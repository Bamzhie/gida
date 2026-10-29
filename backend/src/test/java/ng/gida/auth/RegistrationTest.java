package ng.gida.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class RegistrationTest extends IntegrationTest {

    @Test
    void registersAnAgent() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"Adebayo Ogundele","email":"Adebayo@Example.com",
                         "password":"correct horse battery","phone":"0803 000 0001","role":"AGENT"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("adebayo@example.com"))
                .andExpect(jsonPath("$.role").value("AGENT"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void rejectsDuplicateEmailIgnoringCase() throws Exception {
        register("agent@example.com");
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"Second","email":"AGENT@example.com","password":"another password"}
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/email_taken"));
    }

    @Test
    void rejectsShortPassword() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"Short","email":"short@example.com","password":"1234567"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    void refusesSelfAssignedAdmin() throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("""
                        {"name":"Sneaky","email":"admin@example.com","password":"long enough password","role":"ADMIN"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.role").exists());
    }

    private void register(String email) throws Exception {
        mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"name":"Agent","email":"%s","password":"long enough password","role":"AGENT"}
                        """.formatted(email)))
                .andExpect(status().isCreated());
    }
}
