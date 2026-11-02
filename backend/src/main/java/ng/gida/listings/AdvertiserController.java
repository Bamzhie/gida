package ng.gida.listings;

import jakarta.validation.Valid;
import java.util.UUID;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AdvertiserController {

    private final ListingService listingService;

    public AdvertiserController(ListingService listingService) {
        this.listingService = listingService;
    }

    @PostMapping("/listings")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public ListingCreated create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateListingRequest request) {
        return listingService.create(UUID.fromString(jwt.getSubject()), request);
    }

    @PatchMapping("/listings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public void patch(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                      @Valid @RequestBody PatchListingRequest request) {
        listingService.patch(UUID.fromString(jwt.getSubject()), isAdmin(jwt), id, request);
    }

    @PostMapping("/me/listings/{id}/submit")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public ListingCreated submit(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return listingService.submit(UUID.fromString(jwt.getSubject()), isAdmin(jwt), id);
    }

    @PostMapping("/me/listings/{id}/resume")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public void resume(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        listingService.resume(UUID.fromString(jwt.getSubject()), isAdmin(jwt), id);
    }

    @PostMapping("/me/listings/{id}/confirm")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public java.util.Map<String, java.time.Instant> confirm(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return java.util.Map.of("confirmedAt", listingService.confirm(UUID.fromString(jwt.getSubject()), isAdmin(jwt), id));
    }

    @PostMapping("/me/listings/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public ListingCreated duplicate(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return listingService.duplicate(UUID.fromString(jwt.getSubject()), isAdmin(jwt), id);
    }

    @PostMapping("/me/listings/{id}/renew")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public ListingRenewed renew(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return listingService.renew(UUID.fromString(jwt.getSubject()), isAdmin(jwt), id);
    }

    @PostMapping("/listings/{id}/pause")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public void pause(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        listingService.pause(UUID.fromString(jwt.getSubject()), isAdmin(jwt), id);
    }

    @GetMapping("/me/listings")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public PageResponse<OwnerListingDto> mine(@AuthenticationPrincipal Jwt jwt,
                                              @RequestParam(required = false) Integer page,
                                              @RequestParam(required = false) Integer size) {
        return listingService.ownListings(UUID.fromString(jwt.getSubject()), Paging.of(page, size));
    }

    @GetMapping("/me/advertiser-summary")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public AdvertiserSummaryDto summary(@AuthenticationPrincipal Jwt jwt) {
        return listingService.summary(UUID.fromString(jwt.getSubject()));
    }

    private static boolean isAdmin(Jwt jwt) {
        return "ADMIN".equals(jwt.getClaimAsString("role"));
    }
}
