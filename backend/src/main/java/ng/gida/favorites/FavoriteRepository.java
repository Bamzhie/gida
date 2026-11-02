package ng.gida.favorites;

import java.util.UUID;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class FavoriteRepository {

    private static final String VISIBLE = """
            lifecycle = 'PUBLISHED'
            AND (expires_at IS NULL OR expires_at > now())
            AND EXISTS (SELECT 1 FROM users u WHERE u.id = listings.advertiser_id AND u.status = 'ACTIVE')
            """;

    private final JdbcClient jdbc;

    public FavoriteRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public void requireVisibleListing(UUID listingId) {
        Long count = jdbc.sql("SELECT count(*) FROM listings WHERE id = :id AND " + VISIBLE)
                .param("id", listingId)
                .query(Long.class)
                .single();
        if (count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "That property is no longer available.");
        }
    }

    public void add(UUID userId, UUID listingId) {
        jdbc.sql("""
                INSERT INTO favorites (user_id, listing_id) VALUES (:user, :listing)
                ON CONFLICT (user_id, listing_id) DO NOTHING
                """).param("user", userId).param("listing", listingId).update();
    }

    public void remove(UUID userId, UUID listingId) {
        jdbc.sql("DELETE FROM favorites WHERE user_id = :user AND listing_id = :listing")
                .param("user", userId).param("listing", listingId).update();
    }
}
