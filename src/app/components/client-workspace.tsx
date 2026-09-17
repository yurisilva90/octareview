"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  BarChart3, Building2, Check, ChevronRight, ContactRound, FileText, Globe2,
  LayoutDashboard, Link2, LoaderCircle, LogOut, Menu, MessageSquareText, Nfc, Plus,
  QrCode, Settings, ShieldCheck, Smartphone, Store, Users, X,
} from "lucide-react";
import BioSiteEditor, {
  pageToDraft,
  type PageDraft,
  type PageLink,
  type SmartPage,
} from "./biosite-editor";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/site";

type View = "overview" | "presence" | "plates" | "team" | "page" | "contacts" | "reports" | "services" | "settings";
type Establishment = { id: number; organization_id: number; name: string; category: string | null; city: string | null; state: string | null; address: string | null; phone: string | null; email: string | null; website: string | null; google_profile_url: string | null; lifecycle_status: string };
type Plate = { id: number; public_id: string; plate_type: "main" | "employee"; lifecycle_status: string; display_name: string | null; location_label: string | null; destination_mode: "page" | "redirect"; activated_at: string | null };
type Employee = { id: number; full_name: string; job_title: string | null; photo_url: string | null; status: "active" | "inactive" };
type CapturedContact = { id: number; full_name: string | null; whatsapp: string | null; email: string | null; source: string; campaign: string | null; consent_accepted: boolean; captured_at: string };
type EventRow = { event_type: string; source: string; occurred_at: string };
type Subscription = { id: number; status: string; quantity?: number; unit_price: number; billing_interval: string | null; products: { name: string; features?: Record<string, unknown> } | { name: string; features?: Record<string, unknown> }[] | null };

