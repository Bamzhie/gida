package ng.gida.search;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class ListingSearchTest extends IntegrationTest {

    @Test
    void exposesAreaStateAndDisclosureFromTheHierarchy() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListing(agent, "lekki-phase-1"));

        mvc.perform(get("/api/v1/listings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].area").value("Lekki Phase 1"))
                .andExpect(jsonPath("$.items[0].state").value("Lagos"))
                .andExpect(jsonPath("$.items[0].listingType").value("RENT"))
                .andExpect(jsonPath("$.items[0].pricePeriod").value("YEAR"))
                .andExpect(jsonPath("$.items[0].bedrooms").value(2))
                .andExpect(jsonPath("$.items[0].hasDisclosedFees").value(true))
                .andExpect(jsonPath("$.items[0].primaryImage").doesNotExist());
    }

    @Test
    void filtersByEverySimpleFacet() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID studio = createListingFromJson(agent,
                ListingFixtures.rent("yaba", "1200000.00", 1, "24-7-security"));
        UUID family = createListingFromJson(agent,
                ListingFixtures.rent("lekki-phase-1", "3500000.00", 2, "borehole-water", "24-7-security"));
        UUID newHome = createListingFromJson(agent,
                ListingFixtures.newHome("lekki-phase-1", "HOUSE", "28000000.00", 3));
        UUID ikeja = createListingFromJson(agent,
                ListingFixtures.sale("ikeja", "HOUSE", "45000000.00", 4));
        for (UUID id : new UUID[]{studio, family, newHome, ikeja}) {
            publishListing(agent, id);
        }
        setAvailability(agent, ikeja, "SOLD");

        expectTotal("/api/v1/listings", 4);
        expectTotal("/api/v1/listings?listingType=RENT", 2);
        expectTotal("/api/v1/listings?availability=SOLD", 1);
        expectTotal("/api/v1/listings?category=NEW_HOMES", 1);
        expectTotal("/api/v1/listings?propertyType=LAND", 0);
        expectTotal("/api/v1/listings?bedrooms=3", 2);
        expectTotal("/api/v1/listings?minPrice=20000000", 2);
        expectTotal("/api/v1/listings?maxPrice=3600000&listingType=RENT", 2);
        expectTotal("/api/v1/listings?furnished=true", 0);
        expectTotal("/api/v1/listings?amenity=borehole-water&amenity=24-7-security", 1);
        expectTotal("/api/v1/listings?location=lagos", 4);
        expectTotal("/api/v1/listings?location=ikeja", 1);
    }

    @Test
    void filtersByIdsAndRejectsMoreThanFifty() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        UUID first = createListing(agent, "yaba");
        UUID second = createListing(agent, "ikeja");
        publishListing(agent, first);
        publishListing(agent, second);

        mvc.perform(get("/api/v1/listings").param("ids", first + "," + second))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2));

        String tooMany = IntStream.range(0, 51)
                .mapToObj(index -> UUID.randomUUID().toString())
                .collect(Collectors.joining(","));
        mvc.perform(get("/api/v1/listings").param("ids", tooMany))
                .andExpect(status().isBadRequest());
    }

    @Test
    void hidesDraftsAndExpiredListings() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        createListing(agent, "yaba");
        UUID expired = createListing(agent, "ikeja");
        publishListing(agent, expired);
        jdbc.sql("UPDATE listings SET expires_at = now() - interval '1 day' WHERE id = :id")
                .param("id", expired)
                .update();

        expectTotal("/api/v1/listings", 0);
    }

    @Test
    void paginatesWithTotals() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("yaba", "1000000.00", 1)));
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("ikeja", "2000000.00", 2)));
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1", "3000000.00", 3)));

        mvc.perform(get("/api/v1/listings").param("size", "2").param("page", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.pages").value(2))
                .andExpect(jsonPath("$.items.length()").value(1));

        mvc.perform(get("/api/v1/listings").param("size", "101"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sortsByPriceAndByNewest() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("yaba", "3000000.00", 1)));
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("ikeja", "1000000.00", 2)));
        publishListing(agent, createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1", "2000000.00", 3)));

        mvc.perform(get("/api/v1/listings").param("sort", "price-asc"))
                .andExpect(jsonPath("$.items[0].price").value(1000000.0))
                .andExpect(jsonPath("$.items[1].price").value(2000000.0))
                .andExpect(jsonPath("$.items[2].price").value(3000000.0));

        mvc.perform(get("/api/v1/listings").param("sort", "price-desc"))
                .andExpect(jsonPath("$.items[0].price").value(3000000.0));

        mvc.perform(get("/api/v1/listings").param("sort", "nonsense"))
                .andExpect(status().isBadRequest());
    }

    private void expectTotal(String url, int total) throws Exception {
        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(total));
    }

    private void setAvailability(String token, UUID listingId, String availability) throws Exception {
        mvc.perform(patch("/api/v1/listings/{id}", listingId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"availability\":\"" + availability + "\"}"))
                .andExpect(status().isNoContent());
    }
}
