package ng.gida;

import java.util.Map;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/_test")
class TestController {

    @GetMapping("/boom")
    Map<String, String> boom() {
        throw new ApiException(HttpStatus.CONFLICT, "email_taken", "An account already exists");
    }

    record Probe(@jakarta.validation.constraints.NotBlank String email) {
    }

    @org.springframework.web.bind.annotation.PostMapping("/validate")
    Map<String, String> validate(@jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody Probe probe) {
        return Map.of();
    }
}
