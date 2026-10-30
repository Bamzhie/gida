package ng.gida.advertisers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import org.junit.jupiter.api.Test;

class AdvertiserDirectoryTest extends IntegrationTest {

    @Test
    void listsAdvertisersWithTheirPublishedListingCount() throws Exception {
        String ade = registerAndLogin("ade@example.com", "AGENT");
        String bayo = registerAndLogin("bayo@example.com", "AGENT");
        for (int i = 0; i < 2; i++) {
            publishListing(ade, createListingFromJson(ade, ListingFixtures.rent("lekki-phase-1")));
        }
        createListingFromJson(bayo, ListingFixtures.rent("ikeja")); // stays in DRAFT
        UUID expired = createListingFromJson(bayo, ListingFixtures.rent("yaba"));
        publishListing(bayo, expired);
        jdbc.sql("UPDATE listings SET expires_at = now() - interval '1 day' WHERE id = :id")
                .param("id", expired).update();
        jdbc.sql("UPDATE users SET phone = :phone WHERE email = :email")
                .param("phone", "0803 111 2222").param("email", "ade@example.com").update();
        jdbc.sql("INSERT INTO advertiser_profiles (user_id, agency_name, bio) "
                        + "SELECT id, 'Lekki Homes Ltd', 'Six years on the Island.' FROM users WHERE email = :email")
                .param("email", "ade@example.com").update();

        mvc.perform(get("/api/v1/advertisers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].name").value("Test Agent"))
                .andExpect(jsonPath("$.items[0].listingCount").value(2))
                .andExpect(jsonPath("$.items[0].agencyName").value("Lekki Homes Ltd"))
                .andExpect(jsonPath("$.items[0].bio").value("Six years on the Island."))
                .andExpect(jsonPath("$.items[0].phone").value("0803 111 2222"))
                .andExpect(jsonPath("$.items[1].listingCount").value(0))
                .andExpect(jsonPath("$.items[1].agencyName").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void filtersByKeywordAndByLocationSubtree() throws Exception {
        String ade = registerAndLogin("ade@example.com", "AGENT");
        String bayo = registerAndLogin("bayo@example.com", "AGENT");
        jdbc.sql("UPDATE users SET name = :name WHERE email = :email")
                .param("name", "Adaeze Obi").param("email", "ade@example.com").update();
        jdbc.sql("UPDATE users SET name = :name WHERE email = :email")
                .param("name", "Bola Sharpe").param("email", "bayo@example.com").update();
        publishListing(ade, createListingFromJson(ade, ListingFixtures.rent("lekki-phase-1")));
        publishListing(bayo, createListingFromJson(bayo, ListingFixtures.rent("ikeja")));

        mvc.perform(get("/api/v1/advertisers").param("q", "ad"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Adaeze Obi"));

        // eti-osa is the parent of lekki-phase-1, so a state-level search reaches it.
        mvc.perform(get("/api/v1/advertisers").param("location", "eti-osa"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));

        mvc.perform(get("/api/v1/advertisers").param("location", "ikeja"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Bola Sharpe"));
    }

    @Test
    void rejectsOversizedPages() throws Exception {
        mvc.perform(get("/api/v1/advertisers").param("size", "101"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_paging"));
        mvc.perform(get("/api/v1/advertisers").param("page", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_paging"));
    }

    @Test
    void isPublic() throws Exception {
        mvc.perform(get("/api/v1/advertisers")).andExpect(status().isOk());
    }
}
