package ng.gida.requests;

import java.time.Instant;
import java.util.UUID;

public record RequestCreated(UUID id, String status, Instant createdAt) {
}
