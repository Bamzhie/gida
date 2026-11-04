package ng.gida.moderation;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
class AdminUserSuspensionTest extends IntegrationTest {
    @org.springframework.beans.factory.annotation.Autowired private ng.gida.users.UserRepository users;
    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.transaction.PlatformTransactionManager transactions;
    @org.springframework.beans.factory.annotation.Autowired private ng.gida.auth.AuthService auth;
    private UUID target() throws Exception {
        registerAndLogin("target@example.com", "AGENT");
        return jdbc.sql("SELECT id FROM users WHERE email='target@example.com'").query(UUID.class).single();
    }
    private org.springframework.test.web.servlet.ResultActions act(UUID id, String name, String json)
            throws Exception {
        return mvc.perform(post("/api/v1/admin/users/{id}/" + name, id)
                        .header("Authorization", "Bearer " + adminToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json));
    }
    @Test
    void adminCanSearchUsersByEmailAndStatus() throws Exception {
        UUID id = target();
        act(id, "suspend", "{\"reason\":\"Spam\"}").andExpect(status().isNoContent());
        mvc.perform(get("/api/v1/admin/users?q=target@&status=SUSPENDED")
                            .header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].id").value(id.toString()));
    }
    @Test
    void suspendingRevokesRefreshTokensAndBlocksLogin() throws Exception {
        UUID id = target();
        String body = mvc.perform(post("/api/v1/auth/login")
                                          .contentType(MediaType.APPLICATION_JSON)
                                          .content("{\"email\":\"target@example.com\",\"password\":\"long "
                                                  + "enough password\"}"))
                              .andExpect(status().isOk())
                              .andReturn()
                              .getResponse()
                              .getContentAsString();
        String refresh = JsonPath.read(body, "$.refreshToken");
        act(id, "suspend", "{\"reason\":\"Spam\"}").andExpect(status().isNoContent());
        assertThat(jdbc.sql("SELECT count(*) FROM refresh_tokens WHERE user_id=:id AND revoked_at IS NULL")
                           .param("id", id)
                           .query(Long.class)
                           .single())
                .isZero();
        mvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"target@example.com\",\"password\":\"long enough "
                                    + "password\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/auth/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/account_suspended"));
    }

    @Test
    void suspendingAnAdvertiserHidesTheirListingsAndDirectoryProfile() throws Exception {
        String owner = registerAndLogin("public-agent@example.com", "AGENT");
        UUID id = jdbc.sql("SELECT id FROM users WHERE email='public-agent@example.com'")
                .query(UUID.class).single();
        UUID listing = createListing(owner, "lekki-phase-1");
        publishListing(owner, listing);

        mvc.perform(get("/api/v1/listings").param("advertiser", id.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/v1/listings/{id}", listing))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/advertisers").param("q", "Test Agent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));

        act(id, "suspend", "{\"reason\":\"Fraud investigation\"}")
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/listings").param("advertiser", id.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/v1/listings/{id}", listing))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/advertisers").param("q", "Test Agent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }
    @Test
    void suspendRequiresAReasonAndRejectsSelfSuspension() throws Exception {
        UUID id = target();
        act(id, "suspend", "{}").andExpect(status().isUnprocessableContent());
        UUID self = jdbc.sql("SELECT id FROM users WHERE role='ADMIN'").query(UUID.class).single();
        act(self, "suspend", "{\"reason\":\"Oops\"}")
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/cannot_suspend_self"));
    }
    @Test
    void reinstatedUsersCanSignInAgain() throws Exception {
        UUID id = target();
        act(id, "suspend", "{\"reason\":\"Spam\"}").andExpect(status().isNoContent());
        act(id, "suspend", "{\"reason\":\"Spam\"}").andExpect(status().isConflict());
        act(id, "reinstate", "{}").andExpect(status().isNoContent());
        loginAs("target@example.com");
    }
    @Test
    void suspensionIsAuditedWithTheActor() throws Exception {
        UUID id = target();
        act(id, "suspend", "{\"reason\":\"Spam\"}").andExpect(status().isNoContent());
        assertThat(jdbc.sql("SELECT count(*) FROM moderation_actions a JOIN users u ON u.id=a.actor_id WHERE "
                               + "a.target_id=:id AND a.action='SUSPEND_USER' AND u.role='ADMIN'")
                           .param("id", id)
                           .query(Long.class)
                           .single())
                .isEqualTo(1);
    }
    @Test
    void agentsCannotSuspendAnyone() throws Exception {
        UUID id = target();
        String agent = loginAs("target@example.com");
        mvc.perform(post("/api/v1/admin/users/{id}/suspend", id)
                            .header("Authorization", "Bearer " + agent)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"reason\":\"Spam\"}"))
                .andExpect(status().isForbidden());
    }
    @Test
    void statusLockDoesNotBlockRefreshForeignKeyInsertion() throws Exception {
        UUID id = target();
        String body = mvc.perform(post("/api/v1/auth/login")
                                          .contentType(MediaType.APPLICATION_JSON)
                                          .content("{\"email\":\"target@example.com\",\"password\":\"long "
                                                   + "enough password\"}"))
                              .andExpect(status().isOk())
                              .andReturn()
                              .getResponse()
                              .getContentAsString();
        String refresh = JsonPath.read(body, "$.refreshToken");
        var locked = new java.util.concurrent.CountDownLatch(1);
        var release = new java.util.concurrent.CountDownLatch(1);
        try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            var holder = pool.submit(
                    ()
                            -> new org.springframework.transaction.support.TransactionTemplate(transactions)
                                    .executeWithoutResult(status -> {
                                        users.findStatusForUpdate(id);
                                        locked.countDown();
                                        try {
                                            if (!release.await(15, java.util.concurrent.TimeUnit.SECONDS))
                                                throw new IllegalStateException(
                                                        "Timed out waiting for lock test release");
                                        } catch (InterruptedException interrupted) {
                                            Thread.currentThread().interrupt();
                                            throw new IllegalStateException(interrupted);
                                        }
                                    }));
            assertThat(locked.await(10, java.util.concurrent.TimeUnit.SECONDS)).isTrue();
            try {
                var rotation = pool.submit(() -> auth.refresh(refresh));
                org.assertj.core.api.Assertions
                        .assertThatCode(() -> rotation.get(5, java.util.concurrent.TimeUnit.SECONDS))
                        .doesNotThrowAnyException();
            } finally {
                release.countDown();
            }
            holder.get(5, java.util.concurrent.TimeUnit.SECONDS);
        }
    }
}
