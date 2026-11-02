package ng.gida.moderation;

import java.util.List;
import ng.gida.listings.ListingDetailDto;

public record AdminListingDetailDto(String lifecycle, ListingDetailDto listing, List<ModerationActionDto> actions) {}
