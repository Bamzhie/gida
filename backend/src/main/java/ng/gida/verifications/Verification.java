package ng.gida.verifications;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verifications")
public class Verification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "subject_type", nullable = false, length = 10)
    private String subjectType;
    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;
    @Column(nullable = false, length = 24)
    private String dimension;
    @Column(nullable = false, length = 12)
    private String state;
    @Column(name = "evidence_ref")
    private String evidenceRef;
    private String notes;
    @Column(name = "reviewer_id")
    private UUID reviewerId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Verification() {
    }

    public Verification(String subjectType, UUID subjectId, String dimension) {
        this.subjectType = subjectType;
        this.subjectId = subjectId;
        this.dimension = dimension;
    }

    public void review(String state, String evidenceRef, String notes, UUID reviewerId) {
        this.state = state;
        this.evidenceRef = evidenceRef;
        this.notes = notes;
        this.reviewerId = reviewerId;
    }

    /** Back to UNVERIFIED when the fact it certified changed; evidence no longer describes it. */
    public void clear() {
        this.state = "UNVERIFIED";
        this.evidenceRef = null;
        this.notes = null;
        this.reviewerId = null;
    }

    @PrePersist
    void create() {
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void update() {
        updatedAt = Instant.now();
    }

    public VerificationDto dto() {
        return new VerificationDto(dimension, state, evidenceRef, notes, updatedAt);
    }
}
