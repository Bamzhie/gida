package ng.gida.media;

import java.util.UUID;

/** One entry of the media reorder request body: {@code [{"id": …, "sortOrder": …}]}. */
public record MediaOrderItem(UUID id, Integer sortOrder) {
}
