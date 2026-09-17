import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

type ActivatePlateBody = {
  accountId?: number;
  plateId?: string;
  activationCode?: string;
  name?: string;
  location?: string;
};

function corsHeaders(request: Request) {
  return {
    "Access-Control-Allow-Origin": request.headers.get("origin") ?? "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

const activate = withSupabase({ auth: "user" }, async (request, context) => {
  try {
    const body = await request.json() as ActivatePlateBody;
    const accountId = Number(body.accountId);
    const plateId = body.plateId?.trim().toUpperCase();
    const activationCode = body.activationCode?.trim();
    const userId = context.userClaims?.sub;

    if (!userId || !Number.isSafeInteger(accountId) || accountId <= 0 || !plateId || !activationCode) {
      return json(request, { error: "Informe o estabelecimento, o ID da placa e o código de ativação." }, 400);
    }

    const { data, error } = await context.supabaseAdmin.rpc("activate_plate_for_account", {
      requested_user_id: userId,
      requested_account_id: accountId,
      requested_public_id: plateId,
      requested_code: activationCode,
      requested_name: body.name?.trim() || null,
      requested_location: body.location?.trim() || null,
    });

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("access denied")) return json(request, { error: "Você não possui permissão neste estabelecimento." }, 403);
      if (lower.includes("not found")) return json(request, { error: "Placa ou estabelecimento não encontrado." }, 404);
      if (lower.includes("already activated")) return json(request, { error: "Esta placa já foi ativada." }, 409);
      if (lower.includes("invalid activation code")) return json(request, { error: "Código de ativação inválido." }, 400);
      if (lower.includes("unavailable")) return json(request, { error: "Esta placa ainda não está disponível para ativação." }, 409);
      throw error;
    }

    return json(request, { plate: data }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível ativar a placa.";
    return json(request, { error: message }, 500);
  }
});

export default {
  fetch(request: Request) {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
    if (request.method !== "POST") return json(request, { error: "Método não permitido." }, 405);
    return activate(request);
  },
};
