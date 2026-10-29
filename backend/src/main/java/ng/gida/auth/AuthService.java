package ng.gida.auth;

import java.util.Locale;
import java.util.UUID;
import ng.gida.shared.ApiException;
import ng.gida.users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AuthService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
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

    static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
