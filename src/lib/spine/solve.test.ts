import { describe, expect, it } from "vitest";
import { solve, slotType } from "./solve";

describe("solve() golden matrix", () => {
  it("20:10 paint access: S8 park, V1 idle, door FAIL", () => {
    const plan = solve("20:10", "paint", "access");
    expect(slotType(plan, "S8")).toBe("park");
    expect(plan.vans[0]?.assignedTripId).toBeNull();
    expect(plan.door.googlePathExists).toBe(true);
    expect(plan.door.verdict).toBe("FAIL");
    expect(plan.door.reason).toContain("path exists, stop does not");
    expect(plan.scores.door).toBe("fail");
    expect(plan.tagline).toBe(
      "Google gets you to the pin. Spine decides if you can stop.",
    );
  });

  it("20:10 speed access: S8 clear, V1 idle, door FAIL", () => {
    const plan = solve("20:10", "speed", "access");
    expect(slotType(plan, "S8")).toBe("clear");
    expect(plan.slots.some((s) => s.type === "disabled")).toBe(false);
    expect(plan.vans[0]?.assignedTripId).toBeNull();
    expect(plan.door.verdict).toBe("FAIL");
    expect(plan.door.reason).toContain("path exists, stop does not");
    expect(plan.scores.busDelayMin).toBe(0);
  });

  it("20:10 spine access: S8 disabled, V1 → T-rpa, SERVE", () => {
    const plan = solve("20:10", "spine", "access");
    expect(slotType(plan, "S8")).toBe("disabled");
    expect(plan.vans[0]?.id).toBe("V1");
    expect(plan.vans[0]?.assignedTripId).toBe("T-rpa");
    expect(plan.door.verdict).toBe("SERVE");
    expect(plan.scores.door).toBe("serve");
    expect(plan.scores.busDelayMin).toBeLessThanOrEqual(3);
    expect(plan.scores.tripsServed).toBeGreaterThanOrEqual(1);
    expect(plan.trips.find((t) => t.id === "T-rpa")?.status).toBe("served");
    expect(plan.slots.some((s) => s.type === "bus")).toBe(true);
  });

  it("14:00 spine heat: shade-side short-stop, not the 20:10 access paint", () => {
    const heat = solve("14:00", "spine", "heat");
    const access = solve("20:10", "spine", "access");
    const heatTypes = heat.slots.map((s) => s.type).join(",");
    const accessTypes = access.slots.map((s) => s.type).join(",");
    expect(heatTypes).not.toBe(accessTypes);
    expect(slotType(heat, "S3")).toMatch(/^(van|load)$/);
    expect(heat.slots.find((s) => s.id === "S3")?.shade).toBe(true);
    expect(slotType(heat, "S8")).not.toBe("disabled");
  });

  it("20:10 spine night: empty park dies, pickup on a lit slot", () => {
    const plan = solve("20:10", "spine", "night");
    expect(plan.slots.every((s) => s.type !== "park")).toBe(true);
    const pickup = plan.slots.filter(
      (s) => s.type === "van" || s.type === "disabled",
    );
    expect(pickup.length).toBeGreaterThan(0);
    expect(pickup.some((s) => s.lit)).toBe(true);
  });

  it("never invents a van", () => {
    const plan = solve("20:10", "spine", "access");
    expect(plan.vans.map((v) => v.id)).toEqual(["V1"]);
  });

  it("same demand list for every planner at 20:10", () => {
    const ids = (planner: "paint" | "speed" | "spine") =>
      solve("20:10", planner, "access")
        .trips.map((t) => t.id)
        .sort();
    expect(ids("paint")).toEqual(ids("speed"));
    expect(ids("speed")).toEqual(ids("spine"));
    expect(ids("paint")).toContain("T-rpa");
  });
});
