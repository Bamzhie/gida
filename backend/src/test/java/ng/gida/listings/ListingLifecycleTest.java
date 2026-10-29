package ng.gida.listings;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ListingLifecycleTest extends IntegrationTest {

    @Test
    void ownerPublishesADraftAndPauseRequiresPublishedState() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        mvc.perform(post("/api/v1/listings/{id}/pause", listingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_lifecycle_transition"));

        mvc.perform(post("/api/v1/listings/{id}/publish", listingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(lifecycle(listingId)).isEqualTo("PUBLISHED");
        assertThat(jdbc.sql("SELECT published_at FROM listings WHERE id = :id")
                .param("id", listingId)
                .query(java.time.OffsetDateTime.class)
                .single()).isNotNull();

        mvc.perform(post("/api/v1/listings/{id}/pause", listingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        assertThat(lifecycle(listingId)).isEqualTo("PAUSED");

        mvc.perform(post("/api/v1/listings/{id}/publish", listingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        assertThat(lifecycle(listingId)).isEqualTo("PUBLISHED");
    }

    @Test
    void anotherAgentCannotEditTheListing() throws Exception {
        String owner = registerAndLogin("owner@example.com", "AGENT");
        String other = registerAndLogin("other@example.com", "AGENT");
        UUID listingId = createListing(owner, "lekki-phase-1");

        mvc.perform(patch("/api/v1/listings/{id}", listingId)
                        .header("Authorization", "Bearer " + other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Hijacked"}
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void publishedListingsRejectPropertyCostAndMediaEdits() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        publishListing(token, listingId);

        mvc.perform(patch("/api/v1/listings/{id}", listingId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"costs":[{"type":"LEGAL_FEE","amount":100000.00}]}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/property_locked"));
    }

    @Test
    void publishedListingsStillAllowTitlePriceAndAvailabilityEdits() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        publishListing(token, listingId);

        mvc.perform(patch("/api/v1/listings/{id}", listingId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Reduced: 2 bedroom flat","price":3300000.00,"availability":"PENDING"}
                                """))
                .andExpect(status().isNoContent());

        assertThat(jdbc.sql("SELECT title FROM listings WHERE id = :id")
                .param("id", listingId).query(String.class).single())
                .isEqualTo("Reduced: 2 bedroom flat");
        assertThat(jdbc.sql("SELECT availability FROM listings WHERE id = :id")
                .param("id", listingId).query(String.class).single())
                .isEqualTo("PENDING");
    }

    @Test
    void unknownPatchFieldsAreRejected() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        mvc.perform(patch("/api/v1/listings/{id}", listingId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"lifecycle":"PUBLISHED"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void meListingsReturnsEveryLifecycleStateForTheCallerOnly() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        String other = registerAndLogin("other@example.com", "AGENT");
        UUID draft = createListing(agent, "lekki-phase-1");
        UUID published = createListing(agent, "ikeja");
        publishListing(agent, published);
        createListing(other, "yaba");

        mvc.perform(get("/api/v1/me/listings").header("Authorization", "Bearer " + agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items.length()").value(2));

        mvc.perform(get("/api/v1/me/listings").header("Authorization", "Bearer " + other))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));

        assertThat(lifecycle(draft)).isEqualTo("DRAFT");
    }

    private String lifecycle(UUID listingId) {
        return jdbc.sql("SELECT lifecycle FROM listings WHERE id = :id")
                .param("id", listingId)
                .query(String.class)
                .single();
    }
}
