package ng.gida.requests;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import ng.gida.locations.LocationRepository;
import ng.gida.shared.ApiException;
import ng.gida.shared.Contacts;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import ng.gida.shared.Vocabulary.ListingType;
import ng.gida.shared.Vocabulary.PropertyType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PropertyRequestService {

    private final PropertyRequestRepository requests;
    private final LocationRepository locations;

    public PropertyRequestService(PropertyRequestRepository requests, LocationRepository locations) {
        this.requests = requests;
        this.locations = locations;
    }

    public RequestCreated create(UUID userId, PropertyRequestInput input) {
        if (input.website() != null && !input.website().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "honeypot_rejected", "This form was rejected.");
        }
        String title = trimmed(input.title(), 160);
        if (title == null) throw ApiException.validation("title", "Give the request a short title.");

        ListingType listingType = listingType(input.listingType());
        PropertyType propertyType = propertyType(input.propertyType());

        UUID locationId = null;
        if (input.location() != null && !input.location().isBlank()) {
            locationId = locations.findIdBySlug(input.location().trim())
                    .orElseThrow(() -> new ApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                            "unknown_location", "Choose an area from the list."));
        }

        BigDecimal min = input.minPrice();
        BigDecimal max = input.maxPrice();
        if (min != null && min.signum() < 0) throw ApiException.validation("minPrice", "Budgets cannot be negative.");
        if (max != null && max.signum() < 0) throw ApiException.validation("maxPrice", "Budgets cannot be negative.");
        if (min != null && max != null && min.compareTo(max) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_budget",
                    "Your maximum budget must be at least your minimum budget.");
        }
        if (input.bedrooms() != null) checkRooms("bedrooms", input.bedrooms());
        if (input.bathrooms() != null) checkRooms("bathrooms", input.bathrooms());

        String name = trimmed(input.name(), 120);
        if (name == null) throw ApiException.validation("name", "Add your name.");
        String contact = trimmed(input.contact(), 320);
        if (contact == null || !Contacts.isValid(contact)) {
            throw ApiException.validation("contact", "Enter a valid email address or phone number.");
        }

        List<String> amenitySlugs = input.amenities() == null ? List.of() : input.amenities().stream()
                .filter(value -> value != null && !value.isBlank()).map(String::trim).distinct().toList();
        Map<String, UUID> amenityIds = locations.findAmenityIds(amenitySlugs);
        for (String slug : amenitySlugs) {
            if (!amenityIds.containsKey(slug)) {
                throw ApiException.validation("amenities", "'" + slug + "' is not a listed amenity.");
            }
        }

        if (requests.recentlySeen(contact, title)) {
            throw new ApiException(HttpStatus.CONFLICT, "duplicate_request", "You have already posted this request.");
        }

        PropertyRequestDto values = new PropertyRequestDto(
                null, title, listingType.name(), propertyType == null ? null : propertyType.name(),
                null, locationId,
                min, max, input.bedrooms(), input.bathrooms(), input.furnished(),
                neededBy(input.neededBy()), trimmed(input.notes(), 5000), name, contact,
                "OPEN", List.of(), null);
        return requests.insert(userId, values, amenitySlugs.stream().map(amenityIds::get).toList());
    }

    public PageResponse<PropertyRequestDto> mine(UUID userId, Paging paging) {
        return requests.mine(userId, paging);
    }

    public PageResponse<MatchingRequestDto> matching(UUID advertiserId, Paging paging) {
        return requests.matching(advertiserId, paging);
    }

    private static String trimmed(String raw, int max) {
        if (raw == null) return null;
        String value = raw.trim();
        if (value.isEmpty() || value.length() > max) return null;
        return value;
    }

    /** `property_requests.bedrooms`/`bathrooms` are `smallint`, so 32767 is the last storable value. */
    private static void checkRooms(String field, int value) {
        if (value < 0) {
            throw ApiException.validation(field, "The number cannot be negative.");
        }
        if (value > 32767) {
            throw ApiException.validation(field, "That number is too large.");
        }
    }

    private static ListingType listingType(String raw) {
        try {
            return ListingType.valueOf(raw == null ? "" : raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.validation("listingType", "Choose rent or buy.");
        }
    }

    private static PropertyType propertyType(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return PropertyType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw ApiException.validation("propertyType", "That property type is not listed.");
        }
    }

    private static LocalDate neededBy(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim();
        try {
            return value.length() == 7
                    ? LocalDate.parse(value + "-01", DateTimeFormatter.ISO_LOCAL_DATE)
                    : LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE);
        } catch (java.time.format.DateTimeParseException ex) {
            throw ApiException.validation("neededBy", "Use a month such as 2026-12.");
        }
    }
}
