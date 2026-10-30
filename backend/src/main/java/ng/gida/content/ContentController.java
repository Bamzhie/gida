package ng.gida.content;

import ng.gida.shared.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/content")
public class ContentController {

    private final ContentRepository content;

    public ContentController(ContentRepository content) {
        this.content = content;
    }

    @GetMapping("/{key}")
    public ContentBlockDto block(@PathVariable String key) {
        return content.find(key).orElseThrow(() -> new ApiException(
                HttpStatus.NOT_FOUND, "content_not_found", "That content block is not published."));
    }
}
