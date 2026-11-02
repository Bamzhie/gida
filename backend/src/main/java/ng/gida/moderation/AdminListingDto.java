package ng.gida.moderation;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminListingDto(UUID id, String title, String lifecycle, String availability, BigDecimal price,
        String pricePeriod, UUID advertiserId, String advertiserName, String advertiserEmail, String area,
        String state, Instant submittedAt, Instant confirmedAt, Instant createdAt, Instant updatedAt) {}
