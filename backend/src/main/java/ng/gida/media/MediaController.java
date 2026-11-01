package ng.gida.media;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MediaController {

    private static final String CACHE_HEADER = "public, max-age=31536000, immutable";

    private final ObjectStorage storage;

    public MediaController(ObjectStorage storage) {
        this.storage = storage;
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

    private static ResponseEntity<byte[]> notFound() {
        return ResponseEntity.notFound().build();
    }
}
