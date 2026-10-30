package ng.gida.locations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;
import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

class AreaReferenceTest extends IntegrationTest {

    @Test
    void countsPublishedListingsPerArea() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1")));
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1")));
        createListingFromJson(agent, ListingFixtures.rent("ikeja"));   // draft, not counted

        MvcResult result = mvc.perform(get("/api/v1/areas").param("limit", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andReturn();
        List<Map<String, Object>> rows = JsonMapper.builder().build().readValue(
                result.getResponse().getContentAsString(),
                new TypeReference<List<Map<String, Object>>>() {});

        assertThat(rows).anySatisfy(row -> {
            assertThat(row.get("slug")).isEqualTo("lekki-phase-1");
            assertThat(row.get("name")).isEqualTo("Lekki Phase 1");
            assertThat(((Number) row.get("listingCount")).longValue()).isEqualTo(2L);
        });
        assertThat(rows).anySatisfy(row -> {
            assertThat(row.get("slug")).isEqualTo("eti-osa");
            assertThat(((Number) row.get("listingCount")).longValue()).isEqualTo(2L);
        });
        assertThat(rows).allSatisfy(row -> {
            if (row.get("slug").equals("ikeja") || row.get("slug").equals("yaba")) {
                assertThat(((Number) row.get("listingCount")).longValue()).isZero();
            }
        });
    }

    @Test
    void rejectsLimitsOutsideOneToTwenty() throws Exception {
        mvc.perform(get("/api/v1/areas").param("limit", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_limit"));
        mvc.perform(get("/api/v1/areas").param("limit", "21"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_limit"));
    }
}
