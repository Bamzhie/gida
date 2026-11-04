package ng.gida.moderation;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
class AdminListingReviewTest extends IntegrationTest {
    @org.springframework.beans.factory.annotation.Autowired private ModerationService moderation;
    private String owner;
    private UUID id;
    private void draft() throws Exception {
        owner = registerAndLogin("owner@example.com", "AGENT");
        id = createListing(owner, "lekki-phase-1");
    }
    private void submitted() throws Exception {
        draft();
        mvc.perform(post("/api/v1/me/listings/{id}/submit", id).header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk());
    }
    private org.springframework.test.web.servlet.ResultActions act(String action, String json)
            throws Exception {
        return mvc.perform(post("/api/v1/admin/listings/{id}/" + action, id)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json));
    }
    private long count(String action) {
        return jdbc.sql("SELECT count(*) FROM moderation_actions WHERE target_id=:id AND action=:action")
                .param("id", id)
                .param("action", action)
                .query(Long.class)
                .single();
    }
    @Test
    void adminQueueListsSubmittedListingsOldestFirst() throws Exception {
        submitted();
        UUID second = createListing(owner, "ikeja");
        mvc.perform(
                   post("/api/v1/me/listings/{id}/submit", second).header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/listings?state=SUBMITTED")
                            .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(id.toString()))
                .andExpect(jsonPath("$.total").value(2));
    }
    @Test
    void approvePublishesAndAudits() throws Exception {
        submitted();
        act("approve", "{}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/listings/{id}", id)).andExpect(status().isOk());
        assertThat(count("APPROVE")).isEqualTo(1);
        assertThat(jdbc.sql("SELECT u.role FROM moderation_actions a JOIN users u ON u.id=a.actor_id WHERE "
                               + "a.target_id=:id")
                           .param("id", id)
                           .query(String.class)
                           .single())
                .isEqualTo("ADMIN");
    }
    @Test
    void rejectRequiresAReasonAndRecordsIt() throws Exception {
        submitted();
        act("reject", "{}").andExpect(status().isUnprocessableContent());
        act("reject", "{\"reason\":\"Fix the price\"}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/me/listings").header("Authorization", "Bearer " + owner))
                .andExpect(jsonPath("$.items[0].reviewNote").value("Fix the price"));
    }
    @Test
    void requestCorrectionsReturnsTheListingToDraft() throws Exception {
        submitted();
        act("request-corrections", "{\"reason\":\"Need photos\"}").andExpect(status().isNoContent());
        assertThat(jdbc.sql("SELECT lifecycle FROM listings WHERE id=:id")
                           .param("id", id)
                           .query(String.class)
                           .single())
                .isEqualTo("DRAFT");
    }
    @Test
    void suspendHidesTheListingAndBlocksOwnerResume() throws Exception {
        submitted();
        act("approve", "{}").andExpect(status().isNoContent());
        act("suspend", "{\"reason\":\"Under investigation\"}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/listings/{id}", id)).andExpect(status().isNotFound());
        mvc.perform(post("/api/v1/me/listings/{id}/resume", id).header("Authorization", "Bearer " + owner))
                .andExpect(status().isConflict());
    }
    @Test
    void reinstateReturnsASuspendedListingToPaused() throws Exception {
        draft();
        jdbc.sql("UPDATE listings SET lifecycle='SUSPENDED' WHERE id=:id").param("id", id).update();
        act("reinstate", "{}").andExpect(status().isNoContent());
        assertThat(jdbc.sql("SELECT lifecycle FROM listings WHERE id=:id")
                           .param("id", id)
                           .query(String.class)
                           .single())
                .isEqualTo("PAUSED");
    }
    @Test
    void flagStaleOnlyAppliesToPublishedListings() throws Exception {
        submitted();
        act("flag-stale", "{}").andExpect(status().isConflict());
        act("approve", "{}").andExpect(status().isNoContent());
        act("flag-stale", "{}").andExpect(status().isNoContent());
        assertThat(count("FLAG_STALE")).isEqualTo(1);
    }
    @Test
    void adminDetailCarriesMediaAndActionHistory() throws Exception {
        submitted();
        jdbc.sql("INSERT INTO listing_media (listing_id,url,kind,sort_order) VALUES "
                 + "(:id,'/media/review-photo.png','PHOTO',0)")
                .param("id", id)
                .update();
        act("reject", "{\"reason\":\"Fix\"}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/admin/listings/{id}", id).header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.listing.media[0].url").value("/media/review-photo.png"))
                .andExpect(jsonPath("$.actions[0].action").value("REJECT"))
                .andExpect(jsonPath("$.actions[0].actorName").value("Test Agent"));
    }
    @Test
    void agentsAndUsersCannotReachAdminRoutes() throws Exception {
        for (String role : new String[] {"AGENT", "USER"}) {
            String t = registerAndLogin(role + "@example.com", role);
            mvc.perform(get("/api/v1/admin/listings").header("Authorization", "Bearer " + t))
                    .andExpect(status().isForbidden());
        }
    }
    @Test
    void anonymousAdminCallsGetTheSignedOutProblem() throws Exception {
        mvc.perform(get("/api/v1/admin/listings"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").isNotEmpty());
    }
    @Test
    void doubleApprovalIsAConflictNotADoubleAudit() throws Exception {
        submitted();
        act("approve", "{}").andExpect(status().isNoContent());
        act("approve", "{}").andExpect(status().isConflict());
        assertThat(count("APPROVE")).isEqualTo(1);
    }
    @Test
    void invalidFiltersAndUnknownDetailAreProblems() throws Exception {
        String t = adminToken();
        for (String q : new String[] {"state=INVALID", "state=PUBLISHED&staleDays=30", "staleDays=-1"})
            mvc.perform(get("/api/v1/admin/listings?" + q).header("Authorization", "Bearer " + t))
                    .andExpect(status().isBadRequest());
        mvc.perform(get("/api/v1/admin/listings/{id}", UUID.randomUUID())
                            .header("Authorization", "Bearer " + t))
                .andExpect(status().isNotFound());
    }
    @Test
    void concurrentApprovalsHaveOneWinnerAndOneAudit() throws Exception {
        submitted();
        String admin = adminToken();
        try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var start = new java.util.concurrent.CountDownLatch(1);
            java.util.concurrent.Callable<Integer> approve = () -> {
                start.await();
                return mvc
                        .perform(post("/api/v1/admin/listings/{id}/approve", id)
                                        .header("Authorization", "Bearer " + admin))
                        .andReturn()
                        .getResponse()
                        .getStatus();
            };
            var first = pool.submit(approve);
            var second = pool.submit(approve);
            start.countDown();
            assertThat(java.util.List.of(first.get(), second.get())).containsExactlyInAnyOrder(204, 409);
        }
        assertThat(count("APPROVE")).isEqualTo(1);
    }
    @Test
    void staleQueueUsesConfirmationDateAndRejectReasonsAreBounded() throws Exception {
        submitted();
        act("reject",
                "{\"reason\":\""
                        + "x".repeat(1001) + "\"}")
                .andExpect(status().isUnprocessableContent());
        act("approve", "{}").andExpect(status().isNoContent());
        jdbc.sql("UPDATE listings SET published_at=now()-interval '40 days',confirmed_at=NULL WHERE id=:id")
                .param("id", id)
                .update();
        mvc.perform(get("/api/v1/admin/listings?staleDays=30")
                            .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));
        mvc.perform(post("/api/v1/me/listings/{id}/confirm", id).header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/listings?staleDays=30")
                            .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }
    @Test
    void failedAuditRollsBackJdbcLifecycleTransition() throws Exception {
        submitted();
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> moderation.approve(UUID.randomUUID(), id))
                .isInstanceOf(RuntimeException.class)
                .hasStackTraceContaining("moderation_actions_actor_id_fkey");
        assertThat(jdbc.sql("SELECT lifecycle FROM listings WHERE id=:id")
                           .param("id", id)
                           .query(String.class)
                           .single())
                .isEqualTo("SUBMITTED");
        assertThat(count("APPROVE")).isZero();
    }
    @Test
    void unreviewedListingsCannotReachPublishedViaSuspension() throws Exception {
        draft();
        act("suspend", "{\"reason\":\"Investigate\"}").andExpect(status().isConflict());
        mvc.perform(post("/api/v1/me/listings/{id}/submit", id).header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk());
        act("suspend", "{\"reason\":\"Investigate\"}").andExpect(status().isConflict());
        assertThat(jdbc.sql("SELECT lifecycle FROM listings WHERE id=:id")
                           .param("id", id)
                           .query(String.class)
                           .single())
                .isEqualTo("SUBMITTED");
        assertThat(count("SUSPEND_LISTING")).isZero();
    }
    @Test
    void adminDetailIncludesLifecycleAcrossReview() throws Exception {
        draft();
        String admin = adminToken();
        mvc.perform(get("/api/v1/admin/listings/{id}", id).header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycle").value("DRAFT"));
        mvc.perform(post("/api/v1/me/listings/{id}/submit", id).header("Authorization", "Bearer " + owner))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/admin/listings/{id}", id).header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.lifecycle").value("SUBMITTED"));
        act("approve", "{}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/admin/listings/{id}", id).header("Authorization", "Bearer " + admin))
                .andExpect(jsonPath("$.lifecycle").value("PUBLISHED"));
    }
    @Test
    void submittedUnderReviewAndSuspendedListingsRejectAllPatches() throws Exception {
        draft();
        for (String state : java.util.List.of("SUBMITTED", "UNDER_REVIEW", "SUSPENDED")) {
            jdbc.sql("UPDATE listings SET lifecycle=:state WHERE id=:id")
                    .param("state", state)
                    .param("id", id)
                    .update();
            mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .patch("/api/v1/listings/{id}", id)
                                .header("Authorization", "Bearer " + owner)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"title\":\"Changed during "
                                         + "review\",\"price\":2500000,\"availability\":\"PENDING\"}"))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.type").value("https://gida.ng/errors/listing_locked"));
        }
    }
}
