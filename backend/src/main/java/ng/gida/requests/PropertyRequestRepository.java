package ng.gida.requests;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class PropertyRequestRepository {

    private final JdbcClient jdbc;

    public PropertyRequestRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public boolean recentlySeen(String contact, String title) {
        return jdbc.sql("""
                SELECT count(*) FROM property_requests
                WHERE contact = :contact AND lower(title) = lower(:title)
                  AND created_at > now() - interval '1 hour'
                """).param("contact", contact).param("title", title)
                .query(Long.class).single() > 0;
    }

    public RequestCreated insert(UUID userId, PropertyRequestDto values, List<UUID> amenityIds) {
        RequestCreated created = jdbc.sql("""
                INSERT INTO property_requests (
                    user_id, title, listing_type, property_type, location_id, min_price, max_price,
                    bedrooms, bathrooms, furnished, needed_by, notes, name, contact)
                VALUES (
                    :userId, :title, :listingType, :propertyType, :locationId, :minPrice, :maxPrice,
                    :bedrooms, :bathrooms, :furnished, :neededBy, :notes, :name, :contact)
                RETURNING id, status, created_at
                """)
                .param("userId", userId, java.sql.Types.OTHER)
                .param("title", values.title())
                .param("listingType", values.listingType())
                .param("propertyType", values.propertyType(), java.sql.Types.VARCHAR)
                .param("locationId", values.areaId(), java.sql.Types.OTHER)
                .param("minPrice", values.minPrice(), java.sql.Types.NUMERIC)
                .param("maxPrice", values.maxPrice(), java.sql.Types.NUMERIC)
                .param("bedrooms", values.bedrooms(), java.sql.Types.SMALLINT)
                .param("bathrooms", values.bathrooms(), java.sql.Types.SMALLINT)
                .param("furnished", values.furnished(), java.sql.Types.BOOLEAN)
                .param("neededBy", values.neededBy(), java.sql.Types.DATE)
                .param("notes", values.notes(), java.sql.Types.VARCHAR)
                .param("name", values.name())
                .param("contact", values.contact())
                .query((rs, row) -> new RequestCreated(
                        rs.getObject("id", UUID.class), rs.getString("status"), instant(rs, "created_at")))
                .single();

        for (UUID amenityId : amenityIds) {
            jdbc.sql("INSERT INTO property_request_amenities (request_id, amenity_id) VALUES (:request, :amenity)")
                    .param("request", created.id()).param("amenity", amenityId).update();
        }
        return created;
    }

    public PageResponse<PropertyRequestDto> mine(UUID userId, Paging paging) {
        long total = jdbc.sql("SELECT count(*) FROM property_requests WHERE user_id = :user")
                .param("user", userId).query(Long.class).single();

        List<PropertyRequestDto> items = jdbc.sql(SELECT + """
                        FROM property_requests r
                        LEFT JOIN locations loc ON loc.id = r.location_id
                        WHERE r.user_id = :user
                        ORDER BY r.created_at DESC, r.id
                        LIMIT :limit OFFSET :offset
                        """)
                .param("user", userId)
                .param("limit", paging.size())
                .param("offset", paging.offset())
                .query(this::map)
                .list();

        return PageResponse.of(items, paging.page(), paging.size(), total);
    }

    private static final String MATCHING_BASE = """
            WITH RECURSIVE visible_listings AS (
                SELECT l.id, l.listing_type, l.price, p.location_id, p.bedrooms, p.bathrooms, p.furnished
                FROM listings l
                JOIN properties p ON p.id = l.property_id
                WHERE l.advertiser_id = :me
                  AND l.lifecycle = 'PUBLISHED'
                  AND (l.expires_at IS NULL OR l.expires_at > now())
            ),
            listing_areas AS (
                SELECT vl.id AS listing_id, vl.location_id AS node_id
                FROM visible_listings vl
                UNION
                SELECT la.listing_id, parent.parent_id
                FROM listing_areas la
                JOIN locations parent ON parent.id = la.node_id
                WHERE parent.parent_id IS NOT NULL
            ),
            pairs AS (
                SELECT r.id AS request_id, vl.id AS listing_id, vl.price, r.created_at
                FROM property_requests r
                JOIN visible_listings vl ON vl.listing_type = r.listing_type
                     AND (r.location_id IS NULL OR EXISTS
                            (SELECT 1 FROM listing_areas la
                             WHERE la.listing_id = vl.id AND la.node_id = r.location_id))
                     AND (r.min_price IS NULL OR vl.price >= r.min_price)
                     AND (r.max_price IS NULL OR vl.price <= r.max_price)
                     AND (r.bedrooms IS NULL OR vl.bedrooms >= r.bedrooms)
                     AND (r.bathrooms IS NULL OR vl.bathrooms >= r.bathrooms)
                     AND (r.furnished IS NULL OR vl.furnished = r.furnished)
                WHERE r.status = 'OPEN' AND r.created_at > now() - interval '90 days'
            ),
            grouped AS (
                SELECT request_id,
                       string_agg(listing_id::text, ',' ORDER BY price, listing_id) AS matched_ids,
                       min(created_at) AS seen_at
                FROM pairs
                GROUP BY request_id
            )
            """;

    public PageResponse<MatchingRequestDto> matching(UUID advertiserId, Paging paging) {
        long total = jdbc.sql(MATCHING_BASE + "SELECT count(*) FROM grouped")
                .param("me", advertiserId).query(Long.class).single();

        List<MatchingRequestDto> items = jdbc.sql(MATCHING_BASE + SELECT + """
                        , g.matched_ids
                        FROM grouped g
                        JOIN property_requests r ON r.id = g.request_id
                        LEFT JOIN locations loc ON loc.id = r.location_id
                        ORDER BY r.created_at DESC, r.id
                        LIMIT :limit OFFSET :offset
                        """)
                .param("me", advertiserId)
                .param("limit", paging.size())
                .param("offset", paging.offset())
                .query((rs, row) -> new MatchingRequestDto(
                        rs.getObject("id", UUID.class),
                        rs.getString("title"),
                        rs.getString("listing_type"),
                        rs.getString("property_type"),
                        rs.getString("area"),
                        rs.getObject("area_id", UUID.class),
                        rs.getBigDecimal("min_price"),
                        rs.getBigDecimal("max_price"),
                        rs.getObject("bedrooms", Integer.class),
                        rs.getObject("bathrooms", Integer.class),
                        rs.getObject("furnished", Boolean.class),
                        rs.getObject("needed_by", LocalDate.class),
                        rs.getString("notes"),
                        rs.getString("name"),
                        rs.getString("contact"),
                        labels(rs.getString("amenity_labels")),
                        ids(rs.getString("matched_ids")),
                        instant(rs, "created_at")))
                .list();

        return PageResponse.of(items, paging.page(), paging.size(), total);
    }

    private static List<String> labels(String raw) {
        return raw == null || raw.isEmpty() ? List.of() : List.of(raw.split("\\t"));
    }

    private static List<UUID> ids(String raw) {
        return raw == null || raw.isEmpty()
                ? List.of()
                : java.util.Arrays.stream(raw.split(",")).map(UUID::fromString).toList();
    }

    /** The column list shared by /me/requests and the matching read in Task 11. */
    static final String SELECT = """
            SELECT r.id, r.title, r.listing_type, r.property_type, r.min_price, r.max_price,
                   r.bedrooms, r.bathrooms, r.furnished, r.needed_by, r.notes,
                   r.name, r.contact, r.status, r.created_at,
                   loc.name AS area, loc.id AS area_id,
                   COALESCE((SELECT string_agg(am.label, chr(9) ORDER BY am.label)
                             FROM property_request_amenities pra
                             JOIN amenities am ON am.id = pra.amenity_id
                             WHERE pra.request_id = r.id), '') AS amenity_labels
            """;

    PropertyRequestDto map(ResultSet rs, int row) throws SQLException {
        String raw = rs.getString("amenity_labels");
        List<String> amenities = raw == null || raw.isEmpty() ? List.of() : List.of(raw.split("\\t"));
        return new PropertyRequestDto(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("listing_type"),
                rs.getString("property_type"),
                rs.getString("area"),
                rs.getObject("area_id", UUID.class),
                rs.getBigDecimal("min_price"),
                rs.getBigDecimal("max_price"),
                rs.getObject("bedrooms", Integer.class),
                rs.getObject("bathrooms", Integer.class),
                rs.getObject("furnished", Boolean.class),
                rs.getObject("needed_by", LocalDate.class),
                rs.getString("notes"),
                rs.getString("name"),
                rs.getString("contact"),
                rs.getString("status"),
                amenities,
                instant(rs, "created_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
