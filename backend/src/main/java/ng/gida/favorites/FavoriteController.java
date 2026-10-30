package ng.gida.favorites;

import java.util.UUID;
import ng.gida.search.ListingSearchRepository;
import ng.gida.search.ListingSummaryDto;
import ng.gida.shared.ApiException;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me/favorites")
public class FavoriteController {

    private final FavoriteRepository favorites;
    private final ListingSearchRepository search;

    public FavoriteController(FavoriteRepository favorites, ListingSearchRepository search) {
        this.favorites = favorites;
        this.search = search;
    }

    @GetMapping
    public PageResponse<ListingSummaryDto> list(@AuthenticationPrincipal Jwt jwt,
                                                @RequestParam MultiValueMap<String, String> params) {
        Paging paging = Paging.of(integer(params, "page"), integer(params, "size"));
        return search.favorites(userId(jwt), paging);
    }

    @PutMapping("/{listingId}")
    public ResponseEntity<Void> add(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID listingId) {
        favorites.requireVisibleListing(listingId);
        favorites.add(userId(jwt), listingId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{listingId}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID listingId) {
        favorites.remove(userId(jwt), listingId);
        return ResponseEntity.noContent().build();
    }

    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
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
