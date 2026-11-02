package ng.gida.verifications;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/verifications")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVerificationController {
    private final VerificationService service;

    public AdminVerificationController(VerificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<VerificationDto> list(@RequestParam String subjectType, @RequestParam UUID subjectId) {
        return service.list(subjectType, subjectId);
    }
    @PutMapping
    public VerificationDto upsert(@AuthenticationPrincipal Jwt jwt, @RequestBody UpsertVerificationRequest request) {
        return service.upsert(UUID.fromString(jwt.getSubject()), request);
    }
}
