package ng.gida.users;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class AdvertiserProfileTest extends IntegrationTest {

    @Test
    void agentUpsertsAProfileAndMeReportsIt() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");

        mvc.perform(put("/api/v1/me/advertiser-profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"agencyName":"Harcourt Court Properties","bio":"Lagos consultant.","contactPhone":"0803 000 0001"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.agencyName").value("Harcourt Court Properties"));

        mvc.perform(put("/api/v1/me/advertiser-profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"agencyName":"Harcourt Court","bio":null,"contactPhone":"0803 000 0099"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contactPhone").value("0803 000 0099"));

        mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.agencyName").value("Harcourt Court"));
    }

    @Test
    void plainUsersCannotSetAnAdvertiserProfile() throws Exception {
        String token = registerAndLogin("buyer@example.com", "USER");

        mvc.perform(put("/api/v1/me/advertiser-profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"agencyName":"Not Allowed"}
                                """))
                .andExpect(status().isForbidden());
    }
}
