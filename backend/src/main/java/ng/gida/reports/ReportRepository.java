package ng.gida.reports;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReportRepository extends JpaRepository<Report, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select report from Report report where report.id = :id")
    Optional<Report> findForUpdate(@Param("id") UUID id);

    boolean existsByListingIdAndReporterIdAndStatus(UUID listingId, UUID reporterId, String status);

    @Query(nativeQuery = true, value = """
            SELECT EXISTS (
                SELECT 1 FROM listings
                WHERE id = :id
                  AND lifecycle = 'PUBLISHED'
                  AND (expires_at IS NULL OR expires_at > now()))
            """)
    boolean publishedListingExists(@Param("id") UUID id);

    @Query(nativeQuery = true, value = """
            SELECT r.id AS "id", r.listing_id AS "listingId", l.title AS "listingTitle",
                   r.reporter_id AS "reporterId", u.email AS "reporterEmail",
                   r.reason AS "reason", r.details AS "details", r.status AS "status",
                   r.resolved_by AS "resolvedBy", r.resolved_at AS "resolvedAt",
                   r.created_at AS "createdAt"
            FROM reports r
            JOIN listings l ON l.id = r.listing_id
            JOIN users u ON u.id = r.reporter_id
            WHERE CAST(:status AS varchar) IS NULL OR r.status = :status
            ORDER BY r.created_at DESC, r.id
            LIMIT :limit OFFSET :offset
            """)
    List<AdminReportRow> findAdminReports(@Param("status") String status,
                                          @Param("limit") int limit,
                                          @Param("offset") int offset);

    @Query(nativeQuery = true, value = """
            SELECT count(*)
            FROM reports r
            WHERE CAST(:status AS varchar) IS NULL OR r.status = :status
            """)
    long countAdminReports(@Param("status") String status);

    interface AdminReportRow {

        UUID getId();

        UUID getListingId();

        String getListingTitle();

        UUID getReporterId();

        String getReporterEmail();

        String getReason();

        String getDetails();

        String getStatus();

        UUID getResolvedBy();

        Instant getResolvedAt();

        Instant getCreatedAt();
    }
}
