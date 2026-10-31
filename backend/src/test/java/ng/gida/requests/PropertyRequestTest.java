package ng.gida.requests;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class PropertyRequestTest extends IntegrationTest {

    private String request(String location, String min, String max) {
        return request(location, min, max, "ada@example.com");
    }

    private String request(String location, String min, String max, String contact) {
        return """
                {"title":"2-bedroom flat for rent","listingType":"RENT","propertyType":"APARTMENT",
                 "location":"%s","minPrice":%s,"maxPrice":%s,"bedrooms":2,"bathrooms":1,
                 "furnished":true,"neededBy":"2026-12","notes":"Near the office.",
                 "name":"Ada Eze","contact":"%s","amenities":["24-7-security"]}
                """.formatted(location, min, max, contact);
    }

    @Test
    void anonymousSubmitterGetsAnIdBack() throws Exception {
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content(request("lekki-phase-1", "1000000", "4000000")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.createdAt").exists());

        String stored = jdbc.sql("""
                SELECT (location_id IS NOT NULL)::text || '|' || needed_by::text || '|' || furnished::text
                FROM property_requests""")
                .query(String.class).single();
        assertThat(stored).isEqualTo("true|2026-12-01|true");
    }

    @Test
    void unknownLocationSlugIsRejected() throws Exception {
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content(request("marina-city", "1000000", "4000000")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/unknown_location"));
    }

    @Test
    void unknownAmenitySlugIsRejected() throws Exception {
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Flat","listingType":"RENT","location":"yaba",
                                 "name":"Ada","contact":"ada@example.com","amenities":["gym"]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/validation_failed"));
    }

    @Test
    void invertedBudgetIsRejected() throws Exception {
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content(request("yaba", "9000000", "4000000")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_budget"));
    }

    @Test
    void requiredFieldsAndContactFormatAreChecked() throws Exception {
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingType":"RENT","name":"","contact":"wrong","location":"yaba"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/validation_failed"))
                .andExpect(jsonPath("$.errors.title").exists());
    }

    @Test
    void aSecondRequestWithinTheHourIsADuplicate() throws Exception {
        String json = request("ikeja", "1000000", "4000000");
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/duplicate_request"));
    }

    @Test
    void honeypotRejects() throws Exception {
        mvc.perform(post("/api/v1/requests").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Flat","listingType":"RENT","location":"yaba",
                                 "name":"Bot","contact":"bot@example.com","website":"http://spam.test"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/honeypot_rejected"));
    }

    @Test
    void aSignedInSubmitterCanListOwnRequestsOnly() throws Exception {
        String ada = registerAndLogin("ada@example.com", "USER");
        String other = registerAndLogin("other@example.com", "USER");
        mvc.perform(post("/api/v1/requests")
                        .header("Authorization", "Bearer " + ada)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("yaba", null, "3000000")))
                .andExpect(status().isCreated());
        // a different contact, or the plan's (contact, lower(title)) dedupe would answer 409
        mvc.perform(post("/api/v1/requests")
                        .header("Authorization", "Bearer " + other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request("yaba", null, "3000000", "other@example.com")))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/me/requests").header("Authorization", "Bearer " + ada))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].status").value("OPEN"))
                .andExpect(jsonPath("$.items[0].name").value("Ada Eze"))
                .andExpect(jsonPath("$.items[0].area").value("Yaba"))
                .andExpect(jsonPath("$.items[0].amenities[0]").value("24/7 security"))
                .andExpect(jsonPath("$.items[0].contact").value("ada@example.com"));

        Long stored = jdbc.sql("SELECT count(*) FROM property_requests WHERE user_id IS NOT NULL")
                .query(Long.class).single();
        assertThat(stored).isEqualTo(2);
    }
}
