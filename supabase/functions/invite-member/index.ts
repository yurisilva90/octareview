import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type InviteBody = { organizationId?: number; email?: string; fullName?: string; role?: string; accountId?: number };
const roles = new Set(["admin", "commercial", "finance", "success", "partner", "customer"]);

function headers(request: Request) { return { "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json; charset=utf-8", Vary: "Origin" }; }
function json(request: Request, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: headers(request) }); }

const invite = withSupabase({ auth: "user" }, async (request, context) => {
  try {
    const body = await request.json() as InviteBody; const organizationId = Number(body.organizationId); const accountId = body.accountId ? Number(body.accountId) : null;
    const email = body.email?.trim().toLowerCase(); const fullName = body.fullName?.trim().slice(0, 160) || ""; const role = body.role?.trim() || ""; const userId = context.userClaims?.sub;
    if (!userId || !Number.isSafeInteger(organizationId) || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !roles.has(role)) return json(request, { error: "Informe e-mail e perfil válidos." }, 400);
    if (role === "customer" && (!accountId || !Number.isSafeInteger(accountId))) return json(request, { error: "Selecione o estabelecimento do cliente." }, 400);
    const { data: caller } = await context.supabaseAdmin.from("organization_members").select("id").eq("organization_id", organizationId).eq("user_id", userId).eq("role", "admin").eq("status", "active").maybeSingle();
    if (!caller) return json(request, { error: "Somente administradores podem convidar usuários." }, 403);
    if (accountId) { const { data: account } = await context.supabaseAdmin.from("accounts").select("id").eq("id", accountId).eq("organization_id", organizationId).maybeSingle(); if (!account) return json(request, { error: "Estabelecimento inválido." }, 400); }
    const { data: invited, error: inviteError } = await context.supabaseAdmin.auth.admin.inviteUserByEmail(email, { data: { full_name: fullName, octareview_role: role }, redirectTo: "https://yurisilva90.github.io/octareview/login/" });
    if (inviteError || !invited.user) { const detail = inviteError?.message.toLowerCase() ?? ""; if (detail.includes("already") || detail.includes("registered")) return json(request, { error: "Este e-mail já possui usuário. O vínculo de usuários existentes será liberado em Configurações." }, 409); throw inviteError ?? new Error("Convite não criado."); }
    const { error: memberError } = await context.supabaseAdmin.from("organization_members").insert({ organization_id: organizationId, user_id: invited.user.id, account_id: accountId, role, status: "active" });
    if (memberError) throw memberError;
    if (role === "customer" && accountId) { const { error: accessError } = await context.supabaseAdmin.from("account_users").insert({ organization_id: organizationId, account_id: accountId, user_id: invited.user.id, role: "owner", status: "active", invited_by: userId, accepted_at: new Date().toISOString() }); if (accessError) throw accessError; }
    return json(request, { ok: true, userId: invited.user.id });
  } catch (error) { console.error("invite-member failure", error); return json(request, { error: "Não foi possível enviar o convite." }, 500); }
});

export default { fetch(request: Request) { if (request.method === "OPTIONS") return new Response("ok", { headers: headers(request) }); if (request.method !== "POST") return json(request, { error: "Método não permitido." }, 405); return invite(request); } };
