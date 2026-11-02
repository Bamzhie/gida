package ng.gida;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.UUID;
import ng.gida.auth.TokenService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class VerificationInvalidationTest extends IntegrationTest {

    @Autowired
    TokenService tokens;

    private String reviewer() {
        UUID id = jdbc.sql("""
                INSERT INTO users (email, password_hash, name, role)
                VALUES ('reviewer@example.com', 'unused', 'Reviewer', 'ADMIN') RETURNING id
                """).query(UUID.class).single();
        return tokens.issueAccessToken(id, "ADMIN");
    }

    private void verify(String admin, String type, UUID id, String dimension) throws Exception {
        mvc.perform(put("/api/v1/admin/verifications")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"subjectType":"%s","subjectId":"%s","dimension":"%s","state":"VERIFIED"}
                                """.formatted(type, id, dimension)))
                .andExpect(status().isOk());
    }

    private void edit(String owner, UUID listing, String body) throws Exception {
        mvc.perform(patch("/api/v1/listings/{id}", listing)
                        .header("Authorization", "Bearer " + owner)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isNoContent());
    }

    @ParameterizedTest
    @ValueSource(strings = {"{\"price\":1234567}", "{\"pricePeriod\":\"MONTH\"}"})
    void changingTheAskingPriceInvalidatesItsPriorConfirmation(String changedPrice) throws Exception {
        String owner = registerAndLogin("price-owner@example.com", "AGENT");
        UUID listing = createListing(owner, "lekki-phase-1");
        publishListing(owner, listing);
        verify(reviewer(), "LISTING", listing, "PRICE");
        BigDecimal original = jdbc.sql("SELECT price FROM listings WHERE id = :id")
                .param("id", listing).query(BigDecimal.class).single();
        edit(owner, listing, "{\"title\":\"Same verified asking price\",\"price\":" + original + "}");
        mvc.perform(get("/api/v1/listings/{id}/verification", listing))
                .andExpect(status().isOk()).andExpect(jsonPath("$.priceVerified").value(true));
        edit(owner, listing, changedPrice);
        mvc.perform(get("/api/v1/listings/{id}/verification", listing))
                .andExpect(status().isOk()).andExpect(jsonPath("$.priceVerified").value(false));
    }

    @Test
    void correctingPropertyFactsInvalidatesOnlyTheAffectedPublicSignals() throws Exception {
        String owner = registerAndLogin("property-owner@example.com", "AGENT");
        UUID listing = createListing(owner, "lekki-phase-1");
        UUID ownerId = jdbc.sql("SELECT advertiser_id FROM listings WHERE id = :id")
                .param("id", listing).query(UUID.class).single();
        String admin = reviewer();
        for (String dimension : new String[]{"PROPERTY_EXISTENCE", "LOCATION", "PRICE"}) {
            verify(admin, "LISTING", listing, dimension);
        }
        verify(admin, "ADVERTISER", ownerId, "IDENTITY");
        edit(owner, listing, """
                {"property":{"locationSlug":"ikeja","propertyType":"APARTMENT","bedrooms":3}}
                """);
        publishListing(owner, listing);
        mvc.perform(get("/api/v1/listings/{id}/verification", listing))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.propertyVerified").value(false))
                .andExpect(jsonPath("$.locationVerified").value(false))
                .andExpect(jsonPath("$.priceVerified").value(true))
                .andExpect(jsonPath("$.advertiserVerified").value(true));
    }
}
