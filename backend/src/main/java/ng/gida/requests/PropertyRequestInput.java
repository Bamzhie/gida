package ng.gida.requests;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record PropertyRequestInput(
        String title,
        String listingType,
        String propertyType,
        String location,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Integer bedrooms,
        Integer bathrooms,
        Boolean furnished,
        String neededBy,
        String notes,
        String name,
        String contact,
        List<String> amenities,
        String website) {
}
