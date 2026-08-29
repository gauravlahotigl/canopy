import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-journey-border bg-journey-bg-raised shadow-[0_16px_40px_-24px_rgb(23_21_18_/_0.35)] ${className}`}
      {...props}
    />
  );
}
