CREATE TABLE users (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email             varchar(320) NOT NULL,
    password_hash     varchar(100) NOT NULL,
    name              varchar(120) NOT NULL,
    phone             varchar(40),
    role              varchar(20) NOT NULL DEFAULT 'USER'
                      CHECK (role IN ('USER', 'AGENT', 'ADMIN')),
    status            varchar(20) NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    email_verified_at timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email));

CREATE TABLE refresh_tokens (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash  char(64) NOT NULL UNIQUE,
    family_id   uuid NOT NULL,
    issued_at   timestamptz NOT NULL DEFAULT now(),
    expires_at  timestamptz NOT NULL,
    revoked_at  timestamptz,
    replaced_by uuid REFERENCES refresh_tokens (id) ON DELETE SET NULL
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id);

CREATE TABLE advertiser_profiles (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    agency_name   varchar(160),
    bio           text,
    contact_phone varchar(40),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE locations (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id  uuid REFERENCES locations (id) ON DELETE RESTRICT,
    kind       varchar(16) NOT NULL
               CHECK (kind IN ('STATE', 'LGA', 'AREA', 'ESTATE', 'LANDMARK')),
    name       varchar(120) NOT NULL,
    slug       varchar(160) NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX locations_parent_idx ON locations (parent_id);
CREATE INDEX locations_name_trgm_idx ON locations USING GIN (name gin_trgm_ops);

CREATE TABLE amenities (
    id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug  varchar(80) NOT NULL UNIQUE,
    label varchar(120) NOT NULL
);

CREATE TABLE properties (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id   uuid NOT NULL REFERENCES locations (id) ON DELETE RESTRICT,
    address_line  varchar(255),
    property_type varchar(20) NOT NULL
                  CHECK (property_type IN ('APARTMENT', 'HOUSE', 'TOWNHOUSE', 'CONDO', 'LAND', 'COMMERCIAL')),
    bedrooms      int CHECK (bedrooms >= 0),
    bathrooms     int CHECK (bathrooms >= 0),
    size_sqm      numeric(10, 2) CHECK (size_sqm > 0),
    lot_size_sqm  numeric(12, 2) CHECK (lot_size_sqm > 0),
    year_built    int CHECK (year_built BETWEEN 1500 AND 2100),
    parking       int CHECK (parking >= 0),
    furnished     boolean NOT NULL DEFAULT false,
    geom          geometry(Point, 4326),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_geom_idx ON properties USING GIST (geom);
CREATE INDEX properties_location_idx ON properties (location_id);
CREATE INDEX properties_type_idx ON properties (property_type);
CREATE INDEX properties_bedrooms_idx ON properties (bedrooms);
CREATE INDEX properties_address_trgm_idx ON properties USING GIN (address_line gin_trgm_ops);

CREATE TABLE property_amenities (
    property_id uuid NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
    amenity_id  uuid NOT NULL REFERENCES amenities (id) ON DELETE CASCADE,
    PRIMARY KEY (property_id, amenity_id)
);

CREATE TABLE listings (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id   uuid NOT NULL REFERENCES properties (id) ON DELETE RESTRICT,
    advertiser_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    title         varchar(200) NOT NULL,
    description   text NOT NULL,
    listing_type  varchar(8) NOT NULL CHECK (listing_type IN ('SALE', 'RENT')),
    category      varchar(16) NOT NULL DEFAULT 'STANDARD'
                  CHECK (category IN ('STANDARD', 'NEW_HOMES', 'SHORTLET')),
    price         numeric(14, 2) NOT NULL CHECK (price >= 0),
    price_period  varchar(8) CHECK (price_period IN ('YEAR', 'MONTH', 'NIGHT', 'STAY')),
    lifecycle     varchar(16) NOT NULL DEFAULT 'DRAFT'
                  CHECK (lifecycle IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'PUBLISHED', 'PAUSED', 'EXPIRED', 'REJECTED')),
    availability  varchar(12) NOT NULL DEFAULT 'AVAILABLE'
                  CHECK (availability IN ('AVAILABLE', 'PENDING', 'SOLD', 'RENTED')),
    published_at  timestamptz,
    confirmed_at  timestamptz,
    expires_at    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now(),
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english'::regconfig, title), 'A') ||
        setweight(to_tsvector('english'::regconfig, description), 'B')
    ) STORED,
    CONSTRAINT listings_price_period_chk CHECK (
        (listing_type = 'SALE' AND price_period IS NULL) OR
        (listing_type = 'RENT' AND price_period IS NOT NULL)
    )
);
CREATE INDEX listings_lifecycle_idx ON listings (lifecycle, availability);
CREATE INDEX listings_type_category_idx ON listings (listing_type, category);
CREATE INDEX listings_price_idx ON listings (price);
CREATE INDEX listings_published_idx ON listings (published_at);
CREATE INDEX listings_confirmed_idx ON listings (confirmed_at);
CREATE INDEX listings_expires_idx ON listings (expires_at);
CREATE INDEX listings_search_idx ON listings USING GIN (search_vector);
CREATE INDEX listings_property_idx ON listings (property_id);
CREATE INDEX listings_advertiser_idx ON listings (advertiser_id);

CREATE TABLE listing_costs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id   uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    cost_type    varchar(20) NOT NULL
                 CHECK (cost_type IN ('AGENCY_FEE', 'LEGAL_FEE', 'SERVICE_CHARGE', 'CAUTION', 'OTHER')),
    amount       numeric(14, 2) NOT NULL CHECK (amount >= 0),
    disclosed_at timestamptz NOT NULL DEFAULT now(),
    note         varchar(255),
    UNIQUE (listing_id, cost_type)
);

CREATE TABLE listing_media (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL REFERENCES listings (id) ON DELETE CASCADE,
    url        varchar(2048) NOT NULL,
    caption    varchar(255),
    kind       varchar(12) NOT NULL DEFAULT 'PHOTO'
               CHECK (kind IN ('PHOTO', 'VIDEO', 'FLOOR_PLAN')),
    sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX listing_media_listing_idx ON listing_media (listing_id, sort_order);
