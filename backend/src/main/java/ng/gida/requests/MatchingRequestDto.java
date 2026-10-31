package ng.gida.requests;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MatchingRequestDto(
        UUID id,
        String title,
        String listingType,
        String propertyType,
        String area,
        UUID areaId,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Integer bedrooms,
        Integer bathrooms,
        Boolean furnished,
        LocalDate neededBy,
        String notes,
        String name,
        String contact,
        List<String> amenities,
        List<UUID> matchedListingIds,
        Instant createdAt) {
}
