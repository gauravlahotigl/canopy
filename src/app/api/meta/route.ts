import {
  CANOPIES,
  CLOCKS,
  DEFAULT_QUERY,
  PLANNERS,
  SLOT_COLORS,
  SLOT_LEGEND,
  SLOT_TYPES,
  TAGLINE,
} from "@/lib/spine/config";

export async function GET() {
  return Response.json(
    {
      clocks: CLOCKS,
      planners: PLANNERS,
      canopies: CANOPIES,
      slotTypes: SLOT_TYPES,
      defaultQuery: DEFAULT_QUERY,
      tagline: TAGLINE,
      slotColors: SLOT_COLORS,
      slotLegend: SLOT_LEGEND,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
