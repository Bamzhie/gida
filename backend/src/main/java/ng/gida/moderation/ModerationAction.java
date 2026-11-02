package ng.gida.moderation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "moderation_actions")
public class ModerationAction {
    @Id
    private UUID id;
    @Column(name = "actor_id", nullable = false)
    private UUID actorId;
    @Column(nullable = false, length = 32)
    private String action;
    @Column(name = "target_type", nullable = false, length = 16)
    private String targetType;
    @Column(name = "target_id", nullable = false)
    private UUID targetId;
    @Column(columnDefinition = "text")
    private String reason;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected ModerationAction() {
    }

    public ModerationAction(UUID actorId, String action, String targetType, UUID targetId, String reason) {
        this.id = UUID.randomUUID();
        this.actorId = actorId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.reason = reason;
    }

    @PrePersist
    void timestamp() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public UUID getActorId() {
        return actorId;
    }

    public String getAction() {
        return action;
    }

    public String getTargetType() {
        return targetType;
    }

    public UUID getTargetId() {
        return targetId;
    }

    public String getReason() {
        return reason;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
