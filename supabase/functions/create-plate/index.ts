import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type Body = { organizationId?: number; plateType?: "main" | "employee" };
function headers(request: Request) { return { "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8", Vary: "Origin" }; }
function json(request: Request, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: headers(request) }); }
function randomDigits(length: number) { const values = new Uint32Array(length); crypto.getRandomValues(values); return Array.from(values, (value) => String(value % 10)).join(""); }
async function sha256(value: string) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)); return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(""); }

const createPlate = withSupabase({ auth: "user" }, async (request, context) => {
  try {
    const body = await request.json() as Body; const organizationId = Number(body.organizationId); const type = body.plateType === "employee" ? "employee" : "main"; const userId = context.userClaims?.sub;
    if (!userId || !Number.isSafeInteger(organizationId)) return json(request, { error: "Organização inválida." }, 400);
    const { data: membership } = await context.supabase.from("organization_members").select("id").eq("organization_id", organizationId).eq("user_id", userId).eq("role", "admin").eq("status", "active").maybeSingle();
    if (!membership) return json(request, { error: "Somente administradores podem criar placas." }, 403);
    const activationCode = randomDigits(8); const activationCodeHash = await sha256(activationCode); let publicId = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      publicId = `${type === "employee" ? "P" : "A"}${randomDigits(7)}`;
      const { error } = await context.supabase.from("plates").insert({ organization_id: organizationId, public_id: publicId, plate_type: type, lifecycle_status: "available", activation_code_hash: activationCodeHash });
      if (!error) return json(request, { plate: { publicId, plateType: type, lifecycleStatus: "available" }, activationCode });
      if (error.code !== "23505") throw error;
    }
    return json(request, { error: "Não foi possível gerar um identificador único." }, 409);
  } catch (error) { console.error("create-plate failure", error); return json(request, { error: "Não foi possível criar a placa." }, 500); }
});

export default { fetch(request: Request) { if (request.method === "OPTIONS") return new Response("ok", { headers: headers(request) }); if (request.method !== "POST") return json(request, { error: "Método não permitido." }, 405); return createPlate(request); } };
