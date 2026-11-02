package ng.gida.reports;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ReportTest extends IntegrationTest {

    @Test
    void aSignedInUserCanReportAPublishedListing() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);
        String seeker = registerAndLogin("seeker@example.com", "USER");

        mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                        .header("Authorization", "Bearer " + seeker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reason":"WRONG_PRICE","details":"The price is out of date."}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.status").value("OPEN"));

        mvc.perform(get("/api/v1/admin/reports").header("Authorization", "Bearer " + trustAdminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].reason").value("WRONG_PRICE"))
                .andExpect(jsonPath("$.items[0].details").value("The price is out of date."))
                .andExpect(jsonPath("$.items[0].status").value("OPEN"));
    }

    @Test
    void reportingAnUnknownOrUnpublishedListingIs404() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        String seeker = registerAndLogin("seeker@example.com", "USER");
        UUID draft = createListing(agent, "lekki-phase-1");
        UUID expired = createListing(agent, "ikeja");
        publishListing(agent, expired);
        jdbc.sql("UPDATE listings SET expires_at = now() - interval '1 day' WHERE id = :id")
                .param("id", expired).update();

        for (UUID listing : new UUID[] {draft, expired, UUID.randomUUID()}) {
            mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                            .header("Authorization", "Bearer " + seeker)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"reason":"FRAUD"}
                                    """))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.type").value("https://gida.ng/errors/listing_not_found"));
        }
        assertThatRows(0);
    }

    @Test
    void aSecondOpenReportByTheSameUserIsAConflict() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);
        String seeker = registerAndLogin("seeker@example.com", "USER");
        String other = registerAndLogin("other@example.com", "USER");
        report(seeker, listing, "FRAUD", null);

        mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                        .header("Authorization", "Bearer " + seeker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reason":"UNAVAILABLE"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/duplicate_report"));

        report(other, listing, "UNAVAILABLE", null);
        assertThatRows(2);
    }

    @Test
    void aResolvedReportCanBeFiledAgain() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);
        String seeker = registerAndLogin("seeker@example.com", "USER");
        report(seeker, listing, "FRAUD", null);
        UUID reportId = onlyReportId();

        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", reportId)
                        .header("Authorization", "Bearer " + trustAdminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"RESOLVED","note":"Price corrected."}
                                """))
                .andExpect(status().isNoContent());

        report(seeker, listing, "WRONG_PRICE", "Still wrong.");
        assertThatRows(2);
    }

    @Test
    void adminSeesOpenReportsWithListingAndReporter() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID first = createListing(agent, "lekki-phase-1");
        UUID second = createListing(agent, "ikeja");
        publishListing(agent, first);
        publishListing(agent, second);
        String seeker = registerAndLogin("seeker@example.com", "USER");
        String other = registerAndLogin("other@example.com", "USER");
        report(seeker, first, "FRAUD", "Asked for a deposit off-platform.");
        report(other, second, "DUPLICATE", null);

        mvc.perform(get("/api/v1/admin/reports").param("status", "OPEN")
                        .header("Authorization", "Bearer " + trustAdminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].listingId").isNotEmpty())
                .andExpect(jsonPath("$.items[0].listingTitle").isNotEmpty())
                .andExpect(jsonPath("$.items[0].reporterId").isNotEmpty())
                .andExpect(jsonPath("$.items[0].reporterEmail").isNotEmpty())
                .andExpect(jsonPath("$.items[0].resolvedBy").doesNotExist())
                .andExpect(jsonPath("$.items[0].resolvedAt").doesNotExist())
                .andExpect(jsonPath("$.items[1].listingTitle").isNotEmpty());
    }

    @Test
    void resolveAndDismissRequireAnAdminAndRecordTheOutcome() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID first = createListing(agent, "lekki-phase-1");
        UUID second = createListing(agent, "ikeja");
        UUID third = createListing(agent, "yaba");
        publishListing(agent, first);
        publishListing(agent, second);
        publishListing(agent, third);
        String seeker = registerAndLogin("seeker@example.com", "USER");
        report(seeker, first, "FRAUD", null);
        report(seeker, second, "UNAVAILABLE", null);
        report(seeker, third, "OFFENSIVE", null);
        UUID firstReport = reportIdFor(first);
        UUID secondReport = reportIdFor(second);
        UUID thirdReport = reportIdFor(third);

        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", firstReport)
                        .header("Authorization", "Bearer " + seeker)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"DISMISSED"}
                                """))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", firstReport)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"DISMISSED"}
                                """))
                .andExpect(status().isUnauthorized());

        String admin = trustAdminToken();
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", firstReport)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"RESOLVED","note":"Contacted the advertiser."}
                                """))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", secondReport)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"DISMISSED"}
                                """))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", thirdReport)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"REOPENED"}
                                """))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_outcome"));

        assertThat(jdbc.sql("SELECT status FROM reports WHERE id = :id")
                .param("id", firstReport).query(String.class).single()).isEqualTo("RESOLVED");
        assertThat(jdbc.sql("SELECT status FROM reports WHERE id = :id")
                .param("id", secondReport).query(String.class).single()).isEqualTo("DISMISSED");
        assertThat(jdbc.sql("SELECT resolved_by FROM reports WHERE id = :id")
                .param("id", firstReport).query(UUID.class).single()).isNotNull();
        assertThat(jdbc.sql("SELECT resolved_at FROM reports WHERE id = :id")
                .param("id", firstReport).query(java.time.OffsetDateTime.class).single()).isNotNull();
        assertThat(jdbc.sql("SELECT status FROM reports WHERE id = :id")
                .param("id", thirdReport).query(String.class).single()).isEqualTo("OPEN");
    }

    @Test
    void resolvingTwiceIsAConflict() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);
        String seeker = registerAndLogin("seeker@example.com", "USER");
        report(seeker, listing, "FRAUD", null);
        UUID reportId = onlyReportId();
        String admin = trustAdminToken();

        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", reportId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"RESOLVED"}
                                """))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", reportId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"DISMISSED"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/report_already_resolved"));
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", UUID.randomUUID())
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"outcome":"DISMISSED"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/report_not_found"));

        assertThat(jdbc.sql("SELECT status FROM reports WHERE id = :id")
                .param("id", reportId).query(String.class).single()).isEqualTo("RESOLVED");
    }

    @Test
    void anonymousReportingIsRejected() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);

        mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"reason":"FRAUD"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/signed_out"));
        assertThatRows(0);
    }

    @Test
    void reportReasonIsAllowlisted() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);
        String seeker = registerAndLogin("seeker@example.com", "USER");

        for (String body : new String[] {"{\"reason\":\"SPAM\"}", "{}"}) {
            mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                            .header("Authorization", "Bearer " + seeker)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isUnprocessableContent())
                    .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_reason"));
        }
        assertThatRows(0);
    }

    @Test
    void concurrentReportsReturnCreatedAndConflict() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);
        String seeker = registerAndLogin("seeker@example.com", "USER");
        java.util.concurrent.Callable<Integer> request = () -> mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                .header("Authorization", "Bearer " + seeker).contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\":\"FRAUD\"}")).andReturn().getResponse().getStatus();
        assertThat(concurrently(request)).containsExactlyInAnyOrder(201, 409);
        assertThatRows(1);
    }

    @Test
    void concurrentResolutionsHaveExactlyOneWinner() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID listing = createListing(agent, "lekki-phase-1");
        publishListing(agent, listing);
        String seeker = registerAndLogin("seeker@example.com", "USER");
        report(seeker, listing, "FRAUD", null);
        UUID id = onlyReportId(); String admin = trustAdminToken();
        java.util.concurrent.Callable<Integer> request = () -> mvc.perform(post("/api/v1/admin/reports/{id}/resolve", id)
                .header("Authorization", "Bearer " + admin).contentType(MediaType.APPLICATION_JSON)
                .content("{\"outcome\":\"RESOLVED\"}")).andReturn().getResponse().getStatus();
        assertThat(concurrently(request)).containsExactlyInAnyOrder(204, 409);
    }

    private java.util.List<Integer> concurrently(java.util.concurrent.Callable<Integer> request) throws Exception {
        var start = new java.util.concurrent.CountDownLatch(1);
        try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Integer> work = () -> { start.await(); return request.call(); };
            var first = pool.submit(work); var second = pool.submit(work); start.countDown();
            return java.util.List.of(first.get(30, java.util.concurrent.TimeUnit.SECONDS),
                    second.get(30, java.util.concurrent.TimeUnit.SECONDS));
        }
    }

    private void report(String token, UUID listing, String reason, String details) throws Exception {
        String detailJson = details == null ? "" : ",\"details\":\"%s\"".formatted(details);
        mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"%s\"%s}".formatted(reason, detailJson)))
                .andExpect(status().isCreated());
    }

    private UUID onlyReportId() {
        return jdbc.sql("SELECT id FROM reports").query(UUID.class).single();
    }

    private UUID reportIdFor(UUID listingId) {
        return jdbc.sql("SELECT id FROM reports WHERE listing_id = :id")
                .param("id", listingId).query(UUID.class).single();
    }

    private void assertThatRows(long expected) {
        assertThat(jdbc.sql("SELECT count(*) FROM reports").query(Long.class).single()).isEqualTo(expected);
    }

    private String trustAdminToken() throws Exception {
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        registerAndLogin(email, "AGENT");
        jdbc.sql("UPDATE users SET role = 'ADMIN' WHERE lower(email) = :email")
                .param("email", email).update();
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"long enough password"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }
}
