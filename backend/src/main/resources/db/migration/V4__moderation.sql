ALTER TABLE listings DROP CONSTRAINT listings_lifecycle_check;
ALTER TABLE listings ADD CONSTRAINT listings_lifecycle_check
    CHECK (lifecycle IN ('DRAFT','SUBMITTED','UNDER_REVIEW','PUBLISHED',
                         'PAUSED','EXPIRED','REJECTED','SUSPENDED'));
ALTER TABLE listings ADD COLUMN submitted_at timestamptz;
CREATE INDEX listings_submitted_idx ON listings (submitted_at);

CREATE TABLE moderation_actions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    action      varchar(32) NOT NULL CHECK (action IN (
                  'APPROVE','REJECT','REQUEST_CORRECTIONS','SUSPEND_LISTING',
                  'REINSTATE_LISTING','FLAG_STALE','SUSPEND_USER','REINSTATE_USER',
                  'RESOLVE_REPORT','DISMISS_REPORT','VERIFY')),
    target_type varchar(16) NOT NULL CHECK (target_type IN ('LISTING','USER','REPORT')),
    target_id   uuid NOT NULL,
    reason      text,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_actions_target_idx ON moderation_actions (target_type, target_id, created_at DESC);
CREATE INDEX moderation_actions_actor_idx  ON moderation_actions (actor_id, created_at DESC);

CREATE FUNCTION moderation_actions_append_only() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'moderation_actions is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moderation_actions_no_rewrite
    BEFORE UPDATE OR DELETE ON moderation_actions
    FOR EACH ROW EXECUTE FUNCTION moderation_actions_append_only();
