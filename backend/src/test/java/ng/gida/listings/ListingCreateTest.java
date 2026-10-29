package ng.gida.listings;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ListingCreateTest extends IntegrationTest {

    @Test
    void createsADraftListingWithCostsAmenitiesAndPoint() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");

        String body = mvc.perform(post("/api/v1/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("lekki-phase-1", "AGENCY_FEE")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lifecycle").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();
        UUID listingId = UUID.fromString(JsonPath.read(body, "$.id"));

        assertThat(scalar("SELECT lifecycle FROM listings WHERE id = :id", listingId)).isEqualTo("DRAFT");
        assertThat(scalar("SELECT category FROM listings WHERE id = :id", listingId)).isEqualTo("STANDARD");
        assertThat(jdbc.sql("""
                        SELECT ST_SRID(p.geom)
                        FROM properties p JOIN listings l ON l.property_id = p.id
                        WHERE l.id = :id
                        """).param("id", listingId).query(Integer.class).single()).isEqualTo(4326);
        assertThat(jdbc.sql("""
                        SELECT count(*) FROM listing_costs c
                        JOIN listings l ON l.id = c.listing_id WHERE l.id = :id
                        """).param("id", listingId).query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("""
                        SELECT count(*) FROM property_amenities pa
                        JOIN listings l ON l.property_id = pa.property_id WHERE l.id = :id
                        """).param("id", listingId).query(Integer.class).single()).isEqualTo(2);
    }

    @Test
    void rejectsRentAsACostType() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");

        mvc.perform(post("/api/v1/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("lekki-phase-1", "RENT")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsAnUnknownLocationWith422() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");

        mvc.perform(post("/api/v1/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("atlantis", "AGENCY_FEE")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/unknown_location"));
    }

    @Test
    void rejectsAnUnknownAmenity() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        String body = createBody("lekki-phase-1", "AGENCY_FEE")
                .replace("\"24-7-security\"", "\"helipad\"");

        mvc.perform(post("/api/v1/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/unknown_amenity"));
    }

    @Test
    void rejectsASaleListingThatCarriesAPricePeriod() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        String body = createBody("lekki-phase-1", "AGENCY_FEE")
                .replace("\"listingType\": \"RENT\"", "\"listingType\": \"SALE\"");

        mvc.perform(post("/api/v1/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_price_period"));
    }

    @Test
    void plainUsersCannotCreateListings() throws Exception {
        String token = registerAndLogin("buyer@example.com", "USER");

        mvc.perform(post("/api/v1/listings")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("lekki-phase-1", "AGENCY_FEE")))
                .andExpect(status().isForbidden());
    }

    private String scalar(String sql, UUID id) {
        return jdbc.sql(sql).param("id", id).query(String.class).single();
    }

    private static String createBody(String locationSlug, String costType) {
        return """
                {
                  "title": "2 bedroom flat in Lekki Phase 1",
                  "description": "A bright flat close to Admiralty Way.",
                  "listingType": "RENT",
                  "price": 3500000.00,
                  "pricePeriod": "YEAR",
                  "property": {
                    "locationSlug": "%s",
                    "addressLine": "12 Admiralty Way",
                    "propertyType": "APARTMENT",
                    "bedrooms": 2,
                    "bathrooms": 2,
                    "latitude": 6.4385,
                    "longitude": 3.4356,
                    "amenities": ["borehole-water", "24-7-security"]
                  },
                  "costs": [{ "type": "%s", "amount": 350000.00 }],
                  "media": [{ "url": "https://example.com/photo.jpg", "sortOrder": 0 }]
                }
                """.formatted(locationSlug, costType);
    }
}
