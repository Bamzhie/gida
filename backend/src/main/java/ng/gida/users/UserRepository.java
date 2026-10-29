package ng.gida.users;

import java.sql.Types;
import java.util.Optional;
import java.util.UUID;
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
                .query((rs, index) -> new UserRow(
                        rs.getObject("id", UUID.class),
                        rs.getString("email"),
                        rs.getString("password_hash"),
                        rs.getString("name"),
                        rs.getString("phone"),
                        rs.getString("role"),
                        rs.getString("status")))
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
}
