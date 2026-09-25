"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Pencil, X, Trash2, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  filterByPolygon,
  type LatLngTuple,
} from "@/lib/geo";
import { LAGOS_CENTER, SAMPLE_MAP_LISTINGS } from "@/lib/sample-map-listings";

const DRAW_COLOR = "#b1552e";
const MIN_PX_GAP = 6;
const MAX_POINTS = 400;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

function priceIcon(label: string, active: boolean) {
  const safeLabel = escapeHtml(label);
  return L.divIcon({
    className: "gida-price-marker",
    html: `<span role="img" aria-label="${safeLabel}" style="
      display:inline-block;
      background:${active ? "#15140f" : "#ffffff"};
      color:${active ? "#f8f6f0" : "#15140f"};
      border:1px solid #15140f;
      border-radius:999px;
      padding:4px 10px;
      font-size:12px;
      font-weight:600;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
    ">${safeLabel}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function BoundsTracker({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMap();
  const onBoundsChangeRef = useRef(onBoundsChange);

  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    const update = () => onBoundsChangeRef.current(map.getBounds());
    update();
    map.on("moveend", update);
    return () => {
      map.off("moveend", update);
    };
  }, [map]);

  return null;
}

function FreehandDraw({
  active,
  onProgress,
  onComplete,
}: {
  active: boolean;
  onProgress: (count: number) => void;
  onComplete: (polygon: LatLngTuple[]) => void;
}) {
  const map = useMap();
  const [stroke, setStroke] = useState<LatLngTuple[]>([]);
  const strokeRef = useRef<LatLngTuple[]>([]);
  const callbacksRef = useRef({ onProgress, onComplete });

  useEffect(() => {
    callbacksRef.current = { onProgress, onComplete };
  }, [onComplete, onProgress]);

  useEffect(() => {
    if (!active) return;
    strokeRef.current = [];
    callbacksRef.current.onProgress(0);

    map.dragging.disable();
    map.doubleClickZoom.disable();
    if (map.boxZoom) map.boxZoom.disable();

    const container = map.getContainer();
    const prevTouchAction = container.style.touchAction;
    container.style.touchAction = "none";

    let stroking = false;
    let activePointers = 0;
    let lastPx: { x: number; y: number } | null = null;

    const toLatLng = (clientX: number, clientY: number): LatLngTuple => {
      const rect = container.getBoundingClientRect();
      const ll = map.containerPointToLatLng(L.point(clientX - rect.left, clientY - rect.top));
      return [ll.lat, ll.lng];
    };

    const pushPoint = (clientX: number, clientY: number, force = false) => {
      if (!force && lastPx) {
        const dx = clientX - lastPx.x;
        const dy = clientY - lastPx.y;
        if (dx * dx + dy * dy < MIN_PX_GAP * MIN_PX_GAP) return;
      }
      lastPx = { x: clientX, y: clientY };
      strokeRef.current.push(toLatLng(clientX, clientY));
      if (strokeRef.current.length > MAX_POINTS) {
        strokeRef.current = strokeRef.current.filter((_, i) => i % 2 === 0);
      }
      setStroke([...strokeRef.current]);
      callbacksRef.current.onProgress(strokeRef.current.length);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      activePointers += 1;
      if (activePointers !== 1) {
        stroking = false;
        strokeRef.current = [];
        setStroke([]);
        callbacksRef.current.onProgress(0);
        return;
      }
      stroking = true;
      lastPx = null;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture is best-effort.
      }
      pushPoint(e.clientX, e.clientY, true);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!stroking || activePointers !== 1) return;
      pushPoint(e.clientX, e.clientY);
    };

    const onPointerUp = () => {
      activePointers = Math.max(0, activePointers - 1);
      if (!stroking || activePointers > 0) return;
      stroking = false;
      const finished = strokeRef.current;
      strokeRef.current = [];
      setStroke([]);
      callbacksRef.current.onProgress(0);
      if (finished.length >= 3) callbacksRef.current.onComplete(finished);
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      container.style.touchAction = prevTouchAction;
      map.dragging.enable();
      map.doubleClickZoom.enable();
      if (map.boxZoom) map.boxZoom.enable();
    };
  }, [active, map]);

  if (!active || stroke.length < 2) return null;
  return <Polyline positions={stroke} color={DRAW_COLOR} weight={3} dashArray="2 6" />;
}

export function SearchMap() {
  const allListings = SAMPLE_MAP_LISTINGS;
  const [drawing, setDrawing] = useState(false);
  const [strokePoints, setStrokePoints] = useState(0);
  const [polygon, setPolygon] = useState<LatLngTuple[] | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [searchAsIMove, setSearchAsIMove] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function startDrawing() {
    setPolygon(null);
    setSelectedId(null);
    setStrokePoints(0);
    setDrawing(true);
  }

  function cancelDrawing() {
    setDrawing(false);
    setStrokePoints(0);
  }

  function handleComplete(finished: LatLngTuple[]) {
    setPolygon(finished);
    setSelectedId(null);
    setDrawing(false);
    setStrokePoints(0);
  }

  function clearPolygon() {
    setPolygon(null);
    setSelectedId(null);
    setDrawing(false);
    setStrokePoints(0);
  }

  const revealed = polygon !== null && !drawing;
  const visibleListings = useMemo(() => {
    if (!revealed) return [];
    let result = filterByPolygon(allListings, polygon);
    if (searchAsIMove && bounds) {
      result = result.filter((listing) => bounds.contains([listing.lat, listing.lng]));
    }
    return result;
  }, [allListings, bounds, polygon, revealed, searchAsIMove]);
  const inPolygonCount = useMemo(
    () => visibleListings.length,
    [visibleListings]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="lg:flex-1">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border">
            {!drawing ? (
              <Button size="sm" className="rounded-full" onClick={startDrawing}>
                <Pencil className="h-4 w-4" /> Draw search area
              </Button>
            ) : (
              <>
                <Badge variant="secondary" className="rounded-full">
                  {strokePoints > 0
                    ? `Drawing… ${strokePoints} points — release to finish`
                    : "Press and hold, then draw on the map"}
                </Badge>
                <Button size="sm" variant="ghost" className="rounded-full" onClick={cancelDrawing}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </>
            )}
            {polygon && !drawing && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-full ml-auto"
                onClick={clearPolygon}
              >
                <Trash2 className="h-4 w-4" /> Clear area
              </Button>
            )}
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={searchAsIMove}
                onChange={(e) => setSearchAsIMove(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#b1552e]"
              />
              Search as I move the map
            </label>
          </div>

          <div className="relative h-[480px] lg:h-[600px] w-full z-0">
            <MapContainer
              center={LAGOS_CENTER}
              zoom={11}
              scrollWheelZoom
              className="h-full w-full"
              style={{ cursor: drawing ? "crosshair" : undefined }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <BoundsTracker onBoundsChange={setBounds} />
              <FreehandDraw
                active={drawing}
                onProgress={setStrokePoints}
                onComplete={handleComplete}
              />
              {revealed &&
                visibleListings.map((listing) => (
                  <Marker
                    key={listing.id}
                    position={[listing.lat, listing.lng]}
                    icon={priceIcon(listing.priceLabel, selectedId === listing.id)}
                    eventHandlers={{ click: () => setSelectedId(listing.id) }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{listing.title}</p>
                        <p className="text-muted-foreground">{listing.area}</p>
                        <p className="font-bold mt-1">{listing.priceLabel}</p>
                        <Link href={`/listings/${listing.id}`} className="underline underline-offset-2">
                          View listing
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              {polygon && (
                <Polygon
                  positions={polygon}
                  pathOptions={{
                    color: DRAW_COLOR,
                    weight: 2,
                    fillColor: DRAW_COLOR,
                    fillOpacity: 0.12,
                    fillRule: "evenodd",
                  }}
                />
              )}
            </MapContainer>

            {drawing && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] rounded-full bg-black/80 text-white text-xs px-4 py-2 pointer-events-none whitespace-nowrap">
                Press and hold, draw your area · release when done
              </div>
            )}
            {!drawing && !polygon && (
              <div className="absolute top-3 left-3 z-[500] pointer-events-none">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background/95 border border-border shadow px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <EyeOff className="h-3.5 w-3.5" /> Homes hidden · draw to reveal
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-border text-xs text-muted-foreground">
            {!polygon ? (
              <span>
                {allListings.length} preview homes in Lagos — draw an area to reveal them
              </span>
            ) : (
              <span>
                <strong className="text-foreground">{inPolygonCount}</strong> of{" "}
                {allListings.length} preview homes inside your area
                {searchAsIMove && bounds ? " and current map view" : ""}
              </span>
            )}
            <Badge variant="outline" className="rounded-full">preview data</Badge>
          </div>
        </div>
      </div>

      <div className="lg:w-[380px] shrink-0">
        <div className="rounded-2xl border border-border bg-card p-4 lg:max-h-[668px] lg:overflow-y-auto">
          <h2 className="font-heading font-semibold mb-1">
            {revealed ? "Inside your drawn area" : "No area drawn yet"}
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            {revealed
              ? "Only homes inside the polygon are shown. Clear the area to hide them again."
              : "Draw an area on the map — matching homes will appear here once you release."}
          </p>
          <div className="space-y-3">
            {revealed &&
              visibleListings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedId(listing.id)}
                  aria-pressed={selectedId === listing.id}
                  aria-label={`Select ${listing.title}`}
                  className={`w-full text-left rounded-xl border p-3 transition-colors hover:bg-secondary ${
                    selectedId === listing.id ? "border-primary" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-sm">{listing.priceLabel}</span>
                    <Badge variant={listing.listingType === "SALE" ? "default" : "secondary"} className="text-[11px]">
                      For {listing.listingType === "SALE" ? "Sale" : "Rent"}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {listing.area}
                    {listing.beds ? ` · ${listing.beds} bed` : ""}
                    {listing.baths ? ` · ${listing.baths} bath` : ""}
                  </p>
                </button>
              ))}
            {revealed && visibleListings.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No homes inside this area yet. Try drawing a bigger area.
              </p>
            )}
            {!revealed && (
              <div className="text-center py-8">
                <EyeOff className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">
                  Browse all preview homes
                </p>
                <Button size="sm" variant="outline" className="rounded-full" asChild>
                  <Link href="/listings">Browse all preview homes</Link>
                </Button>
                <Button size="sm" className="rounded-full" onClick={startDrawing}>
                  <Pencil className="h-4 w-4" /> Draw search area
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
