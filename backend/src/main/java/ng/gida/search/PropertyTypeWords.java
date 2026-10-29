package ng.gida.search;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

public final class PropertyTypeWords {

    private static final Map<String, String> WORDS = Map.ofEntries(
            Map.entry("flat", "APARTMENT"),
            Map.entry("apartment", "APARTMENT"),
            Map.entry("duplex", "HOUSE"),
            Map.entry("house", "HOUSE"),
            Map.entry("terrace", "HOUSE"),
            Map.entry("bungalow", "HOUSE"),
            Map.entry("townhouse", "TOWNHOUSE"),
            Map.entry("condo", "CONDO"),
            Map.entry("land", "LAND"),
            Map.entry("plot", "LAND"),
            Map.entry("office", "COMMERCIAL"),
            Map.entry("shop", "COMMERCIAL"),
            Map.entry("commercial", "COMMERCIAL"));

    public static List<String> matching(String query) {
        return Arrays.stream(query.toLowerCase(Locale.ROOT).split("[^a-z]+"))
                .map(WORDS::get)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private PropertyTypeWords() {
    }
}
