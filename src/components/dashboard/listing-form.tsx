"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  AmenityDto,
  Availability,
  CostType,
  ListingCategory,
  ListingCreatedDto,
  ListingType,
  Lifecycle,
  LocationDto,
  PricePeriod,
  PropertyType,
} from "@/lib/api-types";
import { listingProblemMessage } from "@/lib/listing-problems";
import { COST_LABELS } from "@/lib/listing-view";

export type ListingFormCost = {
  type: CostType;
  amount: string;
  note: string;
};

export type ListingFormInitial = {
  listingType: ListingType;
  category: ListingCategory | "";
  title: string;
  description: string;
  price: string;
  pricePeriod: PricePeriod | "";
  availability: Availability;
  addressLine: string;
  stateSlug: string;
  lgaSlug: string;
  locationSlug: string;
  propertyType: PropertyType | "";
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  lotSizeSqm: string;
  yearBuilt: string;
  parking: string;
  furnished: "true" | "false" | "";
  amenities: string[];
  costs: ListingFormCost[];
};

const PRICE_PERIOD_LABELS: Record<PricePeriod, string> = {
  YEAR: "Per year",
  MONTH: "Per month",
  NIGHT: "Per night",
  STAY: "Per stay",
};

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: "Apartment",
  HOUSE: "House",
  TOWNHOUSE: "Townhouse",
  CONDO: "Condo",
  LAND: "Land",
  COMMERCIAL: "Commercial",
};

const COST_TYPES = Object.keys(COST_LABELS) as CostType[];

const PRICE_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;
const COUNT_PATTERN = /^\d+$/;

type ListingFormProps = {
  mode: "create" | "edit";
  listingId?: string;
  lifecycle: Lifecycle | null;
  /** True when the API locks property facts, costs and media (published or unknown detail). */
  structureLocked: boolean;
  /** False when the saved description cannot be loaded, so blank means "keep it". */
  descriptionKnown: boolean;
  initial: ListingFormInitial;
  locations: LocationDto[];
  amenities: AmenityDto[];
  children?: ReactNode;
};

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeMoneyInput(value: string): string {
  const cleaned = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [whole, ...fractions] = cleaned.split(".");
  if (fractions.length === 0) return whole;
  return `${whole || "0"}.${fractions.join("").slice(0, 2)}`;
}

function formatMoneyInput(value: string): string {
  if (!value) return "";
  const [whole, fraction] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

function updateMoneyInput(event: ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) {
  const input = event.currentTarget;
  const logicalCursor = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/,/g, "").length;
  const nextValue = normalizeMoneyInput(input.value);
  onChange(nextValue);
  requestAnimationFrame(() => {
    const formatted = formatMoneyInput(nextValue);
    let cursor = 0;
    let characters = 0;
    while (cursor < formatted.length && characters < logicalCursor) {
      if (formatted[cursor] !== ",") characters += 1;
      cursor += 1;
    }
    input.setSelectionRange(cursor, cursor);
  });
}

