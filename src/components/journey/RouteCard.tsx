"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AmenityKind, RouteResult } from "@/lib/journey/types";

const KIND_LABEL: Record<AmenityKind, string> = {
  toilet: "Toilet",
  bench: "Rest bench",
  water: "Water",
  pharmacy: "Pharmacy",
};

function effortLabel(ascentMeters: number | undefined, distanceMeters: number): string {
  if (!ascentMeters || distanceMeters === 0) return "Flat";
  const gradient = ascentMeters / distanceMeters;
  if (gradient < 0.01) return "Flat";
  if (gradient < 0.03) return "Gentle rise";
  return "Some hills";
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

export function RouteCard({ route }: { route: RouteResult }) {
  const reduceMotion = useReducedMotion();
  const transition = { duration: reduceMotion ? 0 : 0.25, ease: "easeOut" as const };

  return (
    <div>
      <div className="flex items-baseline gap-4">
        <p className="text-2xl font-semibold tracking-tight text-journey-ink">
          {formatDuration(route.durationSeconds)}
        </p>
        <p className="text-sm text-journey-ink-muted">
          {formatDistance(route.distanceMeters)} · {effortLabel(route.ascentMeters, route.distanceMeters)}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {route.notes.length > 0 && (
          <motion.p
            key={route.notes.join("|")}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={transition}
            className="mt-1.5 text-sm text-journey-accent"
          >
            {route.notes[0]}
          </motion.p>
        )}
      </AnimatePresence>

      {route.stops.length > 0 && (
        <ol className="mt-4 space-y-2 border-t border-journey-border pt-3">
          {route.stops.map((stop, i) => (
            <motion.li
              key={stop.amenity.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...transition, delay: reduceMotion ? 0 : i * 0.05 }}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-journey-ink">
                {KIND_LABEL[stop.amenity.kind]}
                {stop.amenity.name ? ` · ${stop.amenity.name}` : ""}
              </span>
              <span className="text-journey-ink-muted">{stop.etaMinutes} min</span>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
