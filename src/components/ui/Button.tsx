"use client";

import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-journey-accent text-journey-accent-ink shadow-[0_8px_20px_-6px_rgb(242_106_75_/_0.55)] hover:brightness-105 active:brightness-95",
  secondary:
    "bg-journey-bg-raised text-journey-ink border border-journey-border hover:border-journey-ink/30",
  ghost: "bg-transparent text-journey-ink-muted hover:text-journey-ink",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
