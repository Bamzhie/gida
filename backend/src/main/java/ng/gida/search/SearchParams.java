package ng.gida.search;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.shared.Paging;
import ng.gida.shared.Vocabulary.Availability;
import ng.gida.shared.Vocabulary.ListingCategory;
import ng.gida.shared.Vocabulary.ListingType;
import ng.gida.shared.Vocabulary.PropertyType;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;

public record SearchParams(
        String location,
        UUID advertiser,
        String q,
        List<UUID> ids,
        ListingType listingType,
        ListingCategory category,
        PropertyType propertyType,
        Availability availability,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Integer bedrooms,
        Integer bathrooms,
        Boolean furnished,
        List<String> amenities,
        BoundingBox bbox,
        String polygon,
        String sort,
        int page,
        int size) {

    public record BoundingBox(double minLng, double minLat, double maxLng, double maxLat) {
    }

    private static final int MAX_IDS = 50;
    private static final Set<String> SORTS =
            Set.of("newest", "oldest", "price-asc", "price-desc", "updated", "confirmed", "relevance");

    public static SearchParams parse(MultiValueMap<String, String> params) {
        Paging paging = Paging.of(integer(params, "page"), integer(params, "size"));
        String q = single(params, "q");
        if (q != null && q.length() > 200) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter", "q may hold at most 200 characters");
        }
        String sort = single(params, "sort") == null ? "newest" : single(params, "sort");
        if (!SORTS.contains(sort)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter", "Unsupported sort '" + sort + "'");
        }
        if ("relevance".equals(sort) && q == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "relevance_requires_keyword",
                    "sort=relevance requires a keyword");
        }
        return new SearchParams(
                single(params, "location"),
                advertiser(params),
                q,
                ids(params),
                enumValue(params, "listingType", ListingType.class),
                enumValue(params, "category", ListingCategory.class),
                enumValue(params, "propertyType", PropertyType.class),
                enumValue(params, "availability", Availability.class),
                decimal(params, "minPrice"),
                decimal(params, "maxPrice"),
                integer(params, "bedrooms"),
                integer(params, "bathrooms"),
                bool(params, "furnished"),
                amenities(params),
                bbox(params),
                GeoJson.polygon(single(params, "polygon")),
                sort,
                paging.page(),
                paging.size());
    }

    private static BoundingBox bbox(MultiValueMap<String, String> params) {
        String raw = single(params, "bbox");
        if (raw == null) {
            return null;
        }
        String[] parts = raw.split(",");
        if (parts.length != 4) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_bbox",
                    "bbox must be minLng,minLat,maxLng,maxLat");
        }
        double[] values = new double[4];
        for (int index = 0; index < 4; index++) {
            try {
                values[index] = Double.parseDouble(parts[index].trim());
            } catch (NumberFormatException ex) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_bbox", "bbox holds a non-numeric value");
            }
        }
        double minLng = values[0];
        double minLat = values[1];
        double maxLng = values[2];
        double maxLat = values[3];
        if (minLng >= maxLng || minLat >= maxLat) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_bbox",
                    "bbox must satisfy minLng < maxLng and minLat < maxLat");
        }
        if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_bbox", "bbox is outside WGS84 bounds");
        }
        return new BoundingBox(minLng, minLat, maxLng, maxLat);
    }

    private static String single(MultiValueMap<String, String> params, String key) {
        List<String> values = params.get(key);
        if (values == null || values.isEmpty()) {
            return null;
        }
        String value = values.get(0);
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static List<UUID> ids(MultiValueMap<String, String> params) {
        if (!params.containsKey("ids")) {
            return null;
        }
        List<UUID> parsed = params.get("ids").stream()
                .flatMap(value -> Arrays.stream(value.split(",")))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(SearchParams::uuid)
                .toList();
        if (parsed.size() > MAX_IDS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "too_many_ids",
                    "At most " + MAX_IDS + " ids may be requested");
        }
        return parsed;
    }

    private static UUID advertiser(MultiValueMap<String, String> params) {
        String raw = single(params, "advertiser");
        return raw == null ? null : uuid(raw);
    }

    private static List<String> amenities(MultiValueMap<String, String> params) {
        List<String> values = params.get("amenity");
        return values == null
                ? List.of()
                : values.stream().map(String::trim).filter(value -> !value.isEmpty()).distinct().toList();
    }

    private static UUID uuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter", "'" + raw + "' is not a valid id");
        }
    }

    private static <E extends Enum<E>> E enumValue(MultiValueMap<String, String> params, String key, Class<E> type) {
        String raw = single(params, key);
        if (raw == null) {
            return null;
        }
        try {
            return Enum.valueOf(type, raw);
        } catch (IllegalArgumentException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter",
                    "Unsupported value '" + raw + "' for " + key);
        }
    }

    private static BigDecimal decimal(MultiValueMap<String, String> params, String key) {
        String raw = single(params, key);
        if (raw == null) {
            return null;
        }
        try {
            BigDecimal value = new BigDecimal(raw);
            if (value.signum() < 0) {
                throw new NumberFormatException();
            }
            return value;
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter",
                    "'" + raw + "' is not a valid " + key);
        }
    }

    private static Integer integer(MultiValueMap<String, String> params, String key) {
        String raw = single(params, key);
        if (raw == null) {
            return null;
        }
        try {
            int value = Integer.parseInt(raw);
            if (value < 0 && !"page".equals(key)) {
                throw new NumberFormatException();
            }
            return value;
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter",
                    "'" + raw + "' is not a valid " + key);
        }
    }

    private static Boolean bool(MultiValueMap<String, String> params, String key) {
        String raw = single(params, key);
        if (raw == null) {
            return null;
        }
        if ("true".equals(raw)) {
            return Boolean.TRUE;
        }
        if ("false".equals(raw)) {
            return Boolean.FALSE;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter", "'" + raw + "' is not a valid " + key);
    }
}