const nav: Array<{ id: View; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard }, { id: "presence", label: "Minha presença", icon: Store },
  { id: "plates", label: "Placas", icon: Nfc }, { id: "team", label: "Equipe", icon: Users },
  { id: "page", label: "Página e links", icon: Link2 }, { id: "contacts", label: "Contatos", icon: ContactRound },
  { id: "reports", label: "Relatórios", icon: BarChart3 }, { id: "services", label: "Serviços", icon: FileText },
  { id: "settings", label: "Configurações", icon: Settings },
];
const eventLabels: Record<string, string> = { plate_open: "Interações", page_view: "Visualizações", google_review_click: "Cliques para avaliação", whatsapp_click: "WhatsApp", website_click: "Site", instagram_click: "Instagram", pix_click: "Pix", lead_submit: "Contatos" };

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50); }
function locationOf(item: Establishment) { return [item.city, item.state].filter(Boolean).join(" · ") || "Localização não informada"; }
function dateTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`rounded-2xl bg-white shadow-[0_8px_30px_rgba(15,23,42,.05)] ${className}`}>{children}</section>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-xs font-semibold text-slate-600">{label}<div className="mt-2">{children}</div></label>; }
const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function ClientWorkspace() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [view, setView] = useState<View>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [email, setEmail] = useState("");
  const [membership, setMembership] = useState<{ organization_id: number; role: string }>();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedId, setSelectedId] = useState<number>();
  const [plates, setPlates] = useState<Plate[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [smartPages, setSmartPages] = useState<SmartPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<number>();
  const [pageLimit, setPageLimit] = useState(1);
  const [pageDraft, setPageDraft] = useState<PageDraft>();
  const [links, setLinks] = useState<PageLink[]>([]);
  const [contacts, setContacts] = useState<CapturedContact[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [period, setPeriod] = useState("30");

  const selected = useMemo(() => establishments.find((item) => item.id === selectedId), [establishments, selectedId]);
  const smartPage = useMemo(() => smartPages.find((item) => item.id === selectedPageId) ?? smartPages[0], [selectedPageId, smartPages]);
  const canCreate = membership && ["admin", "commercial", "success", "partner"].includes(membership.role);

  const loadEstablishments = useCallback(async () => {
    if (!supabase) return;
    const { data, error: queryError } = await supabase.from("accounts").select("id,organization_id,name,category,city,state,address,phone,email,website,google_profile_url,lifecycle_status").in("lifecycle_status", ["onboarding", "active", "at_risk", "delinquent", "inactive"]).order("name");
    if (queryError) throw queryError;
    const rows = (data ?? []) as Establishment[];
    setEstablishments(rows);
    setSelectedId((current) => current && rows.some((row) => row.id === current) ? current : rows[0]?.id);
  }, [supabase]);

  const loadAccountData = useCallback(async (account: Establishment) => {
    if (!supabase) return;
    const days = period === "today" ? 0 : Number(period);
    const since = new Date();
    if (days === 0) since.setHours(0, 0, 0, 0); else since.setDate(since.getDate() - days);
    const [platesResult, employeesResult, pageResult, contactsResult, eventsResult, subscriptionsResult] = await Promise.all([
      supabase.from("plates").select("id,public_id,plate_type,lifecycle_status,display_name,location_label,destination_mode,activated_at").eq("account_id", account.id).order("created_at"),
      supabase.from("employees").select("id,full_name,job_title,photo_url,status").eq("account_id", account.id).order("full_name"),
      supabase.from("smart_pages").select("id,slug,status,page_type,is_primary,name,short_description,presentation_text,primary_color,logo_url,cover_url,cover_type,background_mode,background_value,button_color,highlight_color,form_button_color,button_shape,button_variant,button_border_width,button_effect,form_background_color,form_border_color,form_border_width,form_effect,cover_shape,profile_border_enabled,profile_border_color,footer_text,capture_enabled,capture_config,draft_version,published_version,published_at").eq("account_id", account.id).order("is_primary", { ascending: false }).order("created_at"),
      supabase.from("captured_contacts").select("id,full_name,whatsapp,email,source,campaign,consent_accepted,captured_at").eq("account_id", account.id).order("captured_at", { ascending: false }).limit(100),
      supabase.from("interaction_events").select("event_type,source,occurred_at").eq("account_id", account.id).gte("occurred_at", since.toISOString()).order("occurred_at", { ascending: false }).limit(2000),
      supabase.from("subscriptions").select("id,status,quantity,unit_price,billing_interval,products(name,features)").eq("account_id", account.id).order("created_at", { ascending: false }),
    ]);
    let pageRows = pageResult.data;
    if (pageResult.error) {
      const fallback = await supabase.from("smart_pages").select("id,slug,status,page_type,is_primary,name,short_description,presentation_text,primary_color,logo_url,cover_url,cover_type,background_mode,background_value,button_color,highlight_color,form_button_color,button_shape,button_variant,button_border_width,footer_text,capture_enabled,capture_config,draft_version,published_version,published_at").eq("account_id", account.id).order("is_primary", { ascending: false }).order("created_at");
      if (fallback.error) throw pageResult.error;
      pageRows = (fallback.data ?? []).map((row) => ({
        ...row,
        button_effect: "shadow",
        form_background_color: "#ffffff",
        form_border_color: "#e2e8f0",
        form_border_width: 1,
        form_effect: "shadow",
        cover_shape: "curve",
        profile_border_enabled: true,
        profile_border_color: "#ffffff",
      }));
    }
    const firstError = [platesResult, employeesResult, contactsResult, eventsResult, subscriptionsResult].find((result) => result.error)?.error;
    if (firstError) throw firstError;
    setPlates((platesResult.data ?? []) as Plate[]); setEmployees((employeesResult.data ?? []) as Employee[]);
    const pages = (pageRows ?? []) as SmartPage[]; setSmartPages(pages);
    const page = pages.find((item) => item.id === selectedPageId) ?? pages[0];
    setSelectedPageId(page?.id); setPageDraft(page ? pageToDraft(page) : undefined);
    const nextSubscriptions = (subscriptionsResult.data ?? []) as Subscription[];
    const allowedPages = nextSubscriptions.filter((item) => ["trial", "active", "past_due"].includes(item.status)).reduce((limit, item) => { const product = Array.isArray(item.products) ? item.products[0] : item.products; const configured = Number(product?.features?.page_limit ?? 1); return Number.isFinite(configured) ? Math.max(limit, Math.min(50, configured * (item.quantity ?? 1))) : limit; }, 1);
    setPageLimit(allowedPages);
    setContacts((contactsResult.data ?? []) as CapturedContact[]); setEvents((eventsResult.data ?? []) as EventRow[]); setSubscriptions(nextSubscriptions);
    if (page) { const result = await supabase.from("page_links").select("id,link_type,title,subtitle,url,sort_order,active").eq("smart_page_id", page.id).order("sort_order").order("id"); if (result.error) throw result.error; setLinks((result.data ?? []) as PageLink[]); } else setLinks([]);
  }, [period, selectedPageId, supabase]);

  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser(); setEmail(userData.user?.email ?? "");
        if (userData.user) { const { data } = await supabase.from("organization_members").select("organization_id,role").eq("user_id", userData.user.id).eq("status", "active").limit(1).maybeSingle(); setMembership(data ?? undefined); }
        await loadEstablishments();
      } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar o painel."); }
      finally { setLoading(false); }
    })();
  }, [loadEstablishments, supabase]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    const refresh = async () => {
      setLoading(true);
      setError(undefined);
      try {
        await loadAccountData(selected);
      } catch (caught) {
        if (active) setError(caught instanceof Error ? caught.message : "Não foi possível carregar o estabelecimento.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    return () => { active = false; };
  }, [loadAccountData, selected]);

  function flash(message: string) { setNotice(message); window.setTimeout(() => setNotice(undefined), 3500); }
  async function signOut() { await supabase?.auth.signOut(); window.location.assign(withBasePath("/login/")); }
  async function run(action: () => Promise<void>, success?: string) { setBusy(true); setError(undefined); try { await action(); if (success) flash(success); } catch (caught) { const message = caught instanceof Error ? caught.message : "Não foi possível concluir a ação."; setError(/row-level security policy|permission denied/i.test(message) ? "Seu usuário não tem permissão para publicar este BioSite. O administrador precisa liberar o perfil de cliente para edição." : message); } finally { setBusy(false); } }

  async function createEstablishment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || !membership) return;
    const form = new FormData(event.currentTarget); const name = String(form.get("name") ?? "").trim();
    await run(async () => {
      const { data, error: insertError } = await supabase.from("accounts").insert({ organization_id: membership.organization_id, name, category: String(form.get("category") ?? "").trim() || null, city: String(form.get("city") ?? "").trim() || null, state: String(form.get("state") ?? "").trim().toUpperCase().slice(0, 2) || null, address: String(form.get("address") ?? "").trim() || null, phone: String(form.get("phone") ?? "").trim() || null, website: String(form.get("website") ?? "").trim() || null, lifecycle_status: "onboarding", pipeline_stage: "onboarding", source: "customer_portal" }).select("id,organization_id,name").single();
      if (insertError) throw insertError;
      await Promise.all([
        supabase.from("customer_portal_settings").insert({ account_id: data.id, organization_id: data.organization_id }),
        supabase.from("smart_pages").insert({ account_id: data.id, organization_id: data.organization_id, name: data.name, slug: `${slugify(data.name) || "empresa"}-${String(data.id)}` }),
      ]);
      await loadEstablishments(); setSelectedId(data.id);
    }, "Estabelecimento criado.");
  }

  async function ensurePage() {
    if (!supabase || !selected) return;
    if (smartPages.length >= pageLimit) { setError(`Seu plano permite até ${pageLimit} ${pageLimit === 1 ? "página" : "páginas"}.`); return; }
    await run(async () => {
      const suffix = smartPages.length ? `-${Date.now().toString(36)}` : "";
      const { data, error: insertError } = await supabase.from("smart_pages").insert({ account_id: selected.id, organization_id: selected.organization_id, name: smartPages.length ? `Nova página ${smartPages.length + 1}` : selected.name, slug: `${slugify(selected.name) || "empresa"}-${selected.id}${suffix}`, is_primary: smartPages.length === 0 }).select("id").single();
      if (insertError) throw insertError;
      setSelectedPageId(data.id);
    }, "Página criada.");
  }

  async function duplicatePage() {
    if (!supabase || !selected || !smartPage) return;
    if (smartPages.length >= pageLimit) { setError(`Seu plano permite até ${pageLimit} ${pageLimit === 1 ? "página" : "páginas"}.`); return; }
    await run(async () => {
      const { data, error: insertError } = await supabase.from("smart_pages").insert({
        account_id: selected.id, organization_id: selected.organization_id, page_type: smartPage.page_type,
        name: `${smartPage.name} · cópia`.slice(0, 120), slug: `${slugify(smartPage.name) || "pagina"}-${selected.id}-${Date.now().toString(36)}`,
        short_description: smartPage.short_description, presentation_text: smartPage.presentation_text,
        primary_color: smartPage.primary_color, logo_url: smartPage.logo_url, cover_url: smartPage.cover_url,
        cover_type: smartPage.cover_type, background_mode: smartPage.background_mode, background_value: smartPage.background_value,
        button_color: smartPage.button_color, highlight_color: smartPage.highlight_color, form_button_color: smartPage.form_button_color,
        button_shape: smartPage.button_shape, button_variant: smartPage.button_variant, button_border_width: smartPage.button_border_width,
        button_effect: smartPage.button_effect, form_background_color: smartPage.form_background_color, form_border_color: smartPage.form_border_color,
        form_border_width: smartPage.form_border_width, form_effect: smartPage.form_effect, cover_shape: smartPage.cover_shape,
        profile_border_enabled: smartPage.profile_border_enabled, profile_border_color: smartPage.profile_border_color,
        footer_text: smartPage.footer_text, capture_enabled: smartPage.capture_enabled, capture_config: smartPage.capture_config,
      }).select("id").single();
      if (insertError) throw insertError;
      if (links.length) {
        const { error: linkError } = await supabase.from("page_links").insert(links.map((link) => ({ organization_id: selected.organization_id, account_id: selected.id, smart_page_id: data.id, link_type: link.link_type, title: link.title, subtitle: link.subtitle, url: link.url, sort_order: link.sort_order, active: link.active, highlighted: link.highlighted, button_color: link.button_color })));
        if (linkError) throw linkError;
      }
      setSelectedPageId(data.id);
    }, "Página duplicada.");
  }

  async function savePage(publish = false) {
    if (!supabase || !selected || !smartPage || !pageDraft) return;
    const colors = [pageDraft.button_color, pageDraft.highlight_color, pageDraft.form_button_color, pageDraft.form_background_color, pageDraft.form_border_color, pageDraft.profile_border_color, ...(pageDraft.background_mode === "solid" ? [pageDraft.background_value] : [])];
    if (colors.some((color) => !/^#[0-9a-f]{6}$/i.test(color))) { setError("Revise as cores: use o formato hexadecimal completo, como #0F766E."); return; }
    await run(async () => {
      const nextVersion = smartPage.draft_version + 1;
      const payload = { ...pageDraft, draft_version: nextVersion, ...(publish ? { status: "published", published_version: nextVersion, published_at: new Date().toISOString() } : {}) };
      const { error: updateError } = await supabase.from("smart_pages").update(payload).eq("id", smartPage.id); if (updateError) throw updateError; await loadAccountData(selected);
    }, publish ? "Página publicada." : "Rascunho salvo.");
  }

  async function addLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || !selected || !smartPage) return; const formElement = event.currentTarget; const form = new FormData(formElement);
    await run(async () => { const { error: insertError } = await supabase.from("page_links").insert({ organization_id: selected.organization_id, account_id: selected.id, smart_page_id: smartPage.id, link_type: String(form.get("type")), title: String(form.get("title")).trim(), url: String(form.get("url")).trim(), sort_order: links.length }); if (insertError) throw insertError; formElement.reset(); await loadAccountData(selected); }, "Link adicionado.");
  }

  async function updateLink(link: PageLink, patch: Partial<PageLink>) {
    if (!supabase || !selected) return;
    await run(async () => { const { error: updateError } = await supabase.from("page_links").update(patch).eq("id", link.id); if (updateError) throw updateError; await loadAccountData(selected); });
  }

  async function reorderLinks(orderedIds: number[]) {
    if (!supabase || !selected) return;
    await run(async () => {
      const results = await Promise.all(orderedIds.map((id, index) => supabase.from("page_links").update({ sort_order: index }).eq("id", id)));
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      await loadAccountData(selected);
    }, "Ordem atualizada.");
  }

  async function saveSocial(type: string, url: string) {
    if (!supabase || !selected || !smartPage) return;
    const existing = links.find((link) => link.link_type === type);
    const labels: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn" };
    await run(async () => {
      const result = existing
        ? await supabase.from("page_links").update({ url, active: true }).eq("id", existing.id)
        : await supabase.from("page_links").insert({ organization_id: selected.organization_id, account_id: selected.id, smart_page_id: smartPage.id, link_type: type, title: labels[type] ?? type, url, sort_order: links.length, active: true });
      if (result.error) throw result.error; await loadAccountData(selected);
    }, "Rede social salva.");
  }

  async function uploadPageMedia(kind: "logo" | "cover", file: File) {
    if (!supabase || !selected || !smartPage || !pageDraft) { setError("Faça login e selecione uma página antes de enviar o arquivo."); return; }
    const detectedCoverType = kind === "cover"
      ? file.type.startsWith("video/") ? "video" : file.type === "image/gif" ? "animation" : "image"
      : undefined;
    const rules = kind === "logo"
      ? { max: 2 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] }
      : detectedCoverType === "video"
        ? { max: 20 * 1024 * 1024, types: ["video/mp4", "video/webm"] }
        : detectedCoverType === "animation"
          ? { max: 10 * 1024 * 1024, types: ["image/gif", "image/webp"] }
          : { max: 5 * 1024 * 1024, types: ["image/jpeg", "image/png", "image/webp"] };
    if (!rules.types.includes(file.type)) { setError("Formato de arquivo não permitido para esta opção."); return; }
    if (file.size > rules.max) { setError(`O arquivo ultrapassa o limite de ${Math.round(rules.max / 1024 / 1024)} MB.`); return; }
    const previewUrl = URL.createObjectURL(file);
    setError(undefined);
    setPageDraft({ ...pageDraft, ...(kind === "logo" ? { logo_url: previewUrl } : { cover_url: previewUrl, cover_type: detectedCoverType ?? pageDraft.cover_type }) });
    await run(async () => {
      const extension = (file.name.split(".").pop() || (file.type.split("/")[1] ?? "bin")).toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${selected.id}/${smartPage.id}/${kind}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("biosite-media").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("biosite-media").getPublicUrl(path);
      const column = kind === "logo" ? "logo_url" : "cover_url";
      const { error: updateError } = await supabase.from("smart_pages").update({ [column]: data.publicUrl, ...(kind === "cover" && detectedCoverType ? { cover_type: detectedCoverType } : {}) }).eq("id", smartPage.id);
      if (updateError) throw updateError;
      await loadAccountData(selected);
    }, kind === "logo" ? "Logo atualizada." : "Capa atualizada.");
  }

  async function addEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || !selected) return; const formElement = event.currentTarget; const form = new FormData(formElement);
    await run(async () => { const { error: insertError } = await supabase.from("employees").insert({ organization_id: selected.organization_id, account_id: selected.id, full_name: String(form.get("name")).trim(), job_title: String(form.get("role")).trim() || null }); if (insertError) throw insertError; formElement.reset(); await loadAccountData(selected); }, "Pessoa adicionada.");
  }

  async function activatePlate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!supabase || !selected) return; const formElement = event.currentTarget; const form = new FormData(formElement);
    await run(async () => { const { data, error: functionError } = await supabase.functions.invoke("activate-plate", { body: { accountId: selected.id, plateId: String(form.get("plateId")), activationCode: String(form.get("code")), name: String(form.get("name")), location: String(form.get("location")) } }); if (functionError) throw functionError; if (data?.error) throw new Error(data.error); formElement.reset(); await loadAccountData(selected); }, "Placa ativada com segurança.");
  }

  const metrics = useMemo(() => { const count = (type: string) => events.filter((row) => row.event_type === type).length; return { total: events.filter((row) => row.event_type === "plate_open").length, nfc: events.filter((row) => row.source === "nfc" && row.event_type === "plate_open").length, qr: events.filter((row) => row.source === "qr" && row.event_type === "plate_open").length, review: count("google_review_click"), whatsapp: count("whatsapp_click"), website: count("website_click"), social: count("instagram_click"), pix: count("pix_click"), leads: count("lead_submit") }; }, [events]);

  if (!supabase) return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center"><div><h1 className="text-xl font-bold">Conexão indisponível</h1><p className="mt-2 text-sm text-slate-500">Configure o Supabase para usar o painel do cliente.</p></div></main>;

  return <div className="min-h-screen bg-[#f4f7f8] text-slate-950 lg:grid lg:grid-cols-[258px_1fr]">
    {menuOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setMenuOpen(false)} />}
    <aside className={`${menuOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[278px] flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:w-auto lg:translate-x-0`}>
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5"><Image src={withBasePath("/octareview-wordmark.png")} alt="OctaReview" width={170} height={56} className="h-10 w-auto object-contain object-left" /><button className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setMenuOpen(false)}><X className="size-5" /></button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setView(id); setMenuOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${view === id ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:bg-slate-50"}`}><Icon className="size-[18px]" /><span className="flex-1">{label}</span>{view === id && <ChevronRight className="size-4" />}</button>)}</nav>
      <div className="border-t border-slate-100 p-3"><button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-semibold text-slate-500 hover:bg-slate-50"><LogOut className="size-[18px]" /> Sair</button></div>
    </aside>
    <main className="min-w-0">
      <header className="sticky top-0 z-20 flex min-h-[68px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8"><button className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></button><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">Painel do cliente</p><p className="truncate text-[11px] text-slate-400">{email}</p></div>{establishments.length > 0 && <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2 sm:px-3"><Building2 className="hidden size-4 text-teal-700 sm:block" /><select value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))} className="h-10 max-w-[190px] bg-transparent text-xs font-semibold outline-none sm:text-sm">{establishments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}</header>
      {notice && <div className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl"><Check className="size-4" />{notice}</div>}
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{error && <div className="mb-5 flex items-start justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span>{error}</span><button onClick={() => setError(undefined)}><X className="size-4" /></button></div>}
        {loading ? <div className="grid min-h-[55vh] place-items-center"><LoaderCircle className="size-7 animate-spin text-teal-700" /></div> : !selected ? <Onboarding canCreate={Boolean(canCreate)} busy={busy} onSubmit={createEstablishment} /> : <>
          <div className="mb-7 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.16em] text-teal-700">{nav.find((item) => item.id === view)?.label}</p><h1 className="mt-2 text-3xl font-bold tracking-[-.045em]">{selected.name}</h1><p className="mt-2 text-sm text-slate-500">{selected.category || "Categoria não informada"} · {locationOf(selected)}</p></div><span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><ShieldCheck className="size-4" /> Dados isolados por estabelecimento</span></div>
          {view === "overview" && <Overview metrics={metrics} plates={plates} contacts={contacts} events={events} period={period} setPeriod={setPeriod} />}
          {view === "presence" && <Presence establishment={selected} />}
          {view === "plates" && <PlatesView plates={plates} busy={busy} onActivate={activatePlate} />}
          {view === "team" && <TeamView employees={employees} busy={busy} onAdd={addEmployee} onToggle={(employee) => run(async () => { const { error: updateError } = await supabase.from("employees").update({ status: employee.status === "active" ? "inactive" : "active" }).eq("id", employee.id); if (updateError) throw updateError; await loadAccountData(selected); }, "Status atualizado.")} />}
          {view === "page" && <BioSiteEditor pages={smartPages} page={smartPage} draft={pageDraft} setDraft={setPageDraft} links={links} pageLimit={pageLimit} busy={busy} onSelectPage={setSelectedPageId} onCreatePage={ensurePage} onDuplicatePage={duplicatePage} onSave={() => savePage(false)} onPublish={() => savePage(true)} onUpload={(kind, file) => void uploadPageMedia(kind, file)} onAddLink={addLink} onUpdateLink={(link, patch) => void updateLink(link, patch)} onDeleteLink={(link) => void run(async () => { const { error: deleteError } = await supabase.from("page_links").delete().eq("id", link.id); if (deleteError) throw deleteError; await loadAccountData(selected); }, "Link removido.")} onReorderLinks={(ids) => void reorderLinks(ids)} onSaveSocial={(type, url) => void saveSocial(type, url)} />}
          {view === "contacts" && <ContactsView contacts={contacts} />}
          {view === "reports" && <ReportsView metrics={metrics} events={events} />}
          {view === "services" && <ServicesView subscriptions={subscriptions} />}
          {view === "settings" && <SettingsView establishment={selected} page={smartPage} />}
        </>}</div>
    </main>
  </div>;
}

function Onboarding({ canCreate, busy, onSubmit }: { canCreate: boolean; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  if (!canCreate) return <div className="mx-auto mt-16 max-w-xl text-center"><Building2 className="mx-auto size-10 text-teal-700" /><h1 className="mt-5 text-2xl font-bold">Nenhum estabelecimento vinculado</h1><p className="mt-3 text-sm leading-6 text-slate-500">Peça ao administrador para liberar seu acesso a um estabelecimento.</p></div>;
  return <Card className="mx-auto max-w-2xl p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Primeiro acesso</p><h1 className="mt-2 text-2xl font-bold">Cadastre o estabelecimento real</h1><p className="mt-2 text-sm leading-6 text-slate-500">Esse cadastro será o mesmo usado pelo comercial, pelas placas e pelo painel. Não haverá empresa duplicada.</p><form onSubmit={onSubmit} className="mt-7 grid gap-4 sm:grid-cols-2"><Field label="Nome do estabelecimento"><input required name="name" className={inputClass} /></Field><Field label="Categoria"><input name="category" className={inputClass} /></Field><Field label="Cidade"><input name="city" className={inputClass} /></Field><Field label="UF"><input name="state" maxLength={2} className={inputClass} /></Field><div className="sm:col-span-2"><Field label="Endereço"><input name="address" className={inputClass} /></Field></div><Field label="Telefone"><input name="phone" className={inputClass} /></Field><Field label="Site"><input name="website" type="url" className={inputClass} /></Field><button disabled={busy} className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white sm:col-span-2">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />} Criar estabelecimento</button></form></Card>;
}

function Overview({ metrics, plates, contacts, events, period, setPeriod }: { metrics: Record<string, number>; plates: Plate[]; contacts: CapturedContact[]; events: EventRow[]; period: string; setPeriod: (value: string) => void }) {
  const cards = [{ label: "Interações", value: metrics.total, icon: Nfc }, { label: "NFC", value: metrics.nfc, icon: Smartphone }, { label: "QR", value: metrics.qr, icon: QrCode }, { label: "Avaliação", value: metrics.review, icon: MessageSquareText }, { label: "WhatsApp", value: metrics.whatsapp, icon: ContactRound }, { label: "Contatos", value: contacts.length, icon: Users }, { label: "Placas ativas", value: plates.filter((p) => ["activated", "linked", "configured", "in_use"].includes(p.lifecycle_status)).length, icon: Nfc }, { label: "Eventos", value: events.length, icon: BarChart3 }];
  return <div><div className="flex gap-2 overflow-x-auto pb-2">{[{ v: "today", l: "Hoje" }, { v: "7", l: "7 dias" }, { v: "30", l: "30 dias" }, { v: "90", l: "90 dias" }].map((item) => <button key={item.v} onClick={() => setPeriod(item.v)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${period === item.v ? "bg-slate-950 text-white" : "bg-white text-slate-500"}`}>{item.l}</button>)}</div><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <Card key={label} className="p-4 sm:p-5"><Icon className="size-5 text-teal-700" /><strong className="mt-5 block text-3xl tracking-tight">{value}</strong><span className="mt-1 block text-xs text-slate-500">{label}</span></Card>)}</div>{events.length === 0 && <Card className="mt-5 p-6"><BarChart3 className="size-7 text-teal-700" /><h2 className="mt-4 font-bold">Ainda não há eventos neste período</h2><p className="mt-2 text-sm leading-6 text-slate-500">Assim que uma placa ou página for usada, as métricas reais aparecerão aqui. Cliques para avaliação nunca serão tratados como avaliações publicadas.</p></Card>}</div>;
}

