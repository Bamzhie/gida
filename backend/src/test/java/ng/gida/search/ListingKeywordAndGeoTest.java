package ng.gida.search;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import org.junit.jupiter.api.Test;

class ListingKeywordAndGeoTest extends IntegrationTest {

    @Test
    void matchesTitleAndDescription() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        String json = ListingFixtures.rent("yaba")
                .replace("A home in yaba", "Garden terrace with a private yard");
        publishListing(agent, createListingFromJson(agent, json));

        mvc.perform(get("/api/v1/listings").param("q", "terrace"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));

        mvc.perform(get("/api/v1/listings").param("q", "helicopter"))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void matchesLocationNameAndAddressLine() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListing(agent, "lekki-phase-1"));

        mvc.perform(get("/api/v1/listings").param("q", "Lekki"))
                .andExpect(jsonPath("$.total").value(1));

        mvc.perform(get("/api/v1/listings").param("q", "Admiralty"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void mapsEverydayWordsToPropertyTypeEnums() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListing(agent, "yaba"));

        mvc.perform(get("/api/v1/listings").param("q", "flat"))
                .andExpect(jsonPath("$.total").value(1));

        mvc.perform(get("/api/v1/listings").param("q", "plot"))
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void filtersByBoundingBox() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListing(agent, "lekki-phase-1"));
        String abuja = ListingFixtures.rent("ikeja")
                .replace("6.4385", "9.0500")
                .replace("3.4356", "7.4900");
        publishListing(agent, createListingFromJson(agent, abuja));

        expectTotal("/api/v1/listings", 2);
        expectTotal("/api/v1/listings?bbox=3.30,6.30,3.60,6.60", 1);
        expectTotal("/api/v1/listings?bbox=7.30,8.90,7.60,9.20", 1);
        expectTotal("/api/v1/listings?bbox=0.00,0.00,1.00,1.00", 0);
    }

    @Test
    void filtersByPolygon() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListing(agent, "lekki-phase-1"));
        String abuja = ListingFixtures.rent("ikeja")
                .replace("6.4385", "9.0500")
                .replace("3.4356", "7.4900");
        publishListing(agent, createListingFromJson(agent, abuja));

        String aroundLekki = """
                {"type":"Polygon","coordinates":[[[3.30,6.30],[3.60,6.30],[3.60,6.60],[3.30,6.60],[3.30,6.30]]]}
                """.trim();

        mvc.perform(get("/api/v1/listings").param("polygon", aroundLekki))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].area").value("Lekki Phase 1"));
    }

    @Test
    void rejectsAPolygonWithACrsMember() throws Exception {
        String withCrs = """
                {"type":"Polygon","crs":{"type":"name"},"coordinates":[[[3.30,6.30],[3.60,6.30],[3.30,6.30]]]}
                """.trim();

        mvc.perform(get("/api/v1/listings").param("polygon", withCrs))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_polygon"));
    }

    @Test
    void rejectsAnUnclosedRing() throws Exception {
        String unclosed = """
                {"type":"Polygon","coordinates":[[[3.30,6.30],[3.60,6.30],[3.60,6.60],[3.30,6.60]]]}
                """.trim();

        mvc.perform(get("/api/v1/listings").param("polygon", unclosed))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("polygon ring must be closed"));
    }

    @Test
    void relevanceSortRequiresAKeyword() throws Exception {
        mvc.perform(get("/api/v1/listings").param("sort", "relevance"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/relevance_requires_keyword"));
    }

    @Test
    void relevanceSortRanksTitleMatchesFirst() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        String strong = ListingFixtures.rent("yaba").replace("A home in yaba", "Terrace terrace terrace");
        String weak = ListingFixtures.rent("ikeja")
                .replace("A well placed home close to the main road.", "A home that mentions a terrace once.");
        publishListing(agent, createListingFromJson(agent, strong));
        publishListing(agent, createListingFromJson(agent, weak));

        mvc.perform(get("/api/v1/listings").param("q", "terrace").param("sort", "relevance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items[0].id").value(strongId()));
    }

    private String strongId() {
        return jdbc.sql("SELECT id::text FROM listings WHERE title = 'Terrace terrace terrace'")
                .query(String.class)
                .single();
    }

    private void expectTotal(String url, int total) throws Exception {
        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(total));
    }
}
