-- Seed public marketing content without importing development users or listings.
-- Existing block edits are preserved; this only fills missing defaults.
INSERT INTO content_blocks (key, title, blurb, payload, sort_order) VALUES
    ('trust_points', 'What you can see before you call', NULL, '{}'::jsonb, 1),
    ('audience_paths', NULL, NULL, '{}'::jsonb, 2),
    ('landlord_paths', NULL, NULL, '{}'::jsonb, 3),
    ('category_groups', NULL, NULL,
     '{"groups":[{"listingType":"RENT","title":"For rent","icon":"key-round","blurb":"Explore homes by listing type, compare disclosed costs and see when details were last confirmed."},{"listingType":"SALE","title":"For sale","icon":"tag","blurb":"Homes to buy, plus land and commercial property."}]}'::jsonb, 4),
    ('listing_steps', NULL, NULL, '{}'::jsonb, 5),
    ('search_steps', NULL, NULL, '{}'::jsonb, 6),
    ('contact_steps', NULL, NULL, '{}'::jsonb, 7),
    ('cost_guide_parts', NULL, NULL, '{}'::jsonb, 8),
    ('trust_checks', NULL, NULL, '{}'::jsonb, 9)
ON CONFLICT (key) DO UPDATE SET
    title = COALESCE(content_blocks.title, EXCLUDED.title),
    blurb = COALESCE(content_blocks.blurb, EXCLUDED.blurb),
    payload = CASE
        WHEN content_blocks.payload = '{}'::jsonb THEN EXCLUDED.payload
        ELSE content_blocks.payload
    END;

INSERT INTO content_items (block_id, label, body, icon_name, href, payload, sort_order)
SELECT b.id, v.label, v.body, v.icon_name, v.href, v.payload::jsonb, v.sort_order
FROM (VALUES
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

    ('audience_paths', 'Looking for a place',
     'Search homes, compare the visible costs and send an enquiry to the advertiser.',
     'search', '/listings', '{"cta":"Explore listings"}'::jsonb, 1),
    ('audience_paths', 'Looking for an agent',
     'Browse advertisers by name, agency or area, then message one about a property.',
     'user-round', '/agents', '{"cta":"View advertiser directory"}'::jsonb, 2),
    ('audience_paths', 'Looking for something specific',
     'Post a structured request and advertisers with a matching live listing can reach you.',
     'building-2', '/requests', '{"cta":"Post a property request"}'::jsonb, 3),

    ('landlord_paths', 'Landlords and agents',
     'List a home or commercial property, keep the important facts together and prepare for enquiries.',
     'building-2', NULL, '{}'::jsonb, 1),
    ('landlord_paths', 'Property developers',
     'Present a development with its unit types, pricing and availability instead of splitting every unit into a separate ad.',
     'hard-hat', NULL, '{}'::jsonb, 2),

    ('category_groups', 'Apartments', NULL, 'building-2', NULL,
     '{"listingType":"RENT","propertyType":"APARTMENT"}'::jsonb, 1),
    ('category_groups', 'Houses', NULL, 'home', NULL,
     '{"listingType":"RENT","propertyType":"HOUSE"}'::jsonb, 2),
    ('category_groups', 'Townhouses', NULL, 'building', NULL,
     '{"listingType":"RENT","propertyType":"TOWNHOUSE"}'::jsonb, 3),
    ('category_groups', 'Commercial', NULL, 'store', NULL,
     '{"listingType":"RENT","propertyType":"COMMERCIAL"}'::jsonb, 4),
    ('category_groups', 'Short-let', NULL, 'clock', NULL,
     '{"listingType":"RENT","propertyType":"APARTMENT","category":"SHORTLET"}'::jsonb, 5),
    ('category_groups', 'Apartments', NULL, 'building-2', NULL,
     '{"listingType":"SALE","propertyType":"APARTMENT"}'::jsonb, 6),
    ('category_groups', 'Houses', NULL, 'home', NULL,
     '{"listingType":"SALE","propertyType":"HOUSE"}'::jsonb, 7),
    ('category_groups', 'Land', NULL, 'land-plot', NULL,
     '{"listingType":"SALE","propertyType":"LAND"}'::jsonb, 8),
    ('category_groups', 'Commercial', NULL, 'store', NULL,
     '{"listingType":"SALE","propertyType":"COMMERCIAL"}'::jsonb, 9),
    ('category_groups', 'New homes', NULL, 'hard-hat', NULL,
     '{"listingType":"SALE","propertyType":"HOUSE","category":"NEW_HOMES"}'::jsonb, 10),

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

    ('search_steps', 'Start with a search',
     'Use the hero search to combine a Lagos area, keyword, property type, bedrooms, budget and rent-or-buy filter.',
     'search', NULL, '{}'::jsonb, 1),
    ('search_steps', 'Narrow the area',
     'Use the map to draw a search area and inspect the homes inside it. The map runs the same listing search as the results page.',
     'map-pinned', NULL, '{}'::jsonb, 2),
    ('search_steps', 'Save what matters',
     'Save a property to your account, then open the saved-properties page from any device.',
     'heart', NULL, '{}'::jsonb, 3),

    ('contact_steps', 'Ask a structured question',
     'A property request gives advertisers a clear title, area, budget and contact route — not a free-text post.',
     'send', NULL, '{}'::jsonb, 1),
    ('contact_steps', 'Find an advertiser',
     'Search advertisers by name or agency, then open the listings each one has live today.',
     'user-round', NULL, '{}'::jsonb, 2),

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

    ('trust_checks', 'The advertiser behind a listing is named',
     'On the account, with the agency they disclosed.', 'user-round', NULL,
     '{"connected":true}'::jsonb, 1),
    ('trust_checks', 'Disclosed costs are listed with the price',
     'Agency, legal, service charge and deposit, each with the advertiser''s own note.',
     'receipt', NULL, '{"connected":true}'::jsonb, 2),
    ('trust_checks', 'The date the advertiser last confirmed the details',
     'Shown on the listing, not hidden behind a generic badge.', 'file-check', NULL,
     '{"connected":true}'::jsonb, 3),
    ('trust_checks', 'Whether the property is still available',
     'Advertiser-set status: available, pending, rented or sold.', 'shield-check', NULL,
     '{"connected":true}'::jsonb, 4),
    ('trust_checks', 'Independent verification of title or documents',
     'Not connected. Gida publishes what the advertiser states.', NULL, NULL,
     '{"connected":false}'::jsonb, 5),
    ('trust_checks', 'A physical visit by Gida before publishing',
     'Not connected. Listings are published from the advertiser''s own account.', NULL, NULL,
     '{"connected":false}'::jsonb, 6)
) AS v(key, label, body, icon_name, href, payload, sort_order)
JOIN content_blocks b ON b.key = v.key
WHERE NOT EXISTS (
    SELECT 1
    FROM content_items existing
    WHERE existing.block_id = b.id
      AND existing.label = v.label
);
