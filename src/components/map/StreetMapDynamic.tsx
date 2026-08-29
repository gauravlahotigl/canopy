"use client";

import type { Plan } from "@/lib/spine/types";
import dynamic from "next/dynamic";

const StreetMapInner = dynamic(() => import("./StreetMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-950 text-sm text-zinc-500">
      Loading corridor…
    </div>
  ),
});

export function StreetMap({ plan }: { plan: Plan }) {
  return (
    <div className="absolute inset-0">
      <StreetMapInner plan={plan} />
    </div>
  );
}
