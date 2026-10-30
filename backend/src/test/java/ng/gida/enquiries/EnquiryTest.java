package ng.gida.enquiries;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ng.gida.IntegrationTest;
import ng.gida.support.ListingFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class EnquiryTest extends IntegrationTest {

    private String body(String listingId, String action, String contact) {
        return """
                {"listingId":"%s","action":"%s","name":"Ada Eze","contact":"%s",
                 "message":"Is this still available?"}
                """.formatted(listingId, action, contact);
    }

    @Test
    void anonymousVisitorCanEnquireAboutAListing() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        var listing = createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1"));
        publishListing(agent, listing);

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content(body(listing.toString(), "CONTACT", "ada@example.com")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    void anonymousVisitorCanContactAnAdvertiserDirectly() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        String advertiserId = jdbc.sql("SELECT id FROM users WHERE email = 'agent@example.com'")
                .query(java.util.UUID.class).single().toString();

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"advertiserId":"%s","action":"VIEWING","name":"Ada Eze",
                                 "contact":"0803 111 2222","message":"When can I view?"}
                                """.formatted(advertiserId)))
                .andExpect(status().isCreated());
        // the listing branch above must not be needed to prove the advertiser branch works
    }

    @Test
    void bothSubjectsAndNeitherSubjectAreRejected() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        var listing = createListingFromJson(agent, ListingFixtures.rent("yaba"));
        publishListing(agent, listing);
        String advertiserId = jdbc.sql("SELECT id FROM users WHERE email = 'agent@example.com'")
                .query(java.util.UUID.class).single().toString();

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":"%s","advertiserId":"%s","action":"CONTACT",
                                 "name":"Ada","contact":"ada@example.com"}
                                """.formatted(listing, advertiserId)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/validation_failed"));

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"action":"CONTACT","name":"Ada","contact":"ada@example.com"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/validation_failed"));
    }

    @Test
    void unknownSubjectsAreNotFound() throws Exception {
        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content(body(java.util.UUID.randomUUID().toString(), "CONTACT", "ada@example.com")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/listing_not_found"));

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"advertiserId":"%s","action":"CONTACT","name":"Ada","contact":"ada@example.com"}
                                """.formatted(java.util.UUID.randomUUID())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/advertiser_not_found"));
    }

    @Test
    void contactMustLookLikeAnEmailOrAPhone() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        var listing = createListingFromJson(agent, ListingFixtures.rent("ikeja"));
        publishListing(agent, listing);

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content(body(listing.toString(), "CONTACT", "not a contact")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/validation_failed"))
                .andExpect(jsonPath("$.errors.contact").exists());
    }

    @Test
    void aSecondEnquiryWithinTheHourIsADuplicate() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        var listing = createListingFromJson(agent, ListingFixtures.rent("lekki-phase-1"));
        publishListing(agent, listing);
        String json = body(listing.toString(), "CONTACT", "ada@example.com");

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/duplicate_enquiry"));

        // a different subject from the same contact is not a duplicate
        var other = createListingFromJson(agent, ListingFixtures.rent("yaba"));
        publishListing(agent, other);
        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content(body(other.toString(), "CONTACT", "ada@example.com")))
                .andExpect(status().isCreated());
    }

    @Test
    void honeypotRejectsWithoutWriting() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        var listing = createListingFromJson(agent, ListingFixtures.rent("ikeja"));
        publishListing(agent, listing);

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"listingId":"%s","action":"CONTACT","name":"Bot",
                                 "contact":"bot@example.com","website":"http://spam.test"}
                                """.formatted(listing)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/honeypot_rejected"));

        Long rows = jdbc.sql("SELECT count(*) FROM enquiries").query(Long.class).single();
        assertThat(rows).isZero();
    }

    @Test
    void theInboxShowsOnlyTheCallersOwnSubjects() throws Exception {
        String ade = registerAndLogin("ade@example.com", "AGENT");
        String bayo = registerAndLogin("bayo@example.com", "AGENT");
        var adeListing = createListingFromJson(ade, ListingFixtures.rent("lekki-phase-1"));
        publishListing(ade, adeListing);
        var bayoListing = createListingFromJson(bayo, ListingFixtures.rent("ikeja"));
        publishListing(bayo, bayoListing);

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content(body(adeListing.toString(), "VIEWING", "ada@example.com")))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content(body(bayoListing.toString(), "CONTACT", "bola@example.com")))
                .andExpect(status().isCreated());

        mvc.perform(get("/api/v1/me/enquiries").header("Authorization", "Bearer " + ade))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].contact").value("ada@example.com"))
                .andExpect(jsonPath("$.items[0].listingTitle").value(org.hamcrest.Matchers.containsString("Lekki")))
                .andExpect(jsonPath("$.items[0].action").value("VIEWING"));
    }

    @Test
    void aPlainUserCannotReadAnInbox() throws Exception {
        String user = registerAndLogin("user@example.com", "USER");
        mvc.perform(get("/api/v1/me/enquiries").header("Authorization", "Bearer " + user))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousEnquiriesRecordNoUserButSignedInOnesDo() throws Exception {
        String agent = registerAndLogin("agent@example.com", "AGENT");
        String visitor = registerAndLogin("visitor@example.com", "USER");
        var listing = createListingFromJson(agent, ListingFixtures.rent("yaba"));
        publishListing(agent, listing);

        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .content(body(listing.toString(), "CONTACT", "someone@example.com")))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/v1/enquiries").contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer " + visitor)
                        .content(body(listing.toString(), "CONTACT", "signed@example.com")))
                .andExpect(status().isCreated());

        Long withUser = jdbc.sql("SELECT count(*) FROM enquiries WHERE user_id IS NOT NULL")
                .query(Long.class).single();
        assertThat(withUser).isEqualTo(1);
    }
}