function Presence({ establishment }: { establishment: Establishment }) { const rows = [["Categoria", establishment.category], ["Endereço", establishment.address], ["Telefone", establishment.phone], ["Site", establishment.website], ["Perfil da Empresa no Google", establishment.google_profile_url]]; return <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><Card className="p-6"><h2 className="font-bold">Dados públicos do estabelecimento</h2><div className="mt-5 divide-y divide-slate-100">{rows.map(([label, value]) => <div key={label} className="grid gap-1 py-4 sm:grid-cols-[210px_1fr]"><span className="text-xs font-semibold text-slate-400">{label}</span><span className="break-all text-sm font-medium">{value || "Não informado"}</span></div>)}</div></Card><Card className="p-6"><Globe2 className="size-7 text-blue-600" /><h2 className="mt-4 font-bold">Status da integração</h2><span className={`mt-4 inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${establishment.google_profile_url ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{establishment.google_profile_url ? "Dados públicos" : "Não conectado"}</span><p className="mt-4 text-sm leading-6 text-slate-500">“Conectado oficialmente” só será exibido depois da autorização direta da conta Google.</p></Card></div>; }

function PlatesView({ plates, busy, onActivate }: { plates: Plate[]; busy: boolean; onActivate: (event: FormEvent<HTMLFormElement>) => void }) { return <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><Card className="overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-bold">Placas vinculadas</h2><p className="mt-1 text-xs text-slate-500">O ID público sozinho não permite ativação.</p></div>{plates.length ? <div className="divide-y divide-slate-100">{plates.map((plate) => <div key={plate.id} className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-700"><Nfc className="size-5" /></span><div className="min-w-0 flex-1"><strong className="block text-sm">{plate.display_name || plate.public_id}</strong><span className="mt-1 block text-xs text-slate-500">{plate.public_id} · {plate.plate_type === "employee" ? "Equipe" : "Estabelecimento"} · {plate.location_label || "Local não informado"}</span></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">{plate.lifecycle_status}</span></div>)}</div> : <div className="p-8 text-center text-sm text-slate-500">Nenhuma placa vinculada.</div>}</Card><Card className="p-5"><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Ativação segura</p><h2 className="mt-2 text-lg font-bold">Ativar uma placa</h2><form onSubmit={onActivate} className="mt-5 space-y-4"><Field label="ID da placa"><input required name="plateId" placeholder="A000123" className={inputClass} /></Field><Field label="Código de ativação"><input required name="code" className={inputClass} /></Field><Field label="Nome ou apelido"><input name="name" placeholder="Balcão principal" className={inputClass} /></Field><Field label="Local"><input name="location" placeholder="Recepção" className={inputClass} /></Field><button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white">{busy ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Validar e ativar</button></form></Card></div>; }

function TeamView({ employees, busy, onAdd, onToggle }: { employees: Employee[]; busy: boolean; onAdd: (event: FormEvent<HTMLFormElement>) => void; onToggle: (employee: Employee) => void }) { return <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><Card className="overflow-hidden">{employees.length ? <div className="divide-y divide-slate-100">{employees.map((person) => <div key={person.id} className="flex items-center gap-4 p-5"><span className="grid size-10 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">{person.full_name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="flex-1"><strong className="text-sm">{person.full_name}</strong><p className="mt-1 text-xs text-slate-500">{person.job_title || "Cargo não informado"}</p></div><button onClick={() => onToggle(person)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase ${person.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{person.status === "active" ? "Ativo" : "Inativo"}</button></div>)}</div> : <div className="p-8 text-center text-sm text-slate-500">Nenhuma pessoa cadastrada.</div>}</Card><Card className="p-5"><h2 className="font-bold">Adicionar pessoa</h2><form onSubmit={onAdd} className="mt-5 space-y-4"><Field label="Nome"><input required name="name" className={inputClass} /></Field><Field label="Cargo"><input name="role" className={inputClass} /></Field><button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 text-sm font-bold text-white"><Plus className="size-4" /> Adicionar</button></form></Card></div>; }

function ContactsView({ contacts }: { contacts: CapturedContact[] }) { return <Card className="overflow-hidden">{contacts.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-3">Contato</th><th className="px-4 py-3">Origem</th><th className="px-4 py-3">Campanha</th><th className="px-4 py-3">Consentimento</th><th className="px-4 py-3">Data</th></tr></thead><tbody className="divide-y divide-slate-100">{contacts.map((contact) => <tr key={contact.id}><td className="px-5 py-4"><strong className="text-sm">{contact.full_name || "Sem nome"}</strong><p className="mt-1 text-xs text-slate-500">{contact.whatsapp || contact.email || "Sem contato informado"}</p></td><td className="px-4 py-4 text-sm">{contact.source.toUpperCase()}</td><td className="px-4 py-4 text-sm text-slate-500">{contact.campaign || "—"}</td><td className="px-4 py-4 text-sm">{contact.consent_accepted ? "Registrado" : "Não exigido"}</td><td className="px-4 py-4 text-xs text-slate-500">{dateTime(contact.captured_at)}</td></tr>)}</tbody></table></div> : <div className="p-10 text-center"><ContactRound className="mx-auto size-8 text-teal-700" /><h2 className="mt-4 font-bold">Nenhum contato capturado</h2><p className="mt-2 text-sm text-slate-500">Os contatos enviados pela página inteligente aparecerão aqui com origem e consentimento.</p></div>}</Card>; }

function ReportsView({ metrics, events }: { metrics: Record<string, number>; events: EventRow[] }) { const rows = Object.entries(eventLabels).map(([key, label]) => ({ label, value: events.filter((event) => event.event_type === key).length })); return <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><Card className="p-6"><h2 className="font-bold">Eventos por tipo</h2><div className="mt-6 space-y-4">{rows.map((row) => <div key={row.label}><div className="flex justify-between text-xs"><span className="text-slate-500">{row.label}</span><strong>{row.value}</strong></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-600" style={{ width: `${events.length ? Math.max(3, row.value / events.length * 100) : 0}%` }} /></div></div>)}</div></Card><Card className="p-6"><h2 className="font-bold">Conversão</h2><strong className="mt-6 block text-4xl">{metrics.total ? `${Math.round(metrics.leads / metrics.total * 100)}%` : "—"}</strong><p className="mt-2 text-sm leading-6 text-slate-500">Contatos capturados sobre aberturas de placa. A métrica usa somente eventos registrados.</p></Card></div>; }

function ServicesView({ subscriptions }: { subscriptions: Subscription[] }) { return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{subscriptions.length ? subscriptions.map((item) => { const product = Array.isArray(item.products) ? item.products[0] : item.products; return <Card key={item.id} className="p-5"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-700">{item.status}</span><h2 className="mt-5 font-bold">{product?.name || "Serviço contratado"}</h2><p className="mt-2 text-sm text-slate-500">R$ {Number(item.unit_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · {item.billing_interval || "avulso"}</p></Card>; }) : <Card className="p-8 text-center md:col-span-2 xl:col-span-3"><FileText className="mx-auto size-8 text-teal-700" /><h2 className="mt-4 font-bold">Nenhum serviço ativo</h2><p className="mt-2 text-sm text-slate-500">Planos e adicionais contratados aparecerão aqui.</p></Card>}</div>; }

function SettingsView({ establishment, page }: { establishment: Establishment; page?: SmartPage }) { return <div className="grid gap-5 md:grid-cols-2"><Card className="p-6"><h2 className="font-bold">Dados da empresa</h2><div className="mt-5 space-y-3 text-sm"><p><span className="text-slate-400">Nome:</span> {establishment.name}</p><p><span className="text-slate-400">Status:</span> {establishment.lifecycle_status}</p><p><span className="text-slate-400">E-mail:</span> {establishment.email || "Não informado"}</p><p><span className="text-slate-400">Telefone:</span> {establishment.phone || "Não informado"}</p></div></Card><Card className="p-6"><h2 className="font-bold">Publicação</h2><div className="mt-5 space-y-3 text-sm"><p><span className="text-slate-400">Página:</span> {page ? `/${page.slug}` : "Não criada"}</p><p><span className="text-slate-400">Estado:</span> {page?.status || "—"}</p><p><span className="text-slate-400">Versão publicada:</span> {page?.published_version || "—"}</p></div></Card></div>; }
