package ng.gida.verifications;

public record PublicVerificationDto(
        boolean advertiserVerified, boolean propertyVerified, boolean locationVerified, boolean priceVerified) {
}
