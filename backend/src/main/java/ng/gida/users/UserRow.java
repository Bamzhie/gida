package ng.gida.users;

import java.util.UUID;

public record UserRow(UUID id, String email, String passwordHash, String name,
                      String phone, String role, String status) {
}
