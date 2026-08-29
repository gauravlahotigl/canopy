"use client";

import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
  label: string;
  hint?: string;
}

export function Chip({ selected, label, hint, className = "", ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`flex min-h-11 flex-col items-start justify-center rounded-2xl border px-4 py-2 text-left text-sm font-medium transition ${
        selected
          ? "border-journey-accent bg-journey-accent-soft text-journey-accent"
          : "border-journey-border bg-journey-bg-raised text-journey-ink hover:border-journey-ink/25"
      } ${className}`}
      {...props}
    >
      <span>{label}</span>
      {hint && (
        <span
          className={`text-xs font-normal ${
            selected ? "text-journey-accent/80" : "text-journey-ink-muted"
          }`}
        >
          {hint}
        </span>
      )}
    </button>
  );
}
