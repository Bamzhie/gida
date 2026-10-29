package ng.gida.auth;

public record LoginResponse(String accessToken, long expiresIn, AuthUser user) {
}
