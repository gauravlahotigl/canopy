"use client";

import { StreetMap } from "@/components/map/StreetMapDynamic";
import { Controls } from "@/components/operator/Controls";
import { DoorBadge } from "@/components/operator/DoorBadge";
import { Scoreboard } from "@/components/operator/Scoreboard";
import { SlotStrip } from "@/components/operator/SlotStrip";
import { solve } from "@/lib/spine/solve";
import {
  SLOT_COLORS,
  SLOT_LEGEND,
  type Canopy,
  type Clock,
  type Planner,
  type SlotType,
} from "@/lib/spine/types";
import { useMemo, useState } from "react";

export default function Page() {
  const [clock, setClock] = useState<Clock>("20:10");
  const [planner, setPlanner] = useState<Planner>("paint");
  const [canopy, setCanopy] = useState<Canopy>("access");

  const plan = useMemo(
    () => solve(clock, planner, canopy),
    [clock, planner, canopy],
  );

  const s8 = plan.slots.find((s) => s.id === "S8");
  const v1 = plan.vans.find((v) => v.id === "V1");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-amber-500/90">
            heat · night · access
          </p>
          <h1 className="font-mono text-3xl font-semibold tracking-tight">
            Spine
          </h1>
          <p className="text-sm text-zinc-400">{plan.corridor.name}</p>
        </div>
        <p className="max-w-md text-right text-sm text-zinc-400">
          {plan.tagline}
        </p>
      </header>

      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 overflow-y-auto border-b border-zinc-800 p-5 lg:border-b-0 lg:border-r">
          <Controls
            clock={clock}
            planner={planner}
            canopy={canopy}
            onClock={setClock}
            onPlanner={setPlanner}
            onCanopy={setCanopy}
          />
          <DoorBadge plan={plan} />
          <Scoreboard plan={plan} />
          <Legend />
        </aside>

        <section className="relative min-h-[420px] lg:min-h-0">
          <div className="pointer-events-none absolute inset-x-3 top-3 z-[2000]">
            <div className="rounded-md border border-zinc-800 bg-zinc-950/85 p-2 backdrop-blur-sm">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                Kerb · S8 is the door lever
              </p>
              <SlotStrip plan={plan} />
              <p className="mt-2 font-mono text-xs text-zinc-300">
                S8={s8?.type} · V1={v1?.assignedTripId ?? "idle"}
              </p>
            </div>
          </div>
          <StreetMap plan={plan} />
        </section>
      </div>
    </div>
  );
}

function Legend() {
  const types = Object.keys(SLOT_LEGEND) as SlotType[];
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
      {types.map((type) => (
        <li key={type} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: SLOT_COLORS[type] }}
          />
          {SLOT_LEGEND[type]}
        </li>
      ))}
    </ul>
  );
}
