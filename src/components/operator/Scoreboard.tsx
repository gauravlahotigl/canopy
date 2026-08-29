import type { Plan } from "@/lib/spine/types";

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

export function Scoreboard({ plan }: { plan: Plan }) {
  const s = plan.scores;
  return (
    <div data-testid="scoreboard" className="grid grid-cols-2 gap-2">
      <Cell label="trips served" value={String(s.tripsServed)} />
      <Cell label="door" value={s.door} />
      <Cell label="bus delay" value={`${s.busDelayMin} min`} />
      <Cell label="extra sun/dark" value={`${s.extraWalkSunDarkMin} min`} />
    </div>
  );
}
