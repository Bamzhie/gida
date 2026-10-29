package ng.gida.users;

import java.sql.Types;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AdvertiserProfileRepository {

    private final JdbcClient jdbc;

    public AdvertiserProfileRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public AdvertiserProfileDto upsert(UUID userId, AdvertiserProfileRequest request) {
        jdbc.sql("""
                        INSERT INTO advertiser_profiles (user_id, agency_name, bio, contact_phone)
                        VALUES (:userId, :agencyName, :bio, :contactPhone)
                        ON CONFLICT (user_id) DO UPDATE
                        SET agency_name = EXCLUDED.agency_name,
                            bio = EXCLUDED.bio,
                            contact_phone = EXCLUDED.contact_phone,
                            updated_at = now()
                        """)
                .param("userId", userId)
                .param("agencyName", request.agencyName(), Types.VARCHAR)
                .param("bio", request.bio(), Types.VARCHAR)
                .param("contactPhone", request.contactPhone(), Types.VARCHAR)
                .update();
        return new AdvertiserProfileDto(request.agencyName(), request.bio(), request.contactPhone());
    }

    public Optional<AdvertiserProfileDto> find(UUID userId) {
        return jdbc.sql("""
                        SELECT agency_name, bio, contact_phone
                        FROM advertiser_profiles WHERE user_id = :userId
                        """)
                .param("userId", userId)
                .query((rs, index) -> new AdvertiserProfileDto(
                        rs.getString("agency_name"),
                        rs.getString("bio"),
                        rs.getString("contact_phone")))
                .optional();
    }
}
