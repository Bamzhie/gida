package ng.gida.verifications;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VerificationService {
    private static final List<String> DIMENSIONS = List.of(
            "IDENTITY", "BUSINESS", "REGULATORY", "PROPERTY_EXISTENCE", "LOCATION",
            "AUTHORITY", "PRICE", "AVAILABILITY", "MEDIA_FRESHNESS");
    private static final Set<String> STATES = Set.of("UNVERIFIED", "PENDING", "VERIFIED", "FAILED");
    private final VerificationRepository verifications;

    public VerificationService(VerificationRepository verifications) {
        this.verifications = verifications;
    }

    @Transactional(readOnly = true)
    public List<VerificationDto> list(String subjectType, UUID subjectId) {
        validateSubject(subjectType, subjectId, false);
        Map<String, VerificationDto> rows = new HashMap<>();
        verifications.findBySubjectTypeAndSubjectId(subjectType, subjectId)
                .forEach(row -> rows.put(row.dto().dimension(), row.dto()));
        return DIMENSIONS.stream().map(d -> rows.getOrDefault(d,
                new VerificationDto(d, "UNVERIFIED", null, null, null))).toList();
    }

    @Transactional
    public VerificationDto upsert(UUID actorId, UpsertVerificationRequest request) {
        // Lock the subject before reading the dimension, including its first insert.
        // Existing aggregates remain unmapped and are only read through these native queries.
        validateSubject(request.subjectType(), request.subjectId(), true);
        if (request.dimension() == null || !DIMENSIONS.contains(request.dimension())) {
            throw invalid("invalid_dimension", "Unknown verification dimension");
        }
        if (request.state() == null || !STATES.contains(request.state())) {
            throw invalid("invalid_state", "Unknown verification state");
        }
        Verification row = verifications.findBySubjectTypeAndSubjectIdAndDimension(
                        request.subjectType(), request.subjectId(), request.dimension())
                .orElseGet(() -> new Verification(request.subjectType(), request.subjectId(), request.dimension()));
        row.review(request.state(), request.evidenceRef(), request.notes(), actorId);
        Verification saved = verifications.saveAndFlush(row);
        audit(actorId, request.subjectType(), request.subjectId(), request.dimension() + ":" + request.state());
        return saved.dto();
    }

    void audit(UUID actorId, String subjectType, UUID subjectId, String reason) {
        // wired at merge
    }

    @Transactional(readOnly = true)
    public PublicVerificationDto publicSummary(UUID listingId) {
        if (!verifications.publishedListingExists(listingId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "Listing not found");
        }
        Set<String> listing = new HashSet<>();
        boolean advertiser = false;
        for (var row : verifications.publicRows(listingId)) {
            if ("ADVERTISER".equals(row.getSubjectType())) {
                advertiser |= Set.of("IDENTITY", "BUSINESS").contains(row.getDimension());
            } else {
                listing.add(row.getDimension());
            }
        }
        return new PublicVerificationDto(advertiser, listing.contains("PROPERTY_EXISTENCE"),
                listing.contains("LOCATION"), listing.contains("PRICE"));
    }

    @Transactional(readOnly = true)
    public boolean verifiedAdvertiser(UUID userId) {
        return verifications.verifiedAdvertiser(userId);
    }

    private void validateSubject(String type, UUID id, boolean lock) {
        if (!"LISTING".equals(type) && !"ADVERTISER".equals(type)) {
            throw invalid("invalid_subject_type", "subjectType must be LISTING or ADVERTISER");
        }
        boolean exists = false;
        if (id != null) {
            if ("LISTING".equals(type)) {
                exists = lock ? verifications.lockListing(id).isPresent() : verifications.listingExists(id);
            } else {
                exists = lock ? verifications.lockAdvertiser(id).isPresent() : verifications.advertiserExists(id);
            }
        }
        if (!exists) {
            throw new ApiException(HttpStatus.NOT_FOUND, "subject_not_found", "Verification subject not found");
        }
    }

    private static ApiException invalid(String code, String message) {
        return new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, code, message);
    }
}
