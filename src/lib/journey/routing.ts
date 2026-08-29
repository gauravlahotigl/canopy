import { projectOntoRoute, routeLengthMeters } from "./geo";
import { fetchAmenities } from "./amenities";
import { combineNeeds, type RoutingRule } from "./needs";
import type {
  Amenity,
  AmenityKind,
  JourneyPlan,
  LatLng,
  NeedId,
  Place,
  RouteResult,
  RouteStop,
} from "./types";

const ORS_KEY = process.env.NEXT_PUBLIC_ORS_KEY;
const ORS_DIRECTIONS_URL =
  "https://api.openrouteservice.org/v2/directions/foot-walking/geojson";
const ORS_AUTOCOMPLETE_URL =
  "https://api.openrouteservice.org/geocode/autocomplete";

/** Average pace used to turn distance-along-route into an ETA, in m/s. */
const WALK_SPEED_M_PER_S = 1.3;

const DWELL_SECONDS: Record<AmenityKind, number> = {
  toilet: 120,
  bench: 180,
  water: 40,
  pharmacy: 90,
};

export class NoApiKeyError extends Error {}

export async function geocode(query: string): Promise<Place[]> {
  if (!ORS_KEY) throw new NoApiKeyError("Missing NEXT_PUBLIC_ORS_KEY");
  if (query.trim().length < 3) return [];

  const url = new URL(ORS_AUTOCOMPLETE_URL);
  url.searchParams.set("api_key", ORS_KEY);
  url.searchParams.set("text", query);
  url.searchParams.set("size", "5");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
  const data = await res.json();

  return (data.features ?? []).map(
    (f: { properties: { label: string }; geometry: { coordinates: [number, number] } }) => ({
      label: f.properties.label,
      position: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
    }),
  );
}

interface OrsDirectionsResult {
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  ascentMeters?: number;
}

