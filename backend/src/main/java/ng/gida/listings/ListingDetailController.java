package ng.gida.listings;

import java.util.List;
import java.util.UUID;
import ng.gida.search.ListingSearchRepository;
import ng.gida.search.ListingSummaryDto;
import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/listings")
public class ListingDetailController {

    private final ListingDetailRepository details;
    private final ListingSearchRepository search;

    public ListingDetailController(ListingDetailRepository details, ListingSearchRepository search) {
        this.details = details;
        this.search = search;
    }

    @GetMapping("/{id}")
    public ListingDetailDto detail(@PathVariable UUID id) {
        return details.find(id).orElseThrow(ListingDetailController::notFound);
    }

    @GetMapping("/{id}/similar")
    public List<ListingSummaryDto> similar(@PathVariable UUID id,
                                           @RequestParam(required = false) Integer limit) {
        ListingDetailDto detail = details.find(id).orElseThrow(ListingDetailController::notFound);
        int resolved = limit == null ? 3 : limit;
        if (resolved < 1 || resolved > 10) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_limit", "limit must be between 1 and 10");
        }
        return search.similar(detail.id(), detail.area(), detail.propertyType(),
                detail.listingType(), detail.price(), resolved);
    }

    private static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, "listing_not_found", "Listing not found");
    }
}
