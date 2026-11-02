package ng.gida.advertisers;

public record AdvertiserCardDto(
        java.util.UUID id,
        String name,
        String agencyName,
        String bio,
        String phone,
        long listingCount,
        boolean verified) {
}
