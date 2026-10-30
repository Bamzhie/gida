package ng.gida.enquiries;

import java.time.Instant;
import java.util.UUID;

public record EnquiryDto(
        UUID id,
        String action,
        String name,
        String contact,
        String message,
        UUID listingId,
        String listingTitle,
        UUID advertiserId,
        Instant createdAt) {
}
