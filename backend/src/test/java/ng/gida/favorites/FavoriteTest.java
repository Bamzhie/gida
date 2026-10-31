package ng.gida.favorites;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;

class FavoriteTest extends IntegrationTest {

    @Test
    void insertIsIdempotentAndReadsBackOnce() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);

        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(put("/api/v1/me/favorites/{id}", listing).header("Authorization", "Bearer " + agent))
                    .andExpect(status().isNoContent());
        }

        mvc.perform(get("/api/v1/me/favorites").header("Authorization", "Bearer " + agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(listing.toString()))
                .andExpect(jsonPath("$.items[0].area").value("Lekki Phase 1"));
    }

    @Test
    void deleteIsIdempotent() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "yaba");
        publishListing(agent, listing);
        mvc.perform(put("/api/v1/me/favorites/{id}", listing).header("Authorization", "Bearer " + agent))
                .andExpect(status().isNoContent());

        for (int attempt = 0; attempt < 2; attempt++) {
            mvc.perform(delete("/api/v1/me/favorites/{id}", listing).header("Authorization", "Bearer " + agent))
                    .andExpect(status().isNoContent());
        }
        mvc.perform(get("/api/v1/me/favorites").header("Authorization", "Bearer " + agent))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void oneUserCannotSeeOrClearAnotherList() throws Exception {
        String owner = registerAndLogin("owner@example.com", "AGENT");
        String other = registerAndLogin("other@example.com", "USER");
        UUID listing = createListing(owner, "ikeja");
        publishListing(owner, listing);
        mvc.perform(put("/api/v1/me/favorites/{id}", listing).header("Authorization", "Bearer " + owner))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/me/favorites").header("Authorization", "Bearer " + other))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(delete("/api/v1/me/favorites/{id}", listing).header("Authorization", "Bearer " + other))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/me/favorites").header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void savingADraftOrUnknownListingIsRejected() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID draft = createListing(agent, "lekki-phase-1");

        mvc.perform(put("/api/v1/me/favorites/{id}", draft).header("Authorization", "Bearer " + agent))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/listing_not_found"));
        mvc.perform(put("/api/v1/me/favorites/{id}", UUID.randomUUID()).header("Authorization", "Bearer " + agent))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/listing_not_found"));
        mvc.perform(put("/api/v1/me/favorites/{id}", "not-a-uuid").header("Authorization", "Bearer " + agent))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_filter"));
    }

    @Test
    void readsRequireASession() throws Exception {
        mvc.perform(get("/api/v1/me/favorites"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/signed_out"))
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.instance").value("/api/v1/me/favorites"));
        // a malformed token takes the same entry point and gets the same shape
        mvc.perform(get("/api/v1/me/favorites").header("Authorization", "Bearer not-a-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/signed_out"));
    }
}
