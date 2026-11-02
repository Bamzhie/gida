#!/usr/bin/env node

// Pick up backend/.env (SMOKE_AGENT_* credentials) without overriding real
// environment variables; silently skipped when the file is absent.
import { readFileSync } from "node:fs";
try {
  for (const line of readFileSync(new URL("../backend/.env", import.meta.url), "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {}

if (!process.env.SMOKE_ADMIN_PASSWORD) {
  console.error("Set SMOKE_ADMIN_PASSWORD in backend/.env (see backend/.env.example) before running the moderation smoke checks.");
  process.exit(1);
}

const API = `${(process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "")}/api/v1`;
// Spring serves stored media outside the versioned API, at /media/{key}.
const SPRING = API.replace(/\/api\/v1$/, "");
const APP = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const LOCATION_KINDS = new Set(["STATE", "LGA", "AREA", "ESTATE", "LANDMARK"]);
const LIFECYCLE_STATES = ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "PUBLISHED", "PAUSED", "EXPIRED", "REJECTED", "SUSPENDED"];

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

// Like json but for multipart bodies: no Content-Type here — the runtime
// must add the boundary itself.
async function multipart(path, form, init = {}) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    ...init,
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    body: form,
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
  const password = "smoke-" + Math.random().toString(36).slice(2, 8) + "Aa1!";
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

  const adminEmail = process.env.SMOKE_ADMIN_EMAIL ?? "admin@gida.local";
  const adminLogin = await json("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: process.env.SMOKE_ADMIN_PASSWORD }),
  });
  check("the seeded admin can sign in", adminLogin.status === 200 && typeof adminLogin.body?.accessToken === "string", String(adminLogin.status));
  const adminAuth = { Authorization: `Bearer ${adminLogin.body?.accessToken}` };
  const plainUserAdminQueue = await json("/admin/listings", { headers: { Authorization: `Bearer ${session.accessToken}` } });
  const anonymousAdminQueue = await json("/admin/listings");
  check("a plain user is refused the admin listing queue", plainUserAdminQueue.status === 403, String(plainUserAdminQueue.status));
  check("an anonymous caller is refused the admin listing queue", anonymousAdminQueue.status === 401 && Boolean(anonymousAdminQueue.body?.type), String(anonymousAdminQueue.status));

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
  const agentEmail = process.env.SMOKE_AGENT_EMAIL ?? "adebayo@gida.local";
  const agentPassword = process.env.SMOKE_AGENT_PASSWORD;
  const agentLogin = await json("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: agentEmail, password: agentPassword }),
  });
  check("the seeded advertiser can sign in",
    agentLogin.status === 200 && typeof agentLogin.body?.accessToken === "string",
    agentPassword
      ? `needs the local-profile dev seed: ${agentLogin.status}`
      : "set SMOKE_AGENT_PASSWORD in backend/.env (see backend/.env.example)");
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

  section("Advertiser authoring");
  const advertiserEmail = `smoke-${Date.now()}-agent@example.com`;
  const advertiserPassword = "smoke-" + Math.random().toString(36).slice(2, 8) + "Aa1!";
  const advertiserRegister = await json("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Smoke Agent", email: advertiserEmail, password: advertiserPassword,
      phone: "+2348000000001", role: "AGENT",
    }),
  });
  check(
    "agent registration returns 201 with the new agent",
    advertiserRegister.status === 201 && advertiserRegister.body?.email === advertiserEmail,
    String(advertiserRegister.status)
  );
  const advertiserLogin = await json("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: advertiserEmail, password: advertiserPassword }),
  });
  const advertiserAuth = { Authorization: `Bearer ${advertiserLogin.body?.accessToken}` };
  check(
    "the throwaway agent can sign in",
    advertiserLogin.status === 200 && typeof advertiserLogin.body?.accessToken === "string",
    String(advertiserLogin.status)
  );

  // A rent fixture mirroring ng.gida.support.ListingFixtures#rent.
  const rentFixture = {
    title: "A home in lekki-phase-1",
    description: "A well placed home close to the main road.",
    listingType: "RENT",
    pricePeriod: "YEAR",
    price: 3500000,
    property: {
      locationSlug: "lekki-phase-1",
      addressLine: "12 Admiralty Way",
      propertyType: "APARTMENT",
      bedrooms: 2,
      bathrooms: 2,
      latitude: 6.4385,
      longitude: 3.4356,
      amenities: ["borehole-water", "24-7-security"],
    },
    costs: [{ type: "AGENCY_FEE", amount: 350000 }],
  };
  const created = await json("/listings", { method: "POST", headers: advertiserAuth, body: JSON.stringify(rentFixture) });
  const listingId = created.body?.id;
  check("the agent creates a rent listing", created.status === 201 && typeof listingId === "string", String(created.status));

  // A minimal valid 1x1 PNG; the photo is re-encoded server side, so it only
  // has to decode. Multipart bodies carry no hand-set content type.
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64"
  );
  const photoForm = () => {
    const form = new FormData();
    form.append("kind", "PHOTO");
    form.append("file", new Blob([png], { type: "image/png" }), "photo.png");
    return form;
  };
  const upload = await multipart(`/me/listings/${listingId}/media`, photoForm(), { headers: advertiserAuth });
  const mediaUrl = upload.body?.url ?? "";
  check("the photo upload returns 201 under /media/", upload.status === 201 && mediaUrl.startsWith("/media/"), `${upload.status} ${mediaUrl}`);
  const served = await fetch(`${SPRING}${mediaUrl}`);
  check(
    "Spring serves the stored photo as an image",
    served.status === 200 && (served.headers.get("content-type") ?? "").startsWith("image/"),
    String(served.status)
  );

  const submitted = await json(`/me/listings/${listingId}/submit`, { method: "POST", headers: advertiserAuth });
  check("submit returns the listing id and SUBMITTED lifecycle", submitted.status === 200 && submitted.body?.id === listingId && submitted.body?.lifecycle === "SUBMITTED", `${submitted.status} ${submitted.body?.lifecycle}`);
  const hiddenBeforeReview = await json(`/listings/${listingId}`);
  check("a submitted listing stays private before review", hiddenBeforeReview.status === 404, String(hiddenBeforeReview.status));
  const approved = await json(`/admin/listings/${listingId}/approve`, { method: "POST", headers: adminAuth });
  check("admin approval returns 204", approved.status === 204, String(approved.status));
  const publicDetail = await json(`/listings/${listingId}`);
  check(
    "the public detail carries the uploaded photo",
    publicDetail.status === 200 && (publicDetail.body?.media ?? []).some((entry) => entry.url === mediaUrl),
    String(publicDetail.status)
  );

  const copied = await json(`/me/listings/${listingId}/duplicate`, { method: "POST", headers: advertiserAuth });
  check(
    "duplicate returns a new draft id",
    copied.status === 201 && typeof copied.body?.id === "string" && copied.body.id !== listingId && copied.body?.lifecycle === "DRAFT",
    String(copied.status)
  );

  const renewed = await json(`/me/listings/${listingId}/renew`, { method: "POST", headers: advertiserAuth });
  const expiresAt = Date.parse(renewed.body?.expiresAt ?? "");
  const day = 24 * 60 * 60 * 1000;
  check(
    "renew returns 200 with an expiry about 30 days out",
    renewed.status === 200 && Math.abs(expiresAt - (Date.now() + 30 * day)) < day,
    String(renewed.status)
  );

  const summary = await json("/me/advertiser-summary", { headers: advertiserAuth });
  const states = summary.body?.listingsByState ?? {};
  check(
    "the summary spans all eight lifecycle states and counts enquiries",
    summary.status === 200 && LIFECYCLE_STATES.every((state) => state in states) && typeof summary.body?.totalEnquiries === "number",
    `${summary.status} ${Object.keys(states).join(",")}`
  );

  const locked = await multipart(`/me/listings/${listingId}/media`, photoForm(), { headers: advertiserAuth });
  check(
    "uploading to a published listing returns 422 listing_locked",
    locked.status === 422 && problemCode(locked.body) === "listing_locked",
    `${locked.status} ${problemCode(locked.body)}`
  );

  section("Moderation and trust");
  const resubmitted = await json(`/me/listings/${listingId}/confirm`, { method: "POST", headers: advertiserAuth });
  const confirmedAt = Date.parse(resubmitted.body?.confirmedAt ?? "");
  check("availability confirmation returns a recent confirmedAt", resubmitted.status === 200 && Number.isFinite(confirmedAt) && Math.abs(Date.now() - confirmedAt) < 5 * 60 * 1000, String(resubmitted.status));

  const staleQueue = await json("/admin/listings?staleDays=30", { headers: adminAuth });
  check("admin stale listing queue returns a page", staleQueue.status === 200 && Array.isArray(staleQueue.body?.items), String(staleQueue.status));
  const adminDetail = await json(`/admin/listings/${listingId}`, { headers: adminAuth });
  check("admin listing detail includes lifecycle and action history",
    adminDetail.status === 200 && adminDetail.body?.lifecycle === "PUBLISHED" &&
      adminDetail.body?.listing?.id === listingId &&
      Array.isArray(adminDetail.body?.actions) &&
      adminDetail.body.actions.some((action) => action.action === "APPROVE"),
    String(adminDetail.status));
  const flaggedStale = await json(`/admin/listings/${listingId}/flag-stale`, {
    method: "POST", headers: adminAuth,
  });
  check("admin can flag a published listing as stale", flaggedStale.status === 204, String(flaggedStale.status));

  const secondListing = await json("/listings", { method: "POST", headers: advertiserAuth, body: JSON.stringify({ ...rentFixture, title: "A second home in lekki-phase-1" }) });
  const secondId = secondListing.body?.id;
  const secondSubmit = await json(`/me/listings/${secondId}/submit`, { method: "POST", headers: advertiserAuth });
  const rejected = await json(`/admin/listings/${secondId}/reject`, { method: "POST", headers: adminAuth, body: JSON.stringify({ reason: "Please correct the address details." }) });
  const ownerRows = await json("/me/listings", { headers: advertiserAuth });
  check("admin can reject a submitted listing with a reason", secondSubmit.status === 200 && rejected.status === 204, `${secondSubmit.status}/${rejected.status}`);
  check("owner listing row exposes the review note", (ownerRows.body?.items ?? []).some((item) => item.id === secondId && item.reviewNote === "Please correct the address details."));
  check("rejected listing remains private", (await json(`/listings/${secondId}`)).status === 404);
  const secondResubmit = await json(`/me/listings/${secondId}/submit`, { method: "POST", headers: advertiserAuth });
  const corrections = await json(`/admin/listings/${secondId}/request-corrections`, { method: "POST", headers: adminAuth, body: JSON.stringify({ reason: "Add a current availability note." }) });
  const afterCorrections = await json("/me/listings", { headers: advertiserAuth });
  check("rejected listing can resubmit and return to DRAFT on corrections", secondResubmit.status === 200 && corrections.status === 204 && (afterCorrections.body?.items ?? []).some((item) => item.id === secondId && item.lifecycle === "DRAFT"), `${secondResubmit.status}/${corrections.status}`);

  const suspendedListing = await json(`/admin/listings/${listingId}/suspend`, { method: "POST", headers: adminAuth, body: JSON.stringify({ reason: "Temporary review hold." }) });
  const hiddenWhileSuspended = await json(`/listings/${listingId}`);
  const resumeWhileSuspended = await json(`/me/listings/${listingId}/resume`, { method: "POST", headers: advertiserAuth });
  const reinstatedListing = await json(`/admin/listings/${listingId}/reinstate`, { method: "POST", headers: adminAuth });
  const resumeAfterReinstate = await json(`/me/listings/${listingId}/resume`, { method: "POST", headers: advertiserAuth });
  check("suspended listing is hidden and cannot be resumed by its owner", suspendedListing.status === 204 && hiddenWhileSuspended.status === 404 && resumeWhileSuspended.status === 409, `${suspendedListing.status}/${hiddenWhileSuspended.status}/${resumeWhileSuspended.status}`);
  check("reinstate returns listing to PAUSED so the owner can resume", reinstatedListing.status === 204 && resumeAfterReinstate.status === 204, `${reinstatedListing.status}/${resumeAfterReinstate.status}`);

  const reportUserEmail = `smoke-report-${Date.now()}@example.com`;
  const reportUserPassword = "smoke-" + Math.random().toString(36).slice(2, 8) + "Aa1!";
  const reportUser = await json("/auth/register", { method: "POST", body: JSON.stringify({ name: "Smoke Reporter", email: reportUserEmail, password: reportUserPassword, phone: "+2348000000002", role: "USER" }) });
  const reportLogin = await json("/auth/login", { method: "POST", body: JSON.stringify({ email: reportUserEmail, password: reportUserPassword }) });
  const reportUserAuth = { Authorization: `Bearer ${reportLogin.body?.accessToken ?? ""}` };
  check("a new seeker can register and sign in to report", reportUser.status === 201 && reportLogin.status === 200, `${reportUser.status}/${reportLogin.status}`);
  const report = await json(`/listings/${listingId}/reports`, { method: "POST", headers: reportUserAuth, body: JSON.stringify({ reason: "WRONG_PRICE", details: "The advertised amount does not match the current quote." }) });
  const duplicateReport = await json(`/listings/${listingId}/reports`, { method: "POST", headers: reportUserAuth, body: JSON.stringify({ reason: "WRONG_PRICE" }) });
  const reportQueue = await json("/admin/reports?status=OPEN", { headers: adminAuth });
  const reportId = report.body?.id;
  check("a signed-in seeker can report a published listing once", report.status === 201 && typeof report.body?.id === "string" && report.body?.status === "OPEN" && duplicateReport.status === 409, `${report.status}/${duplicateReport.status}`);
  check("admin report queue includes the new report", reportQueue.status === 200 && (reportQueue.body?.items ?? []).some((item) => item.id === reportId), String(reportQueue.status));
  const resolvedReport = await json(`/admin/reports/${reportId}/resolve`, { method: "POST", headers: adminAuth, body: JSON.stringify({ outcome: "RESOLVED", note: "Reviewed against the advertiser's current quote." }) });
  const resolvedAgain = await json(`/admin/reports/${reportId}/resolve`, { method: "POST", headers: adminAuth, body: JSON.stringify({ outcome: "RESOLVED" }) });
  check("admin can resolve a report only once", resolvedReport.status === 204 && resolvedAgain.status === 409, `${resolvedReport.status}/${resolvedAgain.status}`);

  const priceVerification = await json("/admin/verifications", { method: "PUT", headers: adminAuth, body: JSON.stringify({ subjectType: "LISTING", subjectId: listingId, dimension: "PRICE", state: "VERIFIED", evidenceRef: "smoke:price", notes: "Confirmed in smoke." }) });
  const listingVerifications = await json(`/admin/verifications?subjectType=LISTING&subjectId=${listingId}`, { headers: adminAuth });
  check("admin verification read zero-fills all nine dimensions",
    listingVerifications.status === 200 && listingVerifications.body?.length === 9 &&
      listingVerifications.body.some((item) => item.dimension === "PRICE" && item.state === "VERIFIED") &&
      listingVerifications.body.some((item) => item.dimension === "IDENTITY" && item.state === "UNVERIFIED"),
    String(listingVerifications.status));
  const publicVerification = await json(`/listings/${listingId}/verification`);
  check("verified PRICE is reflected in the public four-boolean summary", priceVerification.status === 200 && publicVerification.status === 200 && publicVerification.body?.priceVerified === true, `${priceVerification.status}/${publicVerification.status}`);
  const identityVerification = await json("/admin/verifications", { method: "PUT", headers: adminAuth, body: JSON.stringify({ subjectType: "ADVERTISER", subjectId: advertiserRegister.body?.id, dimension: "IDENTITY", state: "VERIFIED", evidenceRef: "smoke:identity", notes: "Confirmed in smoke." }) });
  const advertiserVerifications = await json(`/admin/verifications?subjectType=ADVERTISER&subjectId=${advertiserRegister.body?.id}`, { headers: adminAuth });
  check("admin can read the advertiser verification record",
    advertiserVerifications.status === 200 && advertiserVerifications.body?.some((item) => item.dimension === "IDENTITY" && item.state === "VERIFIED"),
    String(advertiserVerifications.status));
  const verifiedDirectory = await json("/advertisers?size=100");
  check("verified advertiser appears verified in the public directory", identityVerification.status === 200 && (verifiedDirectory.body?.items ?? []).some((item) => item.id === advertiserRegister.body?.id && item.verified === true), String(identityVerification.status));

  const adminUsers = await json(`/admin/users?q=${encodeURIComponent(advertiserEmail)}&status=ACTIVE`, { headers: adminAuth });
  check("admin user search finds the active advertiser",
    adminUsers.status === 200 && (adminUsers.body?.items ?? []).some((item) => item.id === advertiserRegister.body?.id && item.status === "ACTIVE"),
    String(adminUsers.status));
  const suspendedAgent = await json(`/admin/users/${advertiserRegister.body?.id}/suspend`, { method: "POST", headers: adminAuth, body: JSON.stringify({ reason: "Smoke suspension check." }) });
  const suspendedLogin = await json("/auth/login", { method: "POST", body: JSON.stringify({ email: advertiserEmail, password: advertiserPassword }) });
  const suspendedListingDetail = await json(`/listings/${listingId}`);
  const suspendedDirectory = await json("/advertisers?size=100");
  const reinstatedAgent = await json(`/admin/users/${advertiserRegister.body?.id}/reinstate`, { method: "POST", headers: adminAuth });
  const reinstatedLogin = await json("/auth/login", { method: "POST", body: JSON.stringify({ email: advertiserEmail, password: advertiserPassword }) });
  check("suspended agent cannot sign in and can sign in after reinstatement", suspendedAgent.status === 204 && suspendedLogin.status === 403 && problemCode(suspendedLogin.body) === "account_suspended" && reinstatedAgent.status === 204 && reinstatedLogin.status === 200, `${suspendedAgent.status}/${suspendedLogin.status}/${reinstatedAgent.status}/${reinstatedLogin.status}`);
  check("suspending an advertiser hides the listing and directory profile", suspendedListingDetail.status === 404 && !(suspendedDirectory.body?.items ?? []).some((item) => item.id === advertiserRegister.body?.id), `${suspendedListingDetail.status}/${suspendedDirectory.status}`);

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
