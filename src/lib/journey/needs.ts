import type { AmenityKind, NeedDef, NeedId } from "./types";

export const NEEDS: NeedDef[] = [
  {
    id: "toilets",
    label: "Frequent toilet stops",
    hint: "Never more than ~5 min from a toilet",
  },
  {
    id: "heart",
    label: "Take it easy on my heart",
    hint: "Flatter paths, benches every 8–10 min",
  },
  {
    id: "stepFree",
    label: "Step-free / wheelchair",
    hint: "No steps or kerbs, accessible toilets",
  },
  {
    id: "stroller",
    label: "Pregnant / with a stroller",
    hint: "Gentle, shaded, shorter stretches",
  },
  {
    id: "frail",
    label: "Older / frail",
    hint: "Flat, well-lit, benches and toilets",
  },
  {
    id: "heat",
    label: "Hot day",
    hint: "Prefers shade and water stops",
  },
  {
    id: "night",
    label: "Walking at night",
    hint: "Prefers well-lit, busier streets",
  },
];

/** Union of routing constraints produced by the active needs. */
export interface RoutingRule {
  avoidSteps: boolean;
  preferFlat: boolean;
  maxToiletGapMinutes: number | null;
  restStopIntervalMinutes: number | null;
  maxSegmentMinutes: number | null;
  requireWheelchairToilets: boolean;
  preferShade: boolean;
  preferLit: boolean;
  amenityKinds: Set<AmenityKind>;
}

const RULES: Record<NeedId, Partial<RoutingRule>> = {
  toilets: {
    maxToiletGapMinutes: 5,
    amenityKinds: new Set(["toilet"]),
  },
  heart: {
    avoidSteps: true,
    preferFlat: true,
    restStopIntervalMinutes: 9,
    amenityKinds: new Set(["bench"]),
  },
  stepFree: {
    avoidSteps: true,
    preferFlat: true,
    requireWheelchairToilets: true,
    amenityKinds: new Set(["toilet"]),
  },
  stroller: {
    avoidSteps: true,
    preferFlat: true,
    preferShade: true,
    maxToiletGapMinutes: 10,
    restStopIntervalMinutes: 10,
    maxSegmentMinutes: 10,
    amenityKinds: new Set(["toilet", "bench"]),
  },
  frail: {
    avoidSteps: true,
    preferFlat: true,
    preferLit: true,
    maxToiletGapMinutes: 8,
    restStopIntervalMinutes: 8,
    amenityKinds: new Set(["toilet", "bench"]),
  },
  heat: {
    preferShade: true,
    amenityKinds: new Set(["water"]),
  },
  night: {
    preferLit: true,
    amenityKinds: new Set(),
  },
};

function minDefined(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.min(a, b);
}

/** Takes the union of every active need's constraints. */
export function combineNeeds(active: NeedId[]): RoutingRule {
  const rule: RoutingRule = {
    avoidSteps: false,
    preferFlat: false,
    maxToiletGapMinutes: null,
    restStopIntervalMinutes: null,
    maxSegmentMinutes: null,
    requireWheelchairToilets: false,
    preferShade: false,
    preferLit: false,
    amenityKinds: new Set(),
  };

  for (const id of active) {
    const partial = RULES[id];
    rule.avoidSteps = rule.avoidSteps || !!partial.avoidSteps;
    rule.preferFlat = rule.preferFlat || !!partial.preferFlat;
    rule.requireWheelchairToilets =
      rule.requireWheelchairToilets || !!partial.requireWheelchairToilets;
    rule.preferShade = rule.preferShade || !!partial.preferShade;
    rule.preferLit = rule.preferLit || !!partial.preferLit;
    rule.maxToiletGapMinutes = minDefined(
      rule.maxToiletGapMinutes,
      partial.maxToiletGapMinutes ?? null,
    );
    rule.restStopIntervalMinutes = minDefined(
      rule.restStopIntervalMinutes,
      partial.restStopIntervalMinutes ?? null,
    );
    rule.maxSegmentMinutes = minDefined(
      rule.maxSegmentMinutes,
      partial.maxSegmentMinutes ?? null,
    );
    for (const kind of partial.amenityKinds ?? []) {
      rule.amenityKinds.add(kind);
    }
  }

  return rule;
}

export function needById(id: NeedId): NeedDef {
  const def = NEEDS.find((n) => n.id === id);
  if (!def) throw new Error(`Unknown need: ${id}`);
  return def;
}
