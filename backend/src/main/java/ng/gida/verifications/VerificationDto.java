package ng.gida.verifications;

import java.time.Instant;

public record VerificationDto(
        String dimension, String state, String evidenceRef, String notes, Instant updatedAt) {
}
