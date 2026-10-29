package ng.gida.listings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import ng.gida.listings.CreateListingRequest.CostInput;
import ng.gida.listings.CreateListingRequest.MediaInput;
import ng.gida.listings.CreateListingRequest.PropertyInput;
import ng.gida.shared.Vocabulary.Availability;
import ng.gida.shared.Vocabulary.PricePeriod;

public record PatchListingRequest(
        @Size(min = 1, max = 200) String title,
        @Size(min = 1) String description,
        @DecimalMin("0") @Digits(integer = 12, fraction = 2) BigDecimal price,
        PricePeriod pricePeriod,
        Availability availability,
        @Valid PropertyInput property,
        @Valid List<CostInput> costs,
        @Valid List<MediaInput> media) {
}
