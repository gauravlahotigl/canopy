import type { Amenity, AmenityKind, LatLng } from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const OSM_AMENITY_TAG: Record<AmenityKind, string> = {
  toilet: "toilets",
  bench: "bench",
  water: "drinking_water",
  pharmacy: "pharmacy",
};

interface OverpassElement {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

function kindFromTag(amenityTag: string | undefined): AmenityKind | null {
  if (!amenityTag) return null;
  const entry = Object.entries(OSM_AMENITY_TAG).find(
    ([, tag]) => tag === amenityTag,
  );
  return entry ? (entry[0] as AmenityKind) : null;
}

/**
 * Fetches nearby amenities from OpenStreetMap via Overpass. Returns an
 * empty list (never throws) so callers can decide how to degrade — the
 * caller is expected to fall back to the bundled demo data on a bad
 * network rather than treat "no results" as an error.
 */
export async function fetchAmenities(
  bbox: { south: number; west: number; north: number; east: number },
  kinds: Iterable<AmenityKind>,
): Promise<Amenity[]> {
  const tags = [...new Set([...kinds].map((k) => OSM_AMENITY_TAG[k]))];
  if (tags.length === 0) return [];

  const bboxStr = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const clauses = tags
    .map((tag) => `node["amenity"="${tag}"](${bboxStr});`)
    .join("\n");
  const query = `[out:json][timeout:15];(${clauses});out center;`;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];

    const data: OverpassResponse = await res.json();
    const amenities: Amenity[] = [];

    for (const el of data.elements) {
      const kind = kindFromTag(el.tags?.amenity);
      if (!kind) continue;
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;
      if (lat == null || lng == null) continue;

      amenities.push({
        id: `osm-${el.id}`,
        kind,
        position: { lat, lng } satisfies LatLng,
        name: el.tags?.name,
        wheelchair: el.tags?.wheelchair === "yes",
      });
    }

    return amenities;
  } catch {
    return [];
  }
}
