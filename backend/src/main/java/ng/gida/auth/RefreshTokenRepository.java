package ng.gida.auth;

import java.sql.Types;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class RefreshTokenRepository {

    public record TokenRow(UUID id, UUID userId, UUID familyId, Instant expiresAt, Instant revokedAt) {
    }

    private final JdbcClient jdbc;

    public RefreshTokenRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public UUID insert(UUID userId, String tokenHash, UUID familyId, Instant expiresAt) {
        // pgjdbc cannot infer a type for java.time.Instant; timestamptz binds from OffsetDateTime.
        return jdbc.sql("""
                        INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
                        VALUES (:userId, :hash, :familyId, :expiresAt)
                        RETURNING id
                        """)
                .param("userId", userId)
                .param("hash", tokenHash)
                .param("familyId", familyId)
                .param("expiresAt", expiresAt.atOffset(ZoneOffset.UTC))
                .query(UUID.class)
                .single();
    }

    public Optional<TokenRow> findByHashForUpdate(String tokenHash) {
        return jdbc.sql("""
                        SELECT id, user_id, family_id, expires_at, revoked_at
                        FROM refresh_tokens
                        WHERE token_hash = :hash
                        FOR UPDATE
                        """)
                .param("hash", tokenHash)
                .query((rs, index) -> new TokenRow(
                        rs.getObject("id", UUID.class),
                        rs.getObject("user_id", UUID.class),
                        rs.getObject("family_id", UUID.class),
                        rs.getTimestamp("expires_at").toInstant(),
                        rs.getTimestamp("revoked_at") == null ? null : rs.getTimestamp("revoked_at").toInstant()))
                .optional();
    }

    public void markRotated(UUID id, UUID replacedBy) {
        jdbc.sql("UPDATE refresh_tokens SET revoked_at = now(), replaced_by = :replacedBy WHERE id = :id")
                .param("id", id)
                .param("replacedBy", replacedBy, Types.OTHER)
                .update();
    }

    public void revokeFamily(UUID familyId) {
        jdbc.sql("UPDATE refresh_tokens SET revoked_at = now() WHERE family_id = :familyId AND revoked_at IS NULL")
                .param("familyId", familyId)
                .update();
    }

    public void revoke(UUID id) {
        jdbc.sql("UPDATE refresh_tokens SET revoked_at = now() WHERE id = :id AND revoked_at IS NULL")
                .param("id", id)
                .update();
    }
}
