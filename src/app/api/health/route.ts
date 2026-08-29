export async function GET() {
  return Response.json(
    { ok: true, service: "spine" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
