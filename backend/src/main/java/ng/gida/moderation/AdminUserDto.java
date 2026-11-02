package ng.gida.moderation;

import java.time.Instant;
import java.util.UUID;

public record
        AdminUserDto(UUID id, String name, String email, String role, String status, Instant createdAt) {}
