package ng.gida.listings;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class AdvertiserSummaryRepository {

    private static final List<String> LIFECYCLE_STATES =
            List.of("DRAFT", "SUBMITTED", "UNDER_REVIEW", "PUBLISHED", "PAUSED", "EXPIRED", "REJECTED");

    // an enquiry counts for the advertiser when it addresses them directly or sits on one of
    // their listings — the same attribution the enquiry inbox uses
    private static final String ATTRIBUTED_TO_ME = """
            e.advertiser_id = :me
            OR (e.listing_id IS NOT NULL AND EXISTS
                  (SELECT 1 FROM listings l WHERE l.id = e.listing_id AND l.advertiser_id = :me))
            """;

    private final JdbcClient jdbc;

    public AdvertiserSummaryRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    public Map<String, Long> listingsByLifecycle(UUID advertiserId) {
        Map<String, Long> counts = new LinkedHashMap<>();
        LIFECYCLE_STATES.forEach(state -> counts.put(state, 0L));
        jdbc.sql("""
                        SELECT lifecycle, count(*) AS total
                        FROM listings WHERE advertiser_id = :me
                        GROUP BY lifecycle
                        """)
                .param("me", advertiserId)
                .query((rs, row) -> Map.entry(rs.getString("lifecycle"), rs.getLong("total")))
                .list()
                .forEach(entry -> counts.put(entry.getKey(), entry.getValue()));
        return counts;
    }

    public long totalEnquiries(UUID advertiserId) {
        return jdbc.sql("SELECT count(*) FROM enquiries e WHERE " + ATTRIBUTED_TO_ME)
                .param("me", advertiserId)
                .query(Long.class)
                .single();
    }

    public long totalViewingRequests(UUID advertiserId) {
        return jdbc.sql("SELECT count(*) FROM enquiries e WHERE e.action = 'VIEWING' AND " + ATTRIBUTED_TO_ME)
                .param("me", advertiserId)
                .query(Long.class)
                .single();
    }

    public List<AdvertiserSummaryDto.TopListing> topListingsByEnquiries(UUID advertiserId, int limit) {
        return jdbc.sql("""
                        SELECT l.id, l.title, count(*) AS enquiry_count
                        FROM enquiries e
                        JOIN listings l ON l.id = e.listing_id
                        WHERE l.advertiser_id = :me
                        GROUP BY l.id, l.title
                        ORDER BY enquiry_count DESC, l.title ASC, l.id ASC
                        LIMIT :limit
                        """)
                .param("me", advertiserId)
                .param("limit", limit)
                .query((rs, row) -> new AdvertiserSummaryDto.TopListing(
                        rs.getObject("id", UUID.class), rs.getString("title"), rs.getLong("enquiry_count")))
                .list();
    }
}