export function ListingForm({
  mode,
  listingId,
  lifecycle,
  structureLocked,
  descriptionKnown,
  initial,
  locations,
  amenities,
  children,
}: ListingFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<ListingFormInitial>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const states = locations.filter((location) => location.kind === "STATE");
  const lgas = locations.filter(
    (location) => location.kind === "LGA" && location.parentSlug === values.stateSlug
  );
  const localAreas = locations.filter(
    (location) =>
      (location.kind === "AREA" || location.kind === "ESTATE") && location.parentSlug === values.lgaSlug
  );
  const stateAreas = locations.filter(
    (location) =>
      (location.kind === "AREA" || location.kind === "ESTATE") && location.parentSlug === values.stateSlug
  );
  const areaOptions = values.lgaSlug ? localAreas : stateAreas;

  function set<K extends keyof ListingFormInitial>(key: K, value: ListingFormInitial[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function updateCost(index: number, patch: Partial<ListingFormCost>) {
    setValues((current) => ({
      ...current,
      costs: current.costs.map((cost, i) => (i === index ? { ...cost, ...patch } : cost)),
    }));
  }

  function updateListingType(listingType: ListingType) {
    setValues((current) => {
      const category = listingType === "SALE" && current.category === "SHORTLET"
        ? "STANDARD"
        : current.category;
      const pricePeriod = listingType === "SALE"
        ? ""
        : current.listingType === "SALE"
          ? (category === "SHORTLET" ? "NIGHT" : "YEAR")
          : current.pricePeriod;
      return { ...current, listingType, category, pricePeriod };
    });
  }

  function updateCategory(category: ListingCategory) {
    setValues((current) => {
      const allowedPeriods: PricePeriod[] = category === "SHORTLET" ? ["NIGHT", "STAY"] : ["YEAR", "MONTH"];
      const pricePeriod = current.listingType !== "RENT"
        ? current.pricePeriod
        : allowedPeriods.includes(current.pricePeriod as PricePeriod)
          ? current.pricePeriod
          : category === "SHORTLET" ? "NIGHT" : "YEAR";
      return { ...current, category, pricePeriod };
    });
  }

  function validate(): Record<string, string> {
    const found: Record<string, string> = {};
    if (!values.title.trim()) found.title = "Add a title.";
    else if (values.title.trim().length > 200) found.title = "Keep the title under 200 characters.";
    if (descriptionKnown && !values.description.trim()) found.description = "Describe the property.";
    if (!PRICE_PATTERN.test(values.price.trim())) {
      found.price = "Enter the price in naira (whole number, up to two decimals).";
    }
    if (values.listingType === "RENT" && !values.pricePeriod) {
      found.pricePeriod = "Choose how the rent is quoted.";
    }
    // Property facts are locked and possibly unknown on locked listings; only
    // require them when this form can actually edit the property section.
    if (!structureLocked) {
      if (!values.propertyType) found.propertyType = "Choose the property type.";
      if (!values.locationSlug) found.locationSlug = "Choose the location.";
      if (values.furnished === "") found.furnished = "Say whether the place comes furnished.";
    }
    if (values.yearBuilt.trim()) {
      const year = Number(values.yearBuilt);
      if (!COUNT_PATTERN.test(values.yearBuilt) || year < 1500 || year > 2100) {
        found.yearBuilt = "Year built must be between 1500 and 2100.";
      }
    }
    for (const [key, label] of [
      ["bedrooms", "Bedrooms"],
      ["bathrooms", "Bathrooms"],
    ] as const) {
      if (values[key].trim() && !COUNT_PATTERN.test(values[key].trim())) {
        found[key] = `${label} must be a whole number.`;
      }
    }
    const seenTypes = new Set<string>();
    for (const cost of values.costs) {
      if (seenTypes.has(cost.type)) {
        found.costs = "Each cost type can appear only once.";
        break;
      }
      seenTypes.add(cost.type);
      if (!PRICE_PATTERN.test(cost.amount.trim())) {
        found.costs = "Every disclosed cost needs an amount in naira (up to two decimals).";
        break;
      }
    }
    return found;
  }

  function requireSignIn(status: number): boolean {
    if (status !== 401) return false;
    toast.error("Sign in to manage your listings.");
    router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
    return true;
  }

  function buildPropertyBody() {
    return {
      locationSlug: values.locationSlug,
      addressLine: values.addressLine.trim() || undefined,
      propertyType: values.propertyType as PropertyType,
      bedrooms: optionalNumber(values.bedrooms),
      bathrooms: optionalNumber(values.bathrooms),
      sizeSqm: optionalNumber(values.sizeSqm),
      lotSizeSqm: optionalNumber(values.lotSizeSqm),
      yearBuilt: optionalNumber(values.yearBuilt),
      parking: optionalNumber(values.parking),
      furnished: values.furnished === "" ? undefined : values.furnished === "true",
      amenities: values.amenities,
    };
  }

  function buildCostsBody() {
    if (values.costs.length === 0) return undefined;
    return values.costs.map((cost) => ({
      type: cost.type,
      amount: Number(cost.amount.trim()),
      note: cost.note.trim() || undefined,
    }));
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Check the highlighted fields.");
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/dashboard/listings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: values.title.trim(),
        description: values.description.trim(),
        listingType: values.listingType,
        category: values.category || undefined,
        price: Number(values.price.trim()),
        pricePeriod: values.listingType === "RENT" ? values.pricePeriod || undefined : undefined,
        property: buildPropertyBody(),
        costs: buildCostsBody(),
      }),
    });
    setSubmitting(false);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    const created = (await response.json()) as ListingCreatedDto;
    toast.success("Draft saved. Upload media, then publish when it's ready.");
    router.push("/dashboard/agent/listings/" + created.id + "/edit");
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      toast.error("Check the highlighted fields.");
      return;
    }
    setSubmitting(true);
    const response = await fetch(`/api/dashboard/listings/${listingId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: values.title.trim(),
        // When the saved description can't be loaded, blank means "keep it".
        description: values.description.trim() || undefined,
        price: Number(values.price.trim()),
        listingType: structureLocked ? undefined : values.listingType,
        category: structureLocked ? undefined : values.category || "STANDARD",
        pricePeriod: values.listingType === "RENT" ? values.pricePeriod || undefined : null,
        availability: values.availability,
        property: structureLocked ? undefined : buildPropertyBody(),
        costs: structureLocked ? undefined : values.costs.map((cost) => ({
          type: cost.type,
          amount: Number(cost.amount.trim()),
          note: cost.note.trim() || undefined,
        })),
      }),
    });
    setSubmitting(false);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    toast.success("Changes saved.");
    router.push(listingId ? `/dashboard/agent/listings/${listingId}` : "/dashboard/agent/listings");
  }

  async function submitForReview() {
    if (!listingId) return;
    setPublishing(true);
    const response = await fetch(`/api/dashboard/listings/${listingId}/submit`, { method: "POST" });
    setPublishing(false);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    toast.success("Submitted for review. It goes live once a reviewer approves it.");
    router.push("/dashboard/agent/listings");
  }

  async function resume() {
    if (!listingId) return;
    setPublishing(true);
    const response = await fetch(`/api/dashboard/listings/${listingId}/resume`, { method: "POST" });
    setPublishing(false);
    if (requireSignIn(response.status)) return;
    if (!response.ok) {
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    toast.success("The listing is live again.");
    router.refresh();
  }

  const rent = values.listingType === "RENT";
  const pricePeriods: PricePeriod[] = values.category === "SHORTLET" ? ["NIGHT", "STAY"] : ["YEAR", "MONTH"];
  const errorText = (key: string) =>
    errors[key] ? <p className="text-sm text-destructive">{errors[key]}</p> : null;

  const CATEGORY_LABELS: Record<ListingCategory, string> = {
    STANDARD: "Standard",
    SHORTLET: "Short-let",
    NEW_HOMES: "New homes",
  };

  const basics = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="listing-title">Title *</Label>
        <Input
          id="listing-title"
          value={values.title}
          onChange={(event) => set("title", event.target.value)}
          maxLength={200}
          placeholder="e.g. 3-bedroom apartment with standby generator, Ikeja"
        />
        {errorText("title")}
      </div>
      {mode === "create" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="listing-type">Listing type *</Label>
            <Select
              value={values.listingType}
              onValueChange={(listingType) => updateListingType(listingType as ListingType)}
            >
              <SelectTrigger id="listing-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SALE">For sale</SelectItem>
                <SelectItem value="RENT">For rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-category">Category</Label>
            <Select value={values.category || "STANDARD"} onValueChange={(category) => updateCategory(category as ListingCategory)}>
              <SelectTrigger id="listing-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="SHORTLET" disabled={values.listingType === "SALE"}>Short-let</SelectItem>
                <SelectItem value="NEW_HOMES">New homes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : structureLocked ? (
        <div className="space-y-2">
          <Label>Listing type</Label>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={values.listingType === "SALE" ? "default" : "secondary"}>
              For {values.listingType === "SALE" ? "sale" : "rent"}
            </Badge>
            {values.category && <Badge variant="outline">{CATEGORY_LABELS[values.category]}</Badge>}
            <span>Type and category are locked after approval.</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="listing-type">Listing type *</Label>
            <Select value={values.listingType} onValueChange={(listingType) => updateListingType(listingType as ListingType)}>
              <SelectTrigger id="listing-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SALE">For sale</SelectItem>
                <SelectItem value="RENT">For rent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="listing-category">Category</Label>
            <Select value={values.category || "STANDARD"} onValueChange={(category) => updateCategory(category as ListingCategory)}>
              <SelectTrigger id="listing-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="STANDARD">Standard</SelectItem>
                <SelectItem value="SHORTLET" disabled={values.listingType === "SALE"}>Short-let</SelectItem>
                <SelectItem value="NEW_HOMES">New homes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="listing-description">{descriptionKnown ? "Description *" : "Description"}</Label>
        <Textarea
          id="listing-description"
          value={values.description}
          onChange={(event) => set("description", event.target.value)}
          rows={6}
          placeholder={
            descriptionKnown
              ? "Describe the place as you would to someone standing in it."
              : "The saved description can't be loaded right now. Leave blank to keep it, or type a full replacement."
          }
        />
        {errorText("description")}
      </div>
    </div>
  );

  const priceSection = (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="listing-price">{rent ? "Basic rent (₦) *" : "Asking price (₦) *"}</Label>
          <Input
            id="listing-price"
            type="text"
            inputMode="decimal"
            value={formatMoneyInput(values.price)}
            onChange={(event) => updateMoneyInput(event, (price) => set("price", price))}
            placeholder={rent ? "e.g. 2,500,000" : "e.g. 85,000,000"}
          />
          {errorText("price")}
        </div>
        {rent && (
          <div className="space-y-2">
            <Label htmlFor="listing-period">How often is this rent paid? *</Label>
            <Select
              value={values.pricePeriod || "none"}
              onValueChange={(period) => set("pricePeriod", period === "none" ? "" : (period as PricePeriod))}
            >
              <SelectTrigger id="listing-period"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>Choose a period</SelectItem>
                {pricePeriods.map((period) => (
                  <SelectItem key={period} value={period}>{PRICE_PERIOD_LABELS[period]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errorText("pricePeriod")}
          </div>
        )}
      </div>
      <div className="space-y-3 border-t border-border pt-5">
        {renderCostsSection()}
      </div>
      {mode === "edit" && (
        <div className="space-y-2">
          <Label htmlFor="listing-availability">Availability</Label>
          <Select value={values.availability} onValueChange={(availability) => set("availability", availability as Availability)}>
            <SelectTrigger id="listing-availability" className="sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SOLD">Sold</SelectItem>
              <SelectItem value="RENTED">Rented</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const propertySection = (
    <fieldset disabled={structureLocked} className="space-y-5 disabled:opacity-70">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="listing-property-type">Property type *</Label>
          <Select
            value={values.propertyType || "none"}
            onValueChange={(propertyType) => set("propertyType", propertyType === "none" ? "" : (propertyType as PropertyType))}
          >
            <SelectTrigger id="listing-property-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Choose a type</SelectItem>
              {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((type) => (
                <SelectItem key={type} value={type}>{PROPERTY_TYPE_LABELS[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorText("propertyType")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-furnished">Furnishing *</Label>
          <Select
            value={values.furnished || "none"}
            onValueChange={(furnished) => set("furnished", furnished === "none" ? "" : (furnished as "true" | "false"))}
          >
            <SelectTrigger id="listing-furnished"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Choose one</SelectItem>
              <SelectItem value="true">Furnished</SelectItem>
              <SelectItem value="false">Unfurnished</SelectItem>
            </SelectContent>
          </Select>
          {errorText("furnished")}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="listing-bedrooms">Bedrooms</Label>
          <Input id="listing-bedrooms" type="number" min="0" inputMode="numeric" value={values.bedrooms}
                 onChange={(event) => set("bedrooms", event.target.value)} />
          {errorText("bedrooms")}
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-bathrooms">Bathrooms</Label>
          <Input id="listing-bathrooms" type="number" min="0" inputMode="numeric" value={values.bathrooms}
                 onChange={(event) => set("bathrooms", event.target.value)} />
          {errorText("bathrooms")}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="listing-size">Indoor floor area (m²)</Label>
          <Input id="listing-size" type="number" min="0" step="0.01" inputMode="decimal" value={values.sizeSqm} placeholder="e.g. 85"
                 onChange={(event) => set("sizeSqm", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-lot">Plot or land area (m²)</Label>
          <Input id="listing-lot" type="number" min="0" step="0.01" inputMode="decimal" value={values.lotSizeSqm} placeholder="e.g. 450"
                 onChange={(event) => set("lotSizeSqm", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-year">Year built (if known)</Label>
          <Input id="listing-year" type="number" min="1500" max="2100" inputMode="numeric" value={values.yearBuilt}
                 onChange={(event) => set("yearBuilt", event.target.value)} />
          {errorText("yearBuilt")}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="listing-address">Street address</Label>
        <Input id="listing-address" value={values.addressLine} maxLength={255}
               onChange={(event) => set("addressLine", event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="listing-state">State *</Label>
          <Select
            value={values.stateSlug || "none"}
            onValueChange={(slug) =>
              setValues((current) => ({ ...current, stateSlug: slug === "none" ? "" : slug, lgaSlug: "", locationSlug: "" }))
            }
          >
            <SelectTrigger id="listing-state"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>Choose a state</SelectItem>
              {states.map((state) => (
                <SelectItem key={state.slug} value={state.slug}>{state.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-lga">Local government</Label>
          <Select
            value={values.lgaSlug || "none"}
            onValueChange={(slug) =>
              setValues((current) => ({ ...current, lgaSlug: slug === "none" ? "" : slug, locationSlug: "" }))
            }
            disabled={!values.stateSlug}
          >
            <SelectTrigger id="listing-lga"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>
                {values.stateSlug ? "Choose an LGA" : "Choose a state first"}
              </SelectItem>
              {lgas.map((lga) => (
                <SelectItem key={lga.slug} value={lga.slug}>{lga.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="listing-area">Area or estate *</Label>
          <Select
            value={values.locationSlug || "none"}
            onValueChange={(slug) => set("locationSlug", slug === "none" ? "" : slug)}
            disabled={!values.stateSlug}
          >
            <SelectTrigger id="listing-area"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" disabled>
                {values.stateSlug ? "Choose an area" : "Choose a state first"}
              </SelectItem>
              {areaOptions.map((area) => (
                <SelectItem key={area.slug} value={area.slug}>{area.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorText("locationSlug")}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Amenities</Label>
        {amenities.length === 0 ? (
          <p className="text-sm text-muted-foreground">The amenity list is unavailable right now.</p>
        ) : (
          <div className="grid gap-2 rounded-2xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map((amenity) => (
              <label key={amenity.slug} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-input accent-[var(--accent)]"
                  checked={values.amenities.includes(amenity.slug)}
                  onChange={() =>
                    setValues((current) => ({
                      ...current,
                      amenities: current.amenities.includes(amenity.slug)
                        ? current.amenities.filter((slug) => slug !== amenity.slug)
                        : [...current.amenities, amenity.slug],
                    }))
                  }
                />
                {amenity.label}
              </label>
            ))}
          </div>
        )}
      </div>
      {structureLocked && (
        <p className="text-sm text-muted-foreground">
          Property facts are locked for this listing. Duplicate it from My listings to start an
          editable draft copy.
        </p>
      )}
    </fieldset>
  );

  function renderCostsSection() {
    return (
    <fieldset disabled={structureLocked} className="space-y-3 disabled:opacity-70">
      <div>
        <h3 className="font-semibold">Additional costs and fees</h3>
      </div>
      {errors.costs && <p className="text-sm text-destructive">{errors.costs}</p>}
      <ul className="space-y-2">
        {values.costs.map((cost, index) => (
          <li key={index} className="grid items-end gap-3 rounded-xl border border-border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,10rem)_auto]">
            <div className="space-y-2">
              <Label htmlFor={`cost-type-${index}`}>Charge</Label>
              <Select value={cost.type} onValueChange={(type) => updateCost(index, { type: type as CostType })}>
                <SelectTrigger id={`cost-type-${index}`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COST_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{COST_LABELS[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`cost-amount-${index}`}>Amount (₦)</Label>
              <Input
                id={`cost-amount-${index}`}
                type="text"
                inputMode="decimal"
                value={formatMoneyInput(cost.amount)}
                onChange={(event) => updateMoneyInput(event, (amount) => updateCost(index, { amount }))}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setValues((current) => ({ ...current, costs: current.costs.filter((_, i) => i !== index) }))}
              aria-label={`Remove cost ${index + 1}`}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          setValues((current) => ({
            ...current,
            costs: [...current.costs, { type: "AGENCY_FEE", amount: "", note: "" }],
          }))
        }
      >
        <Plus /> Add a cost
      </Button>
      {structureLocked && (
        <p className="text-sm text-muted-foreground">Costs are locked for this listing.</p>
      )}
    </fieldset>
    );
  }

  return (
    <form className="space-y-10" onSubmit={mode === "create" ? submitCreate : submitEdit} noValidate>
      {mode === "edit" && !descriptionKnown && (
        <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
          This listing isn&apos;t public right now, and its saved description and property details
          can&apos;t be loaded yet. You can still correct the title, price and availability below —
          leave the description blank to keep what&apos;s saved.
        </p>
      )}
      {mode === "edit" && structureLocked && descriptionKnown && (
        <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
          This listing is live, so its property facts, costs and media are locked. Pause it from My
          listings to take it off the market, or duplicate it to keep editing a copy.
        </p>
      )}
      {mode === "edit" && !structureLocked && (lifecycle === "SUBMITTED" || lifecycle === "UNDER_REVIEW") && (
        <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
          This listing is awaiting admin approval. Your changes will be included in the review.
        </p>
      )}
      <section aria-labelledby="listing-info-heading" className="space-y-5">
        <h2 id="listing-info-heading" className="font-heading text-lg font-semibold">Listing information</h2>
        {basics}
      </section>
      <section aria-labelledby="price-heading" className="space-y-5">
        <h2 id="price-heading" className="font-heading text-lg font-semibold">{rent ? "Rent and costs" : "Price and costs"}</h2>
        {priceSection}
      </section>
      <section aria-labelledby="property-heading" className="space-y-5">
        <h2 id="property-heading" className="font-heading text-lg font-semibold">The property</h2>
        {propertySection}
      </section>
      {children}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={submitting} className="rounded-xl">
          {mode === "create" ? "Save draft" : "Save changes"}
        </Button>
        {mode === "edit" && (lifecycle === "DRAFT" || lifecycle === "REJECTED") && (
          <Button type="button" variant="secondary" disabled={publishing} onClick={submitForReview} className="rounded-xl">
            <Send /> Submit for review
          </Button>
        )}
        {mode === "edit" && lifecycle === "PAUSED" && (
          <Button type="button" variant="secondary" disabled={publishing} onClick={resume} className="rounded-xl">
            <PlayCircle /> Resume publishing
          </Button>
        )}
        {mode === "create" && (
          <p className="text-sm text-muted-foreground">
            Save this draft to add photos and videos next. It stays private until a reviewer approves it.
          </p>
        )}
      </div>
    </form>
  );
}
