package ng.gida.users;

import java.sql.Types;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ng.gida.auth.AuthUser;
import ng.gida.moderation.AdminUserDto;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {
    private final JdbcClient jdbc;

    public UserRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public boolean existsByEmail(String email) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM users WHERE lower(email) = :email)")
                .param("email", email)
                .query(Boolean.class)
                .single();
    }

    public Optional<UserRow> findByEmail(String email) {
        return jdbc.sql("""
                        SELECT id, email, password_hash, name, phone, role, status
                        FROM users WHERE lower(email) = :email
                        """)
                .param("email", email)
                .query((rs, index)
                                -> new UserRow(rs.getObject("id", UUID.class), rs.getString("email"),
                                        rs.getString("password_hash"), rs.getString("name"),
                                        rs.getString("phone"), rs.getString("role"), rs.getString("status")))
                .optional();
    }

    public UUID insert(String email, String passwordHash, String name, String phone, String role) {
        return jdbc.sql("""
                        INSERT INTO users (email, password_hash, name, phone, role)
                        VALUES (:email, :hash, :name, :phone, :role)
                        RETURNING id
                        """)
                .param("email", email)
                .param("hash", passwordHash)
                .param("name", name)
                .param("phone", phone, Types.VARCHAR)
                .param("role", role)
                .query(UUID.class)
                .single();
    }

    public Optional<AuthUser> findAuthUser(UUID id) {
        return jdbc.sql("""
                        SELECT u.id, u.name, u.email, u.role, ap.agency_name
                        FROM users u
                        LEFT JOIN advertiser_profiles ap ON ap.user_id = u.id
                        WHERE u.id = :id
                        """)
                .param("id", id)
                .query((rs, index)
                                -> new AuthUser(rs.getObject("id", UUID.class), rs.getString("name"),
                                        rs.getString("email"), rs.getString("role"),
                                        rs.getString("agency_name")))
                .optional();
    }

    public Optional<UserRow> findById(UUID id) {
        return jdbc.sql("SELECT id,email,password_hash,name,phone,role,status FROM users WHERE id=:id")
                .param("id", id)
                .query((rs, n)
                                -> new UserRow(rs.getObject("id", UUID.class), rs.getString("email"),
                                        rs.getString("password_hash"), rs.getString("name"),
                                        rs.getString("phone"), rs.getString("role"), rs.getString("status")))
                .optional();
    }

    public Optional<String> findStatusForUpdate(UUID id) {
        // Serialize status changes without blocking refresh-token FK KEY SHARE checks.
        // FOR UPDATE here would invert the user/token lock order during suspension.

        return jdbc.sql("SELECT status FROM users WHERE id=:id FOR NO KEY UPDATE")
                .param("id", id)
                .query(String.class)
                .optional();
    }

    public void updateStatus(UUID id, String status) {
        jdbc.sql("UPDATE users SET status=:status,updated_at=now() WHERE id=:id")
                .param("status", status)
                .param("id", id)
                .update();
    }

    public Map<UUID, String> findNames(Collection<UUID> ids) {
        if (ids.isEmpty())
            return Map.of();
        Map<UUID, String> names = new HashMap<>();
        jdbc.sql("SELECT id,name FROM users WHERE id IN (:ids)")
                .param("ids", ids)
                .query((rs, n) -> Map.entry(rs.getObject("id", UUID.class), rs.getString("name")))
                .list()
                .forEach(entry -> names.put(entry.getKey(), entry.getValue()));
        return names;
    }

    public PageResponse<AdminUserDto> search(String q, String status, Paging paging) {
        Map<String, Object> params = new HashMap<>();
        String where = " WHERE true";
        if (q != null && !q.isBlank()) {
            where += " AND (name ILIKE :q OR email ILIKE :q)";
            params.put("q", "%" + q.trim() + "%");
        }
        if (status != null) {
            where += " AND status=:status";
            params.put("status", status);
        }
        long total = jdbc.sql("SELECT count(*) FROM users" + where).params(params).query(Long.class).single();
        params.put("limit", paging.size());
        params.put("offset", paging.offset());
        var items =
                jdbc.sql("SELECT id,name,email,role,status,created_at FROM users" + where
                            + " ORDER BY created_at,id LIMIT :limit OFFSET :offset")
                        .params(params)
                        .query(this::mapAdminUser)
                        .list();
        return PageResponse.of(items, paging.page(), paging.size(), total);
    }

    private AdminUserDto mapAdminUser(ResultSet rs, int row) throws SQLException {
        return new AdminUserDto(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("email"),
                rs.getString("role"), rs.getString("status"), rs.getObject("created_at", OffsetDateTime.class).toInstant());
    }
}
