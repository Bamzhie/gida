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
