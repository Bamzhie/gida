package ng.gida.listings;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ng.gida.listings.CreateListingRequest.CostInput;
import ng.gida.listings.CreateListingRequest.MediaInput;
import ng.gida.listings.ListingRepository.ListingRow;
import ng.gida.locations.LocationRepository;
import ng.gida.properties.PropertyRepository;
import ng.gida.shared.ApiException;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import ng.gida.shared.Vocabulary.CostType;
import ng.gida.shared.Vocabulary.ListingCategory;
import ng.gida.shared.Vocabulary.ListingType;
import ng.gida.shared.Vocabulary.PricePeriod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListingService {

    private final LocationRepository locations;
    private final PropertyRepository properties;
    private final ListingRepository listings;

    public ListingService(LocationRepository locations, PropertyRepository properties, ListingRepository listings) {
        this.locations = locations;
        this.properties = properties;
        this.listings = listings;
    }

    @Transactional
    public ListingCreated create(UUID advertiserId, CreateListingRequest request) {
        validatePricePeriod(request.listingType(), request.pricePeriod());
        validateCoordinates(request.property().latitude(), request.property().longitude());
        UUID locationId = resolveLocation(request.property().locationSlug());
        Map<String, UUID> amenityIds = resolveAmenities(request.property().amenities());
        List<CostInput> costs = validateCosts(request.costs());
        List<MediaInput> media = validateMedia(request.media());

        UUID propertyId = properties.insert(request.property(), locationId);
        properties.linkAmenities(propertyId, amenityIds.values());
        UUID listingId = listings.insert(propertyId, advertiserId, request,
                request.category() == null ? ListingCategory.STANDARD : request.category());
        costs.forEach(cost -> listings.insertCost(listingId, cost.type(), cost.amount(), cost.note()));
        insertMedia(listingId, media);
        return new ListingCreated(listingId, "DRAFT");
    }

    UUID resolveLocation(String slug) {
        return locations.findIdBySlug(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "unknown_location",
                        "No location exists with slug '" + slug + "'"));
    }

    Map<String, UUID> resolveAmenities(List<String> slugs) {
        List<String> requested = slugs == null
                ? List.of()
                : new ArrayList<>(new LinkedHashSet<>(slugs));
        Map<String, UUID> found = locations.findAmenityIds(requested);
        List<String> unknown = requested.stream().filter(slug -> !found.containsKey(slug)).toList();
        if (!unknown.isEmpty()) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "unknown_amenity",
                    "Unknown amenity slugs: " + String.join(", ", unknown));
        }
        return found;
    }

    List<CostInput> validateCosts(List<CostInput> costs) {
        List<CostInput> resolved = costs == null ? List.of() : costs;
        Set<CostType> seen = EnumSet.noneOf(CostType.class);
        for (CostInput cost : resolved) {
            if (!seen.add(cost.type())) {
                throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "duplicate_cost_type",
                        "Cost type " + cost.type() + " appears more than once");
            }
        }
        return resolved;
    }

    List<MediaInput> validateMedia(List<MediaInput> media) {
        List<MediaInput> resolved = media == null ? List.of() : media;
        if (resolved.size() > 20) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "too_many_media",
                    "A listing may carry at most 20 media entries");
        }
        return resolved;
    }

    static void validateCoordinates(Double latitude, Double longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "incomplete_coordinates",
                    "latitude and longitude must be supplied together");
        }
        if (latitude != null && longitude != null
                && (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "invalid_coordinates",
                    "latitude must be between -90 and 90 and longitude between -180 and 180");
        }
    }

    static void validatePricePeriod(ListingType type, PricePeriod period) {
        boolean valid = type == ListingType.SALE ? period == null : period != null;
        if (!valid) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "invalid_price_period",
                    "SALE listings must omit pricePeriod; RENT listings must supply it");
        }
    }

    void insertMedia(UUID listingId, List<MediaInput> media) {
        int index = 0;
        for (MediaInput entry : media) {
            listings.insertMedia(listingId, entry, index++);
        }
    }

    @Transactional
    public void patch(UUID actorId, boolean admin, UUID listingId, PatchListingRequest request) {
        ListingRow row = ownedRow(actorId, admin, listingId);
        if (!"DRAFT".equals(row.lifecycle())
                && (request.property() != null || request.costs() != null || request.media() != null)) {
            throw new ApiException(HttpStatus.CONFLICT, "property_locked",
                    "Property facts, costs and media can only change while the listing is a draft");
        }
        PricePeriod period = request.pricePeriod() == null ? row.pricePeriod() : request.pricePeriod();
        validatePricePeriod(ListingType.valueOf(row.listingType()), period);

        listings.update(listingId, request, request.pricePeriod());

        if (request.property() != null) {
            validateCoordinates(request.property().latitude(), request.property().longitude());
            UUID locationId = resolveLocation(request.property().locationSlug());
            Map<String, UUID> amenityIds = resolveAmenities(request.property().amenities());
            properties.update(row.propertyId(), request.property(), locationId);
            properties.replaceAmenities(row.propertyId(), amenityIds.values());
        }
        if (request.costs() != null) {
            List<CostInput> costs = validateCosts(request.costs());
            listings.deleteCosts(listingId);
            costs.forEach(cost -> listings.insertCost(listingId, cost.type(), cost.amount(), cost.note()));
        }
        if (request.media() != null) {
            List<MediaInput> media = validateMedia(request.media());
            listings.deleteMedia(listingId);
            insertMedia(listingId, media);
        }
    }

    @Transactional
    public void publish(UUID actorId, boolean admin, UUID listingId) {
        ListingRow row = ownedRow(actorId, admin, listingId);
        if (!"DRAFT".equals(row.lifecycle()) && !"PAUSED".equals(row.lifecycle())) {
            throw invalidTransition(row.lifecycle(), "PUBLISHED");
        }
        listings.publish(listingId);
    }

    @Transactional
    public void pause(UUID actorId, boolean admin, UUID listingId) {
        ListingRow row = ownedRow(actorId, admin, listingId);
        if (!"PUBLISHED".equals(row.lifecycle())) {
            throw invalidTransition(row.lifecycle(), "PAUSED");
        }
        listings.pause(listingId);
    }

    @Transactional
    public ListingCreated duplicate(UUID actorId, boolean admin, UUID listingId) {
        ListingRow row = ownedRow(actorId, admin, listingId);
        UUID propertyId = listings.copyProperty(row.propertyId());
        listings.copyAmenities(row.propertyId(), propertyId);
        UUID copyId = listings.insertCopy(listingId, propertyId, actorId);
        listings.copyCosts(listingId, copyId);
        listings.copyMedia(listingId, copyId);
        return new ListingCreated(copyId, "DRAFT");
    }

    @Transactional(readOnly = true)
    public PageResponse<OwnerListingDto> ownListings(UUID advertiserId, Paging paging) {
        List<OwnerListingDto> items = listings.findByAdvertiser(advertiserId, paging.size(), paging.offset());
        long total = listings.countByAdvertiser(advertiserId);
        return PageResponse.of(items, paging.page(), paging.size(), total);
    }

    ListingRow ownedRow(UUID actorId, boolean admin, UUID listingId) {
        ListingRow row = listings.findForUpdate(listingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "listing_not_found",
                        "Listing not found"));
        if (!admin && !row.advertiserId().equals(actorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_owner", "You do not own this listing");
        }
        return row;
    }

    private static ApiException invalidTransition(String from, String to) {
        return new ApiException(HttpStatus.CONFLICT, "invalid_lifecycle_transition",
                "Cannot move a " + from + " listing to " + to);
    }
}
