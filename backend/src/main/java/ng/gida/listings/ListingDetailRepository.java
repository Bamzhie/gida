package ng.gida.listings;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ListingDetailRepository {

    private final JdbcClient jdbc;

    public ListingDetailRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<ListingDetailDto> find(UUID listingId) {
        return jdbc.sql("""
                        SELECT l.id, l.title, l.description, l.listing_type, l.category,
                               l.price, l.price_period, l.availability,
                               COALESCE(
                                   CASE WHEN loc.kind IN ('AREA','ESTATE') THEN loc.name END,
                                   CASE WHEN up1.kind IN ('AREA','ESTATE') THEN up1.name END,
                                   CASE WHEN up2.kind IN ('AREA','ESTATE') THEN up2.name END,
                                   CASE WHEN up3.kind IN ('AREA','ESTATE') THEN up3.name END) AS area,
                               COALESCE(
                                   CASE WHEN loc.kind = 'STATE' THEN loc.name END,
                                   CASE WHEN up1.kind = 'STATE' THEN up1.name END,
                                   CASE WHEN up2.kind = 'STATE' THEN up2.name END,
                                   CASE WHEN up3.kind = 'STATE' THEN up3.name END,
                                   CASE WHEN up4.kind = 'STATE' THEN up4.name END) AS state,
                               p.id AS property_id, p.address_line, p.property_type, p.bedrooms,
                               p.bathrooms, p.size_sqm, p.lot_size_sqm, p.year_built, p.parking,
                               p.furnished,
                               ST_Y(p.geom) AS latitude, ST_X(p.geom) AS longitude,
                               u.id AS advertiser_id, u.name AS advertiser_name,
                               COALESCE(ap.contact_phone, u.phone) AS advertiser_phone,
                               ap.agency_name,
                               l.published_at, l.confirmed_at, l.expires_at, l.created_at, l.updated_at
                        FROM listings l
                        JOIN properties p ON p.id = l.property_id
                        JOIN locations loc ON loc.id = p.location_id
                        LEFT JOIN locations up1 ON up1.id = loc.parent_id
                        LEFT JOIN locations up2 ON up2.id = up1.parent_id
                        LEFT JOIN locations up3 ON up3.id = up2.parent_id
                        LEFT JOIN locations up4 ON up4.id = up3.parent_id
                        JOIN users u ON u.id = l.advertiser_id
                        LEFT JOIN advertiser_profiles ap ON ap.user_id = u.id
                        WHERE l.id = :id
                          AND l.lifecycle = 'PUBLISHED'
                          AND (l.expires_at IS NULL OR l.expires_at > now())
                        """)
                .param("id", listingId)
                .query(this::mapDetail)
                .optional();
    }

    private ListingDetailDto mapDetail(ResultSet rs, int rowNumber) throws SQLException {
        UUID listingId = rs.getObject("id", UUID.class);
        UUID propertyId = rs.getObject("property_id", UUID.class);
        return new ListingDetailDto(
                listingId,
                rs.getString("title"),
                rs.getString("description"),
                rs.getString("listing_type"),
                rs.getString("category"),
                rs.getBigDecimal("price"),
                rs.getString("price_period"),
                rs.getString("availability"),
                rs.getString("area"),
                rs.getString("state"),
                rs.getString("address_line"),
                rs.getString("property_type"),
                rs.getObject("bedrooms", Integer.class),
                rs.getObject("bathrooms", Integer.class),
                rs.getBigDecimal("size_sqm"),
                rs.getBigDecimal("lot_size_sqm"),
                rs.getObject("year_built", Integer.class),
                rs.getObject("parking", Integer.class),
                rs.getBoolean("furnished"),
                rs.getObject("latitude", Double.class),
                rs.getObject("longitude", Double.class),
                amenities(propertyId),
                costs(listingId),
                media(listingId),
                new ListingDetailDto.AdvertiserDto(
                        rs.getObject("advertiser_id", UUID.class),
                        rs.getString("advertiser_name"),
                        rs.getString("agency_name"),
                        rs.getString("advertiser_phone")),
                instant(rs, "published_at"),
                instant(rs, "confirmed_at"),
                instant(rs, "expires_at"),
                instant(rs, "created_at"),
                instant(rs, "updated_at"));
    }

    private List<String> amenities(UUID propertyId) {
        return jdbc.sql("""
                        SELECT a.slug
                        FROM property_amenities pa
                        JOIN amenities a ON a.id = pa.amenity_id
                        WHERE pa.property_id = :propertyId
                        ORDER BY a.label
                        """)
                .param("propertyId", propertyId)
                .query(String.class)
                .list();
    }

    private List<ListingDetailDto.CostDto> costs(UUID listingId) {
        return jdbc.sql("""
                        SELECT cost_type, amount, note
                        FROM listing_costs
                        WHERE listing_id = :listingId
                        ORDER BY cost_type
                        """)
                .param("listingId", listingId)
                .query((rs, index) -> new ListingDetailDto.CostDto(
                        rs.getString("cost_type"),
                        rs.getBigDecimal("amount"),
                        rs.getString("note")))
                .list();
    }

    private List<ListingDetailDto.MediaDto> media(UUID listingId) {
        return jdbc.sql("""
                        SELECT url, caption, kind, sort_order
                        FROM listing_media
                        WHERE listing_id = :listingId
                        ORDER BY sort_order, id
                        """)
                .param("listingId", listingId)
                .query((rs, index) -> new ListingDetailDto.MediaDto(
                        rs.getString("url"),
                        rs.getString("caption"),
                        rs.getString("kind"),
                        rs.getInt("sort_order")))
                .list();
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
