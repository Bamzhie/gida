package ng.gida.verifications;

import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/listings")
public class VerificationController {
    private final VerificationService service;

    public VerificationController(VerificationService service) {
        this.service = service;
    }

    @GetMapping("/{id}/verification")
    public PublicVerificationDto summary(@PathVariable UUID id) {
        return service.publicSummary(id);
    }
}
