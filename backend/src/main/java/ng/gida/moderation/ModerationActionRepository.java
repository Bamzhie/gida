package ng.gida.moderation;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ModerationActionRepository extends JpaRepository<ModerationAction, UUID> {
    List<ModerationAction> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, UUID targetId);

    default ModerationAction record(
            UUID actorId, String action, String targetType, UUID targetId, String reason) {
        return save(new ModerationAction(actorId, action, targetType, targetId, reason));
    }
}
