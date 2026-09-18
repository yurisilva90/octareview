import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type PublicRequest = { token?: string; action?: "load" | "connect_started" };
const defaultOrigins = ["http://127.0.0.1:3000", "http://localhost:3000", "https://yurisilva90.github.io"];

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const origins = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  const allowed = origins.length ? origins : defaultOrigins;
  return { "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0], "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8", Vary: "Origin" };
}

function json(request: Request, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) }); }

async function hashToken(token: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeToken(value: unknown) {
  return typeof value === "string" && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Método não permitido." }, 405);
  try {
    const body = await request.json() as PublicRequest;
    const token = safeToken(body.token);
    if (!token) return json(request, { error: "Link de diagnóstico inválido." }, 400);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secrets = Deno.env.get("SUPABASE_SECRET_KEYS");
    const serviceKey = secrets ? JSON.parse(secrets).default as string | undefined : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Configuração interna indisponível.");
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: link, error } = await admin.from("diagnostic_access_links")
      .select("id,organization_id,account_id,diagnostic_id,status,expires_at,first_opened_at,open_count,diagnostics!inner(report,status,completed_at,accounts!inner(name))")
      .eq("token_hash", await hashToken(token)).maybeSingle();
    if (error) throw error;
    if (!link || link.status !== "active" || (link.expires_at && new Date(link.expires_at) < new Date())) return json(request, { error: "Este link não está mais disponível." }, 404);
    if (body.action === "connect_started") {
      await admin.from("diagnostic_journey_events").insert({ organization_id: link.organization_id, account_id: link.account_id, diagnostic_id: link.diagnostic_id, diagnostic_access_link_id: link.id, event_type: "google_connect_started" });
      return json(request, { ok: true, message: "A conexão oficial será habilitada após a configuração do Google." });
    }
    const now = new Date().toISOString();
    await admin.from("diagnostic_access_links").update({ first_opened_at: link.first_opened_at ?? now, last_opened_at: now, open_count: link.open_count + 1 }).eq("id", link.id);
    await admin.from("diagnostic_journey_events").insert({ organization_id: link.organization_id, account_id: link.account_id, diagnostic_id: link.diagnostic_id, diagnostic_access_link_id: link.id, event_type: "diagnostic_opened" });
    const diagnostic = Array.isArray(link.diagnostics) ? link.diagnostics[0] : link.diagnostics;
    return json(request, { report: diagnostic?.report ?? null, businessName: diagnostic?.accounts?.name ?? "Empresa", level: "initial", connectionAvailable: false });
  } catch (error) {
    console.error("public-diagnostic failure", error);
    return json(request, { error: "Não foi possível carregar este diagnóstico." }, 500);
  }
});
