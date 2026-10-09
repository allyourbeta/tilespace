// Authenticated-only endpoint (every call carries the caller's own JWT and
// every query runs under their RLS), so CORS just reflects the request
// origin rather than maintaining a fixed allow-list.
export function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

export function jsonResponse(body: unknown, corsHdrs: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHdrs, "Content-Type": "application/json" },
  });
}
