"use client";

import type { RouteMode } from "@/lib/journey/types";

interface RouteToggleProps {
  mode: RouteMode;
  onChange: (mode: RouteMode) => void;
}

export function RouteToggle({ mode, onChange }: RouteToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Route"
      className="grid grid-cols-2 gap-1 rounded-2xl border border-journey-border bg-journey-bg p-1"
    >
      {(["fastest", "forYou"] as const).map((option) => (
        <button
          key={option}
          role="tab"
          aria-selected={mode === option}
          onClick={() => onChange(option)}
          className={`min-h-9 rounded-xl text-sm font-semibold transition ${
            mode === option
              ? "bg-journey-accent text-journey-accent-ink shadow-sm"
              : "text-journey-ink-muted hover:text-journey-ink"
          }`}
        >
          {option === "fastest" ? "Fastest" : "For you"}
        </button>
      ))}
    </div>
  );
}
