package ng.gida.enquiries;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class EnquiryRepository {

    private final JdbcClient jdbc;

    public EnquiryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public boolean listingExists(UUID listingId) {
        return jdbc.sql("""
                SELECT count(*) FROM listings
                WHERE id = :id AND lifecycle = 'PUBLISHED'
                  AND (expires_at IS NULL OR expires_at > now())
                """).param("id", listingId).query(Long.class).single() > 0;
    }

    public boolean advertiserExists(UUID advertiserId) {
        return jdbc.sql("SELECT count(*) FROM users WHERE id = :id AND role IN ('AGENT','ADMIN')")
                .param("advertiserId", advertiserId).query(Long.class).single() > 0;
    }

    public boolean recentlySeen(String contact, UUID subjectId) {
        return jdbc.sql("""
                SELECT count(*) FROM enquiries
                WHERE contact = :contact
                  AND COALESCE(listing_id, advertiser_id) = :subject
                  AND created_at > now() - interval '1 hour'
                """).param("contact", contact).param("subject", subjectId)
                .query(Long.class).single() > 0;
    }

    public EnquiryCreated insert(UUID userId, UUID listingId, UUID advertiserId,
                                 String action, String name, String contact, String message) {
        return jdbc.sql("""
                INSERT INTO enquiries (listing_id, advertiser_id, user_id, action, name, contact, message)
                VALUES (:listing, :advertiser, :user, :action, :name, :contact, :message)
                RETURNING id, created_at
                """)
                .param("listing", listingId, java.sql.Types.OTHER)
                .param("advertiser", advertiserId, java.sql.Types.OTHER)
                .param("user", userId, java.sql.Types.OTHER)
                .param("action", action).param("name", name)
                .param("contact", contact).param("message", message, java.sql.Types.VARCHAR)
                .query((rs, row) -> new EnquiryCreated(rs.getObject("id", UUID.class), instant(rs, "created_at")))
                .single();
    }

    public PageResponse<EnquiryDto> inbox(UUID advertiserId, Paging paging) {
        long total = jdbc.sql("""
                SELECT count(*) FROM enquiries e
                WHERE e.advertiser_id = :me
                   OR (e.listing_id IS NOT NULL AND EXISTS
                        (SELECT 1 FROM listings l WHERE l.id = e.listing_id AND l.advertiser_id = :me))
                """).param("me", advertiserId).query(Long.class).single();

        List<EnquiryDto> items = jdbc.sql("""
                SELECT e.id, e.action, e.name, e.contact, e.message, e.listing_id, e.advertiser_id,
                       e.created_at, l.title AS listing_title
                FROM enquiries e
                LEFT JOIN listings l ON l.id = e.listing_id
                WHERE e.advertiser_id = :me
                   OR (e.listing_id IS NOT NULL AND EXISTS
                        (SELECT 1 FROM listings mine WHERE mine.id = e.listing_id AND mine.advertiser_id = :me))
                ORDER BY e.created_at DESC, e.id
                LIMIT :limit OFFSET :offset
                """)
                .param("me", advertiserId)
                .param("limit", paging.size())
                .param("offset", paging.offset())
                .query(EnquiryRepository::mapInbox)
                .list();

        return PageResponse.of(items, paging.page(), paging.size(), total);
    }

    private static EnquiryDto mapInbox(ResultSet rs, int row) throws SQLException {
        return new EnquiryDto(
                rs.getObject("id", UUID.class),
                rs.getString("action"),
                rs.getString("name"),
                rs.getString("contact"),
                rs.getString("message"),
                rs.getObject("listing_id", UUID.class),
                rs.getString("listing_title"),
                rs.getObject("advertiser_id", UUID.class),
                instant(rs, "created_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
