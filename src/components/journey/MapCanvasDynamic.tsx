"use client";

import type { LatLng, Place, RouteMode, RouteResult } from "@/lib/journey/types";
import dynamic from "next/dynamic";

const MapCanvasInner = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-journey-bg text-sm text-journey-ink-muted">
      Loading map…
    </div>
  ),
});

interface MapCanvasDynamicProps {
  from: Place | null;
  to: Place | null;
  fastest: RouteResult | null;
  forYou: RouteResult | null;
  mode: RouteMode;
  pickingField: "from" | "to" | null;
  onMapClick: (pos: LatLng) => void;
}

export function MapCanvas(props: MapCanvasDynamicProps) {
  return (
    <div className="absolute inset-0">
      <MapCanvasInner {...props} />
    </div>
  );
}
