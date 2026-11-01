package ng.gida.media;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import javax.imageio.ImageIO;
import ng.gida.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

@TestPropertySource(properties = "GIDA_MEDIA_DIR=target/test-media")
class MediaUploadTest extends IntegrationTest {

    private static final Path MEDIA_DIR = Path.of("target", "test-media").toAbsolutePath().normalize();
    private static final String CACHE_CONTROL = "public, max-age=31536000, immutable";

    @Autowired
    private LocalObjectStorage storage;

    @Test
    void ownerUploadsAPhotoIntoADraftListing() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        String body = upload(token, listingId, "PHOTO", "photo.png", "image/png", png())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String url = JsonPath.read(body, "$.url");
        UUID mediaId = UUID.fromString(JsonPath.read(body, "$.id"));
        assertThat(url).startsWith("/media/listings/" + listingId + "/");
        assertThat(jdbc.sql("SELECT url FROM listing_media WHERE id = :id")
                .param("id", mediaId)
                .query(String.class)
                .single()).isEqualTo(url);
        assertThat(jdbc.sql("SELECT kind FROM listing_media WHERE id = :id")
                .param("id", mediaId)
                .query(String.class)
                .single()).isEqualTo("PHOTO");
        assertThat(MEDIA_DIR.resolve(keyOf(url))).exists();
    }

    @Test
    void anotherAgentCannotUploadToAListing() throws Exception {
        String owner = registerAndLogin("owner@example.com", "AGENT");
        String other = registerAndLogin("other@example.com", "AGENT");
        UUID listingId = createListing(owner, "lekki-phase-1");

        upload(other, listingId, "PHOTO", "photo.png", "image/png", png())
                .andExpect(status().isForbidden());
    }

    @Test
    void publishedListingsRejectUploads() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        publishListing(token, listingId);

        upload(token, listingId, "PHOTO", "photo.png", "image/png", png())
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/listing_locked"));
    }

    @Test
    void theTwentyFirstMediaEntryIsRejected() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        for (int i = 0; i < 20; i++) {
            upload(token, listingId, "PHOTO", "photo-" + i + ".png", "image/png", png())
                    .andExpect(status().isCreated());
        }

        upload(token, listingId, "PHOTO", "photo-21.png", "image/png", png())
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/too_many_media"));
    }

    @Test
    void unsupportedExtensionsAndTypesAreRejected() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        upload(token, listingId, "PHOTO", "photo.gif", "image/gif", png())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/unsupported_media"));

        upload(token, listingId, "PHOTO", "photo.png", "video/mp4", png())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/unsupported_media"));

        upload(token, listingId, "VIDEO", "clip.png", "image/png", png())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/unsupported_media"));
    }

    @Test
    void oversizedUploadsAreRejected() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        upload(token, listingId, "PHOTO", "photo.png", "image/png", new byte[11 * 1024 * 1024])
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/unsupported_media"));
    }

    @Test
    void floorPlansAreStoredAsIs() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        byte[] pdf = "%PDF-1.4 floor plan for the listing".getBytes();

        String body = upload(token, listingId, "FLOOR_PLAN", "plan.pdf", "application/pdf", pdf)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String url = JsonPath.read(body, "$.url");
        assertThat(url).startsWith("/media/listings/" + listingId + "/").endsWith(".pdf");
        assertThat(keyOf(url)).doesNotContain("-display");
        assertThat(Files.readAllBytes(MEDIA_DIR.resolve(keyOf(url)))).isEqualTo(pdf);
    }

    @Test
    void photosAreProcessedIntoThumbAndDisplayVariants() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        String body = upload(token, listingId, "PHOTO", "photo.png", "image/png", png())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String url = JsonPath.read(body, "$.url");
        assertThat(url).endsWith("-display.jpg");
        String base = keyOf(url).substring(0, keyOf(url).length() - "-display.jpg".length());
        Path original = MEDIA_DIR.resolve(base + ".jpg");
        Path thumb = MEDIA_DIR.resolve(base + "-thumb.jpg");
        Path display = MEDIA_DIR.resolve(base + "-display.jpg");
        assertThat(original).exists();
        assertThat(thumb).exists();
        assertThat(display).exists();

        BufferedImage thumbImage = ImageIO.read(thumb.toFile());
        assertThat(thumbImage.getWidth()).isEqualTo(400);
        assertThat(thumbImage.getHeight()).isEqualTo(300);
        BufferedImage displayImage = ImageIO.read(display.toFile());
        assertThat(displayImage.getWidth()).isEqualTo(640);
        assertThat(displayImage.getHeight()).isEqualTo(480);

        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/jpeg"));
    }

    @Test
    void undecodablePhotosAreRejected() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        upload(token, listingId, "PHOTO", "photo.jpg", "image/jpeg",
                "this is not an image at all".getBytes())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_image"));
    }

    @Test
    void deletingMediaRemovesTheRowAndTheStoredObjects() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        String body = upload(token, listingId, "PHOTO", "photo.png", "image/png", png())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        UUID mediaId = UUID.fromString(JsonPath.read(body, "$.id"));
        String url = JsonPath.read(body, "$.url");
        String base = keyOf(url).substring(0, keyOf(url).length() - "-display.jpg".length());
        Path original = MEDIA_DIR.resolve(base + ".jpg");
        Path thumb = MEDIA_DIR.resolve(base + "-thumb.jpg");
        Path display = MEDIA_DIR.resolve(base + "-display.jpg");
        assertThat(original).exists();
        assertThat(thumb).exists();
        assertThat(display).exists();

        mvc.perform(delete("/api/v1/me/listings/{listingId}/media/{mediaId}", listingId, mediaId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(jdbc.sql("SELECT count(*) FROM listing_media WHERE id = :id")
                .param("id", mediaId)
                .query(Long.class)
                .single()).isZero();
        assertThat(original).doesNotExist();
        assertThat(thumb).doesNotExist();
        assertThat(display).doesNotExist();
    }

    @Test
    void reorderRewritesTheSortOrderOfTheListingMedia() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        UUID first = uploadAndReadId(token, listingId, "first.png");
        UUID second = uploadAndReadId(token, listingId, "second.png");

        mvc.perform(put("/api/v1/me/listings/{listingId}/media/order", listingId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                [{"id": "%s", "sortOrder": 0}, {"id": "%s", "sortOrder": 1}]
                                """.formatted(second, first)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(second.toString()))
                .andExpect(jsonPath("$[0].sortOrder").value(0))
                .andExpect(jsonPath("$[1].id").value(first.toString()))
                .andExpect(jsonPath("$[1].sortOrder").value(1));

        assertThat(jdbc.sql("SELECT sort_order FROM listing_media WHERE id = :id")
                .param("id", second).query(Integer.class).single()).isZero();
        assertThat(jdbc.sql("SELECT sort_order FROM listing_media WHERE id = :id")
                .param("id", first).query(Integer.class).single()).isEqualTo(1);
    }

    @Test
    void anonymousRequestsServeUploadedObjectsWithImmutableCaching() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");
        String body = upload(token, listingId, "PHOTO", "photo.png", "image/png", png())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String url = JsonPath.read(body, "$.url");

        MvcResult served = mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", CACHE_CONTROL))
                .andExpect(header().string("Content-Type", "image/jpeg"))
                .andReturn();

        assertThat(served.getResponse().getContentAsByteArray()).isNotEmpty();
    }

    @Test
    void servingAMissingObjectReturns404() throws Exception {
        mvc.perform(get("/media/missing")).andExpect(status().isNotFound());
        mvc.perform(get("/media/listings/11111111-1111-1111-1111-111111111111/nope.png"))
                .andExpect(status().isNotFound());
    }

    @Test
    void pathTraversalKeysAreRefused() throws Exception {
        // the container normalises ".." and answers 400 before our controller sees it;
        // anything 4xx is a refusal, and the storage-level assertions below cover the rest
        mvc.perform(get("/media/listings/../application.yml")).andExpect(status().is4xxClientError());

        assertThatThrownBy(() -> storage.put("listings/../escape.png", new byte[1], "image/png"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.put("/etc/passwd", new byte[1], "text/plain"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void oversizedDimensionsAreRefusedBeforeDecode() throws Exception {
        String token = registerAndLogin("agent@example.com", "AGENT");
        UUID listingId = createListing(token, "lekki-phase-1");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        BufferedImage huge = new BufferedImage(9000, 1, BufferedImage.TYPE_INT_RGB);
        ImageIO.write(huge, "png", out);

        upload(token, listingId, "PHOTO", "bomb.png", "image/png", out.toByteArray())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("https://gida.ng/errors/invalid_image"));
    }

    @Test
    void symlinksInsideTheMediaDirectoryCannotEscape() throws Exception {
        Path outside = Files.createTempFile("gida-escape", ".txt");
        Files.writeString(outside, "secret");
        Path link = MEDIA_DIR.resolve("listings-x");
        Files.deleteIfExists(link);
        Files.createSymbolicLink(link, outside.getParent());

        assertThatThrownBy(() -> storage.get("listings-x/" + outside.getFileName()))
                .isInstanceOf(IllegalArgumentException.class);
        Files.deleteIfExists(link);
        Files.deleteIfExists(outside);
    }

    private ResultActions upload(String token, UUID listingId, String kind, String filename,
                                 String contentType, byte[] content) throws Exception {
        return mvc.perform(multipart("/api/v1/me/listings/{listingId}/media", listingId)
                        .file(new MockMultipartFile("file", filename, contentType, content))
                        .param("kind", kind)
                        .header("Authorization", "Bearer " + token));
    }

    private UUID uploadAndReadId(String token, UUID listingId, String filename) throws Exception {
        String body = upload(token, listingId, "PHOTO", filename, "image/png", png())
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.id"));
    }

    private static String keyOf(String url) {
        return url.substring(MediaStorageService.URL_PREFIX.length());
    }

    private static byte[] png() throws IOException {
        BufferedImage image = new BufferedImage(640, 480, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.RED);
        graphics.fillRect(0, 0, 640, 480);
        graphics.dispose();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }
}
