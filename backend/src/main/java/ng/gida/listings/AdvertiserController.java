package ng.gida.listings;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
