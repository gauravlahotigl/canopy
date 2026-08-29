import { SLOT_COLORS, type Plan, type SlotType } from "@/lib/spine/types";

export function SlotStrip({ plan }: { plan: Plan }) {
  return (
    <div className="grid grid-cols-5 gap-1 lg:grid-cols-10">
      {plan.slots.map((slot) => (
        <SlotChip
          key={slot.id}
          id={slot.id}
          type={slot.type}
          highlight={slot.id === "S8"}
        />
      ))}
    </div>
  );
}

function SlotChip({
  id,
  type,
  highlight,
}: {
  id: string;
  type: SlotType;
  highlight: boolean;
}) {
  return (
    <div
      data-testid={id === "S8" ? "slot-s8" : undefined}
      data-s8={id === "S8" ? type : undefined}
      title={`${id} ${type}`}
      className={
        highlight
          ? "flex flex-col items-center rounded-md border-2 border-white px-1 py-0.5"
          : "flex flex-col items-center rounded-md border border-black/20 px-1 py-0.5"
      }
      style={{ backgroundColor: SLOT_COLORS[type] }}
    >
      <span className="text-[10px] font-bold text-white drop-shadow">{id}</span>
      <span className="text-[8px] uppercase tracking-wide text-white/95">
        {type}
      </span>
    </div>
  );
}
