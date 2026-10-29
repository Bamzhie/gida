package ng.gida.users;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class AdvertiserProfileController {

    private final AdvertiserProfileRepository profiles;

    public AdvertiserProfileController(AdvertiserProfileRepository profiles) {
        this.profiles = profiles;
    }

    @PutMapping("/advertiser-profile")
    @PreAuthorize("hasRole('AGENT')")
    public AdvertiserProfileDto upsert(@AuthenticationPrincipal Jwt jwt,
                                       @Valid @RequestBody AdvertiserProfileRequest request) {
        return profiles.upsert(UUID.fromString(jwt.getSubject()), request);
    }
}
