package ng.gida.auth;

import java.util.Locale;
import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.users.UserRepository;
import ng.gida.users.UserRow;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final TokenService tokens;
    private final RefreshTokenService refreshTokens;

    public AuthService(UserRepository users, PasswordEncoder encoder, TokenService tokens,
                       RefreshTokenService refreshTokens) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
        this.refreshTokens = refreshTokens;
    }

    @Transactional
    public AuthUser register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken",
                    "An account with that email already exists");
        }
        String role = request.role() == null ? "USER" : request.role();
        String name = request.name().trim();
        UUID id = users.insert(email, encoder.encode(request.password()), name,
                blankToNull(request.phone()), role);
        return new AuthUser(id, name, email, role, null);
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        UserRow user = users.findByEmail(email).orElseThrow(AuthService::invalidCredentials);
        if (!encoder.matches(request.password(), user.passwordHash())) {
            throw invalidCredentials();
        }
        if (!"ACTIVE".equals(user.status())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "account_suspended", "This account is suspended");
        }
        RefreshTokenService.Issued refresh = refreshTokens.issue(user.id());
        AuthUser authUser = users.findAuthUser(user.id())
                .orElseGet(() -> new AuthUser(user.id(), user.name(), user.email(), user.role(), null));
        return new LoginResponse(tokens.issueAccessToken(user.id(), user.role()),
                TokenService.ACCESS_TTL.toSeconds(),
                refresh.token(), RefreshTokenService.REFRESH_TTL.toSeconds(),
                authUser);
    }

    public RefreshResponse refresh(String presented) {
        RefreshTokenService.Issued rotated = refreshTokens.rotate(presented);
        String role = users.findAuthUser(rotated.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "invalid_refresh_token", "Refresh token is not valid"))
                .role();
        return new RefreshResponse(tokens.issueAccessToken(rotated.userId(), role),
                TokenService.ACCESS_TTL.toSeconds(),
                rotated.token(), RefreshTokenService.REFRESH_TTL.toSeconds());
    }

    public void logout(String presented) {
        refreshTokens.revoke(presented);
    }

    public AuthUser me(UUID userId) {
        return users.findAuthUser(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found", "User no longer exists"));
    }

    private static ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials", "Email or password is incorrect");
    }

    static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
