package ng.gida.media;

import java.util.List;
import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.shared.Vocabulary.MediaKind;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Upload, delete and reorder rules for listing media. Owner and draft checks
 * use their own queries against the listings and listing_media tables; storage
 * objects live behind {@link ObjectStorage}.
 */
@Service
public class MediaStorageService {

    static final int MAX_MEDIA_PER_LISTING = 20;
    static final int MAX_PHOTO_OR_FLOOR_PLAN_BYTES = 10 * 1024 * 1024;
    static final int MAX_VIDEO_BYTES = 100 * 1024 * 1024;
    static final String URL_PREFIX = "/media/";

    private final JdbcClient jdbc;
    private final ObjectStorage storage;

    public MediaStorageService(JdbcClient jdbc, ObjectStorage storage) {
        this.jdbc = jdbc;
        this.storage = storage;
    }

    @Transactional
    public MediaDto upload(UUID actorId, boolean admin, UUID listingId, MediaKind kind,
                           String filename, String contentType, byte[] content) {
        requireOwnedDraft(actorId, admin, listingId);
        if (kind == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unsupported_media",
                    "kind must be PHOTO, VIDEO or FLOOR_PLAN");
        }
        String normalizedType = MediaTypes.normalize(contentType);
        MediaTypes.requireSupported(kind, filename, normalizedType);
        if (content == null || content.length == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unsupported_media", "The uploaded file is empty");
        }
        long cap = kind == MediaKind.VIDEO ? MAX_VIDEO_BYTES : MAX_PHOTO_OR_FLOOR_PLAN_BYTES;
        if (content.length > cap) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unsupported_media",
                    "The uploaded file is larger than the " + (cap / (1024 * 1024)) + " MB cap for " + kind);
        }
        if (countMedia(listingId) >= MAX_MEDIA_PER_LISTING) {
            throw new ApiException(HttpStatus.CONFLICT, "too_many_media",
                    "A listing may carry at most 20 media entries");
        }
        String extension = MediaTypes.extensionOf(filename).orElseThrow();
        String key = "listings/" + listingId + "/" + UUID.randomUUID() + "." + extension;
        storage.put(key, content, normalizedType);
        int sortOrder = nextSortOrder(listingId);
        UUID mediaId = insertMedia(listingId, URL_PREFIX + key, kind, sortOrder);
        return new MediaDto(mediaId, URL_PREFIX + key, null, kind.name(), sortOrder);
    }

    @Transactional
    public void delete(UUID actorId, boolean admin, UUID listingId, UUID mediaId) {
        requireOwnedDraft(actorId, admin, listingId);
        MediaRow row = jdbc.sql("SELECT id, url, kind FROM listing_media WHERE id = :id AND listing_id = :listingId")
                .param("id", mediaId)
                .param("listingId", listingId)
                .query((rs, index) -> new MediaRow(rs.getObject("id", UUID.class), rs.getString("url"),
                        rs.getString("kind")))
                .optional()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "media_not_found",
                        "No media entry with this id on the listing"));
        jdbc.sql("DELETE FROM listing_media WHERE id = :id")
                .param("id", mediaId)
                .update();
        deleteObjects(MediaKind.valueOf(row.kind()), row.url());
    }

    @Transactional
    public List<MediaDto> reorder(UUID actorId, boolean admin, UUID listingId, List<MediaOrderItem> order) {
        requireOwnedDraft(actorId, admin, listingId);
        List<MediaOrderItem> items = order == null ? List.of() : order;
        for (MediaOrderItem item : items) {
            if (item.id() == null) {
                throw ApiException.validation("id", "Every order entry needs a media id");
            }
            if (item.sortOrder() == null) {
                throw ApiException.validation("sortOrder", "Every order entry needs a sort order");
            }
            jdbc.sql("""
                            UPDATE listing_media SET sort_order = :sortOrder
                            WHERE id = :id AND listing_id = :listingId
                            """)
                    .param("sortOrder", item.sortOrder())
                    .param("id", item.id())
                    .param("listingId", listingId)
                    .update();
        }
        return listMedia(listingId);
    }

    @Transactional(readOnly = true)
    public List<MediaDto> listMedia(UUID listingId) {
        return jdbc.sql("""
                        SELECT id, url, caption, kind, sort_order
                        FROM listing_media
                        WHERE listing_id = :listingId
                        ORDER BY sort_order, id
                        """)
                .param("listingId", listingId)
                .query((rs, index) -> new MediaDto(rs.getObject("id", UUID.class), rs.getString("url"),
                        rs.getString("caption"), rs.getString("kind"), rs.getInt("sort_order")))
                .list();
    }

    private void deleteObjects(MediaKind kind, String url) {
        if (!url.startsWith(URL_PREFIX)) {
            return;
        }
        String key = url.substring(URL_PREFIX.length());
        if (kind != MediaKind.PHOTO) {
            storage.delete(key);
            return;
        }
        String base = key;
        if (base.endsWith("-display.jpg") || base.endsWith("-thumb.jpg")) {
            base = base.substring(0, base.lastIndexOf('-'));
        }
        if (base.endsWith(".jpg")) {
            base = base.substring(0, base.length() - 4);
        }
        storage.delete(base + ".jpg");
        storage.delete(base + "-thumb.jpg");
        storage.delete(base + "-display.jpg");
    }

    private void requireOwnedDraft(UUID actorId, boolean admin, UUID listingId) {
        ListingRef listing = jdbc.sql("""
                        SELECT id, advertiser_id, lifecycle
                        FROM listings WHERE id = :id
                        FOR UPDATE
                        """)
                .param("id", listingId)
                .query((rs, index) -> new ListingRef(rs.getObject("id", UUID.class),
                        rs.getObject("advertiser_id", UUID.class), rs.getString("lifecycle")))
                .optional()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "listing_not_found",
                        "Listing not found"));
        if (!admin && !listing.advertiserId().equals(actorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_owner", "You do not own this listing");
        }
        if (!"DRAFT".equals(listing.lifecycle())) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "listing_locked",
                    "Media can only change while the listing is a draft");
        }
    }

    private long countMedia(UUID listingId) {
        return jdbc.sql("SELECT count(*) FROM listing_media WHERE listing_id = :listingId")
                .param("listingId", listingId)
                .query(Long.class)
                .single();
    }

    private int nextSortOrder(UUID listingId) {
        return jdbc.sql("SELECT COALESCE(MAX(sort_order), -1) + 1 FROM listing_media WHERE listing_id = :listingId")
                .param("listingId", listingId)
                .query(Integer.class)
                .single();
    }

    private UUID insertMedia(UUID listingId, String url, MediaKind kind, int sortOrder) {
        return jdbc.sql("""
                        INSERT INTO listing_media (listing_id, url, kind, sort_order)
                        VALUES (:listingId, :url, :kind, :sortOrder)
                        RETURNING id
                        """)
                .param("listingId", listingId)
                .param("url", url)
                .param("kind", kind.name())
                .param("sortOrder", sortOrder)
                .query(UUID.class)
                .single();
    }

    private record MediaRow(UUID id, String url, String kind) {
    }

    private record ListingRef(UUID id, UUID advertiserId, String lifecycle) {
    }
}
