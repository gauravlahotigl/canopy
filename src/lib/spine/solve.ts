import {
  CORRIDOR_NAME,
  DOOR_SLOT_ID,
  DOOR_STOP_RADIUS_M,
  FAIL_REASON,
  PAINT_BY_CLOCK,
  RPA_DOOR,
  SEED_SLOTS,
  SEED_TRIPS,
  SEED_VANS,
} from "./corridor";
import { haversineM } from "./geo";
import {
  SLOT_LEGEND,
  TAGLINE,
  type Canopy,
  type Clock,
  type Door,
  type Plan,
  type Planner,
  type Slot,
  type SlotType,
  type Trip,
  type Van,
} from "./types";

export { isCanopy, isClock, isPlanner } from "./validate";

function cloneTypes(clock: Clock): Record<string, SlotType> {
  return { ...PAINT_BY_CLOCK[clock] };
}

function paintSlots(types: Record<string, SlotType>): Slot[] {
  return SEED_SLOTS.map((seed) => ({
    ...seed,
    type: types[seed.id] ?? "park",
    label: seed.id,
  }));
}

function idleVans(): Van[] {
  return SEED_VANS.map((van) => ({
    ...van,
    assignedTripId: null,
  }));
}

function assignVan(vans: Van[], vanId: string, tripId: string): Van[] {
  return vans.map((van) =>
    van.id === vanId ? { ...van, assignedTripId: tripId } : van,
  );
}

function nearestSlotId(slots: Slot[]): string | null {
  if (slots.length === 0) return null;
  let best = slots[0];
  let bestD = haversineM(best, RPA_DOOR);
  for (const slot of slots.slice(1)) {
    const d = haversineM(slot, RPA_DOOR);
    if (d < bestD) {
      best = slot;
      bestD = d;
    }
  }
  return best.id;
}

function stopExists(slots: Slot[]): boolean {
  return slots.some((slot) => {
    if (slot.type !== "disabled") return false;
    if (slot.id === DOOR_SLOT_ID) return true;
    return haversineM(slot, RPA_DOOR) <= DOOR_STOP_RADIUS_M;
  });
}

function evaluateDoor(
  clock: Clock,
  slots: Slot[],
  vans: Van[],
): Door {
  const nearest = nearestSlotId(slots);
  const hasStop = stopExists(slots);
  const vanServing =
    vans.some((van) => van.assignedTripId === "T-rpa") && hasStop;

  if (clock !== "20:10") {
    return {
      name: RPA_DOOR.name,
      lat: RPA_DOOR.lat,
      lng: RPA_DOOR.lng,
      googlePathExists: true,
      stopExists: hasStop,
      nearestSlotId: nearest,
      verdict: "FAIL",
      reason: "no active wheelchair trip",
    };
  }

  if (vanServing) {
    return {
      name: RPA_DOOR.name,
      lat: RPA_DOOR.lat,
      lng: RPA_DOOR.lng,
      googlePathExists: true,
      stopExists: true,
      nearestSlotId: nearest,
      verdict: "SERVE",
      reason: "disabled bay open, van V1 serving T-rpa",
    };
  }

  return {
    name: RPA_DOOR.name,
    lat: RPA_DOOR.lat,
    lng: RPA_DOOR.lng,
    googlePathExists: true,
    stopExists: hasStop,
    nearestSlotId: nearest,
    verdict: "FAIL",
    reason: FAIL_REASON,
  };
}

function tripActive(trip: (typeof SEED_TRIPS)[number], clock: Clock) {
  return trip.activeAt.includes(clock);
}

function scoreTrips(
  clock: Clock,
  slots: Slot[],
  vans: Van[],
  door: Door,
): Trip[] {
  const hasBus = slots.some((s) => s.type === "bus");
  const hasLoad = slots.some((s) => s.type === "load");

  return SEED_TRIPS.map((seed) => {
    const active = tripActive(seed, clock);
    if (!active) {
      return { ...seed, status: "n/a" as const, reason: "inactive at clock" };
    }

    if (seed.id === "T-370") {
      return {
        ...seed,
        status: hasBus ? ("served" as const) : ("fail" as const),
        reason: hasBus ? "bus slot held" : "no bus slot",
      };
    }

    if (seed.id === "T-rpa") {
      const served = door.verdict === "SERVE";
      return {
        ...seed,
        status: served ? ("served" as const) : ("fail" as const),
        reason: served ? door.reason : door.reason,
      };
    }

    if (seed.id === "T-load") {
      return {
        ...seed,
        status: hasLoad ? ("served" as const) : ("fail" as const),
        reason: hasLoad ? "loading bay open" : "loading bay cleared",
      };
    }

    const assigned = vans.some((van) => van.assignedTripId === seed.id);
    return {
      ...seed,
      status: assigned ? ("served" as const) : ("fail" as const),
      reason: assigned ? "van assigned" : "no van assigned",
    };
  });
}

function applySpeed(types: Record<string, SlotType>) {
  for (const id of Object.keys(types)) {
    const t = types[id];
    if (t === "park" || t === "load") types[id] = "clear";
  }
}

function applySpineBase(types: Record<string, SlotType>) {
  types.S1 = "bus";
  if (types.S2 === "load") types.S2 = "clear";
}

function applyAccess(types: Record<string, SlotType>) {
  types[DOOR_SLOT_ID] = "disabled";
}

function applyHeat(types: Record<string, SlotType>) {
  for (const seed of SEED_SLOTS) {
    if (seed.shade) types[seed.id] = seed.id === "S3" ? "van" : "load";
  }
  types.S4 = "clear";
  types.S5 = "load";
  types.S8 = "load";
  types.S10 = "clear";
}

function applyNight(types: Record<string, SlotType>) {
  for (const id of Object.keys(types)) {
    if (types[id] === "park") types[id] = "clear";
  }
  const litPickup = SEED_SLOTS.find((s) => s.lit && s.id !== "S1") ?? SEED_SLOTS[7];
  if (types[litPickup.id] !== "bus") types[litPickup.id] = "van";
}

export function solve(clock: Clock, planner: Planner, canopy: Canopy): Plan {
  const types = cloneTypes(clock);
  let vans = idleVans();
  let busDelayMin = 4;
  let extraWalkSunDarkMin = 0;

  if (planner === "speed") {
    applySpeed(types);
    busDelayMin = 0;
  }

  if (planner === "spine") {
    applySpineBase(types);
    busDelayMin = 2;

    if (canopy === "access") {
      applyAccess(types);
      if (clock === "20:10") vans = assignVan(vans, "V1", "T-rpa");
    }

    if (canopy === "heat") {
      applyHeat(types);
      extraWalkSunDarkMin = 2;
      vans = assignVan(vans, "V1", "T-share");
    }

    if (canopy === "night") {
      applyNight(types);
      vans = assignVan(vans, "V1", "T-share");
    }
  }

  const slots = paintSlots(types);
  const door = evaluateDoor(clock, slots, vans);
  const trips = scoreTrips(clock, slots, vans, door);
  const tripsServed = trips.filter((t) => t.status === "served").length;

  return {
    clock,
    planner,
    canopy,
    tagline: TAGLINE,
    corridor: { name: CORRIDOR_NAME },
    slots,
    vans,
    trips,
    door,
    scores: {
      tripsServed,
      door: door.verdict === "SERVE" ? "serve" : "fail",
      busDelayMin,
      extraWalkSunDarkMin,
    },
    legend: SLOT_LEGEND,
  };
}

export function slotType(plan: Plan, id: string): SlotType | undefined {
  return plan.slots.find((s) => s.id === id)?.type;
}
