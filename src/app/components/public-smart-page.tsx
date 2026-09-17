"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  BriefcaseBusiness, CalendarDays, Camera, CheckCircle2, FileDown, Gift, Globe2, Link2,
  LoaderCircle, MapPin, MessageCircle, Music2, Play, Send, ShoppingBag, Star,
  Users, UtensilsCrossed,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CaptureField = { key: string; label: string; required?: boolean };
type CaptureConfig = { title?: string; description?: string; button_text?: string; success_message?: string; consent_required?: boolean; consent_text?: string; fields?: CaptureField[] };
type PublicPage = {
  id: string; slug: string; name: string; shortDescription: string | null; presentationText: string | null;
  primaryColor: string; logoUrl: string | null; coverUrl: string | null; coverType: "image" | "video" | "animation";
  backgroundMode: "solid" | "preset"; backgroundValue: string; buttonColor: string; highlightColor: string;
  formButtonColor: string; buttonShape: "square" | "soft" | "round"; buttonVariant: "filled" | "outline";
  buttonBorderWidth: 1 | 2 | 3; footerText: string | null; captureEnabled: boolean; captureConfig: CaptureConfig;
};
type PublicLink = { public_id: string; link_type: string; title: string; subtitle: string | null; url: string; sort_order: number; highlighted: boolean; button_color: string | null };

const socialTypes = new Set(["instagram", "facebook", "tiktok", "youtube", "linkedin"]);
const fieldNames: Record<string, string> = { full_name: "Nome", whatsapp: "WhatsApp", email: "E-mail", city: "Cidade", neighborhood: "Bairro", company: "Empresa", job_title: "Cargo", birth_date: "Data de nascimento" };
const presetStyles: Record<string, CSSProperties> = {
  "navy-gradient": { background: "linear-gradient(145deg,#061b35,#173f67)" },
  "charcoal-lines": { backgroundColor: "#252a31", backgroundImage: "linear-gradient(135deg,rgba(255,255,255,.08) 25%,transparent 25%),linear-gradient(315deg,rgba(255,255,255,.05) 25%,transparent 25%)", backgroundSize: "24px 24px" },
  "teal-mesh": { background: "radial-gradient(circle at 20% 20%,#3f8e8c 0,transparent 34%),radial-gradient(circle at 80% 70%,#0d4854 0,transparent 42%),#082d3b" },
  "ivory-paper": { backgroundColor: "#f3ede2", backgroundImage: "repeating-linear-gradient(0deg,rgba(91,71,45,.035) 0 1px,transparent 1px 4px)" },
  "slate-waves": { background: "radial-gradient(ellipse at 20% 120%,#8aa0b5 0 36%,transparent 37%),radial-gradient(ellipse at 85% 115%,#526b84 0 42%,transparent 43%),#dce4eb" },
  "black-grain": { backgroundColor: "#151719", backgroundImage: "radial-gradient(rgba(255,255,255,.1) .7px,transparent .7px)", backgroundSize: "5px 5px" },
  "burgundy-gradient": { background: "linear-gradient(145deg,#441421,#872d45)" },
  "executive-grid": { backgroundColor: "#69737e", backgroundImage: "linear-gradient(rgba(255,255,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.09) 1px,transparent 1px)", backgroundSize: "18px 18px" },
  "green-organic": { background: "radial-gradient(circle at 10% 20%,#466b5c 0 25%,transparent 26%),radial-gradient(circle at 85% 80%,#1f4438 0 32%,transparent 33%),#16352d" },
  "architectural-white": { background: "linear-gradient(135deg,#ffffff 0 46%,#e7ebee 47% 53%,#f7f8f9 54%)" },
};

function IconFor({ type, className = "size-5" }: { type: string; className?: string }) {
  const icons: Record<string, typeof Link2> = { whatsapp: MessageCircle, google_review: Star, menu: UtensilsCrossed, map: MapPin, website: Globe2, booking: CalendarDays, reservation: CalendarDays, payment: ShoppingBag, pix: ShoppingBag, instagram: Camera, facebook: Users, tiktok: Music2, youtube: Play, linkedin: BriefcaseBusiness, download: FileDown, benefit: Gift };
  const Icon = icons[type] ?? Link2;
  return <Icon className={className} />;
}

