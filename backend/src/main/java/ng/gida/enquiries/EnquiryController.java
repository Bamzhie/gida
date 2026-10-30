package ng.gida.enquiries;

import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
public class EnquiryController {

    private final EnquiryService enquiries;

    public EnquiryController(EnquiryService enquiries) {
        this.enquiries = enquiries;
    }

    @PostMapping("/enquiries")
    public ResponseEntity<EnquiryCreated> create(@RequestBody EnquiryRequest request,
                                                @AuthenticationPrincipal Jwt jwt) {
        UUID userId = jwt == null ? null : UUID.fromString(jwt.getSubject());
        return ResponseEntity.status(201).body(enquiries.create(userId, request));
    }

    @GetMapping("/me/enquiries")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public PageResponse<EnquiryDto> inbox(@AuthenticationPrincipal Jwt jwt,
                                          @RequestParam MultiValueMap<String, String> params) {
        Integer page = integer(params, "page");
        Integer size = integer(params, "size");
        return enquiries.inbox(UUID.fromString(jwt.getSubject()), Paging.of(page, size));
    }

    private static Integer integer(MultiValueMap<String, String> params, String key) {
        String raw = params.getFirst(key);
        if (raw == null || raw.isBlank()) return null;
        try {
            return Integer.valueOf(raw);
        } catch (NumberFormatException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_paging", key + " must be a number");
        }
    }
}
