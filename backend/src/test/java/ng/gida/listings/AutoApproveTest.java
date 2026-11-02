package ng.gida.listings;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
@SpringBootTest(properties = "gida.moderation.auto-approve=true")
class AutoApproveTest extends IntegrationTest {
    @Test
    void autoApprovalPublishes() throws Exception {
        String t = registerAndLogin("agent@example.com", "AGENT");
        UUID id = createListing(t, "lekki-phase-1");
        mvc.perform(post("/api/v1/me/listings/{id}/submit", id).header("Authorization", "Bearer " + t))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lifecycle").value("PUBLISHED"));
        mvc.perform(get("/api/v1/listings/{id}", id)).andExpect(status().isOk());
    }
}
