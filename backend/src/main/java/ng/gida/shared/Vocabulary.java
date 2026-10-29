package ng.gida.shared;

public final class Vocabulary {

    public enum ListingType { SALE, RENT }

    public enum ListingCategory { STANDARD, NEW_HOMES, SHORTLET }

    public enum PricePeriod { YEAR, MONTH, NIGHT, STAY }

    public enum Availability { AVAILABLE, PENDING, SOLD, RENTED }

    public enum CostType { AGENCY_FEE, LEGAL_FEE, SERVICE_CHARGE, CAUTION, OTHER }

    public enum MediaKind { PHOTO, VIDEO, FLOOR_PLAN }

    public enum PropertyType { APARTMENT, HOUSE, TOWNHOUSE, CONDO, LAND, COMMERCIAL }

    private Vocabulary() {
    }
}
