package ng.gida.advertisers;

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
public class AdvertiserDirectoryRepository {

    private static final String SELECT = """
            SELECT u.id, u.name, ap.agency_name, ap.bio, u.phone,
                   (SELECT count(*) FROM listings l
                     JOIN properties p ON p.id = l.property_id
                    WHERE l.advertiser_id = u.id
                      AND l.lifecycle = 'PUBLISHED'
                      AND (l.expires_at IS NULL OR l.expires_at > now())) AS listing_count,
                   EXISTS (SELECT 1 FROM verifications v WHERE v.subject_type='ADVERTISER'
                       AND v.subject_id=u.id AND v.dimension IN ('IDENTITY','BUSINESS')
                       AND v.state='VERIFIED') AS verified
            FROM users u
            LEFT JOIN advertiser_profiles ap ON ap.user_id = u.id
            WHERE u.role = 'AGENT' AND u.status = 'ACTIVE'
            """;

    private static final String COUNT = """
            SELECT count(*)
            FROM users u
            LEFT JOIN advertiser_profiles ap ON ap.user_id = u.id
            WHERE u.role = 'AGENT' AND u.status = 'ACTIVE'
            """;

    private final JdbcClient jdbc;

    public AdvertiserDirectoryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public PageResponse<AdvertiserCardDto> search(String q, String location, Paging paging) {
        Map<String, Object> binds = new LinkedHashMap<>();
        List<String> predicates = new ArrayList<>();
        String scope = "";

        if (q != null) {
            binds.put("qLike", "%" + q.replace("\\", "\\\\")
                    .replace("%", "\\%").replace("_", "\\_") + "%");
            predicates.add("""
                    (u.name ILIKE :qLike ESCAPE '\\'
                     OR ap.agency_name ILIKE :qLike ESCAPE '\\'
                     OR ap.bio ILIKE :qLike ESCAPE '\\')
                    """);
        }
        if (location != null) {
            scope = """
                    WITH RECURSIVE subtree AS (
                        SELECT id FROM locations WHERE slug = :location
                        UNION ALL
                        SELECT child.id
                        FROM locations child
                        JOIN subtree ON child.parent_id = subtree.id
                    )
                    """;
            binds.put("location", location);
            predicates.add("""
                    EXISTS (SELECT 1 FROM subtree st
                            JOIN properties p ON p.location_id = st.id
                            JOIN listings l ON l.property_id = p.id
                            WHERE l.advertiser_id = u.id
                              AND l.lifecycle = 'PUBLISHED'
                              AND (l.expires_at IS NULL OR l.expires_at > now()))
                    """);
        }

        String where = predicates.isEmpty() ? "" : " AND " + String.join(" AND ", predicates);
        long total = jdbc.sql(scope + COUNT + where).params(binds).query(Long.class).single();

        binds.put("limit", paging.size());
        binds.put("offset", paging.offset());

        List<AdvertiserCardDto> items = jdbc.sql(scope + SELECT + where
                        + " ORDER BY listing_count DESC, u.name, u.id"
                        + " LIMIT :limit OFFSET :offset")
                .params(binds)
                .query((rs, row) -> new AdvertiserCardDto(
                        rs.getObject("id", UUID.class),
                        rs.getString("name"),
                        rs.getString("agency_name"),
                        rs.getString("bio"),
                        rs.getString("phone"),
                        rs.getLong("listing_count"),
                        rs.getBoolean("verified")))
                .list();

        return PageResponse.of(items, paging.page(), paging.size(), total);
    }
}
