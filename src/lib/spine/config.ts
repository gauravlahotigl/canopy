import {
  CANOPIES,
  CLOCKS,
  PLANNERS,
  SLOT_COLORS,
  SLOT_LEGEND,
  SLOT_TYPES,
  TAGLINE,
  type Canopy,
  type Clock,
  type Planner,
} from "./types";

export {
  CANOPIES,
  CLOCKS,
  PLANNERS,
  SLOT_COLORS,
  SLOT_LEGEND,
  SLOT_TYPES,
  TAGLINE,
};

export type PlanQuery = {
  clock: Clock;
  planner: Planner;
  canopy: Canopy;
};

export const DEFAULT_QUERY: PlanQuery = {
  clock: "20:10",
  planner: "paint",
  canopy: "access",
};
