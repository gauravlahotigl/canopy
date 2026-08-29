export const TAGLINE =
  "Google gets you to the pin. Spine decides if you can stop.";

export const CLOCKS = ["14:00", "20:10"] as const;
export const PLANNERS = ["paint", "speed", "spine"] as const;
export const CANOPIES = ["heat", "night", "access"] as const;
export const SLOT_TYPES = [
  "bus",
  "load",
  "disabled",
  "van",
  "park",
  "clear",
] as const;

export type Clock = (typeof CLOCKS)[number];
export type Planner = (typeof PLANNERS)[number];
export type Canopy = (typeof CANOPIES)[number];
export type SlotType = (typeof SLOT_TYPES)[number];
export type TripKind = "bus" | "load" | "wheelchair" | "share";
export type TripStatus = "served" | "fail" | "n/a";
export type DoorVerdict = "SERVE" | "FAIL";
export type DoorScore = "serve" | "fail";
export type KerbSide = "N" | "S";

export const SLOT_COLORS: Record<SlotType, string> = {
  bus: "#e11d48",
  load: "#f97316",
  disabled: "#2563eb",
  van: "#7c3aed",
  park: "#6b7280",
  clear: "#16a34a",
};

export const SLOT_LEGEND: Record<SlotType, string> = {
  bus: "bus",
  load: "loading",
  disabled: "disabled bay",
  van: "van / short-stop",
  park: "parking",
  clear: "keep clear",
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type Place = LatLng & {
  name: string;
};

export type Slot = {
  id: string;
  lat: number;
  lng: number;
  side: KerbSide;
  shade: boolean;
  lit: boolean;
  type: SlotType;
  label?: string;
};

export type Van = {
  id: string;
  lat: number;
  lng: number;
  headingDeg: number;
  assignedTripId: string | null;
};

export type Trip = {
  id: string;
  kind: TripKind;
  origin: Place;
  dest: Place;
  activeAt: Clock[];
  status: TripStatus;
  reason?: string;
};

export type Door = {
  name: string;
  lat: number;
  lng: number;
  googlePathExists: true;
  stopExists: boolean;
  nearestSlotId: string | null;
  verdict: DoorVerdict;
  reason: string;
};

export type Scores = {
  tripsServed: number;
  door: DoorScore;
  busDelayMin: number;
  extraWalkSunDarkMin: number;
};

export type Plan = {
  clock: Clock;
  planner: Planner;
  canopy: Canopy;
  tagline: typeof TAGLINE;
  corridor: { name: string };
  slots: Slot[];
  vans: Van[];
  trips: Trip[];
  door: Door;
  scores: Scores;
  legend: Record<SlotType, string>;
};
