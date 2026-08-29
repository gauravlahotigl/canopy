"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MapCanvas } from "@/components/journey/MapCanvasDynamic";
import { NeedsChooser } from "@/components/journey/NeedsChooser";
import { PlaceSearch } from "@/components/journey/PlaceSearch";
import { RouteCard } from "@/components/journey/RouteCard";
import { RouteToggle } from "@/components/journey/RouteToggle";
import { planJourney } from "@/lib/journey/routing";
import type { JourneyPlan, LatLng, NeedId, Place, RouteMode } from "@/lib/journey/types";
import { useState } from "react";

const DEMO_FROM: Place = {
  label: "University of Sydney (Eastern Avenue)",
  position: { lat: -33.8886, lng: 151.1873 },
};
const DEMO_TO: Place = {
  label: "Royal Prince Alfred Hospital (Missenden Rd entrance)",
  position: { lat: -33.8907, lng: 151.1795 },
};

export default function JourneyPage() {
  const [from, setFrom] = useState<Place | null>(null);
  const [to, setTo] = useState<Place | null>(null);
  const [activeNeeds, setActiveNeeds] = useState<NeedId[]>([]);
  const [pickingField, setPickingField] = useState<"from" | "to" | null>(null);
  const [plan, setPlan] = useState<JourneyPlan | null>(null);
  const [mode, setMode] = useState<RouteMode>("forYou");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePick(field: "from" | "to") {
    setPickingField((current) => (current === field ? null : field));
  }

  function handleMapClick(pos: LatLng) {
    if (!pickingField) return;
    const place: Place = {
      label: `Pinned location (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`,
      position: pos,
    };
    if (pickingField === "from") setFrom(place);
    else setTo(place);
    setPickingField(null);
  }

  function toggleNeed(id: NeedId) {
    setActiveNeeds((current) =>
      current.includes(id) ? current.filter((n) => n !== id) : [...current, id],
    );
  }

  async function runPlan(fromPlace: Place, toPlace: Place) {
    setLoading(true);
    setError(null);
    try {
      const result = await planJourney(fromPlace, toPlace, activeNeeds);
      setPlan(result);
      setMode("forYou");
    } catch {
      setError("Couldn't plan that route. Try the demo walk instead.");
    } finally {
      setLoading(false);
    }
  }

  function handlePlan() {
    if (!from || !to) return;
    runPlan(from, to);
  }

  function handleDemo() {
    setFrom(DEMO_FROM);
    setTo(DEMO_TO);
    setActiveNeeds(["toilets", "heart"]);
    runPlan(DEMO_FROM, DEMO_TO);
  }

  const activeRoute = plan ? (mode === "forYou" ? plan.forYou : plan.fastest) : null;

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <MapCanvas
        from={from}
        to={to}
        fastest={plan?.fastest ?? null}
        forYou={plan?.forYou ?? null}
        mode={mode}
        pickingField={pickingField}
        onMapClick={handleMapClick}
      />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex justify-center md:inset-x-auto md:left-4 md:justify-start">
        <Card className="pointer-events-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-sm flex-col overflow-y-auto p-5">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-journey-accent">
              journey
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-journey-ink">
              Plan a walk that fits you
            </h1>
          </div>

          <div className="space-y-3">
            <PlaceSearch
              id="from"
              label="From"
              placeholder="Search or tap the pin to drop on map"
              value={from}
              picking={pickingField === "from"}
              onSelect={setFrom}
              onTogglePick={() => togglePick("from")}
            />
            <PlaceSearch
              id="to"
              label="To"
              placeholder="Search or tap the pin to drop on map"
              value={to}
              picking={pickingField === "to"}
              onSelect={setTo}
              onTogglePick={() => togglePick("to")}
            />
          </div>

          <div className="mt-4">
            <NeedsChooser active={activeNeeds} onToggle={toggleNeed} />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={handlePlan} disabled={!from || !to || loading}>
              {loading ? "Finding your route…" : "Plan route"}
            </Button>
            <Button variant="ghost" onClick={handleDemo} disabled={loading}>
              Try the demo walk
            </Button>
          </div>

          <div aria-live="polite" className="mt-2">
            {error && <p className="text-sm text-journey-pharmacy">{error}</p>}
          </div>

          {plan && activeRoute && (
            <div className="mt-5 border-t border-journey-border pt-4">
              <RouteToggle mode={mode} onChange={setMode} />
              {plan.isFallback && (
                <p className="mt-2 text-xs text-journey-ink-muted">
                  Showing a demo route — add an OpenRouteService key for live planning.
                </p>
              )}
              <div className="mt-3">
                <RouteCard route={activeRoute} />
              </div>
            </div>
          )}

          <p className="mt-5 text-xs text-journey-ink-muted">
            Planning help, not medical advice. What you choose above stays on this device.
          </p>
        </Card>
      </div>
    </main>
  );
}
