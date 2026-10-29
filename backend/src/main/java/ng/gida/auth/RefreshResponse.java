package ng.gida.auth;

public record RefreshResponse(String accessToken, long expiresIn,
                              String refreshToken, long refreshTokenExpiresIn) {
}
