"use client";

import { Chip } from "@/components/ui/Chip";
import { NEEDS } from "@/lib/journey/needs";
import type { NeedId } from "@/lib/journey/types";

interface NeedsChooserProps {
  active: NeedId[];
  onToggle: (id: NeedId) => void;
}

export function NeedsChooser({ active, onToggle }: NeedsChooserProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-medium text-journey-ink-muted">
        Your needs (optional)
      </legend>
      <div className="grid grid-cols-2 gap-2">
        {NEEDS.map((need) => (
          <Chip
            key={need.id}
            label={need.label}
            hint={need.hint}
            selected={active.includes(need.id)}
            onClick={() => onToggle(need.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}
