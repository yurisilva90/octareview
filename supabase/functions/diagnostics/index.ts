import { createClient } from "npm:@supabase/supabase-js@2.116.0";
import { buildDiagnostic, findTargetPlace } from "../../../src/lib/diagnostic.ts";
import type { DiagnosticInput, PlaceRecord, ReviewRecord } from "../../../src/lib/types.ts";

type UnknownRecord = Record<string, unknown>;
type RequestBody = Partial<DiagnosticInput> & {
  accountId?: number;
  responsible?: string;
  phone?: string;
  email?: string;
};

const DEFAULT_ACTOR_ID = "compass/crawler-google-places";
const defaultOrigins = [
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://yurisilva90.github.io",
];

function corsHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const origins = allowed.length ? allowed : defaultOrigins;
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

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function mapReview(value: unknown): ReviewRecord | null {
  if (!value || typeof value !== "object") return null;
  const review = value as UnknownRecord;
  return {
    text: asString(review.text) ?? asString(review.textTranslated) ?? "",
    stars: asNumber(review.stars) ?? asNumber(review.rating),
    publishedAtDate: asString(review.publishedAtDate) ?? asString(review.publishAt),
    responseFromOwnerText: asString(review.responseFromOwnerText),
  };
}

function mapPlace(value: unknown): PlaceRecord | null {
  if (!value || typeof value !== "object") return null;
  const place = value as UnknownRecord;
  const title = asString(place.title);
  if (!title) return null;
  const rawLocation = place.location && typeof place.location === "object" ? place.location as UnknownRecord : null;
  const lat = rawLocation ? asNumber(rawLocation.lat) : null;
  const lng = rawLocation ? asNumber(rawLocation.lng) : null;
  const rawHours = Array.isArray(place.openingHours) ? place.openingHours : [];
  const rawReviews = Array.isArray(place.reviews) ? place.reviews : [];
  const distribution = place.reviewsDistribution && typeof place.reviewsDistribution === "object"
    ? Object.fromEntries(Object.entries(place.reviewsDistribution as UnknownRecord).filter((entry): entry is [string, number] => typeof entry[1] === "number"))
    : null;

  return {
    placeId: asString(place.placeId), title, address: asString(place.address), city: asString(place.city),
    categoryName: asString(place.categoryName),
    categories: Array.isArray(place.categories) ? place.categories.filter((item): item is string => typeof item === "string") : [],
    location: lat !== null && lng !== null ? { lat, lng } : null,
    website: asString(place.website), phone: asString(place.phone) ?? asString(place.phoneUnformatted),
    totalScore: asNumber(place.totalScore), reviewsCount: asNumber(place.reviewsCount), rank: asNumber(place.rank),
    openingHours: rawHours.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as UnknownRecord;
      const day = asString(record.day);
      const hours = asString(record.hours);
      return day && hours ? [{ day, hours }] : [];
    }),
    reviewsDistribution: distribution,
    reviews: rawReviews.map(mapReview).filter((review): review is ReviewRecord => review !== null),
    url: asString(place.url),
  };
}

async function runActor(input: Record<string, unknown>, actorId: string, token: string) {
  const actorPath = actorId.replace("/", "~");
  const response = await fetch(`https://api.apify.com/v2/acts/${encodeURIComponent(actorPath)}/run-sync-get-dataset-items?clean=true&format=json`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`A coleta no Google não concluiu (${response.status}): ${detail.slice(0, 180)}`);
  }
  const records: unknown = await response.json();
  if (!Array.isArray(records)) throw new Error("A Apify retornou um formato inesperado.");
  return records.map(mapPlace).filter((place): place is PlaceRecord => place !== null);
}

