package ng.gida;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import ng.gida.auth.TokenService;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class TrustAuditIntegrationTest extends IntegrationTest {

    @Autowired
    TokenService tokens;

    private UUID insertAdmin() {
        return jdbc.sql("""
                INSERT INTO users (email, password_hash, name, role)
                VALUES ('audit-admin@example.com', 'unused', 'Audit Admin', 'ADMIN') RETURNING id
                """).query(UUID.class).single();
    }

    @ParameterizedTest
    @ValueSource(strings = {"RESOLVED", "DISMISSED"})
    void reportResolutionIsAuditedExactlyOnce(String outcome) throws Exception {
        String owner = registerAndLogin("audit-owner@example.com", "AGENT");
        UUID listing = createListing(owner, "lekki-phase-1");
        publishListing(owner, listing);
        String reporter = registerAndLogin("audit-reporter@example.com", "USER");
        String body = mvc.perform(post("/api/v1/listings/{id}/reports", listing)
                        .header("Authorization", "Bearer " + reporter)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"FRAUD\"}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        UUID report = UUID.fromString(JsonPath.read(body, "$.id"));
        UUID actor = insertAdmin();
        String admin = tokens.issueAccessToken(actor, "ADMIN");
        String request = "{\"outcome\":\"" + outcome + "\",\"note\":\"Investigated\"}";
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", report)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isNoContent());
        mvc.perform(post("/api/v1/admin/reports/{id}/resolve", report)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON).content(request))
                .andExpect(status().isConflict());
        assertThat(jdbc.sql("""
                SELECT count(*) FROM moderation_actions
                WHERE target_type = 'REPORT' AND target_id = :id AND actor_id = :actor
                  AND action = :action AND reason = 'Investigated'
                """).param("id", report).param("actor", actor)
                .param("action", outcome.equals("RESOLVED") ? "RESOLVE_REPORT" : "DISMISS_REPORT")
                .query(Long.class).single()).isEqualTo(1);
    }

    @ParameterizedTest
    @ValueSource(strings = {"LISTING", "ADVERTISER"})
    void verificationAuditsUseTheCorrectSubjectAndActor(String subjectType) throws Exception {
        String owner = registerAndLogin("audit-owner@example.com", "AGENT");
        UUID listing = createListing(owner, "lekki-phase-1");
        UUID ownerId = jdbc.sql("SELECT advertiser_id FROM listings WHERE id = :id")
                .param("id", listing).query(UUID.class).single();
        UUID subject = subjectType.equals("LISTING") ? listing : ownerId;
        String dimension = subjectType.equals("LISTING") ? "PRICE" : "IDENTITY";
        UUID actor = insertAdmin();
        String admin = tokens.issueAccessToken(actor, "ADMIN");
        for (String state : new String[]{"VERIFIED", "FAILED"}) {
            mvc.perform(put("/api/v1/admin/verifications")
                            .header("Authorization", "Bearer " + admin)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"subjectType":"%s","subjectId":"%s","dimension":"%s","state":"%s"}
                                    """.formatted(subjectType, subject, dimension, state)))
                    .andExpect(status().isOk());
            assertThat(jdbc.sql("""
                    SELECT count(*) FROM moderation_actions
                    WHERE target_type = :targetType AND target_id = :subject AND actor_id = :actor
                      AND action = 'VERIFY' AND reason = :reason
                    """).param("targetType", subjectType.equals("ADVERTISER") ? "USER" : "LISTING")
                    .param("subject", subject).param("actor", actor).param("reason", dimension + ":" + state)
                    .query(Long.class).single()).isEqualTo(1);
        }
        assertThat(jdbc.sql("SELECT count(*) FROM verifications WHERE subject_id = :id")
                .param("id", subject).query(Long.class).single()).isEqualTo(1);
    }
}
