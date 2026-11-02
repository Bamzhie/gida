package ng.gida.verifications;

import java.util.UUID;

public record UpsertVerificationRequest(
        String subjectType, UUID subjectId, String dimension, String state, String evidenceRef, String notes) {
}