function parseBody(value: RequestBody): DiagnosticInput & Omit<RequestBody, keyof DiagnosticInput> {
  const businessName = asString(value.businessName);
  const location = asString(value.location);
  if (!businessName || businessName.length > 120 || !location || location.length > 160) {
    throw new Error("Informe o nome da empresa e a localização.");
  }
  return {
    businessName,
    location,
    category: asString(value.category) ?? "",
    maxCompetitors: Math.min(20, Math.max(3, Number(value.maxCompetitors) || 10)),
    maxReviews: Math.min(100, Math.max(0, Number(value.maxReviews) || 40)),
    accountId: typeof value.accountId === "number" ? value.accountId : undefined,
    responsible: asString(value.responsible) ?? undefined,
    phone: asString(value.phone) ?? undefined,
    email: asString(value.email) ?? undefined,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Método não permitido." }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json(request, { error: "Autenticação obrigatória." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKeys = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
    const apifyToken = Deno.env.get("APIFY_API_TOKEN");
    if (!supabaseUrl || !publishableKeys || !apifyToken) throw new Error("A função ainda não possui todos os segredos necessários.");
    const publishableKey = JSON.parse(publishableKeys).default as string;
    const supabase = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authorization } } });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return json(request, { error: "Sessão inválida ou expirada." }, 401);

    const input = parseBody(await request.json() as RequestBody);
    const { data: membership, error: membershipError } = await supabase
      .from("organization_members")
      .select("id, organization_id")
      .eq("user_id", userData.user.id)
      .eq("status", "active")
      .in("role", ["admin", "commercial", "partner"])
      .limit(1)
      .maybeSingle();
    if (membershipError || !membership) return json(request, { error: "Seu usuário não possui uma organização comercial ativa." }, 403);

    const actorId = Deno.env.get("APIFY_GOOGLE_MAPS_ACTOR_ID") || DEFAULT_ACTOR_ID;
    const targetRecords = await runActor({
      searchStringsArray: [input.businessName], locationQuery: input.location, maxCrawledPlacesPerSearch: 3,
      language: "pt-BR", skipClosedPlaces: true, scrapePlaceDetailPage: true,
      maxReviews: input.maxReviews, reviewsSort: "newest", reviewsOrigin: "google", scrapeReviewsPersonalData: false,
    }, actorId, apifyToken);
    const targetMatch = findTargetPlace(input.businessName, targetRecords, []);
    if (!targetMatch || targetMatch.similarity < 0.35) throw new Error(`Não foi possível identificar “${input.businessName}” em ${input.location}.`);
    const detectedCategory = input.category.trim() || targetMatch.place.categoryName || targetMatch.place.categories[0];
    if (!detectedCategory) throw new Error("O Google não informou uma categoria para a comparação.");

    const marketRecords = await runActor({
      searchStringsArray: [detectedCategory], locationQuery: input.location,
      maxCrawledPlacesPerSearch: input.maxCompetitors, language: "pt-BR", skipClosedPlaces: true,
      scrapePlaceDetailPage: true, maxReviews: 0, scrapeReviewsPersonalData: false,
    }, actorId, apifyToken);
    const report = buildDiagnostic({
      input: { ...input, category: detectedCategory }, targetRecords, marketRecords, mode: "live", actorId,
    });

    let accountId = input.accountId;
    if (!accountId) {
      const { data: account, error: accountError } = await supabase.from("accounts").insert({
        organization_id: membership.organization_id, name: report.business.title, category: detectedCategory,
        city: report.business.city, address: report.business.address, phone: input.phone ?? report.business.phone,
        email: input.email, website: report.business.website, google_place_id: report.business.placeId,
        google_profile_url: report.business.url, pipeline_stage: "diagnostic_presented", follow_up_status: "waiting",
        owner_member_id: membership.id, source: "diagnostic", created_by: userData.user.id,
      }).select("id").single();
      if (accountError) throw accountError;
      accountId = account.id as number;
    } else {
      const { error: accountError } = await supabase.from("accounts").update({
        name: report.business.title, category: detectedCategory, city: report.business.city,
        address: report.business.address, google_place_id: report.business.placeId,
        google_profile_url: report.business.url, pipeline_stage: "diagnostic_presented", follow_up_status: "waiting",
      }).eq("id", accountId);
      if (accountError) throw accountError;
    }

    const { error: diagnosticError } = await supabase.from("diagnostics").insert({
      organization_id: membership.organization_id, account_id: accountId, requested_by: userData.user.id,
      status: "completed", mode: "live", provider: "apify", actor_id: actorId,
      input, report, started_at: report.generatedAt, completed_at: new Date().toISOString(),
    });
    if (diagnosticError) throw diagnosticError;
    await supabase.from("activities").insert({
      organization_id: membership.organization_id, account_id: accountId, actor_id: userData.user.id,
      activity_type: "diagnostic_completed", title: "Diagnóstico concluído",
      details: { diagnosticId: report.id, profile: report.summary.profile },
    });

    return json(request, { ...report, accountId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível gerar o diagnóstico.";
    return json(request, { error: message }, 500);
  }
});
