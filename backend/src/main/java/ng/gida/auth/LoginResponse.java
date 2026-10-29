package ng.gida.auth;

public record LoginResponse(String accessToken, long expiresIn,
                            String refreshToken, long refreshTokenExpiresIn, AuthUser user) {
}
