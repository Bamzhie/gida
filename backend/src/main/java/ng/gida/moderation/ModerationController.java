package ng.gida.moderation;

import java.util.UUID;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class ModerationController {
    private final ModerationService moderation;

    public ModerationController(ModerationService moderation) {
        this.moderation = moderation;
    }

    @GetMapping("/listings")
    public PageResponse<AdminListingDto> queue(@RequestParam(required = false) String state,
            @RequestParam(required = false) Integer staleDays, @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return moderation.queue(state, staleDays, Paging.of(page, size));
    }

    @GetMapping("/listings/{id}")
    public AdminListingDetailDto detail(@PathVariable UUID id) {
        return moderation.detail(id);
    }

    @PostMapping("/listings/{id}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        moderation.approve(actor(jwt), id);
    }

    @PostMapping("/listings/{id}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestBody(required = false) ReasonRequest request) {
        moderation.reject(actor(jwt), id, reason(request));
    }

    @PostMapping("/listings/{id}/request-corrections")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestCorrections(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestBody(required = false) ReasonRequest request) {
        moderation.requestCorrections(actor(jwt), id, reason(request));
    }

    @PostMapping("/listings/{id}/suspend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void suspend(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestBody(required = false) ReasonRequest request) {
        moderation.suspend(actor(jwt), id, reason(request));
    }

    @PostMapping("/listings/{id}/reinstate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reinstate(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        moderation.reinstate(actor(jwt), id);
    }

    @PostMapping("/listings/{id}/flag-stale")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void flagStale(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestBody(required = false) ReasonRequest request) {
        moderation.flagStale(actor(jwt), id, reason(request));
    }

    @GetMapping("/users")
    public PageResponse<AdminUserDto> users(@RequestParam(required = false) String q,
            @RequestParam(required = false) String status, @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return moderation.users(q, status, Paging.of(page, size));
    }

    @PostMapping("/users/{id}/suspend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void suspendUser(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestBody(required = false) ReasonRequest request) {
        moderation.suspendUser(actor(jwt), id, reason(request));
    }

    @PostMapping("/users/{id}/reinstate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reinstateUser(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        moderation.reinstateUser(actor(jwt), id);
    }

    private static UUID actor(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    private static String reason(ReasonRequest request) {
        return request == null ? null : request.reason();
    }
}
