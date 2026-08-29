import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journey — plan a walk that fits you",
  description:
    "A health-aware pedestrian route planner: toilets, rest, step-free paths, shade, and light — planned around what you need today.",
};

export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="journey-root min-h-full bg-journey-bg text-journey-ink">
      {children}
    </div>
  );
}
