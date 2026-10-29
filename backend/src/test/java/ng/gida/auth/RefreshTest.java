package ng.gida.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class RefreshTest extends IntegrationTest {

    @Test
    void refreshRotatesTheTokenAndRevokesTheOldOne() throws Exception {
        String first = login();
        String rotated = refresh(first);

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + rotated + "\"}"))
                .andExpect(status().isOk());

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + first + "\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/refresh_token_reused"));
    }

    @Test
    void reuseRevokesTheWholeFamily() throws Exception {
        String first = login();
        String second = refresh(first);

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + first + "\"}"))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + second + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesTheToken() throws Exception {
        String token = login();

        mvc.perform(post("/api/v1/auth/logout").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + token + "\"}"))
                .andExpect(status().isNoContent());

        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + token + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    private String login() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                {"name":"Agent","email":"agent@example.com","password":"long enough password","role":"AGENT"}
                """)).andExpect(status().isCreated());

        String body = mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"agent@example.com","password":"long enough password"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.refreshToken");
    }

    private String refresh(String token) throws Exception {
        String body = mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + token + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.refreshToken");
    }
}
