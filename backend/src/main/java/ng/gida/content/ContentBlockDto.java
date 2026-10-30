package ng.gida.content;

import java.util.List;
import java.util.Map;

public record ContentBlockDto(
        String key,
        String title,
        String blurb,
        Map<String, Object> payload,
        List<ContentItemDto> items) {
}
