"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, LoaderCircle, MessageCircle, Send, Star } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type CaptureField = { key: string; label: string; required?: boolean };
type CaptureConfig = { title?: string; description?: string; button_text?: string; success_message?: string; consent_required?: boolean; consent_text?: string; fields?: CaptureField[] };
type PublicPage = { id: string; slug: string; name: string; shortDescription: string | null; presentationText: string | null; primaryColor: string; logoUrl: string | null; coverUrl: string | null; footerText: string | null; captureEnabled: boolean; captureConfig: CaptureConfig };
type PublicLink = { public_id: string; link_type: string; title: string; subtitle: string | null; url: string; sort_order: number };

const fieldNames: Record<string, string> = { full_name: "Nome", whatsapp: "WhatsApp", email: "E-mail", city: "Cidade", neighborhood: "Bairro", company: "Empresa", job_title: "Cargo", birth_date: "Data de nascimento" };

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
      if (invokeError || data?.error) { setError(data?.error || invokeError?.message || "Página não encontrada."); setLoading(false); return; }
      setPage(data.page as PublicPage); setLinks((data.links ?? []) as PublicLink[]); setLoading(false);
      void supabase.functions.invoke("public-page", { body: { action: "event", slug, eventType: incomingSource === "nfc" || incomingSource === "qr" ? "plate_open" : "page_view", source: incomingSource, campaign: incomingCampaign, sessionId: currentSession } });
    })();
  }, [supabase]);

  async function openLink(link: PublicLink) {
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
    if (invokeError || data?.error) { setError(data?.error || invokeError?.message || "Não foi possível enviar seus dados."); return; }
    setSuccess(data?.message || "Cadastro realizado com sucesso."); formElement.reset();
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50"><LoaderCircle className="size-8 animate-spin text-teal-700" /></main>;
  if (!page) return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><MessageCircle className="mx-auto size-9 text-slate-400" /><h1 className="mt-4 text-xl font-bold">Página indisponível</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div></main>;
  const config = page.captureConfig ?? {};
  const fields = config.fields?.length ? config.fields : [{ key: "full_name", label: "Nome", required: true }, { key: "whatsapp", label: "WhatsApp", required: true }];

  return <main className="min-h-screen bg-slate-100 px-3 py-5 text-slate-950 sm:py-10"><article className="mx-auto max-w-[520px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,.14)]">
    {page.coverUrl && <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(page.coverUrl).slice(1, -1)})` }} />}
    <div className="px-5 pb-7 pt-6 sm:px-8">
      {page.logoUrl && <div className="mb-5 size-20 rounded-2xl border border-slate-100 bg-contain bg-center bg-no-repeat shadow-sm" style={{ backgroundImage: `url(${JSON.stringify(page.logoUrl).slice(1, -1)})` }} />}
      <p className="text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: page.primaryColor }}>Bem-vindo</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-.045em]">{page.name}</h1>
      {page.shortDescription && <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{page.shortDescription}</p>}
      {page.presentationText && <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-500">{page.presentationText}</p>}
      <div className="mt-7 space-y-3">{links.map((link) => <button key={link.public_id} onClick={() => void openLink(link)} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-slate-200 px-4 text-left transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ backgroundColor: page.primaryColor }}>{link.link_type === "google_review" ? <Star className="size-5" /> : <ArrowUpRight className="size-5" />}</span><span className="min-w-0 flex-1"><strong className="block text-sm">{link.title}</strong>{link.subtitle && <span className="mt-1 block text-xs text-slate-500">{link.subtitle}</span>}</span><ArrowUpRight className="size-4 text-slate-400" /></button>)}</div>
      {page.captureEnabled && <section className="mt-8 rounded-2xl bg-slate-50 p-5"><h2 className="text-lg font-bold">{config.title || "Receba novidades"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{config.description || "Cadastre-se para receber novidades e benefícios."}</p>{success ? <div className="mt-5 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800"><CheckCircle2 className="size-5" />{success}</div> : <form onSubmit={submitContact} className="mt-5 space-y-3"><input name="website" tabIndex={-1} autoComplete="off" className="hidden" />{fields.map((field) => <label key={field.key} className="block text-xs font-semibold text-slate-600">{field.label || fieldNames[field.key] || field.key}<input required={field.required} name={field.key} type={field.key === "email" ? "email" : field.key === "birth_date" ? "date" : "text"} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-500" /></label>)}{config.consent_required !== false && <label className="flex gap-3 text-xs leading-5 text-slate-500"><input required name="consent" type="checkbox" className="mt-1 size-4 shrink-0 accent-teal-700" /><span>{config.consent_text || "Concordo em receber comunicações deste estabelecimento."}</span></label>}<button disabled={sending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: page.primaryColor }}>{sending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}{config.button_text || "Quero participar"}</button></form>}</section>}
      {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      <footer className="mt-8 border-t border-slate-100 pt-5 text-center text-xs leading-5 text-slate-400">{page.footerText || "Página inteligente por OctaReview"}</footer>
    </div>
  </article></main>;
}
