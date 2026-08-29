import {
  CORRIDOR_NAME,
  MAP_CENTER,
  MAP_ZOOM,
  RPA_DOOR,
  SEED_SLOTS,
  SEED_VANS,
} from "@/lib/spine/corridor";

export async function GET() {
  return Response.json(
    {
      name: CORRIDOR_NAME,
      door: RPA_DOOR,
      slots: SEED_SLOTS,
      vans: SEED_VANS,
      map: { center: MAP_CENTER, zoom: MAP_ZOOM },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
