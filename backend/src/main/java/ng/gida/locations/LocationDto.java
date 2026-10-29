package ng.gida.locations;

import java.util.UUID;

public record LocationDto(UUID id, String slug, String name, String kind, String parentSlug) {
}
