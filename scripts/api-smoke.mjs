#!/usr/bin/env node

const API = `${(process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")}/api/v1`;
const APP = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const LOCATION_KINDS = new Set(["STATE", "LGA", "AREA", "ESTATE", "LANDMARK"]);

let passed = 0;
const failures = [];

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ok    ${name}`);
    return;
  }
  failures.push(`${name}${detail ? ` (${detail})` : ""}`);
  console.log(`  FAIL  ${name}${detail ? ` (${detail})` : ""}`);
}

function section(title) {
  console.log(`\n${title}`);
}

function problemCode(json) {
  if (typeof json?.type !== "string") return "";
  return json.type.slice(json.type.lastIndexOf("/") + 1);
}

async function read(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

async function json(path, init = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  return { status: response.status, body: await read(response) };
}

async function app(path, init = {}) {
  const response = await fetch(`${APP}${path}`, init);
  return { status: response.status, body: await read(response), headers: response.headers };
}

async function main() {
  section(`Public reads — ${API}`);
  const search = await json("/listings?size=5");
  check("GET /listings returns 200", search.status === 200, String(search.status));
  const page = search.body ?? {};
  check(
    "page response has items, page, size, total and pages",
    Array.isArray(page.items) &&
      typeof page.page === "number" &&
      typeof page.size === "number" &&
      typeof page.total === "number" &&
      typeof page.pages === "number"
  );
  check("size is honoured", (page.items ?? []).length <= 5);
  const first = page.items?.[0];
  check(
    "summary carries primaryImage and hasDisclosedFees",
    Boolean(first) && "primaryImage" in first && typeof first.hasDisclosedFees === "boolean"
  );
  check(
    "summary carries an id, title and numeric price",
    Boolean(first) && typeof first.id === "string" && typeof first.title === "string" && typeof first.price === "number"
  );

  if (first) {
    section("Listing detail");
    const detail = await json(`/listings/${first.id}`);
    check("GET /listings/{id} returns 200", detail.status === 200, String(detail.status));
    const listing = detail.body ?? {};
    check(
      "detail includes costs, media, amenities and advertiser",
      Array.isArray(listing.costs) &&
        Array.isArray(listing.media) &&
        Array.isArray(listing.amenities) &&
        typeof listing.advertiser?.name === "string"
    );
    check("detail id and price match the summary", listing.id === first.id && listing.price === first.price);

    const similar = await json(`/listings/${first.id}/similar?limit=3`);
    check("similar returns a bare array of at most three", Array.isArray(similar.body) && similar.body.length <= 3);
    check(
      "similar excludes the listing itself",
      Array.isArray(similar.body) && similar.body.every((item) => item.id !== first.id)
    );

    const missing = await json("/listings/00000000-0000-0000-0000-000000000000");
    check("unknown listing returns 404", missing.status === 404, String(missing.status));
    check("404 is an RFC 7807 problem", problemCode(missing.body) === "listing_not_found", problemCode(missing.body));
  }

  section("Filters and reference data");
  const locations = await json("/locations");
  check(
    "GET /locations returns a slug and a known kind",
    Array.isArray(locations.body) &&
      locations.body.every((item) => typeof item.slug === "string" && LOCATION_KINDS.has(item.kind))
  );
  const amenities = await json("/amenities");
  check(
    "GET /amenities returns slug and label",
    Array.isArray(amenities.body) && amenities.body.every((item) => typeof item.slug === "string" && typeof item.label === "string")
  );
  const filtered = await json("/listings?listingType=RENT&bedrooms=2&size=100");
  check(
    "listingType and bedroom filters are honoured",
    filtered.status === 200 && (filtered.body?.items ?? []).every((item) => item.listingType === "RENT" && item.bedrooms >= 2)
  );
  const keyword = await json("/listings?q=Lekki&size=50");
  check(
    "keyword search finds Lekki through the location branch",
    keyword.status === 200 && (keyword.body?.total ?? 0) > 0
  );
  const ranked = await json("/listings?q=Lekki&sort=relevance&size=20");
  check(
    "sort=relevance with a keyword returns results",
    ranked.status === 200 && (ranked.body?.total ?? 0) > 0,
    String(ranked.status)
  );
  const unkeyed = await json("/listings?sort=relevance");
  check(
    "sort=relevance without a keyword is a 400 problem",
    unkeyed.status === 400 && problemCode(unkeyed.body) === "relevance_requires_keyword",
    `${unkeyed.status} ${problemCode(unkeyed.body)}`
  );
  const sorted = await json("/listings?sort=price-asc&size=20");
  const prices = (sorted.body?.items ?? []).map((item) => item.price);
  check("price-asc is non-decreasing", prices.every((price, index) => index === 0 || prices[index - 1] <= price));

  const geoPage = await json("/listings?size=100");
  const geoListing = (geoPage.body?.items ?? []).find(
    (item) => typeof item.latitude === "number" && typeof item.longitude === "number"
  );
  if (geoListing) {
    const delta = 0.01;
    const lng = geoListing.longitude;
    const lat = geoListing.latitude;
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].map((value) => value.toFixed(6)).join(",");
    const inBox = await json(`/listings?size=100&bbox=${bbox}`);
    check("bbox includes the listing that defined it", (inBox.body?.items ?? []).some((item) => item.id === geoListing.id));
    const ring = [
      [lng - delta, lat - delta],
      [lng + delta, lat - delta],
      [lng + delta, lat + delta],
      [lng - delta, lat + delta],
      [lng - delta, lat - delta],
    ];
    const polygon = encodeURIComponent(JSON.stringify({ type: "Polygon", coordinates: [ring] }));
    const inPolygon = await json(`/listings?size=100&polygon=${polygon}`);
    check("polygon includes the listing inside it", (inPolygon.body?.items ?? []).some((item) => item.id === geoListing.id));
  } else {
    console.log("  skip  geo filters — no seeded listing carries coordinates");
  }

  section("Auth against Spring");
  const email = `smoke-${Date.now()}@example.com`;
  const password = "smoke-test-password";
  const register = await json("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test", email, password, phone: "+2348000000000", role: "USER" }),
  });
  check(
    "register returns 201 with the new user",
    register.status === 201 && register.body?.email === email,
    String(register.status)
  );
  const duplicate = await json("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Smoke Test", email, password, role: "USER" }),
  });
  check(
    "re-registering the same email returns 409 email_taken",
    duplicate.status === 409 && problemCode(duplicate.body) === "email_taken",
    `${duplicate.status} ${problemCode(duplicate.body)}`
  );

  const login = await json("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const session = login.body ?? {};
  check(
    "login returns an access and refresh pair",
    login.status === 200 &&
      typeof session.accessToken === "string" &&
      typeof session.refreshToken === "string" &&
      session.expiresIn > 0
  );

  const me = await json("/auth/me", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  check("me returns the registered user", me.status === 200 && me.body?.email === email, String(me.status));

  const rotated = await json("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  check(
    "refresh returns a rotated pair",
    rotated.status === 200 &&
      typeof rotated.body?.refreshToken === "string" &&
      rotated.body.refreshToken !== session.refreshToken
  );

  const replay = await json("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken: session.refreshToken }),
  });
  check(
    "replaying the old refresh token returns 401 refresh_token_reused",
    replay.status === 401 && problemCode(replay.body) === "refresh_token_reused",
    `${replay.status} ${problemCode(replay.body)}`
  );

  const logout = await json("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: rotated.body?.refreshToken }),
  });
  check("logout returns 204", logout.status === 204, String(logout.status));
  const logoutAgain = await json("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken: rotated.body?.refreshToken }),
  });
  check("logout is idempotent", logoutAgain.status === 204, String(logoutAgain.status));

  section(`BFF — ${APP}`);
  const bffLogin = await app("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: APP },
    body: JSON.stringify({ email, password }),
  });
  check(
    "BFF login returns the user",
    bffLogin.status === 200 && bffLogin.body?.user?.email === email,
    String(bffLogin.status)
  );
  const cookies = bffLogin.headers.getSetCookie();
  const access = cookies.find((cookie) => cookie.startsWith("gida_access="))?.split(";")[0] ?? "";
  const refresh = cookies.find((cookie) => cookie.startsWith("gida_refresh="))?.split(";")[0] ?? "";
  check("BFF login sets both session cookies", access.length > 0 && refresh.length > 0);
  check(
    "BFF cookies are httpOnly and SameSite=Lax",
    cookies.every((cookie) => /httponly/i.test(cookie) && /samesite=lax/i.test(cookie))
  );

  const bffMe = await app("/api/auth/me", { headers: { Cookie: access } });
  check(
    "BFF me reads the session from the cookie",
    bffMe.status === 200 && bffMe.body?.email === email,
    String(bffMe.status)
  );

  const bffListings = await app("/api/listings?size=2");
  check(
    "BFF listings proxy returns a page",
    bffListings.status === 200 && Array.isArray(bffListings.body?.items),
    String(bffListings.status)
  );

  const bffForeign = await app("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
    body: JSON.stringify({ email, password }),
  });
  check(
    "foreign Origin is rejected with 403 origin_not_allowed",
    bffForeign.status === 403 && problemCode(bffForeign.body) === "origin_not_allowed",
    `${bffForeign.status} ${problemCode(bffForeign.body)}`
  );

  const bffLogout = await app("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: APP, Cookie: `${access}; ${refresh}` },
    body: JSON.stringify({}),
  });
  check("BFF logout returns 204", bffLogout.status === 204, String(bffLogout.status));

  section("Advertisers, areas and content");
  const advertisers = await json("/advertisers?size=5");
  const adPage = advertisers.body ?? {};
  check("directory is public and paged",
    advertisers.status === 200 && Array.isArray(adPage.items) && typeof adPage.total === "number");
  check("cards carry a numeric listingCount",
    (adPage.items ?? []).every((a) => typeof a.listingCount === "number"));
  const firstAdvertiser = adPage.items?.[0];
  const byAdvertiser = await json(`/listings?advertiser=${firstAdvertiser?.id}&size=5`);
  const owned = await Promise.all((byAdvertiser.body?.items ?? []).map(async (item) => {
    const detail = await json(`/listings/${item.id}`);
    return detail.body?.advertiser?.id === firstAdvertiser?.id;
  }));
  check("advertiser filter returns only that advertiser's listings",
    byAdvertiser.status === 200 && owned.length > 0 && owned.every(Boolean));
  check("unknown advertiser id is rejected",
    (await json("/listings?advertiser=not-a-uuid")).status === 400);

  const areas = await json("/areas?limit=6");
  const areaRows = areas.body ?? [];
  check("areas are ranked by published listing count",
    areas.status === 200 && areaRows.length > 0 &&
      areaRows[0].listingCount >= (areaRows[1]?.listingCount ?? 0));
  check("areas reject an out-of-range limit",
    (await json("/areas?limit=0")).status === 400 && (await json("/areas?limit=50")).status === 400);

  const trust = await json("/content/trust_points");
  check("content block is public, complete and ordered",
    trust.status === 200 && (trust.body?.items ?? []).length === 4 &&
      trust.body?.items?.[0]?.label === "Clear status");
  check("unknown content key is 404 content_not_found",
    (await json("/content/hero_slides")).status === 404);

  section("Anonymous writes");
  const smokeContact = `smoke-${Date.now()}@example.com`;
  const enquiryBody = JSON.stringify({
    listingId: first?.id, action: "CONTACT", message: "Smoke test enquiry.",
    name: "Smoke Test", contact: smokeContact,
  });
  const enquiry = await json("/enquiries", { method: "POST", body: enquiryBody });
  check("anonymous enquiry is accepted",
    enquiry.status === 201 && Boolean(enquiry.body?.id), String(enquiry.status));
  const repeat = await json("/enquiries", { method: "POST", body: enquiryBody });
  check("a duplicate inside the hour is rejected",
    repeat.status === 409 && problemCode(repeat.body) === "duplicate_enquiry",
    `${repeat.status} ${problemCode(repeat.body)}`);
  const honeypot = await json("/enquiries", {
    method: "POST",
    body: JSON.stringify({ listingId: first?.id, action: "CONTACT", message: "spam",
      name: "Bot", contact: `bot-${Date.now()}@example.com`, website: "spam.test" }),
  });
  check("the honeypot field is rejected",
    problemCode(honeypot.body) === "honeypot_rejected", problemCode(honeypot.body));
  const badContact = await json("/enquiries", {
    method: "POST",
    body: JSON.stringify({ listingId: first?.id, action: "CONTACT", message: "hi",
      name: "Smoke Test", contact: "not-a-contact" }),
  });
  check("a malformed contact is rejected",
    badContact.status === 400 && problemCode(badContact.body) === "validation_failed");
  const inverted = await json("/requests", {
    method: "POST",
    body: JSON.stringify({ title: "Smoke request", listingType: "RENT", location: "lekki-phase-1",
      name: "Smoke Test", contact: `smoke-${Date.now()}@example.com`, minPrice: 9000000, maxPrice: 1000000 }),
  });
  check("an inverted budget is rejected",
    inverted.status === 400 && problemCode(inverted.body) === "invalid_budget",
    `${inverted.status} ${problemCode(inverted.body)}`);
  const unknownArea = await json("/requests", {
    method: "POST",
    body: JSON.stringify({ title: "Smoke request", listingType: "RENT", location: "nowhere-estate",
      name: "Smoke Test", contact: `smoke-${Date.now()}@example.com` }),
  });
  check("an unknown area slug is rejected",
    unknownArea.status === 422 && problemCode(unknownArea.body) === "unknown_location",
    `${unknownArea.status} ${problemCode(unknownArea.body)}`);

  section("Favourites round-trip under a real session");
  const favListing = (await json("/listings?size=1")).body?.items?.[0];
  const before = await json("/me/favorites", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  check("favourites read is authorised", before.status === 200, String(before.status));
  const addFav = await app(`/api/favorites/${favListing?.id}`, {
    method: "PUT", headers: { Origin: APP, Cookie: access },
  });
  check("BFF favourite write returns 204", addFav.status === 204, String(addFav.status));
  const during = await json("/me/favorites", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  check("Spring sees the saved listing",
    (during.body?.items ?? []).some((item) => item.id === favListing?.id));
  const foreignFav = await app(`/api/favorites/${favListing?.id}`, { method: "PUT" });
  check("a favourite PUT without Origin is rejected", foreignFav.status === 403, String(foreignFav.status));
  const dropFav = await app(`/api/favorites/${favListing?.id}`, {
    method: "DELETE", headers: { Origin: APP, Cookie: access },
  });
  check("BFF favourite delete returns 204", dropFav.status === 204, String(dropFav.status));
  const after = await json("/me/favorites", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  check("the listing is no longer saved",
    !(after.body?.items ?? []).some((item) => item.id === favListing?.id));

  section("Advertiser inbox and matching");
  const agentLogin = await json("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "adebayo@gida.local", password: "GidaLocal2026!" }),
  });
  check("the seeded advertiser can sign in",
    agentLogin.status === 200 && typeof agentLogin.body?.accessToken === "string",
    `needs the local-profile dev seed: ${agentLogin.status}`);
  const agentAuth = { Authorization: `Bearer ${agentLogin.body?.accessToken}` };
  const inbox = await json("/me/enquiries", { headers: agentAuth });
  check("advertiser inbox lists contact strings",
    inbox.status === 200 && (inbox.body?.items ?? []).every((e) => typeof e.contact === "string"),
    String(inbox.status));
  const matching = await json("/me/matching-requests?size=10", { headers: agentAuth });
  check("matching requests are capped and shaped",
    matching.status === 200 && (matching.body?.items ?? []).length <= 10 &&
      (matching.body?.items ?? []).every((r) => Array.isArray(r.matchedListingIds)));
  check("a matching read over the cap is rejected",
    (await json("/me/matching-requests?size=21", { headers: agentAuth })).status === 400);
  const userInbox = await json("/me/enquiries", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  const userMatching = await json("/me/matching-requests", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  check("a plain user is refused both reads",
    userInbox.status === 403 && userMatching.status === 403,
    `${userInbox.status}/${userMatching.status}`);

  section("Rendered pages");
  const landing = await app("/");
  const agents = await app("/agents");
  const guide = await app("/cost-guide");
  check("landing, directory and guide render 200",
    landing.status === 200 && agents.status === 200 && guide.status === 200,
    `${landing.status}/${agents.status}/${guide.status}`);

  section("Result");
  if (failures.length > 0) {
    console.log(`${failures.length} failed, ${passed} passed`);
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`${passed} checks passed`);
}

main().catch((error) => {
  console.error(`\nSmoke run could not start: ${error.message}`);
  console.error(`Is the Spring API running at ${API} and Next at ${APP}?`);
  process.exitCode = 1;
});
