import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/meta/route";
import {
  CANOPIES,
  CLOCKS,
  DEFAULT_QUERY,
  PLANNERS,
  SLOT_COLORS,
  SLOT_LEGEND,
  SLOT_TYPES,
  TAGLINE,
} from "./config";

describe("GET /api/meta", () => {
  it("returns allowlists and default query", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clocks).toEqual([...CLOCKS]);
    expect(body.planners).toEqual([...PLANNERS]);
    expect(body.canopies).toEqual([...CANOPIES]);
    expect(body.slotTypes).toEqual([...SLOT_TYPES]);
    expect(body.defaultQuery).toEqual(DEFAULT_QUERY);
    expect(body.tagline).toBe(TAGLINE);
    expect(body.slotColors).toEqual(SLOT_COLORS);
    expect(body.slotLegend).toEqual(SLOT_LEGEND);
  });
});
