"use client";

import { geocode } from "@/lib/journey/routing";
import type { Place } from "@/lib/journey/types";
import { useEffect, useRef, useState } from "react";

interface PlaceSearchProps {
  id: string;
  label: string;
  placeholder: string;
  value: Place | null;
  picking: boolean;
  onSelect: (place: Place) => void;
  onTogglePick: () => void;
}

export function PlaceSearch({
  id,
  label,
  placeholder,
  value,
  picking,
  onSelect,
  onTogglePick,
}: PlaceSearchProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value]);

  function handleChange(text: string) {
    setQuery(text);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await geocode(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function handleSelect(place: Place) {
    onSelect(place);
    setQuery(place.label);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-journey-ink-muted">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="min-h-11 w-full rounded-2xl border border-journey-border bg-journey-bg-raised px-4 text-sm text-journey-ink placeholder:text-journey-ink-muted focus:border-journey-accent focus:outline-none focus:ring-2 focus:ring-journey-accent/25"
        />
        <button
          type="button"
          onClick={onTogglePick}
          aria-pressed={picking}
          title="Pick on map"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-sm transition ${
            picking
              ? "border-journey-accent bg-journey-accent-soft text-journey-accent"
              : "border-journey-border bg-journey-bg-raised text-journey-ink-muted hover:text-journey-ink"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21s7-6.4 7-12a7 7 0 1 0-14 0c0 5.6 7 12 7 12Z" />
            <circle cx="12" cy="9" r="2.4" />
          </svg>
          <span className="sr-only">Pick {label.toLowerCase()} on map</span>
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-[1100] mt-1 w-full overflow-hidden rounded-2xl border border-journey-border bg-journey-bg-raised shadow-[0_16px_40px_-20px_rgb(23_21_18_/_0.4)]">
          {suggestions.map((s) => (
            <li key={`${s.position.lat}-${s.position.lng}`}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(s)}
                className="block w-full px-4 py-2.5 text-left text-sm text-journey-ink hover:bg-journey-bg"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
