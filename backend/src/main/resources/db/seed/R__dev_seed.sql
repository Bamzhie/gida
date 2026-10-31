DELETE FROM favorites;
DELETE FROM enquiries;
DELETE FROM property_request_amenities;
DELETE FROM property_requests;
DELETE FROM content_items;
DELETE FROM content_blocks;
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
    ('20000000-0000-0000-0000-000000000001', 'adebayo@gida.local', '$2a$12$MAtilXls8srtJncqOgMDMOna8PNlEPHgVwamAG1nporlU1vGpYp1q', 'Adebayo Ogundele', '0803 000 0001', 'AGENT'),
    ('20000000-0000-0000-0000-000000000002', 'ngozi@gida.local',   '$2a$12$MAtilXls8srtJncqOgMDMOna8PNlEPHgVwamAG1nporlU1vGpYp1q', 'Ngozi Eze',        '0803 000 0002', 'AGENT'),
    ('20000000-0000-0000-0000-000000000003', 'tunde@gida.local',   '$2a$12$MAtilXls8srtJncqOgMDMOna8PNlEPHgVwamAG1nporlU1vGpYp1q', 'Tunde Bakare',     '0803 000 0003', 'AGENT'),
    ('20000000-0000-0000-0000-000000000004', 'funmi@gida.local',   '$2a$12$MAtilXls8srtJncqOgMDMOna8PNlEPHgVwamAG1nporlU1vGpYp1q', 'Funmi Adeyemi',    '0803 000 0004', 'AGENT'),
    ('20000000-0000-0000-0000-000000000005', 'chinedu@gida.local', '$2a$12$MAtilXls8srtJncqOgMDMOna8PNlEPHgVwamAG1nporlU1vGpYp1q', 'Chinedu Nwosu',    '0803 000 0005', 'AGENT'),
    ('20000000-0000-0000-0000-000000000006', 'aisha@gida.local',   '$2a$12$MAtilXls8srtJncqOgMDMOna8PNlEPHgVwamAG1nporlU1vGpYp1q', 'Aisha Bello',      '0803 000 0006', 'AGENT');

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

INSERT INTO enquiries (id, listing_id, advertiser_id, user_id, action, name, contact, message, created_at) VALUES
    ('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', NULL, NULL,
     'VIEWING', 'Chidinma Okoro', 'chidinma@example.com',
     'Can I view this on a Saturday morning?', now() - interval '2 hours'),
    ('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', NULL, NULL,
     'CONTACT', 'Tunde Bakare', '+234 802 333 4444',
     'Is the service charge included in the asking price?', now() - interval '26 hours'),
    ('80000000-0000-0000-0000-000000000003', NULL, '20000000-0000-0000-0000-000000000003', NULL,
     'CONTACT', 'Ngozi Adele', 'ngozi@example.com',
     'Do you have anything similar on the mainland under ₦2m?', now() - interval '3 days');

INSERT INTO property_requests (id, user_id, title, listing_type, property_type, location_id,
                               min_price, max_price, bedrooms, bathrooms, furnished, needed_by,
                               notes, name, contact, status, created_at)
SELECT '90000000-0000-0000-0000-000000000001', NULL,
       'Two-bedroom flat in Lekki, ready before December', 'RENT', 'APARTMENT',
       (SELECT id FROM locations WHERE slug = 'lekki-phase-1'),
       3000000, 6000000, 2, 2, NULL, DATE '2026-12-01',
       'Close to the office, ready to move in before the holidays.',
       'Chidinma Okoro', 'chidinma@example.com', 'OPEN', now() - interval '4 days';

INSERT INTO property_requests (id, user_id, title, listing_type, property_type, location_id,
                               min_price, max_price, bedrooms, bathrooms, furnished, needed_by,
                               notes, name, contact, status, created_at)
SELECT '90000000-0000-0000-0000-000000000002', NULL,
       'Secure apartment in Yaba under ₦1.5m', 'RENT', NULL,
       (SELECT id FROM locations WHERE slug = 'yaba'),
       NULL, 1500000, 1, 1, NULL, NULL,
       'Needs reliable power and a borehole.',
       'Tunde Bakare', '+234 802 333 4444', 'OPEN', now() - interval '11 days';

INSERT INTO property_request_amenities (request_id, amenity_id)
SELECT '90000000-0000-0000-0000-000000000001'::uuid, id FROM amenities WHERE slug IN ('24-7-security', 'parking')
UNION ALL
SELECT '90000000-0000-0000-0000-000000000002'::uuid, id FROM amenities WHERE slug = 'borehole-water';

