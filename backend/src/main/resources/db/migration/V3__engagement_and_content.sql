CREATE TABLE favorites (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, listing_id)
);
CREATE INDEX favorites_user_idx ON favorites (user_id);

CREATE TABLE enquiries (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id    uuid REFERENCES listings (id) ON DELETE CASCADE,
    advertiser_id uuid REFERENCES users (id) ON DELETE CASCADE,
    user_id       uuid REFERENCES users (id) ON DELETE SET NULL,
    action        varchar(16) NOT NULL CHECK (action IN ('CONTACT', 'VIEWING')),
    name          varchar(120) NOT NULL,
    contact       varchar(320) NOT NULL,
    message       text,
    created_at    timestamptz NOT NULL DEFAULT now(),
    CHECK ((listing_id IS NULL) <> (advertiser_id IS NULL))
);
CREATE INDEX enquiries_listing_idx ON enquiries (listing_id);
CREATE INDEX enquiries_advertiser_idx ON enquiries (advertiser_id);
CREATE INDEX enquiries_user_idx ON enquiries (user_id);
CREATE INDEX enquiries_dedupe_idx ON enquiries (contact, COALESCE(listing_id, advertiser_id), created_at DESC);

CREATE TABLE property_requests (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid REFERENCES users (id) ON DELETE SET NULL,
    title         varchar(160) NOT NULL,
    listing_type  varchar(8) NOT NULL CHECK (listing_type IN ('SALE', 'RENT')),
    property_type varchar(16) CHECK (property_type IN
                    ('APARTMENT', 'HOUSE', 'TOWNHOUSE', 'CONDO', 'LAND', 'COMMERCIAL')),
    location_id   uuid REFERENCES locations (id) ON DELETE SET NULL,
    min_price     numeric(14, 2) CHECK (min_price IS NULL OR min_price >= 0),
    max_price     numeric(14, 2),
    bedrooms      smallint CHECK (bedrooms IS NULL OR bedrooms >= 0),
    bathrooms     smallint CHECK (bathrooms IS NULL OR bathrooms >= 0),
    furnished     boolean,
    needed_by     date,
    notes         text,
    name          varchar(120) NOT NULL,
    contact       varchar(320) NOT NULL,
    status        varchar(16) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    CHECK (min_price IS NULL OR max_price IS NULL OR min_price <= max_price)
);
CREATE INDEX property_requests_user_idx ON property_requests (user_id);
CREATE INDEX property_requests_location_idx ON property_requests (location_id);
CREATE INDEX property_requests_open_idx ON property_requests (status, created_at DESC);
CREATE INDEX property_requests_dedupe_idx ON property_requests (contact, lower(title), created_at DESC);

CREATE TABLE property_request_amenities (
    request_id uuid NOT NULL REFERENCES property_requests (id) ON DELETE CASCADE,
    amenity_id uuid NOT NULL REFERENCES amenities (id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, amenity_id)
);

CREATE TABLE content_blocks (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key        varchar(80) NOT NULL UNIQUE,
    title      varchar(200),
    blurb      text,
    payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
    sort_order smallint NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_items (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id   uuid NOT NULL REFERENCES content_blocks (id) ON DELETE CASCADE,
    label      varchar(200) NOT NULL,
    body       text,
    icon_name  varchar(64),
    href       varchar(200),
    payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
    sort_order smallint NOT NULL DEFAULT 0
);
CREATE INDEX content_items_block_idx ON content_items (block_id, sort_order);
