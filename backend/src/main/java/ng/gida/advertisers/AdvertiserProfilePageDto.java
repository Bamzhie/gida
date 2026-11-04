package ng.gida.advertisers;

import java.util.UUID;

public record AdvertiserProfilePageDto(
        UUID id,
        String name,
        String agencyName,
        String bio,
        String phone,
        long listingCount,
        boolean verified) {
}
