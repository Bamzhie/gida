package ng.gida.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {

    public static final Duration REFRESH_TTL = Duration.ofDays(30);

    private final RefreshTokenRepository tokens;
    private final SecureRandom random = new SecureRandom();
    private final Clock clock = Clock.systemUTC();

    public RefreshTokenService(RefreshTokenRepository tokens) {
        this.tokens = tokens;
    }

    @Transactional
    public Issued issue(UUID userId) {
        return issue(userId, UUID.randomUUID());
    }

    // noRollbackFor: the reuse branch must commit revokeFamily before the exception propagates.
    @Transactional(noRollbackFor = ApiException.class)
    public Issued rotate(String presented) {
        RefreshTokenRepository.TokenRow row = tokens.findByHashForUpdate(hash(presented))
                .orElseThrow(RefreshTokenService::invalid);
        if (row.revokedAt() != null) {
            tokens.revokeFamily(row.familyId());
            throw new ApiException(HttpStatus.UNAUTHORIZED, "refresh_token_reused",
                    "Refresh token reuse detected; all sessions in this family were revoked");
        }
        if (row.expiresAt().isBefore(clock.instant())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "refresh_token_expired", "Refresh token has expired");
        }

        Issued next = issue(row.userId(), row.familyId());
        tokens.markRotated(row.id(), next.id());
        return next;
    }

    @Transactional
    public void revoke(String presented) {
        tokens.findByHashForUpdate(hash(presented)).ifPresent(row -> tokens.revoke(row.id()));
    }

    public record Issued(UUID id, UUID userId, String token) {
    }

    private Issued issue(UUID userId, UUID familyId) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        UUID id = tokens.insert(userId, hash(token), familyId, clock.instant().plus(REFRESH_TTL));
        return new Issued(id, userId, token);
    }

    private static String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is required", ex);
        }
    }

    private static ApiException invalid() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "invalid_refresh_token", "Refresh token is not valid");
    }
}
