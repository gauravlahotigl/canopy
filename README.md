# Spine (repo: canopy)

Operator control for **Broadway / City Rd**. The product on screen is Spine. CANOPY is three flags on that planner: **heat | night | access**. Not a walking app.

> Google gets you to the pin. Spine decides if you can stop.

## Run

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Default frame is **20:10 · Paint · Access** (door FAIL).

`GET /api/plan?clock=20:10&planner=paint&canopy=access` returns the same `Plan` as `solve()`.

## Film (click this, then stop)

1. **20:10 + Access + Paint** → RPA door **FAIL** — `path exists, stop does not.`
2. **Speed** → still **FAIL** (street clears, S8 is `clear`, no disabled bay)
3. **Spine** → S8 goes **disabled** (blue), van **V1 → T-rpa**, **SERVE**
4. **14:00 + Heat + Spine** → slot colours jump (S3 shade-side short-stop). Not a new polyline.

## Ownership

| Path | Who |
|---|---|
| `src/lib/spine/*` | engine — `solve(clock, planner, canopy)` is the single source of truth |
| `src/app/page.tsx` | operator screen; **must** call `solve()` |
| `src/app/api/plan/route.ts` | same `solve()`, JSON |
| `src/components/map/*` | map restyle only; colours come from `plan.slots[].type` |

Do not duplicate plans in React. Do not edit `solve.ts` to “make the map look nicer.”
