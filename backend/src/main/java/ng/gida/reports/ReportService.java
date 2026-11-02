package ng.gida.reports;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReportService {

    private static final Set<String> REASONS = Set.of(
            "FRAUD", "WRONG_PRICE", "UNAVAILABLE", "DUPLICATE", "OFFENSIVE", "OTHER");
    private static final Set<String> STATUSES = Set.of("OPEN", "RESOLVED", "DISMISSED");
    private static final Set<String> OUTCOMES = Set.of("RESOLVED", "DISMISSED");

    private final ReportRepository reports;

    public ReportService(ReportRepository reports) {
        this.reports = reports;
    }

    @Transactional
    public ReportCreated report(UUID reporterId, UUID listingId, CreateReportRequest request) {
        if (!reports.publishedListingExists(listingId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "Listing not found");
        }
        String reason = text(request.reason(), "").toUpperCase(Locale.ROOT);
        if (!REASONS.contains(reason)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "invalid_reason",
                    "Choose one of the listed report reasons");
        }
        String details = text(request.details(), null);
        if (details != null && details.length() > 2000) {
            throw ApiException.validation("details", "Keep the details under 2000 characters.");
        }
        if (reports.existsByListingIdAndReporterIdAndStatus(listingId, reporterId, "OPEN")) {
            throw new ApiException(HttpStatus.CONFLICT, "duplicate_report",
                    "You already have an open report for this listing");
        }
        try {
            Report saved = reports.saveAndFlush(new Report(listingId, reporterId, reason, details));
            return new ReportCreated(saved.getId(), saved.getStatus());
        } catch (DataIntegrityViolationException exception) {
            for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
                if (cause instanceof org.hibernate.exception.ConstraintViolationException violation
                        && "reports_one_open_per_user_idx".equals(violation.getConstraintName())) {
                    throw new ApiException(HttpStatus.CONFLICT, "duplicate_report",
                            "You already have an open report for this listing");
                }
            }
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReportDto> list(String status, Paging paging) {
        String filter = text(status, null);
        if (filter != null) {
            filter = filter.toUpperCase(Locale.ROOT);
            if (!STATUSES.contains(filter)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter",
                        "status must be OPEN, RESOLVED or DISMISSED");
            }
        }
        long total = reports.countAdminReports(filter);
        return PageResponse.of(
                reports.findAdminReports(filter, paging.size(), paging.offset()).stream()
                        .map(ReportService::toDto)
                        .toList(),
                paging.page(), paging.size(), total);
    }

    @Transactional
    public void resolve(UUID actorId, UUID reportId, ResolveReportRequest request) {
        Report report = reports.findForUpdate(reportId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "report_not_found",
                        "Report not found"));
        if (!"OPEN".equals(report.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "report_already_resolved",
                    "This report has already been resolved");
        }
        String outcome = text(request.outcome(), "").toUpperCase(Locale.ROOT);
        if (!OUTCOMES.contains(outcome)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "invalid_outcome",
                    "outcome must be RESOLVED or DISMISSED");
        }
        String note = text(request.note(), null);
        report.resolve(outcome, actorId, Instant.now());
        reports.save(report);
        audit(actorId, "RESOLVED".equals(outcome) ? "RESOLVE_REPORT" : "DISMISS_REPORT", reportId, note);
    }

    void audit(UUID actorId, String action, UUID reportId, String note) {
        // wired at merge
    }

    private static AdminReportDto toDto(ReportRepository.AdminReportRow row) {
        return new AdminReportDto(
                row.getId(),
                row.getListingId(),
                row.getListingTitle(),
                row.getReporterId(),
                row.getReporterEmail(),
                row.getReason(),
                row.getDetails(),
                row.getStatus(),
                row.getResolvedBy(),
                row.getResolvedAt(),
                row.getCreatedAt());
    }

    private static String text(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
