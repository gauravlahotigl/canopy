export interface LatLng {
  lat: number;
  lng: number;
}

export interface Place {
  label: string;
  position: LatLng;
}

export type NeedId =
  | "toilets"
  | "heart"
  | "stepFree"
  | "stroller"
  | "frail"
  | "heat"
  | "night";

export interface NeedDef {
  id: NeedId;
  label: string;
  hint: string;
}

export type AmenityKind = "toilet" | "bench" | "water" | "pharmacy";

export interface Amenity {
  id: string;
  kind: AmenityKind;
  position: LatLng;
  name?: string;
  wheelchair?: boolean;
}

export interface RouteStop {
  amenity: Amenity;
  etaMinutes: number;
  distanceAlongMeters: number;
}

export type RouteMode = "fastest" | "forYou";

export interface RouteResult {
  mode: RouteMode;
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
  ascentMeters?: number;
  stops: RouteStop[];
  notes: string[];
}

export interface JourneyPlan {
  from: Place;
  to: Place;
  fastest: RouteResult;
  forYou: RouteResult;
  amenities: Amenity[];
  isFallback: boolean;
}
