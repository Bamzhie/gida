package ng.gida.reports;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reports")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "listing_id", nullable = false)
    private UUID listingId;

    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Column(nullable = false, length = 20)
    private String reason;

    private String details;

    @Column(nullable = false, length = 12)
    private String status;

    @Column(name = "resolved_by")
    private UUID resolvedBy;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected Report() {
    }

    public Report(UUID listingId, UUID reporterId, String reason, String details) {
        this.listingId = listingId;
        this.reporterId = reporterId;
        this.reason = reason;
        this.details = details;
        this.status = "OPEN";
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void resolve(String outcome, UUID actorId, Instant at) {
        this.status = outcome;
        this.resolvedBy = actorId;
        this.resolvedAt = at;
    }

    public UUID getId() {
        return id;
    }

    public UUID getListingId() {
        return listingId;
    }

    public UUID getReporterId() {
        return reporterId;
    }

    public String getReason() {
        return reason;
    }

    public String getDetails() {
        return details;
    }

    public String getStatus() {
        return status;
    }

    public UUID getResolvedBy() {
        return resolvedBy;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
