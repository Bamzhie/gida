package ng.gida.listings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import ng.gida.shared.Vocabulary.CostType;
import ng.gida.shared.Vocabulary.ListingCategory;
import ng.gida.shared.Vocabulary.ListingType;
import ng.gida.shared.Vocabulary.MediaKind;
import ng.gida.shared.Vocabulary.PricePeriod;
import ng.gida.shared.Vocabulary.PropertyType;

public record CreateListingRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String description,
        @NotNull ListingType listingType,
        ListingCategory category,
        @NotNull @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal price,
        PricePeriod pricePeriod,
        @NotNull @Valid PropertyInput property,
        @Valid List<CostInput> costs,
        @Valid List<MediaInput> media) {

    public record PropertyInput(
            @NotBlank String locationSlug,
            @Size(max = 255) String addressLine,
            @NotNull PropertyType propertyType,
            @PositiveOrZero Integer bedrooms,
            @PositiveOrZero Integer bathrooms,
            @DecimalMin(value = "0", inclusive = false) @Digits(integer = 8, fraction = 2) BigDecimal sizeSqm,
            @DecimalMin(value = "0", inclusive = false) @Digits(integer = 10, fraction = 2) BigDecimal lotSizeSqm,
            @Min(1500) @Max(2100) Integer yearBuilt,
            @PositiveOrZero Integer parking,
            Boolean furnished,
            Double latitude,
            Double longitude,
            List<@NotBlank String> amenities) {
    }

    public record CostInput(
            @NotNull CostType type,
            @NotNull @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal amount,
            @Size(max = 255) String note) {
    }

    public record MediaInput(
            @NotBlank @Size(max = 2048) String url,
            @Size(max = 255) String caption,
            MediaKind kind,
            @PositiveOrZero Integer sortOrder) {
    }
}