function eventFor(type: string) {
  const direct: Record<string, string> = { google_review: "google_review_click", whatsapp: "whatsapp_click", website: "website_click", instagram: "instagram_click", facebook: "facebook_click", tiktok: "tiktok_click", youtube: "youtube_click", linkedin: "linkedin_click", map: "map_click", menu: "menu_click", delivery: "delivery_click", booking: "booking_click", reservation: "booking_click", pix: "pix_click", payment: "payment_click" };
  return direct[type] ?? "custom_link_click";
}

export default function PublicSmartPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [page, setPage] = useState<PublicPage>();
  const [links, setLinks] = useState<PublicLink[]>([]);
  const [source, setSource] = useState("direct");
  const [campaign, setCampaign] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  useEffect(() => {
    void (async () => {
      if (!supabase) { setError("Página temporariamente indisponível."); setLoading(false); return; }
      const params = new URLSearchParams(window.location.search);
      const slug = params.get("p")?.trim() ?? "";
      const incomingSource = params.get("s") ?? "direct";
      const incomingCampaign = params.get("c") ?? "";
      const currentSession = sessionStorage.getItem("octareview-public-session") ?? crypto.randomUUID();
      sessionStorage.setItem("octareview-public-session", currentSession);
      setSource(incomingSource); setCampaign(incomingCampaign); setSessionId(currentSession);
      if (!slug) { setError("O endereço desta página está incompleto."); setLoading(false); return; }
      const { data, error: invokeError } = await supabase.functions.invoke("public-page", { body: { action: "load", slug } });
      if (invokeError || data?.error) { setError(data?.error || "Esta página não está publicada ou o link expirou."); setLoading(false); return; }
      setPage(data.page as PublicPage); setLinks((data.links ?? []) as PublicLink[]); setLoading(false);
      void supabase.functions.invoke("public-page", { body: { action: "event", slug, eventType: incomingSource === "nfc" || incomingSource === "qr" ? "plate_open" : "page_view", source: incomingSource, campaign: incomingCampaign, sessionId: currentSession } });
    })();
  }, [supabase]);

  function openLink(link: PublicLink) {
    if (!supabase || !page) return;
    void supabase.functions.invoke("public-page", { body: { action: "event", slug: page.slug, eventType: eventFor(link.link_type), linkId: link.public_id, source, campaign, sessionId } });
    window.location.assign(link.url);
  }

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || !page) return;
    const formElement = event.currentTarget; const form = new FormData(formElement); setSending(true); setError(undefined);
    const known = new Set(["full_name", "whatsapp", "email", "consent", "website"]);
    const fieldValues = Object.fromEntries(Array.from(form.entries()).filter(([key]) => !known.has(key)).map(([key, value]) => [key, String(value).slice(0, 300)]));
    const { data, error: invokeError } = await supabase.functions.invoke("public-page", { body: { action: "contact", slug: page.slug, source, campaign, sessionId, website: String(form.get("website") ?? ""), contact: { fullName: String(form.get("full_name") ?? ""), whatsapp: String(form.get("whatsapp") ?? ""), email: String(form.get("email") ?? ""), consentAccepted: form.get("consent") === "on", fieldValues } } });
    setSending(false);
    if (invokeError || data?.error) { setError(data?.error || "Não foi possível enviar seus dados agora. Tente novamente."); return; }
    setSuccess(data?.message || "Cadastro realizado com sucesso."); formElement.reset();
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50"><LoaderCircle className="size-8 animate-spin text-teal-700" /></main>;
  if (!page) return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><MessageCircle className="mx-auto size-9 text-slate-400" /><h1 className="mt-4 text-xl font-bold">Página indisponível</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div></main>;

  const config = page.captureConfig ?? {};
  const fields = config.fields?.length ? config.fields : [{ key: "full_name", label: "Nome", required: true }, { key: "whatsapp", label: "WhatsApp", required: true }];
  const contentLinks = links.filter((link) => !socialTypes.has(link.link_type));
  const socialLinks = links.filter((link) => socialTypes.has(link.link_type));
  const surfaceStyle = page.backgroundMode === "solid" ? { backgroundColor: page.backgroundValue } : presetStyles[page.backgroundValue] ?? presetStyles["navy-gradient"];
  const radius = page.buttonShape === "square" ? "rounded-none" : page.buttonShape === "round" ? "rounded-full" : "rounded-xl";

  return <main className="min-h-screen px-3 py-5 text-slate-950 sm:py-10" style={surfaceStyle}>
    <article className="mx-auto max-w-[520px] overflow-hidden rounded-[28px] bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,.24)] backdrop-blur-sm">
      <div className="relative h-48 overflow-hidden" style={!page.coverUrl ? surfaceStyle : undefined}>
        {page.coverUrl && page.coverType === "video" ? <video src={page.coverUrl} className="size-full object-cover" muted autoPlay loop playsInline /> : page.coverUrl ? <div className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${page.coverUrl})` }} /> : null}
      </div>
      <div className="px-5 pb-7 sm:px-8">
        <div className="flex flex-col items-center text-center"><div className="-mt-12 size-24 overflow-hidden rounded-full border-4 border-white bg-slate-900 bg-contain bg-center bg-no-repeat shadow-lg" style={page.logoUrl ? { backgroundImage: `url(${page.logoUrl})` } : undefined}>{!page.logoUrl && <span className="grid size-full place-items-center text-xl font-bold text-white">{page.name.slice(0, 2).toUpperCase()}</span>}</div>
        <h1 className="mt-4 text-3xl font-bold tracking-[-.045em]">{page.name}</h1>
        {page.shortDescription && <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{page.shortDescription}</p>}
        {page.presentationText && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-500">{page.presentationText}</p>}</div>

        <div className="mt-7 space-y-3">{contentLinks.map((link) => {
          const color = link.button_color || (link.highlighted ? page.highlightColor : page.buttonColor);
          const filled = link.highlighted || page.buttonVariant === "filled";
          return <button key={link.public_id} onClick={() => openLink(link)} className={`flex min-h-14 w-full items-center justify-center gap-3 px-5 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-md ${radius}`} style={filled ? { backgroundColor: color, borderColor: color, borderWidth: page.buttonBorderWidth, color: "white" } : { backgroundColor: "transparent", borderColor: color, borderWidth: page.buttonBorderWidth, color }}><IconFor type={link.link_type} />{link.title}</button>;
        })}</div>

        {socialLinks.length > 0 && <div className="mt-6 flex flex-wrap justify-center gap-3">{socialLinks.map((link) => <button key={link.public_id} onClick={() => openLink(link)} aria-label={link.title} className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5"><IconFor type={link.link_type} /></button>)}</div>}

        {page.captureEnabled && <section className="mt-8 rounded-2xl bg-slate-50 p-5"><h2 className="text-lg font-bold">{config.title || "Receba novidades"}</h2>{config.description && <p className="mt-2 text-sm leading-6 text-slate-500">{config.description}</p>}{success ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="size-5" />{success}</div> : <form onSubmit={submitContact} className="mt-5 space-y-3"><input name="website" tabIndex={-1} autoComplete="off" className="hidden" />{fields.map((field) => <label key={field.key} className="block text-xs font-semibold text-slate-600">{field.label || fieldNames[field.key] || field.key}<input required={field.required} name={field.key} type={field.key === "email" ? "email" : field.key === "birth_date" ? "date" : field.key === "whatsapp" ? "tel" : "text"} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500" /></label>)}{config.consent_required !== false && <label className="flex gap-3 text-xs leading-5 text-slate-500"><input required name="consent" type="checkbox" className="mt-1 size-4 shrink-0 accent-teal-700" /><span>{config.consent_text || "Concordo em receber comunicações deste estabelecimento."}</span></label>}<button disabled={sending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: page.formButtonColor }}>{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{config.button_text || "Quero participar"}</button></form>}</section>}
        {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        <footer className="mt-8 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-400">{page.footerText || "Página inteligente por OctaReview"}</footer>
      </div>
    </article>
  </main>;
}
