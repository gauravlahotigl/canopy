import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/corridor/route";
import {
  CORRIDOR_NAME,
  MAP_CENTER,
  MAP_ZOOM,
  RPA_DOOR,
  SEED_SLOTS,
  SEED_VANS,
} from "./corridor";

describe("GET /api/corridor", () => {
  it("returns pin seed the UI can drop", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const body = await res.json();
    expect(body.name).toBe(CORRIDOR_NAME);
    expect(body.door).toEqual(RPA_DOOR);
    expect(body.slots).toEqual(SEED_SLOTS);
    expect(body.vans).toEqual(SEED_VANS);
    expect(body.map).toEqual({ center: MAP_CENTER, zoom: MAP_ZOOM });
  });
});
