package ng.gida.support;

public final class ListingFixtures {

    public static String rent(String locationSlug) {
        return rent(locationSlug, "3500000.00", 2, "borehole-water", "24-7-security");
    }

    public static String rent(String locationSlug, String price, Integer bedrooms, String... amenitySlugs) {
        return body("RENT", null, "YEAR", price, locationSlug, "APARTMENT", bedrooms, amenitySlugs);
    }

    public static String sale(String locationSlug, String propertyType, String price, Integer bedrooms) {
        return body("SALE", null, null, price, locationSlug, propertyType, bedrooms, "parking");
    }

    public static String newHome(String locationSlug, String propertyType, String price, Integer bedrooms) {
        return body("SALE", "NEW_HOMES", null, price, locationSlug, propertyType, bedrooms, "parking");
    }

    private static String body(String listingType, String category, String pricePeriod, String price,
                               String locationSlug, String propertyType, Integer bedrooms,
                               String... amenitySlugs) {
        String amenities = amenitySlugs.length == 0
                ? ""
                : "\"" + String.join("\",\"", amenitySlugs) + "\"";
        String categoryLine = category == null ? "" : "\"category\": \"" + category + "\",\n";
        String periodLine = pricePeriod == null ? "" : "\"pricePeriod\": \"" + pricePeriod + "\",\n";
        String title = "RENT".equals(listingType)
                ? "A home in " + locationSlug
                : propertyType + " for sale in " + locationSlug;
        return """
                {
                  "title": "%s",
                  "description": "A well placed home close to the main road.",
                  "listingType": "%s",
                  %s%s"price": %s,
                  "property": {
                    "locationSlug": "%s",
                    "addressLine": "12 Admiralty Way",
                    "propertyType": "%s",
                    "bedrooms": %s,
                    "bathrooms": 2,
                    "latitude": 6.4385,
                    "longitude": 3.4356,
                    "amenities": [%s]
                  },
                  "costs": [{ "type": "AGENCY_FEE", "amount": 350000.00 }]
                }
                """.formatted(title, listingType, categoryLine, periodLine, price,
                locationSlug, propertyType, bedrooms, amenities);
    }

    private ListingFixtures() {
    }
}
