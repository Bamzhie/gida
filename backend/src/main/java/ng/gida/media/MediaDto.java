package ng.gida.media;

import java.util.UUID;

/**
 * Shape of a stored media entry, mirroring the listing detail media shape with
 * the entry id added so callers can delete and reorder entries.
 */
public record MediaDto(UUID id, String url, String caption, String kind, int sortOrder) {
}
