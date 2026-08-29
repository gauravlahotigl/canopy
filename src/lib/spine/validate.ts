import {
  CANOPIES,
  CLOCKS,
  PLANNERS,
  type PlanQuery,
} from "./config";
import type { Canopy, Clock, Planner } from "./types";

export const QUERY_HINT = {
  clock: CLOCKS,
  planner: PLANNERS,
  canopy: CANOPIES,
} as const;

export type PlanQueryError = {
  status: 400;
  error: string;
  hint: typeof QUERY_HINT;
};

export function isClock(value: string | null): value is Clock {
  return CLOCKS.includes(value as Clock);
}

export function isPlanner(value: string | null): value is Planner {
  return PLANNERS.includes(value as Planner);
}

export function isCanopy(value: string | null): value is Canopy {
  return CANOPIES.includes(value as Canopy);
}

export function isPlanQueryError(value: unknown): value is PlanQueryError {
  if (typeof value !== "object" || value === null) return false;
  const err = value as Partial<PlanQueryError>;
  return err.status === 400 && typeof err.error === "string" && err.hint != null;
}

export function parsePlanQuery(searchParams: URLSearchParams): PlanQuery {
  const clock = searchParams.get("clock");
  const planner = searchParams.get("planner");
  const canopy = searchParams.get("canopy");

  if (!isClock(clock) || !isPlanner(planner) || !isCanopy(canopy)) {
    const error: PlanQueryError = {
      status: 400,
      error: "clock, planner, and canopy must be allowlisted values",
      hint: QUERY_HINT,
    };
    throw error;
  }

  return { clock, planner, canopy };
}
