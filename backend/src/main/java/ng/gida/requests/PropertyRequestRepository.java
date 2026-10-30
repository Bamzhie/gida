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
