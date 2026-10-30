package ng.gida.enquiries;

import java.time.Instant;
import java.util.UUID;

public record EnquiryCreated(UUID id, Instant createdAt) {
}
