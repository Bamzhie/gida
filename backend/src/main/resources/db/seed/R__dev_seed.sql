DELETE FROM refresh_tokens;
DELETE FROM listing_costs;
DELETE FROM listing_media;
DELETE FROM property_amenities;
DELETE FROM listings;
DELETE FROM properties;
DELETE FROM advertiser_profiles;
DELETE FROM amenities;
DELETE FROM locations;
DELETE FROM users;

INSERT INTO locations (id, parent_id, kind, name, slug) VALUES
    ('10000000-0000-0000-0000-000000000001', NULL,                                   'STATE', 'Lagos',            'lagos'),
    ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'LGA',   'Eti-Osa',          'eti-osa'),
    ('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'LGA',   'Lagos Mainland',   'lagos-mainland'),
    ('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'LGA',   'Ikeja',            'ikeja'),
    ('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'LGA',   'Kosofe',           'kosofe'),
    ('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'AREA',  'Lekki Phase 1',    'lekki-phase-1'),
    ('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'AREA',  'Victoria Island',  'victoria-island'),
    ('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'AREA',  'Ikoyi',            'ikoyi'),
    ('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000008', 'ESTATE','Old Ikoyi',        'old-ikoyi'),
    ('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'AREA',  'Oniru',            'oniru'),
    ('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'AREA',  'Ajah',             'ajah'),
    ('10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'AREA',  'Yaba',             'yaba'),
    ('10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 'AREA',  'Gbagada',          'gbagada'),
    ('10000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004', 'AREA',  'Ikeja GRA',        'ikeja-gra');

INSERT INTO amenities (slug, label) VALUES
    ('parking',        'Parking'),
    ('24-7-security',  '24/7 security'),
    ('generator',      'Generator'),
    ('borehole-water', 'Borehole / water supply'),
    ('estate-gated',   'Estate / gated community'),
    ('pool',           'Swimming pool');

INSERT INTO users (id, email, password_hash, name, phone, role) VALUES
    ('20000000-0000-0000-0000-000000000001', 'adebayo@gida.local', crypt('GidaLocal2026!', gen_salt('bf', 12)), 'Adebayo Ogundele', '0803 000 0001', 'AGENT'),
    ('20000000-0000-0000-0000-000000000002', 'ngozi@gida.local',   crypt('GidaLocal2026!', gen_salt('bf', 12)), 'Ngozi Eze',        '0803 000 0002', 'AGENT'),
    ('20000000-0000-0000-0000-000000000003', 'tunde@gida.local',   crypt('GidaLocal2026!', gen_salt('bf', 12)), 'Tunde Bakare',     '0803 000 0003', 'AGENT'),
    ('20000000-0000-0000-0000-000000000004', 'funmi@gida.local',   crypt('GidaLocal2026!', gen_salt('bf', 12)), 'Funmi Adeyemi',    '0803 000 0004', 'AGENT'),
    ('20000000-0000-0000-0000-000000000005', 'chinedu@gida.local', crypt('GidaLocal2026!', gen_salt('bf', 12)), 'Chinedu Nwosu',    '0803 000 0005', 'AGENT'),
    ('20000000-0000-0000-0000-000000000006', 'aisha@gida.local',   crypt('GidaLocal2026!', gen_salt('bf', 12)), 'Aisha Bello',      '0803 000 0006', 'AGENT');

INSERT INTO advertiser_profiles (id, user_id, agency_name, bio, contact_phone) VALUES
    ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Harcourt Court Properties', 'A Lagos property consultant focused on serviced apartments, short-let homes and well-placed residential listings.', '0803 000 0001'),
    ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Lekki Homes Ltd',           'Helping families find practical homes and estates across the Lekki corridor.',                                '0803 000 0002'),
    ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Mainland Realty',           'Covering mainland Lagos homes, student accommodation and affordable rental options.',                        '0803 000 0003'),
    ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000004', 'Ikoyi Reserve',             'A specialist in premium Ikoyi and Victoria Island homes, including penthouses and luxury rentals.',            '0803 000 0004'),
    ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', 'Gbagada Estates',           'A local consultant for terraces, bungalows and homes around Gbagada and Magodo.',                             '0803 000 0005'),
    ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000006', 'Yaba Living',               'Helping renters and buyers find studio flats and new-build homes on the mainland.',                          '0803 000 0006');

INSERT INTO properties
    (id, location_id, address_line, property_type, bedrooms, bathrooms, lot_size_sqm,
     parking, furnished, geom) VALUES
    ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', NULL, 'APARTMENT', 2,    2,    NULL, 1, false, ST_SetSRID(ST_MakePoint(3.4356, 6.4385), 4326)),
    ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000014', NULL, 'HOUSE',     4,    5,    NULL, 3, false, ST_SetSRID(ST_MakePoint(3.3421, 6.5965), 4326)),
    ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000012', NULL, 'APARTMENT', 1,    1,    NULL, 0, false, ST_SetSRID(ST_MakePoint(3.3712, 6.5158), 4326)),
    ('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000013', NULL, 'HOUSE',     3,    4,    NULL, 2, false, ST_SetSRID(ST_MakePoint(3.3889, 6.5536), 4326)),
    ('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000007', NULL, 'APARTMENT', 3,    3,    NULL, 2, true,  ST_SetSRID(ST_MakePoint(3.4219, 6.4281), 4326)),
    ('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000008', NULL, 'HOUSE',     5,    6,    NULL, 4, true,  ST_SetSRID(ST_MakePoint(3.4453, 6.4531), 4326)),
    ('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000011', NULL, 'LAND',      NULL, NULL, 300,  0, false, ST_SetSRID(ST_MakePoint(3.5852, 6.4676), 4326)),
    ('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000010', NULL, 'APARTMENT', 2,    3,    NULL, 1, false, ST_SetSRID(ST_MakePoint(3.4458, 6.4358), 4326)),
    ('40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', NULL, 'APARTMENT', 1,    1,    NULL, 1, true,  ST_SetSRID(ST_MakePoint(3.4316, 6.4478), 4326));

INSERT INTO listings
    (id, property_id, advertiser_id, title, description, listing_type, category, price,
     price_period, lifecycle, availability, published_at, confirmed_at) VALUES
    ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
     '2 bedroom flat, Lekki Phase 1',
     'A bright, comfortable apartment in a convenient Lekki location with room for a small family and easy access to major roads.',
     'RENT', 'STANDARD', 3500000.00, 'YEAR', 'PUBLISHED', 'AVAILABLE', '2026-09-20T09:00:00Z', '2026-09-21T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002',
     '4 bedroom detached house, Ikeja GRA',
     'A spacious detached home with generous living areas, a useful floor plan and a central location for established Lagos households.',
     'SALE', 'STANDARD', 45000000.00, NULL, 'PUBLISHED', 'AVAILABLE', '2026-09-18T09:00:00Z', '2026-09-19T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003',
     'Self contain, Yaba',
     'A compact self-contained home with straightforward access to transport, work areas and everyday amenities in Yaba.',
     'RENT', 'STANDARD', 1200000.00, 'YEAR', 'PUBLISHED', 'AVAILABLE', '2026-09-17T09:00:00Z', '2026-09-10T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000005',
     '3 bedroom terrace, Gbagada',
     'A newly completed terrace in a fresh Gbagada development, with flexible living space and a useful address close to local services and transport.',
     'SALE', 'NEW_HOMES', 28000000.00, NULL, 'PUBLISHED', 'AVAILABLE', '2026-09-16T09:00:00Z', '2026-09-18T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001',
     '3 bedroom apartment, Victoria Island',
     'A furnished, serviced apartment available for short-let stays and annual rent, with a central island location and generous bedroom and bathroom count for a comfortable city home.',
     'RENT', 'SHORTLET', 6000000.00, 'YEAR', 'PUBLISHED', 'AVAILABLE', '2026-09-15T09:00:00Z', '2026-09-16T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000004',
     '5 bedroom duplex, Ikoyi',
     'A recently built five-bedroom duplex in a new gated Ikoyi development, with a substantial layout, strong access and a high-privacy setting.',
     'SALE', 'NEW_HOMES', 250000000.00, NULL, 'PUBLISHED', 'AVAILABLE', '2026-09-12T09:00:00Z', '2026-09-14T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000006',
     'Plot of land, Ajah',
     'A land opportunity in a growing corridor with a documented title and development potential for the right buyer.',
     'SALE', 'STANDARD', 18000000.00, NULL, 'PUBLISHED', 'AVAILABLE', '2026-09-11T09:00:00Z', '2026-09-13T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001',
     '2 bedroom flat, Oniru',
     'A neat two-bedroom apartment with a practical layout and convenient access to the Victoria Island side of Lagos.',
     'RENT', 'STANDARD', 4200000.00, 'YEAR', 'PUBLISHED', 'AVAILABLE', '2026-09-10T09:00:00Z', '2026-09-12T09:00:00Z'),
    ('50000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004',
     'Furnished 1 bedroom short let, Old Ikoyi',
     'A fully furnished one-bedroom apartment available for short-let stays, with housekeeping, reliable power and easy access to Ikoyi and Victoria Island.',
     'RENT', 'SHORTLET', 4500000.00, 'YEAR', 'PUBLISHED', 'AVAILABLE', '2026-09-22T09:00:00Z', '2026-09-22T09:00:00Z');

INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000001', id FROM amenities
WHERE slug IN ('parking', '24-7-security', 'generator');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000002', id FROM amenities
WHERE slug IN ('parking', '24-7-security', 'borehole-water', 'estate-gated');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000003', id FROM amenities
WHERE slug IN ('24-7-security', 'borehole-water');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000004', id FROM amenities
WHERE slug IN ('parking', '24-7-security', 'generator');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000005', id FROM amenities
WHERE slug IN ('parking', '24-7-security', 'generator', 'pool');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000006', id FROM amenities
WHERE slug IN ('parking', '24-7-security', 'generator', 'estate-gated', 'pool');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000007', id FROM amenities
WHERE slug IN ('24-7-security');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000008', id FROM amenities
WHERE slug IN ('parking', '24-7-security', 'generator');
INSERT INTO property_amenities (property_id, amenity_id)
SELECT '40000000-0000-0000-0000-000000000009', id FROM amenities
WHERE slug IN ('parking', '24-7-security', 'generator', 'borehole-water', 'pool');

INSERT INTO listing_costs (listing_id, cost_type, amount) VALUES
    ('50000000-0000-0000-0000-000000000001', 'AGENCY_FEE',     350000.00),
    ('50000000-0000-0000-0000-000000000001', 'LEGAL_FEE',      175000.00),
    ('50000000-0000-0000-0000-000000000001', 'CAUTION',        300000.00),
    ('50000000-0000-0000-0000-000000000001', 'SERVICE_CHARGE', 250000.00),
    ('50000000-0000-0000-0000-000000000002', 'LEGAL_FEE',     2250000.00),
    ('50000000-0000-0000-0000-000000000002', 'AGENCY_FEE',    2250000.00),
    ('50000000-0000-0000-0000-000000000002', 'OTHER',         1000000.00),
    ('50000000-0000-0000-0000-000000000003', 'AGENCY_FEE',     120000.00),
    ('50000000-0000-0000-0000-000000000003', 'CAUTION',        100000.00),
    ('50000000-0000-0000-0000-000000000004', 'LEGAL_FEE',     1400000.00),
    ('50000000-0000-0000-0000-000000000004', 'AGENCY_FEE',    1400000.00),
    ('50000000-0000-0000-0000-000000000005', 'AGENCY_FEE',     600000.00),
    ('50000000-0000-0000-0000-000000000005', 'LEGAL_FEE',      300000.00),
    ('50000000-0000-0000-0000-000000000005', 'CAUTION',        500000.00),
    ('50000000-0000-0000-0000-000000000005', 'SERVICE_CHARGE', 400000.00),
    ('50000000-0000-0000-0000-000000000006', 'LEGAL_FEE',    12500000.00),
    ('50000000-0000-0000-0000-000000000006', 'AGENCY_FEE',   12500000.00),
    ('50000000-0000-0000-0000-000000000008', 'AGENCY_FEE',     420000.00),
    ('50000000-0000-0000-0000-000000000008', 'CAUTION',        400000.00),
    ('50000000-0000-0000-0000-000000000009', 'AGENCY_FEE',     450000.00),
    ('50000000-0000-0000-0000-000000000009', 'CAUTION',        300000.00),
    ('50000000-0000-0000-0000-000000000009', 'SERVICE_CHARGE', 500000.00);
