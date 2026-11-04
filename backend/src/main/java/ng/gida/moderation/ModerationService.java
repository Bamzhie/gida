package ng.gida.moderation;

import java.util.Set;
import java.util.UUID;
import ng.gida.auth.RefreshTokenRepository;
import ng.gida.listings.ListingDetailRepository;
import ng.gida.listings.ListingRepository;
import ng.gida.shared.ApiException;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import ng.gida.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ModerationService {
    private static final Set<String> STATES = Set.of(
            "DRAFT", "SUBMITTED", "UNDER_REVIEW", "PUBLISHED", "PAUSED", "EXPIRED", "REJECTED", "SUSPENDED");
    private final ListingRepository listings;
    private final ListingDetailRepository details;
    private final AdminListingRepository queue;
    private final ModerationActionRepository actions;
    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;

    public ModerationService(ListingRepository listings, ListingDetailRepository details,
            AdminListingRepository queue, ModerationActionRepository actions, UserRepository users,
            RefreshTokenRepository refreshTokens) {
        this.listings = listings;
        this.details = details;
        this.queue = queue;
        this.actions = actions;
        this.users = users;
        this.refreshTokens = refreshTokens;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminListingDto> queue(String state, Integer staleDays, Paging paging) {
        if ((state != null && !STATES.contains(state)) || (state != null && staleDays != null)
                || (staleDays != null && staleDays < 1)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter",
                    "Choose a valid state or a positive staleDays, not both");
        }
        return queue.queue(state, staleDays, paging);
    }

    @Transactional(readOnly = true)
    public AdminListingDetailDto detail(UUID id) {
        var listing = details.findDetailForAdmin(id).orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "Listing not found"));
        var history = actions.findByTargetTypeAndTargetIdOrderByCreatedAtDesc("LISTING", id);
        var names = users.findNames(history.stream().map(action -> action.getActorId()).distinct().toList());
        String lifecycle = queue.findLifecycle(id).orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "Listing not found"));
        return new AdminListingDetailDto(lifecycle, listing,
                history.stream()
                        .map(a
                                -> new ModerationActionDto(a.getId(), a.getAction(), a.getTargetType(),
                                        a.getTargetId(), a.getActorId(), names.get(a.getActorId()),
                                        a.getReason(), a.getCreatedAt()))
                        .toList());
    }

    @Transactional
    public void approve(UUID actor, UUID id) {
        review(actor, id, "APPROVE", null);
    }

    @Transactional
    public void reject(UUID actor, UUID id, String reason) {
        review(actor, id, "REJECT", requireReason(reason));
    }

    @Transactional
    public void requestCorrections(UUID actor, UUID id, String reason) {
        review(actor, id, "REQUEST_CORRECTIONS", requireReason(reason));
    }

    @Transactional
    public void suspend(UUID actor, UUID id, String reason) {
        review(actor, id, "SUSPEND_LISTING", requireReason(reason));
    }

    @Transactional
    public void reinstate(UUID actor, UUID id) {
        review(actor, id, "REINSTATE_LISTING", null);
    }

    @Transactional
    public void flagStale(UUID actor, UUID id, String reason) {
        if (reason != null && reason.length() > 1000) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "reason_required",
                    "Reason must be at most 1000 characters");
        }
        review(actor, id, "FLAG_STALE", reason == null ? null : reason.trim());
    }

    private void review(UUID actor, UUID id, String action, String reason) {
        var row = listings.findForUpdate(id).orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "Listing not found"));
        String state = row.lifecycle();
        boolean valid = switch (action) {
            case "APPROVE", "REJECT", "REQUEST_CORRECTIONS" ->
                Set.of("SUBMITTED", "UNDER_REVIEW").contains(state);
            case "SUSPEND_LISTING" -> Set.of("PUBLISHED", "PAUSED", "EXPIRED").contains(state);
            case "REINSTATE_LISTING" -> "SUSPENDED".equals(state);
            case "FLAG_STALE" -> "PUBLISHED".equals(state);
            default -> false;
        };
        if (!valid) {
            throw new ApiException(HttpStatus.CONFLICT, "invalid_lifecycle_transition",
                    "Cannot apply " + action + " to a " + state + " listing");
        }
        switch (action) {
            case "APPROVE" -> listings.approve(id);
            case "REJECT" -> listings.reject(id);
            case "REQUEST_CORRECTIONS" -> listings.requestCorrections(id);
            case "SUSPEND_LISTING" -> listings.suspendListing(id);
            case "REINSTATE_LISTING" -> listings.reinstateListing(id);
            case "FLAG_STALE" -> {
            }
            default -> throw new IllegalStateException("Unknown moderation action");
        }
        actions.record(actor, action, "LISTING", id, reason);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> users(String q, String status, Paging paging) {
        if (status != null && !Set.of("ACTIVE", "SUSPENDED").contains(status)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_filter", "Unknown user status");
        }
        return users.search(q, status, paging);
    }

    @Transactional
    public void suspendUser(UUID actor, UUID id, String reason) {
        reason = requireReason(reason);
        if (actor.equals(id)) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "cannot_suspend_self",
                    "You cannot suspend your own account");
        }
        String status = userStatus(id);
        if (!"ACTIVE".equals(status)) {
            throw new ApiException(HttpStatus.CONFLICT, "user_not_active", "User is not active");
        }
        users.updateStatus(id, "SUSPENDED");
        refreshTokens.revokeAllForUser(id);
        actions.record(actor, "SUSPEND_USER", "USER", id, reason);
    }

    @Transactional
    public void reinstateUser(UUID actor, UUID id) {
        if (!"SUSPENDED".equals(userStatus(id))) {
            throw new ApiException(HttpStatus.CONFLICT, "user_not_suspended", "User is not suspended");
        }
        users.updateStatus(id, "ACTIVE");
        actions.record(actor, "REINSTATE_USER", "USER", id, null);
    }

    private String userStatus(UUID id) {
        return users.findStatusForUpdate(id).orElseThrow(
                () -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found", "User not found"));
    }

    static String requireReason(String reason) {
        if (reason == null || reason.isBlank() || reason.length() > 1000) {
            throw new ApiException(HttpStatus.UNPROCESSABLE_CONTENT, "reason_required",
                    "A reason of at most 1000 characters is required");
        }
        return reason.trim();
    }
}
