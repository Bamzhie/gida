// Dependency-free smoke checks for the frontend preview data contracts.
// Run with: npx tsx scripts/preview-smoke.ts (requires tsx) or after
// compiling the TypeScript modules with the project's toolchain.

import assert from "node:assert/strict";
import {
  filterPreviewProperties,
  listingQueryToSearchParams,
  parseListingQuery,
  getPreviewProperty,
} from "../src/lib/preview-listings";
import { searchPreviewAgents } from "../src/lib/preview-agents";
import { PREVIEW_PROPERTIES } from "../src/lib/preview-data";

const search = parseListingQuery(
  new URLSearchParams(
    "listingType=RENT&propertyType=APARTMENT&city=Lekki&bedrooms=2&sort=price-asc"
  )
);
assert.equal(search.listingType, "RENT");
assert.equal(search.propertyType, "APARTMENT");
assert.equal(search.bedrooms, 2);
assert.deepEqual(
  filterPreviewProperties([], search),
  []
);
assert.equal(getPreviewProperty("sample-1")?.city, "Lekki");
assert.equal(getPreviewProperty("does-not-exist"), undefined);
assert.equal(searchPreviewAgents("Lekki").length > 0, true);
assert.equal(searchPreviewAgents("no such agent").length, 0);
assert.equal(
  listingQueryToSearchParams(search).get("bedrooms"),
  "2"
);

const shortlet = parseListingQuery(
  new URLSearchParams("listingType=RENT&category=SHORTLET")
);
assert.equal(shortlet.category, "SHORTLET");
const shortletResults = filterPreviewProperties(PREVIEW_PROPERTIES, shortlet);
assert.equal(shortletResults.length > 0, true);
assert.equal(
  shortletResults.every((property) => property.category === "SHORTLET"),
  true
);
assert.equal(
  listingQueryToSearchParams(shortlet).get("category"),
  "SHORTLET"
);

const newHomes = parseListingQuery(
  new URLSearchParams("listingType=SALE&category=NEWHOMES")
);
const newHomesResults = filterPreviewProperties(PREVIEW_PROPERTIES, newHomes);
assert.equal(newHomesResults.length > 0, true);
assert.equal(
  newHomesResults.every((property) => property.category === "NEWHOMES"),
  true
);
assert.equal(
  parseListingQuery(new URLSearchParams("category=bogus")).category,
  undefined
);

console.log("Preview smoke checks passed");
