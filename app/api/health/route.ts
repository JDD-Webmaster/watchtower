// GET /api/health — used by the deploy pipeline to confirm the new
// container is actually serving before traffic is trusted to it and before
// the old container is torn down. Deliberately has zero dependencies (no
// DB/API calls) — it only needs to prove the Next.js server process itself
// came up, not that the backend is reachable.
export async function GET() {
  return Response.json({ status: "ok" }, { status: 200 });
}
