"use client";

import { MAP_CENTER, MAP_ZOOM } from "@/lib/spine/corridor";
import { SLOT_COLORS, type Plan, type SlotType } from "@/lib/spine/types";
import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function pin(html: string, className: string, size: [number, number]) {
  return L.divIcon({
    className,
    html,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1] / 2],
  });
}

function slotIcon(id: string, type: SlotType, highlight: boolean) {
  const cls = highlight ? "slot-pin slot-pin-s8" : "slot-pin";
  return pin(
    `<div class="${cls}" style="background:${SLOT_COLORS[type]}">${id}</div>`,
    "slot-pin-wrap",
    highlight ? [34, 22] : [30, 20],
  );
}

export default function StreetMap({ plan }: { plan: Plan }) {
  const doorIcon = useMemo(
    () => pin(`<div class="door-pin">RPA</div>`, "door-pin-wrap", [40, 22]),
    [],
  );

  return (
    <MapContainer
      center={[MAP_CENTER.lat, MAP_CENTER.lng]}
      zoom={MAP_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {plan.slots.map((slot) => (
        <Marker
          key={`${slot.id}-${slot.type}`}
          position={[slot.lat, slot.lng]}
          icon={slotIcon(slot.id, slot.type, slot.id === "S8")}
          zIndexOffset={slot.id === "S8" ? 500 : 0}
        >
          <Tooltip direction="top" offset={[0, -10]} permanent={slot.id === "S8"}>
            {slot.id} {slot.type}
          </Tooltip>
        </Marker>
      ))}
      {plan.vans.map((van) => (
        <Marker
          key={`${van.id}-${van.assignedTripId ?? "idle"}`}
          position={[van.lat, van.lng]}
          icon={pin(
            `<div class="van-pin">${van.id}</div>`,
            "van-pin-wrap",
            [32, 32],
          )}
          zIndexOffset={600}
        >
          <Tooltip direction="right" offset={[10, 0]} permanent>
            {van.id}
            {van.assignedTripId ? ` → ${van.assignedTripId}` : " idle"}
          </Tooltip>
        </Marker>
      ))}
      <Marker position={[plan.door.lat, plan.door.lng]} icon={doorIcon} zIndexOffset={700}>
        <Tooltip direction="bottom" offset={[0, 8]}>
          {plan.door.name} door · path exists
        </Tooltip>
      </Marker>
    </MapContainer>
  );
}
