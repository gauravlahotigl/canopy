import type { LatLng } from "./types";

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance in metres. */
export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface ProjectedPoint {
  distanceAlongMeters: number;
  distanceFromLineMeters: number;
}

/**
 * Projects a point onto a polyline, in the small-scale sense (treats each
 * segment as locally flat — fine for a walk of a few km, not for anything
 * bigger).
 */
export function projectOntoRoute(
  point: LatLng,
  route: LatLng[],
): ProjectedPoint {
  let best: ProjectedPoint = {
    distanceAlongMeters: 0,
    distanceFromLineMeters: Infinity,
  };
  let cumulative = 0;

  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const segLen = haversine(a, b);

    const { t, distanceFromLineMeters } = closestPointOnSegment(point, a, b);
    const distanceAlongMeters = cumulative + t * segLen;

    if (distanceFromLineMeters < best.distanceFromLineMeters) {
      best = { distanceAlongMeters, distanceFromLineMeters };
    }

    cumulative += segLen;
  }

  return best;
}

function closestPointOnSegment(
  point: LatLng,
  a: LatLng,
  b: LatLng,
): { t: number; distanceFromLineMeters: number } {
  // Local equirectangular projection around `a`, accurate enough for
  // segment lengths of a few hundred metres.
  const lat0 = toRad(a.lat);
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos(lat0);

  const ax = 0;
  const ay = 0;
  const bx = (b.lng - a.lng) * mPerDegLng;
  const by = (b.lat - a.lat) * mPerDegLat;
  const px = (point.lng - a.lng) * mPerDegLng;
  const py = (point.lat - a.lat) * mPerDegLat;

  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;

  let t = lenSq === 0 ? 0 : ((px - ax) * abx + (py - ay) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const cx = ax + t * abx;
  const cy = ay + t * aby;
  const dx = px - cx;
  const dy = py - cy;

  return { t, distanceFromLineMeters: Math.sqrt(dx * dx + dy * dy) };
}

export function routeLengthMeters(route: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += haversine(route[i], route[i + 1]);
  }
  return total;
}

export function boundingBox(
  points: LatLng[],
  paddingMeters = 150,
): { south: number; west: number; north: number; east: number } {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const south = Math.min(...lats);
  const north = Math.max(...lats);
  const west = Math.min(...lngs);
  const east = Math.max(...lngs);

  const midLat = toRad((south + north) / 2);
  const dLat = paddingMeters / 111320;
  const dLng = paddingMeters / (111320 * Math.cos(midLat));

  return {
    south: south - dLat,
    west: west - dLng,
    north: north + dLat,
    east: east + dLng,
  };
}
