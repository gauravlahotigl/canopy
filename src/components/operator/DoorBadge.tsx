import type { Plan } from "@/lib/spine/types";

export function DoorBadge({ plan }: { plan: Plan }) {
  const serve = plan.door.verdict === "SERVE";
  return (
    <div
      data-testid="door-badge"
      data-door={plan.door.verdict}
      className={
        serve
          ? "rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3"
          : "rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3"
      }
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
        RPA door
      </p>
      <p
        className={
          serve
            ? "mt-1 font-mono text-4xl font-bold tracking-tight text-emerald-400"
            : "mt-1 font-mono text-4xl font-bold tracking-tight text-rose-400"
        }
      >
        {plan.door.verdict}
      </p>
      <p className="mt-2 text-sm leading-snug text-zinc-300">{plan.door.reason}</p>
    </div>
  );
}
