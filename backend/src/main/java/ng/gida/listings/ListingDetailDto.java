package ng.gida.listings;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ListingDetailDto(
        UUID id,
        String title,
        String description,
        String listingType,
        String category,
        BigDecimal price,
        String pricePeriod,
        String availability,
        String area,
        String state,
        String addressLine,
        String propertyType,
        Integer bedrooms,
        Integer bathrooms,
        BigDecimal sizeSqm,
        BigDecimal lotSizeSqm,
        Integer yearBuilt,
        Integer parking,
        boolean furnished,
        Double latitude,
        Double longitude,
        List<String> amenities,
        List<CostDto> costs,
        List<MediaDto> media,
        AdvertiserDto advertiser,
        Instant publishedAt,
        Instant confirmedAt,
        Instant expiresAt,
        Instant createdAt,
        Instant updatedAt) {

    public record CostDto(String type, BigDecimal amount, String note) {
    }

    public record MediaDto(String url, String caption, String kind, int sortOrder) {
    }

    public record AdvertiserDto(UUID id, String name, String agencyName, String phone) {
    }
}
