package ng.gida.listings;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OwnerListingDto(UUID id, String title, String lifecycle, String availability,
                              BigDecimal price, String pricePeriod,
                              Instant createdAt, Instant publishedAt) {
}
