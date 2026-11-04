package ng.gida.search;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ListingSummaryDto(
        UUID id,
        String title,
        String listingType,
        String category,
        String propertyType,
        BigDecimal price,
        String pricePeriod,
        String availability,
        String area,
        String state,
        String addressLine,
        Integer bedrooms,
        Integer bathrooms,
        BigDecimal sizeSqm,
        Double latitude,
        Double longitude,
        ImageDto primaryImage,
        boolean hasDisclosedFees,
        Instant confirmedAt,
        AdvertiserDto advertiser) {

    public record ImageDto(String url, String caption) {
    }

    public record AdvertiserDto(UUID id, String name, String agencyName, String phone) {
    }
}
