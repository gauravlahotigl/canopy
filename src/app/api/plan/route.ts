import { solve } from "@/lib/spine/solve";
import { isPlanQueryError, parsePlanQuery } from "@/lib/spine/validate";

export async function GET(request: Request) {
  try {
    const query = parsePlanQuery(new URL(request.url).searchParams);
    const plan = solve(query.clock, query.planner, query.canopy);
    return Response.json(plan, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    if (isPlanQueryError(err)) {
      return Response.json(
        { error: err.error, hint: err.hint },
        { status: 400 },
      );
    }
    throw err;
  }
}
