package ng.gida.search;

import ng.gida.shared.PageResponse;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ListingSearchController {

    private final ListingSearchRepository search;

    public ListingSearchController(ListingSearchRepository search) {
        this.search = search;
    }

    @GetMapping("/listings")
    public PageResponse<ListingSummaryDto> search(@RequestParam MultiValueMap<String, String> params) {
        return search.search(SearchParams.parse(params));
    }
}
