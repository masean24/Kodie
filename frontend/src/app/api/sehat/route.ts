/** Endpoint healthcheck untuk Coolify/Docker: `GET /api/sehat` membalas 200 selama server Next.js hidup. */
export function GET() {
  return Response.json({ status: "ok" });
}
