import type { Clock, LatLng, Place, SlotType, TripKind } from "./types";

export const CORRIDOR_NAME = "Broadway / City Rd";

export const RPA_DOOR: Place = {
  name: "RPA",
  lat: -33.8894,
  lng: 151.1828,
};

/** Access lever: Spine opens this bay for the RPA door. */
export const DOOR_SLOT_ID = "S8";

export const DOOR_STOP_RADIUS_M = 80;

export type SeedSlot = {
  id: string;
  lat: number;
  lng: number;
  side: "N" | "S";
  shade: boolean;
  lit: boolean;
};

export type SeedTrip = {
  id: string;
  kind: TripKind;
  origin: Place;
  dest: Place;
  activeAt: Clock[];
};

export type SeedVan = {
  id: string;
  lat: number;
  lng: number;
  headingDeg: number;
};

export const SEED_SLOTS: SeedSlot[] = [
  { id: "S1", lat: -33.8844, lng: 151.1955, side: "N", shade: false, lit: true },
  { id: "S2", lat: -33.8848, lng: 151.1942, side: "N", shade: false, lit: true },
  { id: "S3", lat: -33.8856, lng: 151.1928, side: "S", shade: true, lit: false },
  { id: "S4", lat: -33.8864, lng: 151.1914, side: "N", shade: false, lit: false },
  { id: "S5", lat: -33.8872, lng: 151.1900, side: "S", shade: false, lit: false },
  { id: "S6", lat: -33.8880, lng: 151.1886, side: "N", shade: true, lit: false },
  { id: "S7", lat: -33.8886, lng: 151.1872, side: "S", shade: false, lit: true },
  { id: "S8", lat: -33.8890, lng: 151.1854, side: "N", shade: false, lit: true },
  { id: "S9", lat: -33.8892, lng: 151.1840, side: "S", shade: false, lit: true },
  { id: "S10", lat: -33.8888, lng: 151.1864, side: "S", shade: false, lit: false },
];

export const SEED_VANS: SeedVan[] = [
  { id: "V1", lat: -33.8878, lng: 151.1888, headingDeg: 270 },
];

export const WHEELCHAIR_ORIGIN: Place = {
  name: "City Rd / USYD",
  lat: -33.8882,
  lng: 151.1878,
};

export const SEED_TRIPS: SeedTrip[] = [
  {
    id: "T-370",
    kind: "bus",
    origin: { name: "Broadway east", lat: -33.8842, lng: 151.1962 },
    dest: { name: "City Rd west", lat: -33.8890, lng: 151.1848 },
    activeAt: ["14:00", "20:10"],
  },
  {
    id: "T-load",
    kind: "load",
    origin: { name: "City Rd load", lat: -33.8864, lng: 151.1914 },
    dest: { name: "City Rd load", lat: -33.8864, lng: 151.1914 },
    activeAt: ["14:00"],
  },
  {
    id: "T-rpa",
    kind: "wheelchair",
    origin: WHEELCHAIR_ORIGIN,
    dest: RPA_DOOR,
    activeAt: ["20:10"],
  },
  {
    id: "T-share",
    kind: "share",
    origin: { name: "Broadway mid", lat: -33.8860, lng: 151.1920 },
    dest: { name: "Haymarket edge", lat: -33.8848, lng: 151.1940 },
    activeAt: ["14:00", "20:10"],
  },
];

export const PAINT_BY_CLOCK: Record<Clock, Record<string, SlotType>> = {
  "14:00": {
    S1: "bus",
    S2: "load",
    S3: "park",
    S4: "load",
    S5: "park",
    S6: "park",
    S7: "load",
    S8: "park",
    S9: "park",
    S10: "park",
  },
  "20:10": {
    S1: "bus",
    S2: "load",
    S3: "park",
    S4: "park",
    S5: "park",
    S6: "park",
    S7: "park",
    S8: "park",
    S9: "park",
    S10: "park",
  },
};

export const MAP_CENTER: LatLng = { lat: -33.8870, lng: 151.1890 };
export const MAP_ZOOM = 16;

export const FAIL_REASON = "path exists, stop does not.";
