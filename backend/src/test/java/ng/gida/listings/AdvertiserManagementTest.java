package ng.gida.listings;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;

/**
 * Listing-management endpoints of the advertiser surface.
 *
 * <p>Duplicate contract: {@code POST /api/v1/me/listings/{id}/duplicate} deep-copies the listing
 * into a fresh {@code DRAFT} titled "Copy of {title}" — new property row (with its amenities),
 * copied cost rows, and copied media rows that share the source urls (no storage interaction).
 * Works from any lifecycle state; 201 returns {@code {"id": ..., "lifecycle": "DRAFT"}}.
 *
 * <p>Renew contract: {@code POST /api/v1/me/listings/{id}/renew} is for {@code PUBLISHED} listings
 * only and sets {@code expires_at = now() + 30 days}; 200 returns
 * {@code {"id": ..., "expiresAt": ...}}; any other state is 409
 * {@code invalid_lifecycle_transition} (the established transition-conflict code), non-owners 403.
 */
class AdvertiserManagementTest extends IntegrationTest {

    private static final String FULL_LISTING = """
            {
              "title": "Sunlit 2 bedroom in Lekki",
              "description": "A well placed home close to the main road.",
              "listingType": "RENT",
              "pricePeriod": "YEAR",
              "price": 3500000.00,
              "property": {
                "locationSlug": "lekki-phase-1",
                "addressLine": "12 Admiralty Way",
                "propertyType": "APARTMENT",
                "bedrooms": 2,
                "bathrooms": 2,
                "latitude": 6.4385,
                "longitude": 3.4356,
                "amenities": ["borehole-water", "parking"]
              },
              "costs": [
                {"type": "AGENCY_FEE", "amount": 350000.00},
                {"type": "CAUTION", "amount": 100000.00, "note": "Refundable"}
              ],
              "media": [
                {"url": "/media/listings/one/front.jpg", "kind": "PHOTO", "sortOrder": 0},
                {"url": "/media/listings/one/tour.mp4", "kind": "VIDEO", "caption": "Walkthrough", "sortOrder": 1}
              ]
            }
            """;

    @Test
    void duplicateFromAPublishedListingCopiesCostsMediaAndPropertyIntoANewDraft() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID source = createListingFromJson(agent, FULL_LISTING);
        publishListing(agent, source);
        UUID sourceProperty = propertyIdOf(source);

        String body = mvc.perform(post("/api/v1/me/listings/{id}/duplicate", source)
                        .header("Authorization", "Bearer " + agent))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lifecycle").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();
        UUID copy = UUID.fromString(JsonPath.read(body, "$.id"));

        assertThat(copy).isNotEqualTo(source);
        assertThat(lifecycleOf(copy)).isEqualTo("DRAFT");
        assertThat(titleOf(copy)).isEqualTo("Copy of Sunlit 2 bedroom in Lekki");
        assertThat(jdbc.sql("SELECT published_at FROM listings WHERE id = :id")
                .param("id", copy).query(java.time.OffsetDateTime.class).single()).isNull();
        assertThat(jdbc.sql("SELECT expires_at FROM listings WHERE id = :id")
                .param("id", copy).query(java.time.OffsetDateTime.class).single()).isNull();
        assertThat(jdbc.sql("SELECT advertiser_id FROM listings WHERE id = :id")
                .param("id", copy).query(UUID.class).single()).isEqualTo(userIdOf("agent@example.com"));

        // the draft copy owns its own property facts — editing it must never touch the source
        UUID copyProperty = propertyIdOf(copy);
        assertThat(copyProperty).isNotEqualTo(sourceProperty);
        assertThat(amenitySlugs(copyProperty)).containsExactly("borehole-water", "parking");

