CREATE TABLE reports (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    reason      varchar(20) NOT NULL CHECK (reason IN (
                  'FRAUD','WRONG_PRICE','UNAVAILABLE','DUPLICATE','OFFENSIVE','OTHER')),
    details     text,
    status      varchar(12) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','RESOLVED','DISMISSED')),
    resolved_by uuid REFERENCES users (id) ON DELETE SET NULL,
    resolved_at timestamptz,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX reports_one_open_per_user_idx
    ON reports (listing_id, reporter_id) WHERE status = 'OPEN';
CREATE INDEX reports_status_idx ON reports (status, created_at DESC);

CREATE TABLE verifications (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type varchar(10) NOT NULL CHECK (subject_type IN ('LISTING','ADVERTISER')),
    subject_id   uuid NOT NULL,
    dimension    varchar(24) NOT NULL CHECK (dimension IN (
                   'IDENTITY','BUSINESS','REGULATORY','PROPERTY_EXISTENCE','LOCATION',
                   'AUTHORITY','PRICE','AVAILABILITY','MEDIA_FRESHNESS')),
    state        varchar(12) NOT NULL CHECK (state IN ('UNVERIFIED','PENDING','VERIFIED','FAILED')),
    evidence_ref text,
    notes        text,
    reviewer_id  uuid REFERENCES users (id) ON DELETE SET NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now(),
    UNIQUE (subject_type, subject_id, dimension)
);
CREATE INDEX verifications_subject_idx ON verifications (subject_type, subject_id);
