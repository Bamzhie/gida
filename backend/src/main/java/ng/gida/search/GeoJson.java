package ng.gida.search;

import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

public final class GeoJson {

    private static final int MAX_POINTS = 500;
    private static final JsonMapper JSON = JsonMapper.builder().build();

    public static String polygon(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        JsonNode root;
        try {
            root = JSON.readTree(raw);
        } catch (JacksonException ex) {
            throw invalid("polygon is not valid JSON");
        }
        if (root.has("crs")) {
            throw invalid("polygon must not carry a crs member; coordinates are always WGS84");
        }
        if (!"Polygon".equals(root.path("type").asString())) {
            throw invalid("polygon type must be Polygon");
        }
        JsonNode rings = root.path("coordinates");
        if (!rings.isArray() || rings.size() != 1) {
            throw invalid("polygon coordinates must hold exactly one ring");
        }
        JsonNode ring = rings.get(0);
        if (!ring.isArray() || ring.size() < 4) {
            throw invalid("polygon ring needs at least four positions");
        }
        if (ring.size() > MAX_POINTS) {
            throw invalid("polygon ring may hold at most " + MAX_POINTS + " positions");
        }
        for (int index = 0; index < ring.size(); index++) {
            JsonNode position = ring.get(index);
            if (!position.isArray() || position.size() < 2) {
                throw invalid("each polygon position needs a longitude and a latitude");
            }
            double longitude = position.get(0).asDouble();
            double latitude = position.get(1).asDouble();
            if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
                throw invalid("polygon coordinates must be WGS84 longitudes and latitudes");
            }
        }
        JsonNode first = ring.get(0);
        JsonNode last = ring.get(ring.size() - 1);
        if (first.get(0).asDouble() != last.get(0).asDouble()
                || first.get(1).asDouble() != last.get(1).asDouble()) {
            throw invalid("polygon ring must be closed");
        }
        return raw;
    }

    private static ApiException invalid(String detail) {
        return new ApiException(HttpStatus.BAD_REQUEST, "invalid_polygon", detail);
    }

    private GeoJson() {
    }
}
