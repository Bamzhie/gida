package ng.gida.advertisers;

import ng.gida.shared.ApiException;
import ng.gida.shared.PageResponse;
import ng.gida.shared.Paging;
import org.springframework.http.HttpStatus;
import java.util.UUID;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class AdvertiserDirectoryController {

    private final AdvertiserDirectoryRepository directory;

    public AdvertiserDirectoryController(AdvertiserDirectoryRepository directory) {
        this.directory = directory;
    }

    @GetMapping("/advertisers")
    public PageResponse<AdvertiserCardDto> search(@RequestParam MultiValueMap<String, String> params) {
        Paging paging = Paging.of(integer(params, "page"), integer(params, "size"));
        return directory.search(single(params, "q"), single(params, "location"), paging);
    }

    @GetMapping("/advertisers/{advertiserId}")
    public AdvertiserProfilePageDto profile(@org.springframework.web.bind.annotation.PathVariable UUID advertiserId) {
        return directory.findProfile(advertiserId).orElseThrow(() ->
                new ApiException(HttpStatus.NOT_FOUND, "advertiser_not_found", "That advertiser is not listed"));
    }

    private static String single(MultiValueMap<String, String> params, String key) {
        String raw = params.getFirst(key);
        return raw == null || raw.isBlank() ? null : raw.trim();
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
