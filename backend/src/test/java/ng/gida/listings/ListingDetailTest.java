package ng.gida.listings;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import org.junit.jupiter.api.Test;

class ListingDetailTest extends IntegrationTest {

    @Test
    void returnsTheFullListingWithCostsAndAdvertiser() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(agent, "lekki-phase-1");
        publishListing(agent, listingId);

        mvc.perform(get("/api/v1/listings/{id}", listingId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("A home in lekki-phase-1"))
                .andExpect(jsonPath("$.description").value("A well placed home close to the main road."))
                .andExpect(jsonPath("$.listingType").value("RENT"))
                .andExpect(jsonPath("$.pricePeriod").value("YEAR"))
                .andExpect(jsonPath("$.propertyType").value("APARTMENT"))
                .andExpect(jsonPath("$.area").value("Lekki Phase 1"))
                .andExpect(jsonPath("$.state").value("Lagos"))
                .andExpect(jsonPath("$.bedrooms").value(2))
                .andExpect(jsonPath("$.amenities.length()").value(2))
                .andExpect(jsonPath("$.costs.length()").value(1))
                .andExpect(jsonPath("$.costs[0].type").value("AGENCY_FEE"))
                .andExpect(jsonPath("$.media.length()").value(0))
                .andExpect(jsonPath("$.advertiser.name").value("Test Agent"))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());
    }

    @Test
    void costsAreSortedByTypeAndNeverContainRent() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        String json = ListingFixtures.rent("yaba").replace("""
                "costs": [{ "type": "AGENCY_FEE", "amount": 350000.00 }]
                """.trim(), """
                "costs": [
                  { "type": "SERVICE_CHARGE", "amount": 250000.00 },
                  { "type": "AGENCY_FEE", "amount": 350000.00 },
                  { "type": "CAUTION", "amount": 300000.00 }
                ]
                """.trim());
        UUID listingId = createListingFromJson(agent, json);
        publishListing(agent, listingId);

        mvc.perform(get("/api/v1/listings/{id}", listingId))
                .andExpect(jsonPath("$.costs.length()").value(3))
                .andExpect(jsonPath("$.costs[0].type").value("AGENCY_FEE"))
                .andExpect(jsonPath("$.costs[1].type").value("CAUTION"))
                .andExpect(jsonPath("$.costs[2].type").value("SERVICE_CHARGE"));
    }

    @Test
    void hidesDraftsUnknownAndExpiredListings() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID draft = createListing(agent, "yaba");
        UUID expired = createListing(agent, "ikeja");
        publishListing(agent, expired);
        jdbc.sql("UPDATE listings SET expires_at = now() - interval '1 day' WHERE id = :id")
                .param("id", expired)
                .update();

        mvc.perform(get("/api/v1/listings/{id}", draft)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/listings/{id}", expired)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/listings/{id}", UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void similarExcludesTheSourceAndPrefersTheSameArea() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID source = createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1", "3500000.00", 2));
        UUID near = createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1", "3600000.00", 2));
        UUID far = createListingFromJson(agent, ListingFixtures.rent("yaba", "1000000.00", 2));
        for (UUID id : new UUID[]{source, near, far}) {
            publishListing(agent, id);
        }

        mvc.perform(get("/api/v1/listings/{id}/similar", source).param("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].area").value("Lekki Phase 1"))
                .andExpect(jsonPath("$[0].id").value(near.toString()))
                .andExpect(jsonPath("$[1].id").value(far.toString()));

        mvc.perform(get("/api/v1/listings/{id}/similar", UUID.randomUUID()))
                .andExpect(status().isNotFound());
    }
}
