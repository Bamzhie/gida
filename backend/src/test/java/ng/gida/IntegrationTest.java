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

    protected void publishListing(String token, UUID listingId) throws Exception {
        mvc.perform(post("/api/v1/listings/{id}/publish", listingId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }
}
