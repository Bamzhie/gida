package ng.gida.reports;

import java.time.Instant;
import java.util.UUID;

public record AdminReportDto(
        UUID id,
        UUID listingId,
        String listingTitle,
        UUID reporterId,
        String reporterEmail,
        String reason,
        String details,
        String status,
        UUID resolvedBy,
        Instant resolvedAt,
        Instant createdAt) {
}
