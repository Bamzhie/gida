package ng.gida.listings;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Explainable rollup for the advertiser dashboard.
 *
 * @param listingsByState      listing count per lifecycle state; every state is present
 *                             (zero when unused) so the dashboard can render a stable table
 * @param totalEnquiries       all enquiries attributable to the advertiser: those addressed to
 *                             them directly plus those on any of their listings
 * @param totalViewingRequests the VIEWING subset of {@code totalEnquiries}
 * @param topListings          the advertiser's listings ranked by listing-scoped enquiry count,
 *                             most-enquired first, capped at 20; listings without enquiries and
 *                             advertiser-scoped enquiries are not attributable to a single
 *                             listing and therefore absent
 */
public record AdvertiserSummaryDto(
        Map<String, Long> listingsByState,
        long totalEnquiries,
        long totalViewingRequests,
        List<TopListing> topListings) {

    public record TopListing(UUID listingId, String title, long enquiryCount) {
    }
}
