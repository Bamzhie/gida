package ng.gida.moderation;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AdminListingRepository {
    private final JdbcClient jdbc;
    public AdminListingRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<String> findLifecycle(UUID id) {
        return jdbc.sql("SELECT lifecycle FROM listings WHERE id=:id")
                .param("id", id).query(String.class).optional();
    }

    public PageResponse<AdminListingDto> queue(String state, Integer staleDays, Paging paging) {
        Map<String, Object> params = new HashMap<>();
        String where = " WHERE true";
        if (state != null) {
            where += " AND l.lifecycle=:state";
            params.put("state", state);
        }
        if (staleDays != null) {
            where += " AND l.lifecycle='PUBLISHED' AND COALESCE(l.confirmed_at,l.published_at) < now() - "
                    + "make_interval(days => :days)";
            params.put("days", staleDays);
        }
        long total =
                jdbc.sql("SELECT count(*) FROM listings l" + where).params(params).query(Long.class).single();
        String order = staleDays == null ? "l.submitted_at ASC NULLS LAST,l.created_at ASC,l.id"
                                         : "COALESCE(l.confirmed_at,l.published_at) ASC NULLS FIRST,l.id";
        params.put("limit", paging.size());
        params.put("offset", paging.offset());
        var items = jdbc.sql("""
            SELECT l.id,l.title,l.lifecycle,l.availability,l.price,l.price_period,
                   u.id AS advertiser_id,u.name AS advertiser_name,u.email AS advertiser_email,
                   COALESCE(CASE WHEN loc.kind IN ('AREA','ESTATE') THEN loc.name END,
                            CASE WHEN up1.kind IN ('AREA','ESTATE') THEN up1.name END,
                            CASE WHEN up2.kind IN ('AREA','ESTATE') THEN up2.name END,
                            CASE WHEN up3.kind IN ('AREA','ESTATE') THEN up3.name END) AS area,
                   COALESCE(CASE WHEN loc.kind='STATE' THEN loc.name END,
                            CASE WHEN up1.kind='STATE' THEN up1.name END,
                            CASE WHEN up2.kind='STATE' THEN up2.name END,
                            CASE WHEN up3.kind='STATE' THEN up3.name END,
                            CASE WHEN up4.kind='STATE' THEN up4.name END) AS state,
                   l.submitted_at,l.confirmed_at,l.created_at,l.updated_at
            FROM listings l JOIN users u ON u.id=l.advertiser_id
            JOIN properties p ON p.id=l.property_id JOIN locations loc ON loc.id=p.location_id
            LEFT JOIN locations up1 ON up1.id=loc.parent_id
            LEFT JOIN locations up2 ON up2.id=up1.parent_id
            LEFT JOIN locations up3 ON up3.id=up2.parent_id
            LEFT JOIN locations up4 ON up4.id=up3.parent_id
            """ + where + " ORDER BY " + order + " LIMIT :limit OFFSET :offset")
                            .params(params)
                            .query(this::mapListing)
                            .list();
        return PageResponse.of(items, paging.page(), paging.size(), total);
    }

    private AdminListingDto mapListing(ResultSet rs, int row) throws SQLException {
        return new AdminListingDto(rs.getObject("id", UUID.class), rs.getString("title"),
                rs.getString("lifecycle"), rs.getString("availability"), rs.getBigDecimal("price"),
                rs.getString("price_period"), rs.getObject("advertiser_id", UUID.class),
                rs.getString("advertiser_name"), rs.getString("advertiser_email"), rs.getString("area"),
                rs.getString("state"), instant(rs, "submitted_at"), instant(rs, "confirmed_at"),
                instant(rs, "created_at"), instant(rs, "updated_at"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
