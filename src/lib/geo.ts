export type LatLngTuple = [number, number];

export interface MappedListing {
  id: string;
  title: string;
  price: number;
  priceLabel: string;
  listingType: "SALE" | "RENT";
  propertyType: string;
  beds: number | null;
  baths: number | null;
  area: string;
  lat: number;
  lng: number;
}

/** Ray-casting point-in-polygon. Polygon is an array of [lat, lng]. */
export function isPointInPolygon(
  point: LatLngTuple,
  polygon: LatLngTuple[]
): boolean {
  const [x, y] = [point[1], point[0]]; // lng, lat
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [latI, lngI] = polygon[i];
    const [latJ, lngJ] = polygon[j];
    const xi = lngI;
    const yi = latI;
    const xj = lngJ;
    const yj = latJ;

    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }

  return inside;
}

export function filterByPolygon<T extends { lat: number; lng: number }>(
  items: T[],
  polygon: LatLngTuple[] | null
): T[] {
  if (!polygon || polygon.length < 3) return items;
  return items.filter((item) =>
    isPointInPolygon([item.lat, item.lng], polygon)
  );
}

export function polygonToQueryParam(polygon: LatLngTuple[]): string {
  return polygon.map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join(";");
}

export function parsePolygonParam(param: string | null): LatLngTuple[] | null {
  if (!param) return null;
  try {
    const points = param.split(";").map((pair) => {
      const [lat, lng] = pair.split(",").map(Number);
      if (Number.isNaN(lat) || Number.isNaN(lng)) throw new Error("bad coord");
      return [lat, lng] as LatLngTuple;
    });
    return points.length >= 3 ? points : null;
  } catch {
    return null;
  }
}