async function fetchOrsRoute(
  from: LatLng,
  to: LatLng,
  avoidFeatures: string[],
): Promise<OrsDirectionsResult> {
  if (!ORS_KEY) throw new NoApiKeyError("Missing NEXT_PUBLIC_ORS_KEY");

  const body: Record<string, unknown> = {
    coordinates: [
      [from.lng, from.lat],
      [to.lng, to.lat],
    ],
    elevation: true,
  };
  if (avoidFeatures.length > 0) {
    body.options = { avoid_features: avoidFeatures };
  }

  const res = await fetch(ORS_DIRECTIONS_URL, {
    method: "POST",
    headers: {
      Authorization: ORS_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Directions failed: ${res.status}`);

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) throw new Error("No route returned");

  const coordinates: LatLng[] = feature.geometry.coordinates.map(
    ([lng, lat]: [number, number, number?]) => ({ lat, lng }),
  );

  return {
    coordinates,
    distanceMeters: feature.properties.summary.distance,
    durationSeconds: feature.properties.summary.duration,
    ascentMeters: feature.properties.ascent,
  };
}

interface Candidate {
  amenity: Amenity;
  distanceAlongMeters: number;
}

function candidatesForKind(
  amenities: Amenity[],
  route: LatLng[],
  kind: AmenityKind,
  requireWheelchair: boolean,
): Candidate[] {
  return amenities
    .filter((a) => a.kind === kind)
    .filter((a) => !(requireWheelchair && kind === "toilet") || a.wheelchair)
    .map((a) => ({ amenity: a, ...projectOntoRoute(a.position, route) }))
    .filter((c) => c.distanceFromLineMeters <= 60)
    .sort((a, b) => a.distanceAlongMeters - b.distanceAlongMeters)
    .map(({ amenity, distanceAlongMeters }) => ({ amenity, distanceAlongMeters }));
}

/** Greedily keeps the nearest candidate, then only the next one that clears the gap. */
function selectWithGap(candidates: Candidate[], gapMeters: number): Candidate[] {
  const selected: Candidate[] = [];
  let last = -Infinity;
  for (const c of candidates) {
    if (c.distanceAlongMeters - last >= gapMeters) {
      selected.push(c);
      last = c.distanceAlongMeters;
    }
  }
  return selected;
}

function insertStops(
  route: LatLng[],
  amenities: Amenity[],
  rule: RoutingRule,
): RouteStop[] {
  const selected: Candidate[] = [];

  if (rule.amenityKinds.has("toilet")) {
    const candidates = candidatesForKind(
      amenities,
      route,
      "toilet",
      rule.requireWheelchairToilets,
    );
    const gapMeters = rule.maxToiletGapMinutes
      ? rule.maxToiletGapMinutes * 60 * WALK_SPEED_M_PER_S
      : routeLengthMeters(route) + 1;
    selected.push(...selectWithGap(candidates, gapMeters));
  }

  if (rule.amenityKinds.has("bench")) {
    const candidates = candidatesForKind(amenities, route, "bench", false);
    const gapMeters = rule.restStopIntervalMinutes
      ? rule.restStopIntervalMinutes * 60 * WALK_SPEED_M_PER_S
      : routeLengthMeters(route) + 1;
    selected.push(...selectWithGap(candidates, gapMeters));
  }

  if (rule.amenityKinds.has("water")) {
    selected.push(...candidatesForKind(amenities, route, "water", false).slice(0, 2));
  }

  if (rule.amenityKinds.has("pharmacy")) {
    selected.push(...candidatesForKind(amenities, route, "pharmacy", false).slice(0, 1));
  }

  return selected
    .sort((a, b) => a.distanceAlongMeters - b.distanceAlongMeters)
    .map((c) => ({
      amenity: c.amenity,
      distanceAlongMeters: Math.round(c.distanceAlongMeters),
      etaMinutes: Math.round(c.distanceAlongMeters / WALK_SPEED_M_PER_S / 60),
    }));
}

function buildNotes(rule: RoutingRule, fastest: OrsDirectionsResult, forYou: OrsDirectionsResult, stops: RouteStop[]): string[] {
  const notes: string[] = [];
  const deltaMin = Math.round((forYou.durationSeconds - fastest.durationSeconds) / 60);
  const toiletCount = stops.filter((s) => s.amenity.kind === "toilet").length;
  const benchCount = stops.filter((s) => s.amenity.kind === "bench").length;

  const parts: string[] = [];
  if (rule.avoidSteps) parts.push("step-free");
  if (toiletCount > 0) parts.push(`passes ${toiletCount} toilet${toiletCount > 1 ? "s" : ""}`);
  if (benchCount > 0) parts.push(`${benchCount} rest bench${benchCount > 1 ? "es" : ""}`);
  if (rule.preferShade) parts.push("shadier streets where possible");
  if (rule.preferLit) parts.push("better-lit streets");

  if (parts.length > 0) {
    const time = deltaMin > 0 ? `+${deltaMin} min, but ` : deltaMin < 0 ? `${Math.abs(deltaMin)} min faster, and ` : "same time, and ";
    notes.push(time + parts.join(", "));
  }

  return notes;
}

async function hydrateFallback(): Promise<JourneyPlan> {
  const res = await fetch("/demo/journey.json");
  if (!res.ok) throw new Error("Missing bundled demo journey");
  const raw = await res.json();

  const amenityById = new Map<string, Amenity>(
    raw.amenities.map((a: Amenity) => [a.id, a]),
  );

  const hydrateRoute = (route: {
    mode: "fastest" | "forYou";
    coordinates: LatLng[];
    distanceMeters: number;
    durationSeconds: number;
    ascentMeters?: number;
    notes: string[];
    stops: { amenityId: string; etaMinutes: number; distanceAlongMeters: number }[];
  }): RouteResult => ({
    mode: route.mode,
    coordinates: route.coordinates,
    distanceMeters: route.distanceMeters,
    durationSeconds: route.durationSeconds,
    ascentMeters: route.ascentMeters,
    notes: route.notes,
    stops: route.stops.map((s) => ({
      amenity: amenityById.get(s.amenityId)!,
      etaMinutes: s.etaMinutes,
      distanceAlongMeters: s.distanceAlongMeters,
    })),
  });

  return {
    from: raw.from,
    to: raw.to,
    isFallback: true,
    amenities: raw.amenities,
    fastest: hydrateRoute(raw.fastest),
    forYou: hydrateRoute(raw.forYou),
  };
}

export async function planJourney(
  from: Place,
  to: Place,
  activeNeeds: NeedId[],
): Promise<JourneyPlan> {
  if (!ORS_KEY) {
    return hydrateFallback();
  }

  try {
    const rule = combineNeeds(activeNeeds);
    const avoidFeatures = rule.avoidSteps ? ["steps"] : [];

    const [fastestRaw, forYouRaw] = await Promise.all([
      fetchOrsRoute(from.position, to.position, []),
      fetchOrsRoute(from.position, to.position, avoidFeatures),
    ]);

    const combined = [...fastestRaw.coordinates, ...forYouRaw.coordinates];
    const bbox = boundingBoxOf(combined);
    const amenities =
      rule.amenityKinds.size > 0
        ? await fetchAmenities(bbox, rule.amenityKinds)
        : [];

    const stops = insertStops(forYouRaw.coordinates, amenities, rule);
    const dwellSeconds = stops.reduce((sum, s) => sum + DWELL_SECONDS[s.amenity.kind], 0);

    const fastest: RouteResult = {
      mode: "fastest",
      ...fastestRaw,
      notes: [],
      stops: [],
    };
    const forYou: RouteResult = {
      mode: "forYou",
      coordinates: forYouRaw.coordinates,
      distanceMeters: forYouRaw.distanceMeters,
      durationSeconds: forYouRaw.durationSeconds + dwellSeconds,
      ascentMeters: forYouRaw.ascentMeters,
      stops,
      notes: buildNotes(rule, fastestRaw, { ...forYouRaw, durationSeconds: forYouRaw.durationSeconds + dwellSeconds }, stops),
    };

    return { from, to, isFallback: false, amenities, fastest, forYou };
  } catch {
    return hydrateFallback();
  }
}

function boundingBoxOf(points: LatLng[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.0015;
  return {
    south: Math.min(...lats) - pad,
    west: Math.min(...lngs) - pad,
    north: Math.max(...lats) + pad,
    east: Math.max(...lngs) + pad,
  };
}
