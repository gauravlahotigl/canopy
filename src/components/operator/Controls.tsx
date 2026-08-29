"use client";

import type { Canopy, Clock, Planner } from "@/lib/spine/types";

type Seg<T extends string> = {
  value: T;
  label: string;
};

function Group<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Seg<T>[];
  onChange: (next: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const on = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(opt.value)}
              className={
                on
                  ? "rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-950"
                  : "rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-500"
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Controls({
  clock,
  planner,
  canopy,
  onClock,
  onPlanner,
  onCanopy,
}: {
  clock: Clock;
  planner: Planner;
  canopy: Canopy;
  onClock: (clock: Clock) => void;
  onPlanner: (planner: Planner) => void;
  onCanopy: (canopy: Canopy) => void;
}) {
  return (
    <div
      className="flex flex-col gap-5"
      data-clock={clock}
      data-planner={planner}
      data-canopy={canopy}
    >
      <Group
        label="Clock"
        value={clock}
        onChange={onClock}
        options={[
          { value: "14:00", label: "14:00" },
          { value: "20:10", label: "20:10" },
        ]}
      />
      <Group
        label="Planner"
        value={planner}
        onChange={onPlanner}
        options={[
          { value: "paint", label: "Paint" },
          { value: "speed", label: "Speed" },
          { value: "spine", label: "Spine" },
        ]}
      />
      <Group
        label="Canopy"
        value={canopy}
        onChange={onCanopy}
        options={[
          { value: "heat", label: "Heat" },
          { value: "night", label: "Night" },
          { value: "access", label: "Access" },
        ]}
      />
    </div>
  );
}
