import type { PlanQuery } from "./config";
import type { Plan } from "./types";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `API error ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function readJson<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, body);
  }
  return body as T;
}

export async function fetchPlan(query: PlanQuery): Promise<Plan> {
  const params = new URLSearchParams(query);
  const res = await fetch(`/api/plan?${params.toString()}`);
  return readJson<Plan>(res);
}

export async function fetchCorridor() {
  const res = await fetch("/api/corridor");
  return readJson<CorridorPayload>(res);
}

export async function fetchMeta() {
  const res = await fetch("/api/meta");
  return readJson<MetaPayload>(res);
}

export async function fetchHealth() {
  const res = await fetch("/api/health");
  return readJson<{ ok: true; service: "spine" }>(res);
}

export type CorridorPayload = {
  name: string;
  door: { name: string; lat: number; lng: number };
  slots: Array<{
    id: string;
    lat: number;
    lng: number;
    side: "N" | "S";
    shade: boolean;
    lit: boolean;
  }>;
  vans: Array<{
    id: string;
    lat: number;
    lng: number;
    headingDeg: number;
  }>;
  map: { center: { lat: number; lng: number }; zoom: number };
};

export type MetaPayload = {
  clocks: readonly string[];
  planners: readonly string[];
  canopies: readonly string[];
  slotTypes: readonly string[];
  defaultQuery: PlanQuery;
  tagline: string;
  slotColors: Record<string, string>;
  slotLegend: Record<string, string>;
};
