package ng.gida.requests;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class MatchingRequestTest extends IntegrationTest {

    private void postRequest(String contact, String json) throws Exception {
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content(json.replace("@CONTACT", contact)))
                .andExpect(status().isCreated());
    }

    private String rent(String location, String bedrooms, String price) {
        return """
                {"title":"Home in %s","listingType":"RENT","location":"%s",
                 "bedrooms":%s,"maxPrice":%s,"name":"Ada","contact":"@CONTACT"}
                """.formatted(location, location, bedrooms, price);
    }

    @Test
    void matchesWhenTheListingSitsInsideTheRequestedArea() throws Exception {
        String lekki = registerAndLogin("lekki@example.com", "AGENT");
        String mainland = registerAndLogin("mainland@example.com", "AGENT");
        UUID lekkiListing = createListingFromJson(lekki, ListingFixtures.rent("lekki-phase-1", "3500000.00", 2));
        publishListing(lekki, lekkiListing);
        UUID mainlandListing = createListingFromJson(mainland, ListingFixtures.rent("ikeja", "1200000.00", 1));
        publishListing(mainland, mainlandListing);

        // a state-level request matches every listing under Lagos
        postRequest("state@example.com", rent("lagos", "1", "5000000"));
        // a bedroom ceiling the one-bed ikeja home cannot meet
        postRequest("ceiling@example.com", rent("ikeja", "3", "5000000"));
        // a price band the ikeja home is above
        postRequest("price@example.com", rent("ikeja", "1", "500000"));
        // a sale-side request never matches a rental
        postRequest("type@example.com", """
                {"title":"Buy in Ikeja","listingType":"SALE","location":"ikeja",
                 "name":"Bola","contact":"type@example.com"}
                """);

        mvc.perform(get("/api/v1/me/matching-requests").header("Authorization", "Bearer " + lekki))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].contact").value("state@example.com"))
                .andExpect(jsonPath("$.items[0].name").value("Ada"))
                .andExpect(jsonPath("$.items[0].matchedListingIds[0]").value(lekkiListing.toString()));

        mvc.perform(get("/api/v1/me/matching-requests").header("Authorization", "Bearer " + mainland))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].contact").value("state@example.com"));
    }

    /** The direction test: an exact-area request reaches only the advertiser holding that area. */
    @Test
    void anExactAreaRequestDoesNotReachTheOtherAdvertiser() throws Exception {
        String lekki = registerAndLogin("lekki@example.com", "AGENT");
        String mainland = registerAndLogin("mainland@example.com", "AGENT");
        UUID lekkiListing = createListingFromJson(lekki, ListingFixtures.rent("lekki-phase-1", "3500000.00", 2));
        publishListing(lekki, lekkiListing);
        publishListing(mainland, createListingFromJson(mainland, ListingFixtures.rent("ikeja", "1200000.00", 1)));

        postRequest("lekki-only@example.com", rent("lekki-phase-1", "1", "5000000"));

        mvc.perform(get("/api/v1/me/matching-requests").header("Authorization", "Bearer " + lekki))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].area").value("Lekki Phase 1"))
                .andExpect(jsonPath("$.items[0].matchedListingIds[0]").value(lekkiListing.toString()));

        mvc.perform(get("/api/v1/me/matching-requests").header("Authorization", "Bearer " + mainland))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void ignoresClosedAndStaleRequests() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1")));
        // three requests that each match the one Lekki listing, so the two removals are the only variables
        postRequest("old@example.com", rent("lekki-phase-1", "1", "5000000"));
        postRequest("closed@example.com", rent("lekki-phase-1", "1", "5000000"));
        postRequest("live@example.com", rent("lekki-phase-1", "1", "5000000"));

        jdbc.sql("UPDATE property_requests SET created_at = now() - interval '120 days' WHERE contact = :c")
                .param("c", "old@example.com").update();
        jdbc.sql("UPDATE property_requests SET status = 'CLOSED' WHERE contact = :c")
                .param("c", "closed@example.com").update();

        mvc.perform(get("/api/v1/me/matching-requests").header("Authorization", "Bearer " + agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].contact").value("live@example.com"));
    }

    /**
     * The three POSTs in the test above share the title "Home in lekki-phase-1", which is safe: the
     * dedupe keys on `(contact, lower(title))`, so distinct contacts never collide.
     */
    @Test
    void capsPageSizeAtTwentyAndRequiresARole() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        mvc.perform(get("/api/v1/me/matching-requests").param("size", "21")
                        .header("Authorization", "Bearer " + agent))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_paging"));

        String user = registerAndLogin("user@example.com", "USER");
        mvc.perform(get("/api/v1/me/matching-requests").header("Authorization", "Bearer " + user))
                .andExpect(status().isForbidden());
    }

    @Test
    void exposesAmenityLabelsAndRequiredContact() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListingFromJson(agent, furnishedRent("lekki-phase-1")));
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Furnished with security","listingType":"RENT","location":"lekki-phase-1",
                                 "furnished":true,"amenities":["24-7-security","borehole-water"],
                                 "name":"Ada","contact":"ada@example.com"}
                                """))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/me/matching-requests").header("Authorization", "Bearer " + agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].amenities[0]").exists())
                .andExpect(jsonPath("$.items[0].furnished").value(true));
    }

    /** `ListingFixtures.rent(...)` never sets `furnished`, so the furnished case needs its own body. */
    private String furnishedRent(String locationSlug) {
        return """
                {"title":"Furnished home in %s",
                 "description":"A well placed home close to the main road.",
                 "listingType":"RENT","pricePeriod":"YEAR","price":3500000.00,
                 "property":{"locationSlug":"%s","addressLine":"12 Admiralty Way",
                             "propertyType":"APARTMENT","bedrooms":2,"bathrooms":2,
                             "furnished":true,"latitude":6.4385,"longitude":3.4356,
                             "amenities":["borehole-water","24-7-security"]},
                 "costs":[{"type":"AGENCY_FEE","amount":350000.00}]}
                """.formatted(locationSlug, locationSlug);
    }
}
