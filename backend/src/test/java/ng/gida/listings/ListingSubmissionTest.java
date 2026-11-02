package ng.gida.listings;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
class ListingSubmissionTest extends IntegrationTest {
    private String token;
    private UUID id;
    private void setup() throws Exception {
        token = registerAndLogin("agent@example.com", "AGENT");
        id = createListing(token, "lekki-phase-1");
    }
    private org.springframework.test.web.servlet.ResultActions action(String name) throws Exception {
        return mvc.perform(
                post("/api/v1/me/listings/{id}/" + name, id).header("Authorization", "Bearer " + token));
    }
    @Test
    void submittingADraftMovesItToSubmittedAndStampsTheTime() throws Exception {
        setup();
        action("submit").andExpect(status().isOk()).andExpect(jsonPath("$.lifecycle").value("SUBMITTED"));
        assertThat(jdbc.sql("SELECT submitted_at IS NOT NULL FROM listings WHERE id=:id")
                           .param("id", id)
                           .query(Boolean.class)
                           .single())
                .isTrue();
        mvc.perform(get("/api/v1/listings/{id}", id)).andExpect(status().isNotFound());
    }
    @Test
    void rejectedListingsCanBeResubmittedButSubmittedOnesCannot() throws Exception {
        setup();
        action("submit").andExpect(status().isOk());
        action("submit").andExpect(status().isConflict());
        mvc.perform(post("/api/v1/admin/listings/{id}/reject", id)
                            .header("Authorization", "Bearer " + adminToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\":\"Fix price\"}"))
                .andExpect(status().isNoContent());
        action("submit").andExpect(status().isOk());
    }
    @Test
    void resumeOnlyWorksFromPaused() throws Exception {
        setup();
        action("resume").andExpect(status().isConflict());
        publishListing(token, id);
        mvc.perform(post("/api/v1/listings/{id}/pause", id).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
        action("resume").andExpect(status().isNoContent());
    }
    @Test
    void confirmStampsConfirmedAtOnlyForPublishedListings() throws Exception {
        setup();
        action("confirm").andExpect(status().isConflict());
        publishListing(token, id);
        action("confirm").andExpect(status().isOk()).andExpect(jsonPath("$.confirmedAt").isNotEmpty());
    }
    @Test
    void suspendedListingsCannotBeSubmittedOrResumed() throws Exception {
        setup();
        jdbc.sql("UPDATE listings SET lifecycle='SUSPENDED' WHERE id=:id").param("id", id).update();
        action("submit").andExpect(status().isConflict());
        action("resume").andExpect(status().isConflict());
    }
    @Test
    void nonOwnersCannotSubmit() throws Exception {
        setup();
        String other = registerAndLogin("other@example.com", "AGENT");
        mvc.perform(post("/api/v1/me/listings/{id}/submit", id).header("Authorization", "Bearer " + other))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/not_owner"));
    }
    @Test
    void rejectedListingCanBeCorrectedAndResubmitted() throws Exception {
        setup();
        action("submit").andExpect(status().isOk());
        mvc.perform(post("/api/v1/admin/listings/{id}/reject", id)
                            .header("Authorization", "Bearer " + adminToken())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\":\"Correct costs and photos\"}"))
                .andExpect(status().isNoContent());
        mvc.perform(patch("/api/v1/listings/{id}", id)
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"property":{"locationSlug":"ikeja","addressLine":"Corrected address",
                                      "propertyType":"APARTMENT","bedrooms":3,"bathrooms":2,"amenities":[]},
                                     "costs":[{"type":"LEGAL_FEE","amount":10000}],"media":[]}
                                    """))
                .andExpect(status().isNoContent());
        assertThat(jdbc.sql("SELECT p.bedrooms FROM properties p JOIN listings l ON l.property_id=p.id WHERE "
                            + "l.id=:id")
                           .param("id", id)
                           .query(Integer.class)
                           .single())
                .isEqualTo(3);
        action("submit").andExpect(status().isOk());
    }
}
