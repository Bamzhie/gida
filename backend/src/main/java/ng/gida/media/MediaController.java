package ng.gida.media;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.shared.Vocabulary.MediaKind;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
public class MediaController {

    private static final String CACHE_HEADER = "public, max-age=31536000, immutable";

    private final MediaStorageService media;
    private final ObjectStorage storage;

    public MediaController(MediaStorageService media, ObjectStorage storage) {
        this.media = media;
        this.storage = storage;
    }

    @GetMapping("/api/v1/me/listings/{listingId}/media")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public List<MediaDto> listOwned(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID listingId) {
        return media.listOwnedMedia(UUID.fromString(jwt.getSubject()), isAdmin(jwt), listingId);
    }

    @PostMapping("/api/v1/me/listings/{listingId}/media")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public MediaDto upload(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID listingId,
                           @RequestParam("file") MultipartFile file,
                           @RequestParam("kind") String kind) throws IOException {
        return media.upload(UUID.fromString(jwt.getSubject()), isAdmin(jwt), listingId,
                parseKind(kind), file.getOriginalFilename(), file.getContentType(), file.getBytes());
    }

    @DeleteMapping("/api/v1/me/listings/{listingId}/media/{mediaId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID listingId,
                       @PathVariable UUID mediaId) {
        media.delete(UUID.fromString(jwt.getSubject()), isAdmin(jwt), listingId, mediaId);
    }

    @PutMapping("/api/v1/me/listings/{listingId}/media/order")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public List<MediaDto> reorder(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID listingId,
                                  @RequestBody List<MediaOrderItem> order) {
        return media.reorder(UUID.fromString(jwt.getSubject()), isAdmin(jwt), listingId, order);
    }

    /** Public serving endpoint; objects live under {@code /media/{key}}. */
    @GetMapping("/media/{*key}")
    public ResponseEntity<byte[]> serve(@PathVariable String key) {
        String name = key.startsWith("/") ? key.substring(1) : key;
        if (name.contains("..") || !name.startsWith("listings/")) {
            return notFound();
        }
        if (!storage.exists(name)) {
            return notFound();
        }
        byte[] content;
        try {
            content = storage.get(name);
        } catch (UncheckedStorageException missing) {
            return notFound();
        }
        MediaType contentType = MediaTypes.ofFilename(name)
                .map(MediaType::parseMediaType)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_HEADER)
                .contentType(contentType)
                .contentLength(content.length)
                .body(content);
    }

    private static MediaKind parseKind(String kind) {
        try {
            return MediaKind.valueOf(kind);
        } catch (IllegalArgumentException | NullPointerException invalid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unsupported_media",
                    "kind must be PHOTO, VIDEO or FLOOR_PLAN");
        }
    }

    private static boolean isAdmin(Jwt jwt) {
        return "ADMIN".equals(jwt.getClaimAsString("role"));
    }

    private static ResponseEntity<byte[]> notFound() {
        return ResponseEntity.notFound().build();
    }
}
