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

    public AuthService(UserRepository users, PasswordEncoder encoder, TokenService tokens) {
        this.users = users;
        this.encoder = encoder;
        this.tokens = tokens;
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
        String token = tokens.issueAccessToken(user.id(), user.role());
        return new LoginResponse(token, TokenService.ACCESS_TTL.toSeconds(),
                new AuthUser(user.id(), user.name(), user.email(), user.role(), null));
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
