package ng.gida;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Sql(scripts = "/reset.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
public abstract class IntegrationTest {

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcClient jdbc;

    protected String registerAndLogin(String email, String role) throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Test Agent","email":"%s","password":"long enough password","role":"%s"}
                                """.formatted(email, role)))
                .andExpect(status().isCreated());
        return loginAs(email);
    }

    protected String loginAs(String email) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"long enough password"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.accessToken");
    }

    protected UUID createListing(String token, String locationSlug) throws Exception {
        return createListingFromJson(token, ng.gida.support.ListingFixtures.rent(locationSlug));
    }

    protected UUID createListingFromJson(String token, String json) throws Exception {
        String body = mvc.perform(post("/api/v1/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.id"));
    }

    private String cachedAdminToken;
    protected String adminToken() throws Exception {
        if (cachedAdminToken != null) return cachedAdminToken;
        String email = "admin-" + UUID.randomUUID() + "@example.com";
        registerAndLogin(email, "AGENT");
        jdbc.sql("UPDATE users SET role = 'ADMIN' WHERE lower(email) = :email").param("email", email).update();
        return cachedAdminToken = loginAs(email);
    }
    protected void publishListing(String token, UUID listingId) throws Exception {
        mvc.perform(post("/api/v1/me/listings/{id}/submit", listingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        mvc.perform(post("/api/v1/admin/listings/{id}/approve", listingId).header("Authorization", "Bearer " + adminToken())).andExpect(status().isNoContent());
    }
}
