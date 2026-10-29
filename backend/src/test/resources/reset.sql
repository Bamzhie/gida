TRUNCATE refresh_tokens, listing_costs, listing_media, property_amenities, listings,
         properties, advertiser_profiles, amenities, locations, users
    RESTART IDENTITY CASCADE;

INSERT INTO locations (id, parent_id, kind, name, slug) VALUES
    ('11111111-1111-1111-1111-111111111111', NULL, 'STATE', 'Lagos', 'lagos'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'LGA', 'Eti-Osa', 'eti-osa'),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'AREA', 'Lekki Phase 1', 'lekki-phase-1'),
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'LGA', 'Ikeja', 'ikeja');

INSERT INTO amenities (slug, label) VALUES
    ('borehole-water', 'Borehole / water supply'),
    ('24-7-security', '24/7 security'),
    ('parking', 'Parking');
