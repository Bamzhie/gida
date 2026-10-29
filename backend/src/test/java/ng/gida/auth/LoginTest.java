package ng.gida.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class LoginTest extends IntegrationTest {

    @Test
    void loginReturnsAnAccessTokenThatOpensMe() throws Exception {
        registerAgent();
        String body = mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"agent@example.com","password":"long enough password"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andReturn().getResponse().getContentAsString();

        String token = JsonPath.read(body, "$.accessToken");

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("agent@example.com"))
                .andExpect(jsonPath("$.role").value("AGENT"));
    }

    @Test
    void wrongPasswordIsRejectedWithoutLeakingWhichFieldFailed() throws Exception {
        registerAgent();
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"agent@example.com","password":"wrong password value"}
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_credentials"))
                .andExpect(jsonPath("$.detail").value("Email or password is incorrect"));
    }

    @Test
    void meRequiresABearerToken() throws Exception {
        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginReportsTheSameProfileFieldsAsMe() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        mvc.perform(put("/api/v1/me/advertiser-profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"agencyName":"Harcourt Court Properties","bio":"Lagos homes","contactPhone":"0803 000 0001"}
                                """))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"agent@example.com","password":"long enough password"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("AGENT"))
                .andExpect(jsonPath("$.user.agencyName").value("Harcourt Court Properties"));

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(jsonPath("$.agencyName").value("Harcourt Court Properties"));
    }

    private void registerAgent() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"Agent","email":"agent@example.com","password":"long enough password","role":"AGENT"}
                        """))
                .andExpect(status().isCreated());
    }
}
