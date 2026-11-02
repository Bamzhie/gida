package ng.gida.verifications;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.jayway.jsonpath.JsonPath;
import java.util.UUID;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class VerificationTest extends IntegrationTest {
    @Test void listingWithoutRowsExposesFourFalseBadges() throws Exception {
        UUID id = listing();
        mvc.perform(get("/api/v1/listings/{id}/verification",id)).andExpect(status().isOk())
            .andExpect(jsonPath("$.advertiserVerified").value(false)).andExpect(jsonPath("$.propertyVerified").value(false))
            .andExpect(jsonPath("$.locationVerified").value(false)).andExpect(jsonPath("$.priceVerified").value(false));
    }
    @Test void verifyingPriceMakesOnlyThePriceBadgeTrue() throws Exception {
        UUID id=listing(); String admin=trustAdminToken();
        upsert(admin,"LISTING",id,"PRICE","PENDING",200);
        mvc.perform(get("/api/v1/listings/{id}/verification",id)).andExpect(jsonPath("$.priceVerified").value(false));
        upsert(admin,"LISTING",id,"PRICE","VERIFIED",200);
        mvc.perform(get("/api/v1/listings/{id}/verification",id)).andExpect(jsonPath("$.priceVerified").value(true))
            .andExpect(jsonPath("$.advertiserVerified").value(false)).andExpect(jsonPath("$.propertyVerified").value(false))
            .andExpect(jsonPath("$.locationVerified").value(false));
    }
    @Test void advertiserIdentityOrBusinessVerifiesTheAdvertiserBadge() throws Exception {
        UUID id=listing(); UUID advertiser=advertiser(id); String admin=trustAdminToken();
        for(String dimension:new String[]{"IDENTITY","BUSINESS"}) {
            upsert(admin,"ADVERTISER",advertiser,dimension,"VERIFIED",200);
            mvc.perform(get("/api/v1/listings/{id}/verification",id)).andExpect(jsonPath("$.advertiserVerified").value(true));
            upsert(admin,"ADVERTISER",advertiser,dimension,"FAILED",200);
            mvc.perform(get("/api/v1/listings/{id}/verification",id)).andExpect(jsonPath("$.advertiserVerified").value(false));
        }
    }
    @Test void adminListZeroFillsAllNineDimensions() throws Exception {
        UUID id=listing();
        mvc.perform(get("/api/v1/admin/verifications").param("subjectType","LISTING").param("subjectId",id.toString())
            .header("Authorization","Bearer "+trustAdminToken())).andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(9)).andExpect(jsonPath("$[0].state").value("UNVERIFIED"));
    }
    @Test void upsertIsIdempotentAndKeepsReviewerAndTimestamps() throws Exception {
        UUID id=listing(); String admin=trustAdminToken();
        upsert(admin,"LISTING",id,"LOCATION","PENDING",200); upsert(admin,"LISTING",id,"LOCATION","VERIFIED",200);
        assertThat(jdbc.sql("SELECT count(*) FROM verifications WHERE subject_id=:id").param("id",id).query(Long.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("SELECT reviewer_id FROM verifications WHERE subject_id=:id").param("id",id).query(UUID.class).single()).isNotNull();
    }
    @Test void unknownSubjectIs404AndBadDimensionIs422() throws Exception {
        UUID id=listing(); String admin=trustAdminToken();
        upsert(admin,"LISTING",UUID.randomUUID(),"PRICE","VERIFIED",404);
        upsert(admin,"LISTING",id,"MADE_UP","VERIFIED",422);
        upsert(admin,"LISTING",id,"PRICE","MADE_UP",422);
        upsert(admin,"OTHER",id,"PRICE","VERIFIED",422);
    }
    @Test void verificationEndpointIsPublicButInvisibleListingsAre404() throws Exception {
        String agent=registerAndLogin("agent@example.com","AGENT"); UUID draft=createListing(agent,"lekki-phase-1");
        mvc.perform(get("/api/v1/listings/{id}/verification",draft)).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/listings/{id}/verification",UUID.randomUUID())).andExpect(status().isNotFound());
        UUID id=listing(); jdbc.sql("UPDATE listings SET expires_at=now()-interval '1 day' WHERE id=:id").param("id",id).update();
        mvc.perform(get("/api/v1/listings/{id}/verification",id)).andExpect(status().isNotFound());
    }
    @Test void agentDirectoryMarksVerifiedAdvertisers() throws Exception {
        UUID id=listing(); UUID advertiser=advertiser(id);
        upsert(trustAdminToken(),"ADVERTISER",advertiser,"IDENTITY","VERIFIED",200);
        mvc.perform(get("/api/v1/advertisers")).andExpect(status().isOk()).andExpect(jsonPath("$.items[?(@.id == '"+advertiser+"')].verified").value(org.hamcrest.Matchers.contains(true)));
    }
    @Test void userAndAnonymousCannotEditVerification() throws Exception {
        UUID id=listing(); String user=registerAndLogin("user@example.com","USER");
        upsert(user,"LISTING",id,"PRICE","VERIFIED",403);
        mvc.perform(put("/api/v1/admin/verifications").contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/admin/verifications").param("subjectType","LISTING").param("subjectId",id.toString()).header("Authorization","Bearer "+user)).andExpect(status().isForbidden());
    }
    @Test void concurrentUpsertsKeepOneDimensionRow() throws Exception {
        UUID id = listing(); String admin = trustAdminToken();
        var start = new java.util.concurrent.CountDownLatch(1);
        try (var pool = java.util.concurrent.Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Integer> request = () -> {
                start.await();
                return mvc.perform(put("/api/v1/admin/verifications").header("Authorization", "Bearer " + admin)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"subjectType\":\"LISTING\",\"subjectId\":\"%s\",\"dimension\":\"PRICE\",\"state\":\"VERIFIED\"}".formatted(id)))
                    .andReturn().getResponse().getStatus();
            };
            var first = pool.submit(request); var second = pool.submit(request); start.countDown();
            assertThat(java.util.List.of(first.get(30, java.util.concurrent.TimeUnit.SECONDS),
                    second.get(30, java.util.concurrent.TimeUnit.SECONDS))).containsExactly(200, 200);
        }
        assertThat(jdbc.sql("SELECT count(*) FROM verifications WHERE subject_id=:id").param("id", id).query(Long.class).single()).isEqualTo(1);
    }

    private UUID listing() throws Exception {
        String token=registerAndLogin("agent-"+UUID.randomUUID()+"@example.com","AGENT");
        UUID id=createListing(token,"lekki-phase-1"); publishListing(token,id); return id;
    }
    private UUID advertiser(UUID id) {return jdbc.sql("SELECT advertiser_id FROM listings WHERE id=:id").param("id",id).query(UUID.class).single();}
    private void upsert(String token,String type,UUID id,String dimension,String state,int expected) throws Exception {
        mvc.perform(put("/api/v1/admin/verifications").header("Authorization","Bearer "+token).contentType(MediaType.APPLICATION_JSON)
            .content("{\"subjectType\":\"%s\",\"subjectId\":\"%s\",\"dimension\":\"%s\",\"state\":\"%s\",\"evidenceRef\":\"case-123\",\"notes\":\"checked\"}".formatted(type,id,dimension,state)))
            .andExpect(status().is(expected));
    }
    private String trustAdminToken() throws Exception {
        String email="admin-"+UUID.randomUUID()+"@example.com";registerAndLogin(email,"AGENT");
        jdbc.sql("UPDATE users SET role='ADMIN' WHERE email=:email").param("email",email).update();
        String body=mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"%s\",\"password\":\"long enough password\"}".formatted(email)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();return JsonPath.read(body,"$.accessToken");
    }
}
