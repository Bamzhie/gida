package ng.gida.users;

import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/profile")
@PreAuthorize("hasRole('AGENT')")
public class AccountProfileController {

    private final AccountProfileService profiles;

    public AccountProfileController(AccountProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping
    public AccountProfileDto get(@AuthenticationPrincipal Jwt jwt) {
        return profiles.get(UUID.fromString(jwt.getSubject()));
    }

    @PutMapping
    public AccountProfileDto update(@AuthenticationPrincipal Jwt jwt,
                                    @Valid @RequestBody AccountProfileRequest request) {
        return profiles.update(UUID.fromString(jwt.getSubject()), request);
    }
}
