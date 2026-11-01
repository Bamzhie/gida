package ng.gida.listings;

import java.time.Instant;
import java.util.UUID;

public record ListingRenewed(UUID id, Instant expiresAt) {
}
