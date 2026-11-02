package ng.gida.moderation;

import java.time.Instant;
import java.util.UUID;

public record ModerationActionDto(UUID id, String action, String targetType, UUID targetId, UUID actorId,
        String actorName, String reason, Instant createdAt) {}
