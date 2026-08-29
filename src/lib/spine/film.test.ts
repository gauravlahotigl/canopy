import { describe, expect, it } from "vitest";
import { solve, slotType } from "./solve";

describe("film sequence", () => {
  it("20:10 + Access + Paint → RPA door FAIL", () => {
    const plan = solve("20:10", "paint", "access");
    expect(plan.door.verdict).toBe("FAIL");
    expect(plan.door.reason).toBe("path exists, stop does not.");
    expect(slotType(plan, "S8")).not.toBe("disabled");
    expect(plan.vans[0]?.assignedTripId).toBeNull();
  });

  it("20:10 + Access + Speed → still FAIL, clearer street, no disabled bay", () => {
    const plan = solve("20:10", "speed", "access");
    expect(plan.door.verdict).toBe("FAIL");
    expect(slotType(plan, "S8")).toBe("clear");
    expect(plan.slots.some((s) => s.type === "disabled")).toBe(false);
    expect(plan.scores.busDelayMin).toBe(0);
  });

  it("20:10 + Access + Spine → S8 disabled, V1 assigned T-rpa, SERVE", () => {
    const plan = solve("20:10", "spine", "access");
    expect(slotType(plan, "S8")).toBe("disabled");
    expect(plan.vans.find((v) => v.id === "V1")?.assignedTripId).toBe("T-rpa");
    expect(plan.door.verdict).toBe("SERVE");
  });

  it("14:00 + Heat + Spine → slot colours jump (shade-side short-stop)", () => {
    const nightDoor = solve("20:10", "spine", "access");
    const heat = solve("14:00", "spine", "heat");
    expect(heat.slots.map((s) => s.type).join("|")).not.toBe(
      nightDoor.slots.map((s) => s.type).join("|"),
    );
    expect(slotType(heat, "S3")).toMatch(/^(van|load)$/);
  });

  it("20:10 + Night + Spine → parks gone", () => {
    const plan = solve("20:10", "spine", "night");
    expect(plan.slots.some((s) => s.type === "park")).toBe(false);
  });
});
