package ng.gida.auth;

import java.util.UUID;

public record AuthUser(UUID id, String name, String email, String role, String agencyName) {
}
