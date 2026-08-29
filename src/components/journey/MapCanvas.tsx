"use client";

import type { AmenityKind, LatLng, Place, RouteMode, RouteResult } from "@/lib/journey/types";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";

const SYDNEY_CENTER: LatLng = { lat: -33.8896, lng: 151.1835 };

const AMENITY_GLYPH: Record<AmenityKind, { color: string; path: string }> = {
  toilet: {
    color: "var(--journey-toilet)",
    path: '<rect x="7" y="5" width="10" height="6" rx="1.5"/><path d="M8 11v3a4 4 0 0 0 8 0v-3" fill="none" stroke="white" stroke-width="1.6"/>',
  },
  bench: {
    color: "var(--journey-bench)",
    path: '<rect x="5" y="9" width="14" height="2.2" rx="1"/><rect x="6" y="11.2" width="1.8" height="5" rx="0.6"/><rect x="16.2" y="11.2" width="1.8" height="5" rx="0.6"/>',
  },
  water: {
    color: "var(--journey-water)",
    path: '<path d="M12 4c3 4 5 6.8 5 9.2A5 5 0 0 1 7 13.2C7 10.8 9 8 12 4Z"/>',
  },
  pharmacy: {
    color: "var(--journey-pharmacy)",
    path: '<rect x="10.5" y="5" width="3" height="14" rx="1"/><rect x="5" y="10.5" width="14" height="3" rx="1"/>',
  },
};

function amenityIcon(kind: AmenityKind) {
  const glyph = AMENITY_GLYPH[kind];
  return L.divIcon({
    className: "journey-pin-wrap",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:999px;background:${glyph.color};box-shadow:0 2px 6px rgb(23 21 18 / 0.3);border:2px solid white"><svg width="16" height="16" viewBox="0 0 24 24" fill="white">${glyph.path}</svg></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function endpointIcon(label: string, filled: boolean) {
  return L.divIcon({
    className: "journey-pin-wrap",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:999px;background:${filled ? "var(--journey-accent)" : "var(--journey-bg-raised)"};border:3px solid var(--journey-accent);box-shadow:0 2px 8px rgb(23 21 18 / 0.35)" aria-label="${label}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

function FitBounds({ coordinates }: { coordinates: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length < 2) return;
    const bounds = L.latLngBounds(coordinates.map((c) => [c.lat, c.lng]));
    map.fitBounds(bounds, { padding: [64, 64] });
  }, [coordinates, map]);
  return null;
}

function ClickCapture({ onClick }: { onClick: (pos: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface MapCanvasProps {
  from: Place | null;
  to: Place | null;
  fastest: RouteResult | null;
  forYou: RouteResult | null;
  mode: RouteMode;
  pickingField: "from" | "to" | null;
  onMapClick: (pos: LatLng) => void;
}

export default function MapCanvas({
  from,
  to,
  fastest,
  forYou,
  mode,
  pickingField,
  onMapClick,
}: MapCanvasProps) {
  const activeRoute = mode === "forYou" ? forYou : fastest;
  const otherRoute = mode === "forYou" ? fastest : forYou;

  const fitTarget = useMemo(() => {
    if (activeRoute) return activeRoute.coordinates;
    if (from && to) return [from.position, to.position];
    return [];
  }, [activeRoute, from, to]);

  return (
    <MapContainer
      center={[SYDNEY_CENTER.lat, SYDNEY_CENTER.lng]}
      zoom={15}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl={false}
      style={{ cursor: pickingField ? "crosshair" : undefined }}
    >
      {/* CARTO's free basemap CDN now stamps an "API key required" watermark on
          unauthenticated tiles, so we use plain OSM tiles softened with a CSS
          filter (.journey-tiles in globals.css) to stay close to a light,
          minimal style without needing a key. */}
      <TileLayer
        className="journey-tiles"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <ClickCapture onClick={onMapClick} />
      {fitTarget.length >= 2 && <FitBounds coordinates={fitTarget} />}

      {otherRoute && (
        <Polyline
          positions={otherRoute.coordinates.map((c) => [c.lat, c.lng])}
          pathOptions={{
            color: "var(--journey-ink-muted)",
            weight: 3,
            opacity: 0.45,
            dashArray: "1 10",
            lineCap: "round",
          }}
        />
      )}

      {activeRoute && (
        <Polyline
          positions={activeRoute.coordinates.map((c) => [c.lat, c.lng])}
          pathOptions={{
            color: "var(--journey-accent)",
            weight: 5,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {activeRoute?.stops.map((stop) => (
        <Marker
          key={stop.amenity.id}
          position={[stop.amenity.position.lat, stop.amenity.position.lng]}
          icon={amenityIcon(stop.amenity.kind)}
        >
          <Tooltip direction="top" offset={[0, -14]}>
            {stop.amenity.name ?? stop.amenity.kind} · {stop.etaMinutes} min
          </Tooltip>
        </Marker>
      ))}

      {from && (
        <Marker position={[from.position.lat, from.position.lng]} icon={endpointIcon("Start", true)}>
          <Tooltip direction="top" offset={[0, -10]}>
            {from.label}
          </Tooltip>
        </Marker>
      )}
      {to && (
        <Marker position={[to.position.lat, to.position.lng]} icon={endpointIcon("Destination", false)}>
          <Tooltip direction="top" offset={[0, -10]}>
            {to.label}
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}
