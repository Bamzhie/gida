package ng.gida.search;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ListingSearchRepository {

    private static final String SUMMARY_SELECT = """
            SELECT l.id, l.title, l.listing_type, l.category, p.property_type,
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
                   p.address_line, p.bedrooms, p.bathrooms, p.size_sqm,
                   ST_Y(p.geom) AS latitude, ST_X(p.geom) AS longitude,
                   img.url AS image_url, img.caption AS image_caption,
                   EXISTS (SELECT 1 FROM listing_costs c WHERE c.listing_id = l.id) AS has_disclosed_fees,
                   l.confirmed_at,
                   advertiser.id AS advertiser_id, advertiser.name AS advertiser_name,
                   COALESCE(profile.contact_phone, advertiser.phone) AS advertiser_phone,
                   profile.agency_name
            FROM listings l
            JOIN properties p ON p.id = l.property_id
            JOIN locations loc ON loc.id = p.location_id
            JOIN users advertiser ON advertiser.id = l.advertiser_id
            LEFT JOIN advertiser_profiles profile ON profile.user_id = advertiser.id
            LEFT JOIN locations up1 ON up1.id = loc.parent_id
            LEFT JOIN locations up2 ON up2.id = up1.parent_id
            LEFT JOIN locations up3 ON up3.id = up2.parent_id
            LEFT JOIN locations up4 ON up4.id = up3.parent_id
            LEFT JOIN LATERAL (
                SELECT m.url, m.caption
                FROM listing_media m
                WHERE m.listing_id = l.id
                ORDER BY m.sort_order, m.id
                LIMIT 1
            ) img ON true
            """;

    private static final String VISIBLE = """
            l.lifecycle = 'PUBLISHED'
            AND (l.expires_at IS NULL OR l.expires_at > now())
            AND EXISTS (SELECT 1 FROM users u WHERE u.id = l.advertiser_id AND u.status = 'ACTIVE')
            """;

    private final JdbcClient jdbc;

    public ListingSearchRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public PageResponse<ListingSummaryDto> search(SearchParams params) {
        if (params.ids() != null && params.ids().isEmpty()) {
            return PageResponse.of(List.of(), params.page(), params.size(), 0);
        }

        Map<String, Object> binds = new LinkedHashMap<>();
        List<String> predicates = new ArrayList<>();

        String scope = "";
        if (params.location() != null) {
            scope = """
                    WITH RECURSIVE subtree AS (
                        SELECT id FROM locations WHERE slug = :location
                        UNION ALL
                        SELECT child.id
                        FROM locations child
                        JOIN subtree ON child.parent_id = subtree.id
                    )
                    """;
            binds.put("location", params.location());
            predicates.add("EXISTS (SELECT 1 FROM subtree st WHERE st.id = p.location_id)");
        }
        if (params.advertiser() != null) {
            binds.put("advertiser", params.advertiser());
            predicates.add("l.advertiser_id = :advertiser");
        }
        if (params.ids() != null) {
            binds.put("ids", params.ids());
            predicates.add("l.id IN (:ids)");
        }
        if (params.listingType() != null) {
            binds.put("listingType", params.listingType().name());
            predicates.add("l.listing_type = :listingType");
        }
        if (params.category() != null) {
            binds.put("category", params.category().name());
            predicates.add("l.category = :category");
        }
        if (params.propertyType() != null) {
            binds.put("propertyType", params.propertyType().name());
            predicates.add("p.property_type = :propertyType");
        }
        if (params.availability() != null) {
            binds.put("availability", params.availability().name());
            predicates.add("l.availability = :availability");
        }
        if (params.minPrice() != null) {
            binds.put("minPrice", params.minPrice());
            predicates.add("l.price >= :minPrice");
        }
        if (params.maxPrice() != null) {
            binds.put("maxPrice", params.maxPrice());
            predicates.add("l.price <= :maxPrice");
        }
        if (params.bedrooms() != null) {
            binds.put("bedrooms", params.bedrooms());
            predicates.add("p.bedrooms >= :bedrooms");
        }
        if (params.bathrooms() != null) {
            binds.put("bathrooms", params.bathrooms());
            predicates.add("p.bathrooms >= :bathrooms");
        }
        if (params.furnished() != null) {
            binds.put("furnished", params.furnished());
            predicates.add("p.furnished = :furnished");
        }
        for (int index = 0; index < params.amenities().size(); index++) {
            String name = "amenity" + index;
            binds.put(name, params.amenities().get(index));
            predicates.add("""
                    EXISTS (SELECT 1 FROM property_amenities pa
                            JOIN amenities a ON a.id = pa.amenity_id
                            WHERE pa.property_id = p.id AND a.slug = :%s)
                    """.formatted(name));
        }

        if (params.q() != null) {
            String like = "%" + params.q()
                    .replace("\\", "\\\\")
                    .replace("%", "\\%")
                    .replace("_", "\\_") + "%";
            binds.put("q", params.q());
            binds.put("qLike", like);
            StringBuilder keyword = new StringBuilder("(l.search_vector @@ websearch_to_tsquery('english', :q)")
                    .append(" OR p.location_id IN (SELECT id FROM locations WHERE name ILIKE :qLike ESCAPE '\\')")
                    .append(" OR p.address_line ILIKE :qLike ESCAPE '\\'");
            List<String> typeMatches = PropertyTypeWords.matching(params.q());
            if (!typeMatches.isEmpty()) {
                keyword.append(" OR p.property_type IN (");
                for (int index = 0; index < typeMatches.size(); index++) {
                    String name = "type" + index;
                    binds.put(name, typeMatches.get(index));
                    keyword.append(index == 0 ? ":" : ", :").append(name);
                }
                keyword.append(")");
            }
            keyword.append(")");
            predicates.add(keyword.toString());
        }
        if (params.bbox() != null) {
            binds.put("minLng", params.bbox().minLng());
            binds.put("minLat", params.bbox().minLat());
            binds.put("maxLng", params.bbox().maxLng());
            binds.put("maxLat", params.bbox().maxLat());
            predicates.add("p.geom && ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326)");
        }
        if (params.polygon() != null) {
            binds.put("polygon", params.polygon());
            predicates.add("ST_Contains(ST_SetSRID(ST_GeomFromGeoJSON(:polygon), 4326), p.geom)");
        }

        StringBuilder where = new StringBuilder(" WHERE ").append(VISIBLE);
        predicates.forEach(predicate -> where.append(" AND ").append(predicate));

        long total = jdbc.sql(scope + """
                        SELECT count(*)
                        FROM listings l
                        JOIN properties p ON p.id = l.property_id
                        JOIN locations loc ON loc.id = p.location_id
                        """ + where)
                .params(binds)
                .query(Long.class)
                .single();

        binds.put("limit", params.size());
        binds.put("offset", (params.page() - 1) * params.size());

        List<ListingSummaryDto> items = jdbc.sql(scope + SUMMARY_SELECT + where
                        + " ORDER BY " + orderBy(params) + " LIMIT :limit OFFSET :offset")
                .params(binds)
                .query(this::mapSummary)
                .list();

        return PageResponse.of(items, params.page(), params.size(), total);
    }

    public List<ListingSummaryDto> similar(UUID sourceId, String area, String propertyType,
                                           String listingType, java.math.BigDecimal price, int limit) {
        return jdbc.sql("SELECT * FROM (" + SUMMARY_SELECT + " WHERE " + VISIBLE + """
                        ) s
                        WHERE s.id <> :id
                        ORDER BY (s.area IS NOT DISTINCT FROM :area) DESC,
                                 (s.property_type = :propertyType AND s.listing_type = :listingType) DESC,
                                 abs(s.price - :price) ASC,
                                 s.id
                        LIMIT :limit
                        """)
                .param("id", sourceId)
                .param("area", area, java.sql.Types.VARCHAR)
                .param("propertyType", propertyType)
                .param("listingType", listingType)
                .param("price", price)
                .param("limit", limit)
                .query(this::mapSummary)
                .list();
    }

    public PageResponse<ListingSummaryDto> favorites(UUID userId, Paging paging) {
        String join = " JOIN favorites f ON f.listing_id = l.id AND f.user_id = :userId ";
        long total = jdbc.sql("""
                        SELECT count(*)
                        FROM listings l
                        JOIN properties p ON p.id = l.property_id
                        """ + join + " WHERE " + VISIBLE)
                .param("userId", userId)
                .query(Long.class)
                .single();

        List<ListingSummaryDto> items = jdbc.sql(SUMMARY_SELECT + join + " WHERE " + VISIBLE
                        + " ORDER BY f.created_at DESC, f.id LIMIT :limit OFFSET :offset")
                .param("userId", userId)
                .param("limit", paging.size())
                .param("offset", paging.offset())
                .query(this::mapSummary)
                .list();

        return PageResponse.of(items, paging.page(), paging.size(), total);
    }

    private static String orderBy(SearchParams params) {
        if ("relevance".equals(params.sort())) {
            return "ts_rank_cd(l.search_vector, websearch_to_tsquery('english', :q)) DESC,"
                    + " l.published_at DESC NULLS LAST, l.id";
        }
        return switch (params.sort()) {
            case "oldest" -> "l.published_at ASC NULLS LAST, l.id";
            case "price-asc" -> "l.price ASC, l.id";
            case "price-desc" -> "l.price DESC, l.id";
            case "updated" -> "l.updated_at DESC, l.id";
            case "confirmed" -> "l.confirmed_at DESC NULLS LAST, l.id";
            default -> "l.published_at DESC NULLS LAST, l.id";
        };
    }

    private ListingSummaryDto mapSummary(ResultSet rs, int rowNumber) throws SQLException {
        String imageUrl = rs.getString("image_url");
        return new ListingSummaryDto(
                rs.getObject("id", UUID.class),
                rs.getString("title"),
                rs.getString("listing_type"),
                rs.getString("category"),
                rs.getString("property_type"),
                rs.getBigDecimal("price"),
                rs.getString("price_period"),
                rs.getString("availability"),
                rs.getString("area"),
                rs.getString("state"),
                rs.getString("address_line"),
                rs.getObject("bedrooms", Integer.class),
                rs.getObject("bathrooms", Integer.class),
                rs.getBigDecimal("size_sqm"),
                rs.getObject("latitude", Double.class),
                rs.getObject("longitude", Double.class),
                imageUrl == null
                        ? null
                        : new ListingSummaryDto.ImageDto(imageUrl, rs.getString("image_caption")),
                rs.getBoolean("has_disclosed_fees"),
                instant(rs, "confirmed_at"),
                new ListingSummaryDto.AdvertiserDto(
                        rs.getObject("advertiser_id", UUID.class),
                        rs.getString("advertiser_name"),
                        rs.getString("agency_name"),
                        rs.getString("advertiser_phone")));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