INSERT INTO content_blocks (key, title, blurb, payload, sort_order) VALUES
    ('trust_points',     'What you can see before you call', NULL, '{}'::jsonb, 1),
    ('audience_paths',   NULL, NULL, '{}'::jsonb, 2),
    ('landlord_paths',   NULL, NULL, '{}'::jsonb, 3),
    ('category_groups',  NULL, NULL,
     '{"groups":[{"listingType":"RENT","title":"For rent","icon":"key-round","blurb":"Explore homes by listing type, compare disclosed costs and see when details were last confirmed."},{"listingType":"SALE","title":"For sale","icon":"tag","blurb":"Homes to buy, plus land and commercial property."}]}', 4),
    ('listing_steps',    NULL, NULL, '{}'::jsonb, 5),
    ('search_steps',     NULL, NULL, '{}'::jsonb, 6),
    ('contact_steps',    NULL, NULL, '{}'::jsonb, 7),
    ('cost_guide_parts', NULL, NULL, '{}'::jsonb, 8),
    ('trust_checks',     NULL, NULL, '{}'::jsonb, 9);

INSERT INTO content_items (block_id, label, body, icon_name, href, payload, sort_order)
SELECT b.id, v.label, v.body, v.icon_name, v.href, v.payload::jsonb, v.sort_order
FROM (VALUES
    -- trust_points (was marketing-content.ts:66)
    ('trust_points', 'Clear status',
     'Listings show availability and confirmation dates instead of hiding them behind one vague badge.',
     'shield-check', NULL, '{}'::jsonb, 1),
    ('trust_points', 'Visible costs',
     'Listing details keep rent, agency fees, legal fees and deposits together in one breakdown.',
     'receipt', NULL, '{}'::jsonb, 2),
    ('trust_points', 'Honest freshness',
     'Confirmation dates show how recently an advertiser stood behind the listing details.',
     'file-check', NULL, '{}'::jsonb, 3),
    ('trust_points', 'Human context',
     'Every listing names the advertiser and, where disclosed, the agency behind it.',
     'user-round', NULL, '{}'::jsonb, 4),

    -- audience_paths (was marketing-content.ts:127). Three bodies changed: the old copy
    -- promised browser-local previews that no longer describe the product.
    ('audience_paths', 'Looking for a place',
     'Search homes, compare the visible costs and send an enquiry to the advertiser.',
     'search', '/listings', '{"cta":"Explore listings"}'::jsonb, 1),
    ('audience_paths', 'Looking for an agent',
     'Browse advertisers by name, agency or area, then message one about a property.',
     'user-round', '/agents', '{"cta":"View advertiser directory"}'::jsonb, 2),
    ('audience_paths', 'Looking for something specific',
     'Post a structured request and advertisers with a matching live listing can reach you.',
     'building-2', '/requests', '{"cta":"Post a property request"}'::jsonb, 3),

    -- landlord_paths (was marketing-content.ts:157)
    ('landlord_paths', 'Landlords and agents',
     'List a home or commercial property, keep the important facts together and prepare for enquiries.',
     'building-2', NULL, '{}'::jsonb, 1),
    ('landlord_paths', 'Property developers',
     'Present a development with its unit types, pricing and availability instead of splitting every unit into a separate ad.',
     'hard-hat', NULL, '{}'::jsonb, 2),

    -- category_groups cards (was marketing-content.ts:35). Group titles, blurbs and icons
    -- live in block.payload.groups; the ten cards are items so each can carry its own filters.
    ('category_groups', 'Apartments', NULL, 'building-2', NULL, '{"listingType":"RENT","propertyType":"APARTMENT"}'::jsonb, 1),
    ('category_groups', 'Houses', NULL, 'home', NULL, '{"listingType":"RENT","propertyType":"HOUSE"}'::jsonb, 2),
    ('category_groups', 'Townhouses', NULL, 'building', NULL, '{"listingType":"RENT","propertyType":"TOWNHOUSE"}'::jsonb, 3),
    ('category_groups', 'Commercial', NULL, 'store', NULL, '{"listingType":"RENT","propertyType":"COMMERCIAL"}'::jsonb, 4),
    ('category_groups', 'Short-let', NULL, 'clock', NULL, '{"listingType":"RENT","propertyType":"APARTMENT","category":"SHORTLET"}'::jsonb, 5),
    ('category_groups', 'Apartments', NULL, 'building-2', NULL, '{"listingType":"SALE","propertyType":"APARTMENT"}'::jsonb, 6),
    ('category_groups', 'Houses', NULL, 'home', NULL, '{"listingType":"SALE","propertyType":"HOUSE"}'::jsonb, 7),
    ('category_groups', 'Land', NULL, 'land-plot', NULL, '{"listingType":"SALE","propertyType":"LAND"}'::jsonb, 8),
    ('category_groups', 'Commercial', NULL, 'store', NULL, '{"listingType":"SALE","propertyType":"COMMERCIAL"}'::jsonb, 9),
    ('category_groups', 'New homes', NULL, 'hard-hat', NULL, '{"listingType":"SALE","propertyType":"HOUSE","category":"NEW_HOMES"}'::jsonb, 10),

    -- listing_steps (was marketing-content.ts:89). The last body changed: the enquiry
    -- dashboard is connected now, so "the future workflow" would understate it.
    ('listing_steps', 'Create an account',
     'Choose the account path that matches the kind of property or person you represent.',
     'file-check', NULL, '{}'::jsonb, 1),
    ('listing_steps', 'Show your context',
     'The future profile can make agency, landlord and developer information easier to understand.',
     'key-round', NULL, '{}'::jsonb, 2),
    ('listing_steps', 'Prepare a listing',
     'Add the property details, photos, price and availability in one place.',
     'building-2', NULL, '{}'::jsonb, 3),
    ('listing_steps', 'Manage interest',
     'Enquiries and matching property requests arrive in one advertiser dashboard.',
     'search', NULL, '{}'::jsonb, 4),

    -- search_steps (was how-it-works/page.tsx:12). The third body changed: favourites are
    -- stored against the account, not the browser.
    ('search_steps', 'Start with a search',
     'Use the hero search to combine a Lagos area, keyword, property type, bedrooms, budget and rent-or-buy filter.',
     'search', NULL, '{}'::jsonb, 1),
    ('search_steps', 'Narrow the area',
     'Use the map to draw a search area and inspect the homes inside it. The map runs the same listing search as the results page.',
     'map-pinned', NULL, '{}'::jsonb, 2),
    ('search_steps', 'Save what matters',
     'Save a property to your account, then open the saved-properties page from any device.',
     'heart', NULL, '{}'::jsonb, 3),

    -- contact_steps (was how-it-works/page.tsx:30). Both bodies changed: requests are matched
    -- and advertisers no longer need a "profile" promise to be findable.
    ('contact_steps', 'Ask a structured question',
     'A property request gives advertisers a clear title, area, budget and contact route — not a free-text post.',
     'send', NULL, '{}'::jsonb, 1),
    ('contact_steps', 'Find an advertiser',
     'Search advertisers by name or agency, then open the listings each one has live today.',
     'user-round', NULL, '{}'::jsonb, 2),

    -- cost_guide_parts (was cost-guide/page.tsx:12 plus the four inline questions).
    -- payload.kind splits the two arrays the page renders in different sections.
    -- The third body changed: the example beside it is now a real listing.
    ('cost_guide_parts', 'The asking amount',
     'Rent or asking price is the anchor. Gida keeps it separate from the costs that may be added around it.',
     'receipt', NULL, '{"kind":"principle"}'::jsonb, 1),
    ('cost_guide_parts', 'The total picture',
     'A worked example shows the cost of moving in, subject to what the advertiser actually discloses.',
     'calculator', NULL, '{"kind":"principle"}'::jsonb, 2),
    ('cost_guide_parts', 'The context',
     'The example beside these principles is a live listing. Its confirmation date says when the advertiser last stood behind the figures.',
     'file-text', NULL, '{"kind":"principle"}'::jsonb, 3),
    ('cost_guide_parts', 'Is the amount shown yearly, monthly, one-off or negotiable?',
     NULL, NULL, NULL, '{"kind":"question"}'::jsonb, 4),
    ('cost_guide_parts', 'Which fees are disclosed, and which are not yet available?',
     NULL, NULL, NULL, '{"kind":"question"}'::jsonb, 5),
    ('cost_guide_parts', 'What would a person need to budget for before moving in?',
     NULL, NULL, NULL, '{"kind":"question"}'::jsonb, 6),
    ('cost_guide_parts', 'How recent is the information, and who supplied it?',
     NULL, NULL, NULL, '{"kind":"question"}'::jsonb, 7),

    -- trust_checks (was trust-list.tsx:3, where four of five rows said "Illustrative date").
    -- These rows now state what the product genuinely does and does not do.
    ('trust_checks', 'The advertiser behind a listing is named',
     'On the account, with the agency they disclosed.', 'user-round', NULL, '{"connected":true}'::jsonb, 1),
    ('trust_checks', 'Disclosed costs are listed with the price',
     'Agency, legal, service charge and deposit, each with the advertiser''s own note.', 'receipt', NULL, '{"connected":true}'::jsonb, 2),
    ('trust_checks', 'The date the advertiser last confirmed the details',
     'Shown on the listing, not hidden behind a generic badge.', 'file-check', NULL, '{"connected":true}'::jsonb, 3),
    ('trust_checks', 'Whether the property is still available',
     'Advertiser-set status: available, pending, rented or sold.', 'shield-check', NULL, '{"connected":true}'::jsonb, 4),
    ('trust_checks', 'Independent verification of title or documents',
     'Not connected. Gida publishes what the advertiser states.', NULL, NULL, '{"connected":false}'::jsonb, 5),
    ('trust_checks', 'A physical visit by Gida before publishing',
     'Not connected. Listings are published from the advertiser''s own account.', NULL, NULL, '{"connected":false}'::jsonb, 6)
) AS v(key, label, body, icon_name, href, payload, sort_order)
JOIN content_blocks b ON b.key = v.key;
