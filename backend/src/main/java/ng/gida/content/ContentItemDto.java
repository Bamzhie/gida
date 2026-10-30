package ng.gida.content;

import java.util.Map;

public record ContentItemDto(
        String label,
        String body,
        String iconName,
        String href,
        Map<String, Object> payload) {
}
