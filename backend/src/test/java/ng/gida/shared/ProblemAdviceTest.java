package ng.gida.shared;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;

@AutoConfigureMockMvc(addFilters = false)
class ProblemAdviceTest extends IntegrationTest {

    @Test
    void apiExceptionBecomesProblemDetail() throws Exception {
        mvc.perform(get("/api/v1/_test/boom"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/email_taken"))
                .andExpect(jsonPath("$.detail").value("An account already exists"));
    }

    @Test
    void validationErrorsAreGroupedByField() throws Exception {
        mvc.perform(post("/api/v1/_test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/validation_failed"))
                .andExpect(jsonPath("$.errors.email").exists());
    }
}
