import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/plan/route";
import { QUERY_HINT } from "./validate";
import { solve } from "./solve";

describe("/api/plan", () => {
  it("returns the same Plan as solve()", async () => {
    const expected = solve("20:10", "spine", "access");
    const res = await GET(
      new Request(
        "http://localhost/api/plan?clock=20:10&planner=spine&canopy=access",
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual(expected);
  });

  it("rejects bad query", async () => {
    const res = await GET(
      new Request("http://localhost/api/plan?clock=noon&planner=paint&canopy=access"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(body.hint).toEqual(QUERY_HINT);
  });
});
