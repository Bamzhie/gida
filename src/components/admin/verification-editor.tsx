"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Minus } from "lucide-react";
import type { ProblemDetail, VerificationDimension, VerificationDto } from "@/lib/api-types";
import { VERIFICATION_DIMENSIONS, VERIFICATION_STATES } from "@/lib/admin-contracts";

type VerificationEditorProps = {
  subjectType: "LISTING" | "ADVERTISER";
  subjectId: string;
  rows: VerificationDto[];
  otherSubjectRows?: VerificationDto[];
};

const SUBJECT_DIMENSIONS = {
  LISTING: new Set<VerificationDimension>([
    "PROPERTY_EXISTENCE", "LOCATION", "PRICE", "AVAILABILITY", "MEDIA_FRESHNESS",
  ]),
  ADVERTISER: new Set<VerificationDimension>([
    "IDENTITY", "BUSINESS", "REGULATORY", "AUTHORITY",
  ]),
} satisfies Record<VerificationEditorProps["subjectType"], Set<VerificationDimension>>;

/**
 * Subject-specific verification dimensions. Saving a row writes a VERIFY
 * audit entry through the API. The preview combines saved listing and
 * advertiser rows so it matches the four booleans shown to seekers.
 */
export function VerificationEditor({ subjectType, subjectId, rows, otherSubjectRows = [] }: VerificationEditorProps) {
  const router = useRouter();
  const dimensions = VERIFICATION_DIMENSIONS.filter(({ value }) => SUBJECT_DIMENSIONS[subjectType].has(value));
  const [drafts, setDrafts] = useState<Record<string, { state: string; evidenceRef: string; notes: string }>>(
    Object.fromEntries(
      dimensions.map(({ value }) => {
        const row = rows.find((candidate) => candidate.dimension === value);
        return [
          value,
          {
            state: row?.state ?? "UNVERIFIED",
            evidenceRef: row?.evidenceRef ?? "",
            notes: row?.notes ?? "",
          },
        ];
      })
    )
  );
  const [savedStates, setSavedStates] = useState<Record<string, string>>(
    Object.fromEntries(
      dimensions.map(({ value }) => [
        value,
        rows.find((row) => row.dimension === value)?.state ?? "UNVERIFIED",
      ])
    )
  );
  const [busy, setBusy] = useState<VerificationDimension | null>(null);

  function update(dimension: VerificationDimension, patch: Partial<{ state: string; evidenceRef: string; notes: string }>) {
    setDrafts((current) => ({ ...current, [dimension]: { ...current[dimension], ...patch } }));
  }

  async function save(dimension: VerificationDimension) {
    const draft = drafts[dimension];
    setBusy(dimension);
    const response = await fetch("/api/admin/verifications", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        subjectType,
        subjectId,
        dimension,
        state: draft.state,
        evidenceRef: draft.evidenceRef,
        notes: draft.notes,
      }),
    });
    setBusy(null);
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemDetail | null;
      toast.error(problem?.detail ?? "That verification did not save.");
      return;
    }
    const saved = (await response.json()) as VerificationDto;
    setSavedStates((current) => ({ ...current, [dimension]: saved.state }));
    toast.success("Verification saved.");
    router.refresh();
  }

  const stateOf = (dimension: VerificationDimension) => {
    if (SUBJECT_DIMENSIONS[subjectType].has(dimension)) {
      return savedStates[dimension] ?? "UNVERIFIED";
    }
    return otherSubjectRows.find((row) => row.dimension === dimension)?.state ?? "UNVERIFIED";
  };
  const preview = {
    advertiserVerified: stateOf("IDENTITY") === "VERIFIED" || stateOf("BUSINESS") === "VERIFIED",
    propertyVerified: stateOf("PROPERTY_EXISTENCE") === "VERIFIED",
    locationVerified: stateOf("LOCATION") === "VERIFIED",
    priceVerified: stateOf("PRICE") === "VERIFIED",
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">Dimension</th>
              <th scope="col" className="px-3 py-2 font-medium">State</th>
              <th scope="col" className="px-3 py-2 font-medium">Evidence</th>
              <th scope="col" className="px-3 py-2 font-medium">Notes</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Save</th>
            </tr>
          </thead>
          <tbody>
            {dimensions.map(({ value, label }) => (
              <tr key={value} className="border-t border-border align-top">
                <td className="px-3 py-2 font-medium">{label}</td>
                <td className="px-3 py-2">
                  <Select value={drafts[value].state} onValueChange={(next) => update(value, { state: next })}>
                    <SelectTrigger aria-label={`${label} state`} className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VERIFICATION_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    aria-label={`${label} evidence reference`}
                    value={drafts[value].evidenceRef}
                    onChange={(event) => update(value, { evidenceRef: event.target.value })}
                    placeholder="Ref or URL"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    aria-label={`${label} notes`}
                    value={drafts[value].notes}
                    onChange={(event) => update(value, { notes: event.target.value })}
                    placeholder="Optional"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => save(value)}
                    disabled={busy !== null}
                    className="rounded-xl"
                  >
                    {busy === value ? "Saving…" : "Save"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-border bg-secondary/30 p-4" role="status" aria-live="polite">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <Label className="block">Public verification preview</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">Based on saved checks across this listing and advertiser.</p>
          </div>
          <Badge variant="outline">Saved state</Badge>
        </div>
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          <PreviewLine on={preview.advertiserVerified} label="Verified advertiser" />
          <PreviewLine on={preview.propertyVerified} label="Property checked" />
          <PreviewLine on={preview.locationVerified} label="Location checked" />
          <PreviewLine on={preview.priceVerified} label="Price confirmed" />
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          This reflects saved verification states. Unsaved changes above do not affect what seekers see yet.
        </p>
      </div>
    </div>
  );
}

function PreviewLine({ on, label }: { on: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${on ? "border-emerald-200 bg-emerald-50/70 font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100" : "border-border bg-background text-muted-foreground"}`}>
      {on ? <Check className="size-4 shrink-0" aria-hidden="true" /> : <Minus className="size-4 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
      <span className="ml-auto text-xs">{on ? "Shown" : "Hidden"}</span>
    </li>
  );
}
