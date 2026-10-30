package ng.gida;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;

class SchemaMigrationTest extends IntegrationTest {

    @Test
    void requiredExtensionsAreInstalled() {
        Integer count = jdbc.sql("""
                SELECT count(*) FROM pg_extension WHERE extname IN ('postgis', 'pg_trgm', 'pgcrypto')
                """).query(Integer.class).single();
        assertThat(count).isEqualTo(3);
    }

    @Test
    void searchVectorIsGeneratedFromTitleAndDescription() {
        UUID userId = insertUser("agent@example.com", "AGENT");
        UUID propertyId = insertProperty("lekki-phase-1");
        UUID listingId = insertListing(userId, propertyId, "SALE", null);

        String vector = jdbc.sql("SELECT search_vector::text FROM listings WHERE id = :id")
                .param("id", listingId)
                .query(String.class)
                .single();

        // The english stemmer reduces "Stunning" to "stun"; title lexemes carry weight A, description lexemes weight B.
        assertThat(vector)
                .containsPattern("'stun':\\d+A")
                .containsPattern("'bright':\\d+B");
    }

    @Test
    void saleListingCannotCarryAPricePeriod() {
        UUID userId = insertUser("agent@example.com", "AGENT");
        UUID propertyId = insertProperty("lekki-phase-1");

        assertThatThrownBy(() -> insertListing(userId, propertyId, "SALE", "YEAR"))
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    void rentCostTypeIsRejected() {
        UUID userId = insertUser("agent@example.com", "AGENT");
        UUID propertyId = insertProperty("lekki-phase-1");
        UUID listingId = insertListing(userId, propertyId, "RENT", "YEAR");

        assertThatThrownBy(() -> jdbc.sql("""
                INSERT INTO listing_costs (listing_id, cost_type, amount) VALUES (:id, 'RENT', 1000)
                """).param("id", listingId).update())
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    void favoriteIsUniquePerUserAndListing() {
        UUID userId = insertUser("agent@example.com", "AGENT");
        UUID propertyId = insertProperty("lekki-phase-1");
        UUID listingId = insertListing(userId, propertyId, "RENT", "YEAR");

        jdbc.sql("INSERT INTO favorites (user_id, listing_id) VALUES (:user, :listing)")
                .param("user", userId).param("listing", listingId).update();

        assertThatThrownBy(() -> jdbc.sql("INSERT INTO favorites (user_id, listing_id) VALUES (:user, :listing)")
                .param("user", userId).param("listing", listingId).update())
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    void enquiryRequiresExactlyOneSubject() {
        UUID userId = insertUser("agent@example.com", "AGENT");
        UUID propertyId = insertProperty("lekki-phase-1");
        UUID listingId = insertListing(userId, propertyId, "RENT", "YEAR");

        assertThatThrownBy(() -> jdbc.sql("""
                INSERT INTO enquiries (listing_id, advertiser_id, action, name, contact)
                VALUES (:listing, :advertiser, 'CONTACT', 'Ada', 'ada@example.com')
                """).param("listing", listingId).param("advertiser", userId).update())
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);

        assertThatThrownBy(() -> jdbc.sql("""
                INSERT INTO enquiries (action, name, contact) VALUES ('CONTACT', 'Ada', 'ada@example.com')
                """).update())
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    void requestBudgetOrderIsEnforced() {
        assertThatThrownBy(() -> jdbc.sql("""
                INSERT INTO property_requests (title, listing_type, min_price, max_price, name, contact)
                VALUES ('Flat', 'RENT', 5000000, 1000000, 'Ada', 'ada@example.com')
                """).update())
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    @Test
    void contentBlockKeyIsUnique() {
        jdbc.sql("INSERT INTO content_blocks (key) VALUES ('trust_points')").update();
        assertThatThrownBy(() -> jdbc.sql("INSERT INTO content_blocks (key) VALUES ('trust_points')").update())
                .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
    }

    private UUID insertUser(String email, String role) {
        return jdbc.sql("""
                INSERT INTO users (email, password_hash, name, role)
                VALUES (:email, 'x', 'Test User', :role) RETURNING id
                """).param("email", email).param("role", role)
                .query(UUID.class).single();
    }

    private UUID insertProperty(String slug) {
        return jdbc.sql("""
                INSERT INTO properties (location_id, property_type, bedrooms)
                SELECT id, 'APARTMENT', 2 FROM locations WHERE slug = :slug
                RETURNING id
                """).param("slug", slug).query(UUID.class).single();
    }

    private UUID insertListing(UUID userId, UUID propertyId, String type, String period) {
        return jdbc.sql("""
                INSERT INTO listings (property_id, advertiser_id, title, description,
                                      listing_type, price, price_period)
                VALUES (:propertyId, :userId, 'Stunning flat',
                        'A bright apartment close to the water', :type, 1000, :period)
                RETURNING id
                """).param("propertyId", propertyId).param("userId", userId)
                .param("type", type).param("period", period)
                .query(UUID.class).single();
    }
}
