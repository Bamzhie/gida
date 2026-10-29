package ng.gida.locations;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;

class ReferenceDataTest extends IntegrationTest {

    @Test
    void listsLocationsWithParentSlug() throws Exception {
        mvc.perform(get("/api/v1/locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'lekki-phase-1')].parentSlug").value("eti-osa"))
                // A filtered path always yields a list, so a null parent is [null], not null.
                .andExpect(jsonPath("$[?(@.slug == 'lagos')].parentSlug")
                        .value(org.hamcrest.Matchers.contains(org.hamcrest.Matchers.nullValue())));
    }

    @Test
    void listsAmenitiesAlphabetically() throws Exception {
        mvc.perform(get("/api/v1/amenities"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].label").value("24/7 security"))
                .andExpect(jsonPath("$[1].label").value("Borehole / water supply"));
    }
}
