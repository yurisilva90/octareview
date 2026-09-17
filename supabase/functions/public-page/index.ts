import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

type PublicRequest = {
  action?: "load" | "event" | "contact";
  slug?: string;
  eventType?: string;
  source?: string;
  sessionId?: string;
  linkId?: string;
  campaign?: string;
  website?: string;
  contact?: {
    fullName?: string;
    whatsapp?: string;
    email?: string;
    consentAccepted?: boolean;
    fieldValues?: Record<string, unknown>;
  };
};

const allowedOrigins = ["http://127.0.0.1:3000", "http://localhost:3000", "https://yurisilva90.github.io"];
const allowedSources = new Set(["page", "nfc", "qr", "direct", "campaign"]);
const allowedEvents = new Set([
  "page_view", "plate_open", "google_review_click", "whatsapp_click", "website_click",
  "instagram_click", "facebook_click", "tiktok_click", "youtube_click", "linkedin_click",
  "map_click", "menu_click", "delivery_click", "booking_click", "pix_click", "payment_click",
  "custom_link_click", "lead_submit",
]);

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  const origins = configured.length ? configured : allowedOrigins;
  return {
    "Access-Control-Allow-Origin": origins.includes(origin) ? origin : origins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safePublicUrl(value: unknown) {
  const candidate = clean(value, 2048);
  try {
    const parsed = new URL(candidate);
    return ["https:", "http:", "tel:", "mailto:"].includes(parsed.protocol) ? candidate : null;
  } catch {
    return null;
  }
}

function safeSource(value: unknown) {
  const source = clean(value, 20);
  return allowedSources.has(source) ? source : "page";
}

function safeSession(value: unknown) {
  const session = clean(value, 36);
  return /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(session) ? session : null;
}

async function handler(request: Request) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
    const serviceKey = secretKeys ? (JSON.parse(secretKeys).default as string | undefined) : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Configuração interna indisponível.");
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await request.json() as PublicRequest;
    const action = body.action ?? "load";
    const slug = clean(body.slug, 80).toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return json(request, { error: "Página inválida." }, 400);
    if (body.website) return json(request, { ok: true });

    const { data: page, error: pageError } = await supabaseAdmin
      .from("smart_pages")
      .select("id,public_id,organization_id,account_id,slug,name,short_description,presentation_text,primary_color,logo_url,cover_url,footer_text,capture_enabled,capture_config,published_at")
      .eq("slug", slug)
      .eq("status", "published")
      .not("published_at", "is", null)
      .maybeSingle();
    if (pageError) throw pageError;
    if (!page) return json(request, { error: "Esta página não está publicada." }, 404);

    if (action === "load") {
      const { data: links, error: linksError } = await supabaseAdmin
        .from("page_links")
        .select("public_id,link_type,title,subtitle,url,sort_order")
        .eq("smart_page_id", page.id)
        .eq("active", true)
        .order("sort_order")
        .order("id");
      if (linksError) throw linksError;
      const publicLinks = (links ?? []).flatMap((link) => {
        const url = safePublicUrl(link.url);
        return url ? [{ ...link, url }] : [];
      });
      return json(request, {
        page: {
          id: page.public_id, slug: page.slug, name: page.name, shortDescription: page.short_description,
          presentationText: page.presentation_text, primaryColor: page.primary_color, logoUrl: page.logo_url,
          coverUrl: page.cover_url, footerText: page.footer_text, captureEnabled: page.capture_enabled,
          captureConfig: page.capture_config,
        },
        links: publicLinks,
      });
    }

    const source = safeSource(body.source);
    const campaign = clean(body.campaign, 120) || null;
    const sessionId = safeSession(body.sessionId);
    const device = { userAgent: clean(request.headers.get("user-agent"), 300) || null };

    if (action === "event") {
      const eventType = clean(body.eventType, 80);
      if (!allowedEvents.has(eventType) || eventType === "lead_submit") return json(request, { error: "Evento inválido." }, 400);
      let pageLinkId: number | null = null;
      if (body.linkId) {
        const { data: link } = await supabaseAdmin.from("page_links").select("id").eq("public_id", clean(body.linkId, 36)).eq("smart_page_id", page.id).eq("active", true).maybeSingle();
        pageLinkId = link?.id ?? null;
      }
      const { error } = await supabaseAdmin.from("interaction_events").insert({
        organization_id: page.organization_id, account_id: page.account_id, smart_page_id: page.id,
        page_link_id: pageLinkId, event_type: eventType, source, session_id: sessionId, campaign, device,
      });
      if (error) throw error;
      return json(request, { ok: true });
    }

    if (action === "contact") {
      if (!page.capture_enabled) return json(request, { error: "A captura de contatos não está ativa." }, 409);
      const contact = body.contact ?? {};
      const fullName = clean(contact.fullName, 160) || null;
      const whatsapp = clean(contact.whatsapp, 40) || null;
      const email = clean(contact.email, 254).toLowerCase() || null;
      const config = page.capture_config && typeof page.capture_config === "object" ? page.capture_config as Record<string, unknown> : {};
      const consentRequired = config.consent_required !== false;
      if (!fullName || (!whatsapp && !email)) return json(request, { error: "Informe seu nome e WhatsApp ou e-mail." }, 400);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(request, { error: "Informe um e-mail válido." }, 400);
      if (consentRequired && contact.consentAccepted !== true) return json(request, { error: "É necessário aceitar o consentimento." }, 400);
      const fieldValues = contact.fieldValues && typeof contact.fieldValues === "object" ? contact.fieldValues : {};
      const consentText = clean(config.consent_text, 500) || null;
      const { data: captured, error: contactError } = await supabaseAdmin.from("captured_contacts").insert({
        organization_id: page.organization_id, account_id: page.account_id, smart_page_id: page.id,
        source, full_name: fullName, whatsapp, email, field_values: fieldValues,
        consent_accepted: contact.consentAccepted === true, consent_text: consentText, campaign,
      }).select("id").single();
      if (contactError) throw contactError;
      const { error: eventError } = await supabaseAdmin.from("interaction_events").insert({
        organization_id: page.organization_id, account_id: page.account_id, smart_page_id: page.id,
        captured_contact_id: captured.id, event_type: "lead_submit", source, session_id: sessionId, campaign, device,
      });
      if (eventError) throw eventError;
      return json(request, { ok: true, message: clean(config.success_message, 240) || "Cadastro realizado com sucesso." });
    }

    return json(request, { error: "Ação inválida." }, 400);
  } catch (error) {
    console.error("public-page failure", error);
    return json(request, { error: "Não foi possível carregar a página." }, 500);
  }
}

export default {
  fetch(request: Request) {
    if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
    if (request.method !== "POST") return json(request, { error: "Método não permitido." }, 405);
    return handler(request);
  },
};
