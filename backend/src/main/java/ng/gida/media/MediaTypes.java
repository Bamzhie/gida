package ng.gida.media;

import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import ng.gida.shared.ApiException;
import ng.gida.shared.Vocabulary.MediaKind;
import org.springframework.http.HttpStatus;

/**
 * Extension and content-type whitelist for uploads, per media kind. Serving
 * re-derives the content type from the stored key's extension, which is why
 * every uploaded key must carry a whitelisted extension.
 */
public final class MediaTypes {

    private static final Map<String, String> BY_EXTENSION = Map.of(
            "jpg", "image/jpeg",
            "jpeg", "image/jpeg",
            "png", "image/png",
            "webp", "image/webp",
            "mp4", "video/mp4",
            "pdf", "application/pdf");

    private static final Map<MediaKind, Set<String>> ALLOWED_EXTENSIONS = Map.of(
            MediaKind.PHOTO, Set.of("jpg", "jpeg", "png", "webp"),
            MediaKind.VIDEO, Set.of("mp4"),
            MediaKind.FLOOR_PLAN, Set.of("pdf", "png", "jpg", "jpeg"));

    /** Lower-cased extension of the filename without the dot, or empty. */
    public static Optional<String> extensionOf(String filename) {
        if (filename == null) {
            return Optional.empty();
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return Optional.empty();
        }
        return Optional.of(filename.substring(dot + 1).toLowerCase(Locale.ROOT));
    }

    /** Content type for a key or filename by extension, or empty. */
    public static Optional<String> ofFilename(String filename) {
        return extensionOf(filename).map(BY_EXTENSION::get);
    }

    /** Content type without parameters, lower-cased. */
    public static String normalize(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "";
        }
        return contentType.split(";", 2)[0].trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Accepts an upload only when both its extension and its content type are
     * whitelisted for the kind and agree with each other.
     */
    public static void requireSupported(MediaKind kind, String filename, String normalizedContentType) {
        String extension = extensionOf(filename).orElse("");
        String expected = BY_EXTENSION.get(extension);
        if (!ALLOWED_EXTENSIONS.get(kind).contains(extension)
                || expected == null || !expected.equals(normalizedContentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unsupported_media",
                    (extension.isEmpty() ? "Files without an extension" : "Files with the extension ." + extension)
                            + " cannot be uploaded as " + kind);
        }
    }

    private MediaTypes() {
    }
}
