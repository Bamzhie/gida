package ng.gida.listings;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import java.util.UUID;
import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

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
 *
 * <p>Summary contract: {@code GET /api/v1/me/advertiser-summary} (AGENT/ADMIN) returns
 * {@code {"listingsByState": {"DRAFT": 0, "SUBMITTED": 0, "UNDER_REVIEW": 0, "PUBLISHED": 0,
 * "PAUSED": 0, "EXPIRED": 0, "REJECTED": 0}, "totalEnquiries": 0, "totalViewingRequests": 0,
 * "topListings": [{"listingId": "...", "title": "...", "enquiryCount": 1}]}}. Enquiry totals
 * count rows addressed to the advertiser directly or on any of their listings (same attribution
 * as the enquiry inbox); {@code topListings} ranks only listing-scoped enquiries, most-enquired
 * first, capped at 20.
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
        assertThat(jdbc.sql("""
                        SELECT count(*) FROM listings
                        WHERE id = :id AND (published_at IS NOT NULL OR expires_at IS NOT NULL)
                        """).param("id", copy).query(Long.class).single()).isZero();
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
        mvc.perform(post("/api/v1/listings/{id}/pause", draft)
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

    @Test
    void summaryCountsListingsEnquiriesAndTopListings() throws Exception {
        String ade = registerAndLogin("ade@example.com", "AGENT");
        String bayo = registerAndLogin("bayo@example.com", "AGENT");
        UUID busy = createListing(ade, "lekki-phase-1");
        UUID quiet = createListing(ade, "ikeja");
        UUID draft = createListing(ade, "yaba");
        UUID paused = createListing(ade, "ikeja");
        publishListing(ade, busy);
        publishListing(ade, quiet);
        publishListing(ade, paused);
        mvc.perform(post("/api/v1/listings/{id}/pause", paused)
                .header("Authorization", "Bearer " + ade)).andExpect(status().isNoContent());
        UUID bayoListing = createListing(bayo, "yaba");
        publishListing(bayo, bayoListing);

        enquire(enquiryBody(busy.toString(), "CONTACT", "one@example.com"));
        enquire(enquiryBody(busy.toString(), "CONTACT", "two@example.com"));
        enquire(enquiryBody(busy.toString(), "VIEWING", "three@example.com"));
        enquire(enquiryBody(quiet.toString(), "VIEWING", "four@example.com"));
        enquire(enquiryBody(bayoListing.toString(), "CONTACT", "five@example.com"));
        String adeId = userIdOf("ade@example.com").toString();
        enquire("""
                {"advertiserId":"%s","action":"CONTACT","name":"Ada Eze",
                 "contact":"direct@example.com","message":"Reaching you directly"}
                """.formatted(adeId));

        mvc.perform(get("/api/v1/me/advertiser-summary").header("Authorization", "Bearer " + ade))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listingsByState.DRAFT").value(1))
                .andExpect(jsonPath("$.listingsByState.PUBLISHED").value(2))
                .andExpect(jsonPath("$.listingsByState.PAUSED").value(1))
                .andExpect(jsonPath("$.listingsByState.SUBMITTED").value(0))
                .andExpect(jsonPath("$.listingsByState.UNDER_REVIEW").value(0))
                .andExpect(jsonPath("$.listingsByState.EXPIRED").value(0))
                .andExpect(jsonPath("$.listingsByState.REJECTED").value(0))
                .andExpect(jsonPath("$.totalEnquiries").value(5))
                .andExpect(jsonPath("$.totalViewingRequests").value(2))
                .andExpect(jsonPath("$.topListings.length()").value(2))
                .andExpect(jsonPath("$.topListings[0].listingId").value(busy.toString()))
                .andExpect(jsonPath("$.topListings[0].title").value("A home in lekki-phase-1"))
                .andExpect(jsonPath("$.topListings[0].enquiryCount").value(3))
                .andExpect(jsonPath("$.topListings[1].listingId").value(quiet.toString()))
                .andExpect(jsonPath("$.topListings[1].enquiryCount").value(1));

        mvc.perform(get("/api/v1/me/advertiser-summary").header("Authorization", "Bearer " + bayo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEnquiries").value(1))
                .andExpect(jsonPath("$.topListings.length()").value(1))
                .andExpect(jsonPath("$.topListings[0].listingId").value(bayoListing.toString()));
    }

    @Test
    void summaryRequiresAnAdvertiserRole() throws Exception {
        String user = registerAndLogin("user@example.com", "USER");
        mvc.perform(get("/api/v1/me/advertiser-summary").header("Authorization", "Bearer " + user))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/forbidden"));
    }

    private void enquire(String body) throws Exception {
        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
    }

    private String enquiryBody(String listingId, String action, String contact) {
        return """
                {"listingId":"%s","action":"%s","name":"Ada Eze","contact":"%s",
                 "message":"Is this still available?"}
                """.formatted(listingId, action, contact);
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
