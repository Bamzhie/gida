"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Props = { latitude: number; longitude: number; label: string };

export function ListingLocationMapInner({ latitude, longitude, label }: Props) {
  const center: [number, number] = [latitude, longitude];

  return (
    <div className="h-72 overflow-hidden rounded-xl border border-border" role="region" aria-label={`Map showing the approximate location of ${label}`}>
      <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={center}
          radius={9}
          pathOptions={{ color: "#15140f", fillColor: "#b1552e", fillOpacity: 1, weight: 3 }}
        >
          <Popup>{label}</Popup>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
