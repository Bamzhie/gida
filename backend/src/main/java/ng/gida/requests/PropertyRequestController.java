package ng.gida.requests;

import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class PropertyRequestController {

    private final PropertyRequestService requests;

    public PropertyRequestController(PropertyRequestService requests) {
        this.requests = requests;
    }

    @PostMapping("/requests")
    public ResponseEntity<RequestCreated> create(@RequestBody PropertyRequestInput input,
                                                 @AuthenticationPrincipal Jwt jwt) {
        UUID userId = jwt == null ? null : UUID.fromString(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED).body(requests.create(userId, input));
    }

    @GetMapping("/me/requests")
    public PageResponse<PropertyRequestDto> mine(@AuthenticationPrincipal Jwt jwt,
                                                 @RequestParam MultiValueMap<String, String> params) {
        return requests.mine(UUID.fromString(jwt.getSubject()),
                Paging.of(integer(params, "page"), integer(params, "size")));
    }

    private static Integer integer(MultiValueMap<String, String> params, String key) {
        String raw = params.getFirst(key);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Integer.valueOf(raw);
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_paging", key + " must be a number");
        }
    }
}
