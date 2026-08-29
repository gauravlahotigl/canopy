# Spine engine — UI contract

Import the typed client. Do not reimplement `solve()`.

```ts
import { fetchPlan, fetchCorridor, fetchMeta } from "@/lib/spine/client";
```

`fetchPlan({ clock, planner, canopy })` hits `GET /api/plan?...` and returns a `Plan`.  
`fetchCorridor()` is pin seed (slots, vans, RPA door, map center).  
`fetchMeta()` is button allowlists, `DEFAULT_QUERY`, tagline, slot colours.

**Render Plan. Do not recompute SERVE/FAIL.** `plan.door.verdict` and `plan.slots[].type` are the only colour/verdict sources.

Current `page.tsx` still calls `solve()` directly. Please switch Controls to `fetchPlan` (or `/api/plan`) so the map matches this public contract.

## Film URLs

| URL | `door.verdict` |
|---|---|
| `/api/plan?clock=20:10&planner=paint&canopy=access` | **FAIL** (`path exists, stop does not.`) |
| `/api/plan?clock=20:10&planner=speed&canopy=access` | **FAIL** (S8 `clear`, no disabled bay) |
| `/api/plan?clock=20:10&planner=spine&canopy=access` | **SERVE** (S8 `disabled`, V1 → `T-rpa`) |
| `/api/plan?clock=14:00&planner=spine&canopy=heat` | slot colours jump (shade-side short-stop). Door is not the story. |

Default query (first frame): `clock=20:10&planner=paint&canopy=access`.

400 responses are `{ error, hint }` with allowlisted `clock` / `planner` / `canopy`.