        assertThat(costsOf(copy)).isEqualTo(costsOf(source));
        assertThat(mediaOf(copy)).isEqualTo(mediaOf(source));
    }

    @Test
    void duplicateWorksFromADraftAndGuardsOwnership() throws Exception {
        String owner = registerAndLogin("owner@example.com", "AGENT");
        String other = registerAndLogin("other@example.com", "AGENT");
        UUID draft = createListingFromJson(owner, FULL_LISTING);

        mvc.perform(post("/api/v1/me/listings/{id}/duplicate", draft)
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isCreated());

        mvc.perform(post("/api/v1/me/listings/{id}/duplicate", draft)
                        .header("Authorization", "Bearer " + other))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/v1/me/listings/{id}/duplicate", UUID.randomUUID())
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isNotFound());
    }

    @Test
    void renewExtendsAPublishedListingByThirtyDays() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListingFromJson(agent, FULL_LISTING);
        publishListing(agent, listingId);
        jdbc.sql("UPDATE listings SET expires_at = now() - interval '1 day' WHERE id = :id")
                .param("id", listingId).update();

        String body = mvc.perform(post("/api/v1/me/listings/{id}/renew", listingId)
                        .header("Authorization", "Bearer " + agent))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        java.time.Instant renewed = java.time.Instant.parse(JsonPath.read(body, "$.expiresAt"));
        java.time.Instant now = java.time.Instant.now();
        assertThat(renewed).isAfter(now.plus(java.time.Duration.ofDays(29)));
        assertThat(renewed).isBefore(now.plus(java.time.Duration.ofDays(30)).plusSeconds(300));
        assertThat(renewed).isEqualTo(expiresAtOf(listingId));
    }

    @Test
    void renewRejectsDraftsPausedListingsAndNonOwners() throws Exception {
        String owner = registerAndLogin("owner@example.com", "AGENT");
        String other = registerAndLogin("other@example.com", "AGENT");
        UUID draft = createListingFromJson(owner, FULL_LISTING);

        mvc.perform(post("/api/v1/me/listings/{id}/renew", draft)
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type")
                        .value("https://gida.ng/errors/invalid_lifecycle_transition"));

        publishListing(owner, draft);
        mvc.perform(post("/api/v1/me/listings/{id}/pause", draft)
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/me/listings/{id}/renew", draft)
                        .header("Authorization", "Bearer " + owner))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type")
                        .value("https://gida.ng/errors/invalid_lifecycle_transition"));

        mvc.perform(post("/api/v1/me/listings/{id}/renew", draft)
                        .header("Authorization", "Bearer " + other))
                .andExpect(status().isForbidden());
    }

    private java.time.Instant expiresAtOf(UUID listingId) {
        return jdbc.sql("SELECT expires_at FROM listings WHERE id = :id")
                .param("id", listingId)
                .query(java.time.OffsetDateTime.class).single().toInstant();
    }

    private String lifecycleOf(UUID listingId) {
        return jdbc.sql("SELECT lifecycle FROM listings WHERE id = :id")
                .param("id", listingId).query(String.class).single();
    }

    private String titleOf(UUID listingId) {
        return jdbc.sql("SELECT title FROM listings WHERE id = :id")
                .param("id", listingId).query(String.class).single();
    }

    private UUID propertyIdOf(UUID listingId) {
        return jdbc.sql("SELECT property_id FROM listings WHERE id = :id")
                .param("id", listingId).query(UUID.class).single();
    }

    private UUID userIdOf(String email) {
        return jdbc.sql("SELECT id FROM users WHERE email = :email")
                .param("email", email).query(UUID.class).single();
    }

    private List<String> amenitySlugs(UUID propertyId) {
        return jdbc.sql("""
                        SELECT a.slug FROM property_amenities pa
                        JOIN amenities a ON a.id = pa.amenity_id
                        WHERE pa.property_id = :propertyId ORDER BY a.slug
                        """)
                .param("propertyId", propertyId).query(String.class).list();
    }

    private List<String> costsOf(UUID listingId) {
        return jdbc.sql("""
                        SELECT cost_type, amount::text AS amount, note
                        FROM listing_costs WHERE listing_id = :id ORDER BY cost_type
                        """)
                .param("id", listingId)
                .query((rs, i) -> rs.getString("cost_type") + "|" + rs.getString("amount")
                        + "|" + rs.getString("note"))
                .list();
    }

    private List<String> mediaOf(UUID listingId) {
        return jdbc.sql("""
                        SELECT url, kind, caption, sort_order
                        FROM listing_media WHERE listing_id = :id ORDER BY sort_order
                        """)
                .param("id", listingId)
                .query((rs, i) -> rs.getString("url") + "|" + rs.getString("kind")
                        + "|" + rs.getString("caption") + "|" + rs.getInt("sort_order"))
                .list();
    }
}
