"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, CalendarClock, Check,
  ChevronRight, CircleAlert, CircleDollarSign, ClipboardCheck,
  FileSearch, Handshake, Home, LoaderCircle, Mail, MapPin, MessageCircle,
  MoreHorizontal, Navigation, PackageCheck, Phone, Play, Plus,
  Presentation, Route, Search, Star, Target, UserRound, UsersRound, X,
} from "lucide-react";
import type { DiagnosticReport } from "@/lib/types";
import { requestDiagnostic } from "@/lib/supabase/diagnostics";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/site";
import { buildClosurePlan, buildFollowUpPayload, type FollowUpReason } from "@/lib/operations";
import { DiagnosticReportView } from "./diagnostic-workspace";

type MainView = "today" | "leads" | "plates" | "more";
type View = MainView | "lead" | "new-lead" | "report";
type Potential = "Alto" | "Médio" | "Baixo";
type FollowUpStatus = "Sem retorno" | "Aguardando retorno" | "Retorno agendado" | "Em fechamento" | "Pós-venda";
type LeadStage = "Novo" | "Contato iniciado" | "Diagnóstico apresentado" | "Proposta enviada" | "Negociação" | "Fechado" | "Cliente ativo" | "Renovação" | "Perdido";
type ReturnReason = "Enviar diagnóstico" | "Cobrar proposta" | "Decisão com sócio" | "Enviar link de compra" | "Implantação" | "Resultados do primeiro mês" | "Renovação" | "Outro";

type Lead = {
  id: string;
  name: string;
  category: string;
  location: string;
  distance: string;
  rating: number;
  reviews: number;
  potential: Potential;
  stage: LeadStage;
  followUp: FollowUpStatus;
  returnReason: ReturnReason;
  returnAt?: string;
  responsible: string;
  phone: string;
  email: string;
  notes: string;
  profile: string;
  opportunity: string;
  approach: string;
  purchaseUrl: string;
  createdAt: string;
  lastContactAt: string;
  clientSince?: string;
  databaseAccountId?: number;
};

type LeadDraft = {
  businessName: string;
  location: string;
  category: string;
  responsible: string;
  phone: string;
  email: string;
  potential: Potential;
};

const blankDraft: LeadDraft = {
  businessName: "", location: "Teresópolis, Brasil", category: "", responsible: "Yuri Silva",
  phone: "", email: "", potential: "Médio",
};

const navItems: Array<{ id: MainView; label: string; icon: typeof Home }> = [
  { id: "today", label: "Hoje", icon: Home },
  { id: "leads", label: "Leads", icon: UsersRound },
  { id: "plates", label: "Placas", icon: PackageCheck },
  { id: "more", label: "Mais", icon: MoreHorizontal },
];

const potentialStyle: Record<Potential, string> = {
  Alto: "border-[#bce8de] bg-[#eafaf6] text-[#087f69]",
  Médio: "border-[#f8e2ae] bg-[#fff9e9] text-[#9b6a05]",
  Baixo: "border-[#dce3ee] bg-[#f7f9fc] text-[#63708a]",
};

const stages: LeadStage[] = ["Novo", "Contato iniciado", "Diagnóstico apresentado", "Proposta enviada", "Negociação", "Fechado", "Cliente ativo", "Renovação", "Perdido"];
const followUps: FollowUpStatus[] = ["Sem retorno", "Aguardando retorno", "Retorno agendado", "Em fechamento", "Pós-venda"];
const returnReasons: ReturnReason[] = ["Enviar diagnóstico", "Cobrar proposta", "Decisão com sócio", "Enviar link de compra", "Implantação", "Resultados do primeiro mês", "Renovação", "Outro"];

function formatDateTime(value?: string) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function draftFromLead(lead: Lead): LeadDraft {
  return { businessName: lead.name, location: lead.location, category: lead.category, responsible: lead.responsible, phone: lead.phone, email: lead.email, potential: lead.potential };
}

export default function CommercialWorkspace() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [view, setView] = useState<View>("today");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [reports, setReports] = useState<Record<string, DiagnosticReport>>({});
  const [presentation, setPresentation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [draft, setDraft] = useState<LeadDraft>(blankDraft);
  const [search, setSearch] = useState("");
  const [potentialFilter, setPotentialFilter] = useState<"Todos" | Potential>("Todos");
  const [followUpFilter, setFollowUpFilter] = useState<"Todos" | FollowUpStatus>("Todos");
  const [stageFilter, setStageFilter] = useState<"Todos" | LeadStage>("Todos");
  const [organizationId, setOrganizationId] = useState<number>();
  const [memberId, setMemberId] = useState<number>();
  const [userId, setUserId] = useState<string>();
  const saveTimers = useRef<Record<string, number>>({});

  const loadLeads = useCallback(async () => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: membership, error: memberError } = await supabase.from("organization_members").select("id,organization_id").eq("user_id", userData.user.id).eq("status", "active").limit(1).maybeSingle();
    if (memberError) throw memberError;
    if (!membership) throw new Error("Seu usuário ainda não está vinculado a uma organização.");
    setOrganizationId(membership.organization_id); setMemberId(membership.id); setUserId(userData.user.id);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [accountsResult, membersResult, contactsResult, followUpsResult, diagnosticsResult, profilesResult, activitiesResult] = await Promise.all([
      supabase.from("accounts").select("id,public_id,name,category,city,state,address,phone,email,potential,lifecycle_status,pipeline_stage,follow_up_status,owner_member_id,client_since,metadata,created_at,updated_at").eq("organization_id", membership.organization_id).order("updated_at", { ascending: false }),
      supabase.from("organization_members").select("id,user_id").eq("organization_id", membership.organization_id).eq("status", "active"),
      supabase.from("contacts").select("account_id,full_name,email,phone,whatsapp,is_primary").eq("organization_id", membership.organization_id).order("is_primary", { ascending: false }),
      supabase.from("follow_ups").select("account_id,reason,status,due_at").eq("organization_id", membership.organization_id).in("status", ["pending", "scheduled", "overdue"]).order("due_at"),
      supabase.from("diagnostics").select("account_id,report,created_at").eq("organization_id", membership.organization_id).eq("status", "completed").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,email"),
      supabase.from("activities").select("account_id,activity_type,occurred_at").eq("organization_id", membership.organization_id).gte("occurred_at", todayStart.toISOString()),
    ]);
    const firstError = [accountsResult, membersResult, contactsResult, followUpsResult, diagnosticsResult, profilesResult, activitiesResult].find((result) => result.error)?.error;
    if (firstError) throw firstError;
    const members = new Map((membersResult.data ?? []).map((member) => [member.id, member.user_id]));
    const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name || profile.email || "Responsável"]));
    const contacts = new Map<number, { full_name: string; email: string | null; phone: string | null; whatsapp: string | null }>();
    for (const contact of contactsResult.data ?? []) if (!contacts.has(contact.account_id)) contacts.set(contact.account_id, contact);
    const followUps = new Map<number, { reason: string; status: string; due_at: string }>();
    for (const followUp of followUpsResult.data ?? []) if (!followUps.has(followUp.account_id)) followUps.set(followUp.account_id, followUp);
    const latestReports = new Map<number, DiagnosticReport>();
    for (const diagnostic of diagnosticsResult.data ?? []) if (!latestReports.has(diagnostic.account_id) && diagnostic.report) latestReports.set(diagnostic.account_id, diagnostic.report as DiagnosticReport);
    const stageMap: Record<string, LeadStage> = { new: "Novo", contact_started: "Contato iniciado", diagnostic_presented: "Diagnóstico apresentado", proposal_sent: "Proposta enviada", negotiation: "Negociação", won: "Fechado", onboarding: "Fechado", active: "Cliente ativo", renewal: "Renovação", lost: "Perdido" };
    const followMap: Record<string, FollowUpStatus> = { none: "Sem retorno", waiting: "Aguardando retorno", scheduled: "Retorno agendado", closing: "Em fechamento", post_sale: "Pós-venda" };
    const potentialMap: Record<string, Potential> = { high: "Alto", medium: "Médio", low: "Baixo" };
    const reasonMap: Record<string, ReturnReason> = { send_diagnostic: "Enviar diagnóstico", follow_proposal: "Cobrar proposta", partner_decision: "Decisão com sócio", send_purchase_link: "Enviar link de compra", onboarding: "Implantação", first_month_results: "Resultados do primeiro mês", renewal: "Renovação", other: "Outro" };
    const rows = (accountsResult.data ?? []).map((account) => {
      const meta = account.metadata && typeof account.metadata === "object" ? account.metadata as Record<string, unknown> : {};
      const contact = contacts.get(account.id); const followUp = followUps.get(account.id); const report = latestReports.get(account.id);
      const ownerUserId = account.owner_member_id ? members.get(account.owner_member_id) : undefined;
      const id = String(account.public_id);
      return {
        id, name: account.name, category: account.category || "Categoria não informada",
        location: account.address || [account.city, account.state].filter(Boolean).join(", ") || "Localização não informada", distance: "—",
        rating: Number(report?.summary.rating ?? meta.rating ?? 0), reviews: Number(report?.summary.reviewsCount ?? meta.reviews ?? 0),
        potential: potentialMap[account.potential] ?? "Médio", stage: stageMap[account.pipeline_stage] ?? "Novo",
        followUp: followMap[account.follow_up_status] ?? "Sem retorno", returnReason: reasonMap[followUp?.reason ?? String(meta.returnReason ?? "send_diagnostic")] ?? "Outro",
        returnAt: followUp?.due_at ?? (typeof meta.returnAt === "string" ? meta.returnAt : undefined),
        responsible: ownerUserId ? profiles.get(ownerUserId) ?? "Responsável" : "Não atribuído",
        phone: account.phone || contact?.whatsapp || contact?.phone || "", email: account.email || contact?.email || "",
        notes: typeof meta.notes === "string" ? meta.notes : "", profile: report?.summary.profile ?? String(meta.profile ?? "Diagnóstico ainda não realizado"),
        opportunity: report?.summary.narrative ?? String(meta.opportunity ?? "Diagnóstico ainda não realizado."), approach: report?.opportunities[0]?.solution ?? String(meta.approach ?? "Entender o momento do negócio e preparar o diagnóstico."),
        purchaseUrl: typeof meta.purchaseUrl === "string" ? meta.purchaseUrl : "", createdAt: account.created_at, lastContactAt: account.updated_at,
        clientSince: account.client_since ?? undefined, databaseAccountId: account.id,
      } satisfies Lead;
    });
    setLeads(rows); setSelectedId((current) => current && rows.some((lead) => lead.id === current) ? current : rows[0]?.id ?? "");
    setReports(Object.fromEntries(rows.flatMap((lead) => { const report = latestReports.get(lead.databaseAccountId!); return report ? [[lead.id, report]] : []; })));
    setRouteStarted((activitiesResult.data ?? []).some((activity) => activity.activity_type === "route_started"));
    setVisited((activitiesResult.data ?? []).filter((activity) => activity.activity_type === "visit_started" && activity.account_id).map((activity) => String(rows.find((lead) => lead.databaseAccountId === activity.account_id)?.id ?? "")).filter(Boolean));
  }, [supabase]);

  useEffect(() => {
    const timers = saveTimers.current;
    void (async () => { setLoading(true); try { await loadLeads(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível carregar os leads."); } finally { setLoading(false); } })();
    return () => Object.values(timers).forEach((timer) => window.clearTimeout(timer));
  }, [loadLeads]);

  const selected = leads.find((item) => item.id === selectedId) ?? leads[0];
  const filteredLeads = useMemo(() => leads.filter((lead) => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !term || [lead.name, lead.category, lead.location, lead.responsible].some((value) => value.toLocaleLowerCase("pt-BR").includes(term));
    return matchesSearch
      && (potentialFilter === "Todos" || lead.potential === potentialFilter)
      && (followUpFilter === "Todos" || lead.followUp === followUpFilter)
      && (stageFilter === "Todos" || lead.stage === stageFilter);
  }), [followUpFilter, leads, potentialFilter, search, stageFilter]);

  function navigate(next: MainView) {
    setView(next); setPresentation(false); setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openLead(lead: Lead) {
    setSelectedId(lead.id); setDraft(draftFromLead(lead)); setView("lead"); setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startNewLead() {
    setDraft(blankDraft); setSelectedId(""); setError(null); setView("new-lead");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateLead(id: string, patch: Partial<Lead>) {
    const current = leads.find((lead) => lead.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    setLeads((items) => items.map((lead) => lead.id === id ? next : lead));
    if (!supabase || !next.databaseAccountId) return;
    window.clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = window.setTimeout(() => {
      const stageMap: Record<LeadStage, string> = { Novo: "new", "Contato iniciado": "contact_started", "Diagnóstico apresentado": "diagnostic_presented", "Proposta enviada": "proposal_sent", Negociação: "negotiation", Fechado: "won", "Cliente ativo": "active", Renovação: "renewal", Perdido: "lost" };
      const followMap: Record<FollowUpStatus, string> = { "Sem retorno": "none", "Aguardando retorno": "waiting", "Retorno agendado": "scheduled", "Em fechamento": "closing", "Pós-venda": "post_sale" };
      const potentialMap: Record<Potential, string> = { Alto: "high", Médio: "medium", Baixo: "low" };
      const lifecycle = next.stage === "Perdido" ? "lost" : next.stage === "Cliente ativo" ? "active" : next.stage === "Fechado" ? "onboarding" : "lead";
      void supabase.from("accounts").update({
        name: next.name, category: next.category, address: next.location, phone: next.phone || null, email: next.email || null,
        potential: potentialMap[next.potential], pipeline_stage: stageMap[next.stage], follow_up_status: followMap[next.followUp], lifecycle_status: lifecycle,
        client_since: next.clientSince || null, closed_at: next.stage === "Fechado" || next.stage === "Cliente ativo" ? new Date().toISOString() : null,
        metadata: { notes: next.notes, responsible: next.responsible, returnReason: next.returnReason, returnAt: next.returnAt ?? null, profile: next.profile, opportunity: next.opportunity, approach: next.approach, purchaseUrl: next.purchaseUrl, rating: next.rating, reviews: next.reviews },
      }).eq("id", next.databaseAccountId).then(({ error: saveError }) => { if (saveError) setError(saveError.message); });
    }, 650);
  }

  async function recordActivity(activityType: string, title: string, accountId?: number, details: Record<string, unknown> = {}) {
    if (!supabase || !organizationId) throw new Error("Não foi possível identificar sua organização.");
    const { error: insertError } = await supabase.from("activities").insert({ organization_id: organizationId, account_id: accountId ?? null, actor_id: userId ?? null, activity_type: activityType, title, details });
    if (insertError) throw insertError;
  }

  async function startRoute() {
    if (routeStarted) return;
    setLoading(true); setError(null);
    try { await recordActivity("route_started", "Rota comercial iniciada"); setRouteStarted(true); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível iniciar a rota."); }
    finally { setLoading(false); }
  }

  async function startVisit(lead: Lead) {
    if (visited.includes(lead.id)) return;
    setLoading(true); setError(null);
    try {
      if (!lead.databaseAccountId) throw new Error("Este lead ainda não foi salvo na base.");
      await recordActivity("visit_started", "Visita comercial iniciada", lead.databaseAccountId);
      setVisited((items) => [...items, lead.id]);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível iniciar a visita."); }
    finally { setLoading(false); }
  }

  async function scheduleFollowUp(lead: Lead) {
    if (!supabase || !organizationId || !lead.databaseAccountId) return setError("Salve o lead antes de agendar um retorno.");
    setLoading(true); setError(null);
    try {
      const reasonMap: Record<ReturnReason, FollowUpReason> = { "Enviar diagnóstico": "send_diagnostic", "Cobrar proposta": "follow_proposal", "Decisão com sócio": "partner_decision", "Enviar link de compra": "send_purchase_link", "Implantação": "onboarding", "Resultados do primeiro mês": "first_month_results", Renovação: "renewal", Outro: "other" };
      const payload = buildFollowUpPayload({ organizationId, accountId: lead.databaseAccountId, actorId: userId, responsibleMemberId: memberId, reason: reasonMap[lead.returnReason], dueAt: lead.returnAt ?? "" });
      const { error: closeError } = await supabase.from("follow_ups").update({ status: "canceled" }).eq("organization_id", organizationId).eq("account_id", lead.databaseAccountId).in("status", ["pending", "scheduled", "overdue"]);
      if (closeError) throw closeError;
      const { error: insertError } = await supabase.from("follow_ups").insert(payload);
      if (insertError) throw insertError;
      await supabase.from("accounts").update({ follow_up_status: "scheduled" }).eq("id", lead.databaseAccountId);
      await recordActivity("follow_up_scheduled", "Retorno agendado", lead.databaseAccountId, { reason: payload.reason, due_at: payload.due_at });
      await loadLeads();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível agendar o retorno."); }
    finally { setLoading(false); }
  }

  async function closeLead(lead: Lead) {
    if (!supabase || !organizationId || !lead.databaseAccountId) return setError("Salve o lead antes de registrar o fechamento.");
    setLoading(true); setError(null);
    try {
      const dueAt = lead.returnAt || new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16);
      const plan = buildClosurePlan({ organizationId, accountId: lead.databaseAccountId, actorId: userId, responsibleMemberId: memberId, dueAt });
      const { error: accountError } = await supabase.from("accounts").update(plan.account).eq("id", lead.databaseAccountId);
      if (accountError) throw accountError;
      await supabase.from("follow_ups").update({ status: "canceled" }).eq("organization_id", organizationId).eq("account_id", lead.databaseAccountId).in("status", ["pending", "scheduled", "overdue"]);
      const { error: followUpError } = await supabase.from("follow_ups").insert(plan.followUp);
      if (followUpError) throw followUpError;
      const { error: activityError } = await supabase.from("activities").insert(plan.activity);
      if (activityError) throw activityError;
      await loadLeads();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível registrar o fechamento."); }
    finally { setLoading(false); }
  }

  function createLead(report?: DiagnosticReport) {
    const id = `${draft.businessName.toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "lead"}-${Date.now()}`;
    const lead: Lead = {
      id, name: report?.business.title ?? draft.businessName, category: report?.input.category ?? (draft.category || "Categoria automática"),
      location: report?.business.address ?? draft.location, distance: "—",
      rating: report?.summary.rating ?? 0, reviews: report?.summary.reviewsCount ?? 0,
      potential: draft.potential, stage: report ? "Diagnóstico apresentado" : "Novo",
      followUp: report ? "Aguardando retorno" : "Sem retorno",
      returnReason: report ? "Cobrar proposta" : "Enviar diagnóstico",
      responsible: draft.responsible, phone: draft.phone, email: draft.email, notes: "",
      profile: report?.summary.profile ?? "Lead adicionado manualmente",
      opportunity: report?.summary.narrative ?? "Diagnóstico ainda não realizado.",
      approach: report?.opportunities[0]?.solution ?? "Entender o momento do negócio e preparar o diagnóstico antes da abordagem.",
      purchaseUrl: "", createdAt: new Date().toISOString(), lastContactAt: new Date().toISOString(),
      databaseAccountId: report?.accountId,
    };
    setLeads((items) => [lead, ...items]); setSelectedId(id);
    return id;
  }

  async function saveWithoutDiagnostic(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !organizationId || !draft.businessName.trim() || !draft.location.trim()) return;
    setLoading(true); setError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const potentialMap: Record<Potential, string> = { Alto: "high", Médio: "medium", Baixo: "low" };
      const { data, error: insertError } = await supabase.from("accounts").insert({
        organization_id: organizationId, name: draft.businessName.trim(), category: draft.category.trim() || null,
        address: draft.location.trim(), phone: draft.phone.trim() || null, email: draft.email.trim() || null,
        potential: potentialMap[draft.potential], lifecycle_status: "lead", pipeline_stage: "new", follow_up_status: "none",
        source: "manual", created_by: userData.user?.id, metadata: { responsible: draft.responsible.trim() || "Não atribuído" },
      }).select("public_id").single();
      if (insertError) throw insertError;
      await loadLeads(); setSelectedId(String(data.public_id)); setView("lead"); window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível criar o lead."); }
    finally { setLoading(false); }
  }

  async function requestReport(mode: "live" | "demo", leadId?: string) {
    setLoading(true); setError(null);
    try {
      const report = await requestDiagnostic({
        businessName: draft.businessName,
        location: draft.location,
        category: draft.category.trim(),
        maxCompetitors: 10,
        maxReviews: 40,
        mode,
        accountId: leadId ? selected?.databaseAccountId : undefined,
        responsible: draft.responsible,
        phone: draft.phone,
        email: draft.email,
      });
      const targetId = leadId || createLead(report);
      if (leadId) {
        updateLead(leadId, {
          name: report.business.title, category: report.input.category, location: report.business.address ?? draft.location,
          rating: report.summary.rating ?? 0, reviews: report.summary.reviewsCount ?? 0,
          profile: report.summary.profile, opportunity: report.summary.narrative,
          approach: report.opportunities[0]?.solution ?? selected?.approach ?? "",
          stage: selected.stage === "Novo" ? "Diagnóstico apresentado" : selected.stage,
          followUp: selected.followUp === "Sem retorno" ? "Aguardando retorno" : selected.followUp,
          lastContactAt: new Date().toISOString(),
          databaseAccountId: report.accountId ?? selected.databaseAccountId,
        });
      }
      setReports((items) => ({ ...items, [targetId]: report })); setSelectedId(targetId); setView("report");
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ocorreu um erro inesperado.");
    } finally { setLoading(false); }
  }

  if (presentation && selectedId && reports[selectedId]) {
    return (
      <main className="min-h-[100dvh] bg-[#f3f7fa] px-3 pb-10 pt-16 text-[#082944] sm:px-6">
        <button className="fixed left-1/2 top-3 z-50 flex h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#072b50] px-4 text-sm font-semibold text-white shadow-xl" onClick={() => setPresentation(false)}><X size={16} /> Sair da apresentação</button>
        <div className="mx-auto max-w-[920px]"><DiagnosticReportView report={reports[selectedId]} /></div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f3f7fa] pb-24 text-[#082944]">
      <CommercialHeader />
      <div className="mx-auto w-full max-w-[760px] px-4 py-5 sm:px-6 sm:py-7">
        {view === "today" && <TodayView leads={leads} routeStarted={routeStarted} onStart={() => void startRoute()} onOpen={openLead} onAll={() => navigate("leads")} onNew={startNewLead} />}
        {view === "leads" && <LeadsView search={search} onSearch={setSearch} potential={potentialFilter} onPotential={setPotentialFilter} followUp={followUpFilter} onFollowUp={setFollowUpFilter} stage={stageFilter} onStage={setStageFilter} items={filteredLeads} onOpen={openLead} onNew={startNewLead} />}
        {view === "new-lead" && <NewLeadView draft={draft} setDraft={setDraft} loading={loading} error={error} onBack={() => navigate("leads")} onSave={saveWithoutDiagnostic} onDiagnostic={(mode) => void requestReport(mode)} />}
        {view === "lead" && selected && <LeadView lead={selected} visited={visited.includes(selected.id)} loading={loading} error={error} hasReport={Boolean(reports[selected.id])} draft={draft} setDraft={setDraft} onBack={() => navigate("leads")} onVisit={() => void startVisit(selected)} onUpdate={(patch) => updateLead(selected.id, patch)} onSchedule={() => void scheduleFollowUp(selected)} onClose={() => void closeLead(selected)} onDiagnostic={(mode) => void requestReport(mode, selected.id)} onReport={() => setView("report")} />}
        {view === "report" && selectedId && reports[selectedId] && <ReportView report={reports[selectedId]} onBack={() => setView("lead")} onPresent={() => setPresentation(true)} />}
        {view === "plates" && <PlatesView />}
        {view === "more" && <MoreView />}
      </div>
      <BottomNavigation active={view === "lead" || view === "new-lead" || view === "report" ? "leads" : view} onNavigate={navigate} />
    </main>
  );
}

function CommercialHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dbe7ec] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[760px] items-center justify-between px-4 sm:px-6">
        <Image src={withBasePath("/octareview-wordmark.png")} alt="OctaReview" width={150} height={50} className="h-10 w-auto object-contain" priority />
        <div className="flex items-center gap-2"><span className="hidden text-right sm:block"><span className="block text-xs font-semibold">Área comercial</span><span className="block text-[11px] text-[#718495]">Teresópolis · campo</span></span><button aria-label="Perfil comercial" className="flex size-10 items-center justify-center rounded-full border border-[#d9e5ea] bg-[#f5f9fa] text-[#38576d]"><UserRound size={18} /></button></div>
      </div>
    </header>
  );
}

function DemoBadge() {
  return <span className="inline-flex items-center rounded-full border border-[#bfe9e2] bg-[#eafaf6] px-2.5 py-1 text-[11px] font-semibold text-[#087f69]">Dados de demonstração</span>;
}

function TodayView({ leads, routeStarted, onStart, onOpen, onAll, onNew }: { leads: Lead[]; routeStarted: boolean; onStart: () => void; onOpen: (item: Lead) => void; onAll: () => void; onNew: () => void }) {
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const prospections = leads.filter((lead) => ["Novo", "Contato iniciado", "Diagnóstico apresentado"].includes(lead.stage)).slice(0, 3);
  const returns = leads.filter((lead) => lead.followUp !== "Sem retorno" && lead.returnAt).sort((a, b) => (a.returnAt ?? "").localeCompare(b.returnAt ?? "")).slice(0, 4);
  const activeClients = leads.filter((lead) => ["Fechado", "Cliente ativo", "Renovação"].includes(lead.stage)).length;
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] bg-[linear-gradient(135deg,#052b58,#087d87)] p-5 text-white shadow-[0_18px_50px_rgba(5,43,88,.2)] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm capitalize text-[#bcd5dd]">{date}</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Seu dia comercial</h1></div><DemoBadge /></div>
        <div className="mt-6 grid grid-cols-3 gap-2">{[{ value: String(prospections.length), label: "prospecções" }, { value: String(returns.length), label: "retornos" }, { value: String(activeClients), label: "clientes" }].map((item) => <div key={item.label} className="rounded-2xl bg-white/10 px-3 py-3.5"><p className="text-xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-[#c8dce2]">{item.label}</p></div>)}</div>
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-2"><button onClick={onStart} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#08a89c] px-4 text-sm font-bold text-white shadow-lg"><Navigation size={18} />{routeStarted ? "Continuar rota" : "Começar rota"}<ArrowRight size={17} /></button><button onClick={onNew} aria-label="Adicionar lead" className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#075b72]"><Plus size={21} /></button></div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Prospecções do dia</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Prontas para abordagem</h2></div><button onClick={onAll} className="text-sm font-semibold text-[#078b86]">Ver leads</button></div>
        <div className="space-y-3">{prospections.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={() => onOpen(lead)} />)}</div>
      </section>

      <section>
        <div className="mb-3"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Acompanhamento</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Retornos pendentes</h2></div>
        <div className="space-y-3">{returns.map((lead) => <button key={lead.id} onClick={() => onOpen(lead)} className="flex min-h-[88px] w-full items-center gap-3 rounded-[20px] border border-[#dbe7ec] bg-white p-4 text-left"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff5dd] text-[#a8750c]"><CalendarClock size={20} /></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{lead.name}</span><span className="mt-1 block text-sm font-medium text-[#526b7c]">{lead.returnReason}</span><span className="mt-1 block text-xs text-[#8395a1]">{formatDateTime(lead.returnAt)} · {lead.followUp}</span></span><ChevronRight size={18} className="shrink-0 text-[#8aa0ab]" /></button>)}</div>
      </section>

      <section className="rounded-[20px] border border-[#dbe7ec] bg-white p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Ritmo de hoje</p><p className="mt-1 text-lg font-semibold">{routeStarted ? "Rota comercial em andamento" : "Rota ainda não iniciada"}</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f7f6] text-[#087f78]"><Route size={19} /></span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eaf0f2]"><div className={`h-full rounded-full bg-[#08a89c] ${routeStarted ? "w-1/3" : "w-[4%]"}`} /></div></section>
    </div>
  );
}

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  return (
    <article className="rounded-[22px] border border-[#dbe7ec] bg-white">
      <button onClick={onOpen} className="w-full p-5 text-left">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-lg font-semibold tracking-[-0.025em]">{lead.name}</p><p className="mt-1 truncate text-sm text-[#708592]">{lead.category} · {lead.location}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${potentialStyle[lead.potential]}`}>{lead.potential}</span></div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span className="flex items-center gap-1.5 font-semibold"><Star size={15} fill="#f4b63f" className="text-[#f4b63f]" />{lead.rating ? lead.rating.toFixed(1) : "—"}</span><span className="text-[#758894]">{lead.reviews} avaliações</span><span className="rounded-lg bg-[#eef4f5] px-2 py-1 text-xs font-medium text-[#526b7c]">{lead.stage}</span></div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#eaf0f2] pt-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8397a2]">Próxima ação</p><p className="mt-1 text-sm font-semibold text-[#34566a]">{lead.followUp === "Sem retorno" ? "Definir acompanhamento" : lead.returnReason}</p></div><ChevronRight size={18} className="shrink-0 text-[#8aa0ab]" /></div>
      </button>
    </article>
  );
}

function LeadsView({ search, onSearch, potential, onPotential, followUp, onFollowUp, stage, onStage, items, onOpen, onNew }: { search: string; onSearch: (value: string) => void; potential: "Todos" | Potential; onPotential: (value: "Todos" | Potential) => void; followUp: "Todos" | FollowUpStatus; onFollowUp: (value: "Todos" | FollowUpStatus) => void; stage: "Todos" | LeadStage; onStage: (value: "Todos" | LeadStage) => void; items: Lead[]; onOpen: (item: Lead) => void; onNew: () => void }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">CRM de campo</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Leads</h1><p className="mt-1 text-sm text-[#708592]">Da prospecção à renovação.</p></div><button onClick={onNew} className="flex size-12 items-center justify-center rounded-2xl bg-[#078b86] text-white shadow-lg" aria-label="Adicionar lead"><Plus size={21} /></button></div>
      <div className="mt-5 rounded-[22px] border border-[#dbe7ec] bg-white p-4">
        <label className="commercial-field"><Search size={18} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Buscar empresa, categoria ou responsável" /></label>
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#8397a2]">Potencial</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">{(["Todos", "Alto", "Médio", "Baixo"] as const).map((item) => <button key={item} onClick={() => onPotential(item)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold ${potential === item ? "border-[#078b86] bg-[#078b86] text-white" : "border-[#d9e5ea] bg-white text-[#526b7c]"}`}>{item}</button>)}</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="commercial-label">Follow-up<select value={followUp} onChange={(event) => onFollowUp(event.target.value as "Todos" | FollowUpStatus)} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]"><option>Todos</option>{followUps.map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label">Etapa<select value={stage} onChange={(event) => onStage(event.target.value as "Todos" | LeadStage)} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]"><option>Todos</option>{stages.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      </div>
      <div className="mt-4 flex items-center justify-between"><p className="text-sm font-semibold text-[#526b7c]">{items.length} resultado{items.length === 1 ? "" : "s"}</p><button onClick={() => { onSearch(""); onPotential("Todos"); onFollowUp("Todos"); onStage("Todos"); }} className="min-h-10 text-sm font-semibold text-[#078b86]">Limpar filtros</button></div>
      <div className="mt-2 space-y-3">{items.length ? items.map((lead) => <LeadCard key={lead.id} lead={lead} onOpen={() => onOpen(lead)} />) : <div className="rounded-[22px] border border-dashed border-[#cbdade] p-8 text-center text-sm text-[#708592]">Nenhum lead corresponde aos filtros.</div>}</div>
    </div>
  );
}

function NewLeadView({ draft, setDraft, loading, error, onBack, onSave, onDiagnostic }: { draft: LeadDraft; setDraft: (value: LeadDraft) => void; loading: boolean; error: string | null; onBack: () => void; onSave: (event: FormEvent) => void; onDiagnostic: (mode: "live" | "demo") => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[#526b7c]"><ArrowLeft size={18} />Voltar aos leads</button>
      <form onSubmit={onSave} className="rounded-[24px] border border-[#dbe7ec] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Novo lead</p><h1 className="mt-1 text-[26px] font-semibold tracking-[-0.04em]">Empresa e contato</h1><p className="mt-2 text-sm leading-6 text-[#708592]">Ao gerar o diagnóstico, o lead é criado automaticamente.</p></div><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7f6] text-[#087f78]"><UsersRound size={21} /></span></div>
        <div className="mt-6 space-y-4"><label className="commercial-label">Empresa<div className="commercial-field"><Building2 size={18} /><input value={draft.businessName} onChange={(event) => setDraft({ ...draft, businessName: event.target.value })} placeholder="Nome no Google" autoComplete="organization" required /></div></label><label className="commercial-label">Cidade ou região<div className="commercial-field"><MapPin size={18} /><input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} required /></div></label><label className="commercial-label">Categoria de comparação <span className="font-normal text-[#8aa0ab]">(opcional)</span><div className="commercial-field"><Search size={18} /><input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Automática pelo perfil" /></div></label><div className="grid gap-4 sm:grid-cols-2"><label className="commercial-label">Responsável<div className="commercial-field"><UserRound size={18} /><input value={draft.responsible} onChange={(event) => setDraft({ ...draft, responsible: event.target.value })} /></div></label><label className="commercial-label">Potencial<select value={draft.potential} onChange={(event) => setDraft({ ...draft, potential: event.target.value as Potential })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{(["Alto", "Médio", "Baixo"] as const).map((item) => <option key={item}>{item}</option>)}</select></label></div><label className="commercial-label">Telefone<div className="commercial-field"><Phone size={18} /><input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} inputMode="tel" placeholder="(21) 99999-9999" /></div></label><label className="commercial-label">E-mail<div className="commercial-field"><Mail size={18} /><input value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} inputMode="email" placeholder="contato@empresa.com.br" /></div></label></div>
        {error && <div className="mt-4 flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"><CircleAlert className="mt-0.5 shrink-0" size={17} />{error}</div>}
        <div className="mt-6 space-y-3"><button disabled={loading || !draft.businessName.trim() || !draft.location.trim()} type="button" onClick={() => onDiagnostic("live")} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#078b86] px-4 text-sm font-bold text-white shadow-lg disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <FileSearch size={18} />}{loading ? "Criando lead e diagnóstico..." : "Gerar diagnóstico e criar lead"}</button><button disabled={loading || !draft.businessName.trim()} type="submit" className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#d9e5ea] bg-white px-4 text-sm font-bold text-[#34566a] disabled:opacity-50">Salvar lead sem diagnóstico</button><button disabled={loading} type="button" onClick={() => onDiagnostic("demo")} className="min-h-11 w-full text-sm font-semibold text-[#078b86]">Criar lead de exemplo</button></div>
      </form>
    </div>
  );
}

function LeadView({ lead, visited, loading, error, hasReport, draft, setDraft, onBack, onVisit, onUpdate, onSchedule, onClose, onDiagnostic, onReport }: { lead: Lead; visited: boolean; loading: boolean; error: string | null; hasReport: boolean; draft: LeadDraft; setDraft: (value: LeadDraft) => void; onBack: () => void; onVisit: () => void; onUpdate: (patch: Partial<Lead>) => void; onSchedule: () => void; onClose: () => void; onDiagnostic: (mode: "live" | "demo") => void; onReport: () => void }) {
  const closingMessage = `Olá! Segue o link para contratação da OctaReview: ${lead.purchaseUrl}`;
  const whatsappUrl = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(closingMessage)}`;
  const mailUrl = `mailto:${lead.email}?subject=${encodeURIComponent("Link de contratação OctaReview")}&body=${encodeURIComponent(closingMessage)}`;
  const canWhatsapp = Boolean(lead.phone.replace(/\D/g, "") && lead.purchaseUrl.trim());
  const canEmail = Boolean(lead.email.trim() && lead.purchaseUrl.trim());
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[#526b7c]"><ArrowLeft size={18} />Voltar aos leads</button>
      <section className="overflow-hidden rounded-[24px] border border-[#dbe7ec] bg-white"><div className="bg-[linear-gradient(135deg,#052b58,#087d87)] p-5 text-white sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm text-[#bed7df]">{lead.category}</p><h1 className="mt-1 truncate text-[28px] font-semibold tracking-[-0.04em]">{lead.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-[#d1e2e6]"><MapPin size={15} />{lead.location}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${potentialStyle[lead.potential]}`}>{lead.potential}</span></div><div className="mt-5 flex items-center gap-4"><span className="flex items-center gap-1.5 text-lg font-semibold"><Star size={17} fill="#f4b63f" className="text-[#f4b63f]" />{lead.rating ? lead.rating.toFixed(1) : "—"}</span><span className="text-sm text-[#d1e2e6]">{lead.reviews} avaliações</span></div></div><div className="grid grid-cols-2 divide-x divide-[#eaf0f2] p-4"><div className="px-2"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8397a2]">Etapa</p><p className="mt-1 text-sm font-semibold">{lead.stage}</p></div><div className="px-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8397a2]">Follow-up</p><p className="mt-1 text-sm font-semibold">{lead.followUp}</p></div></div></section>

      <section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Controle do lead</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="commercial-label">Etapa<select value={lead.stage} onChange={(event) => onUpdate({ stage: event.target.value as LeadStage })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{stages.map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label">Potencial<select value={lead.potential} onChange={(event) => onUpdate({ potential: event.target.value as Potential })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{(["Alto", "Médio", "Baixo"] as const).map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label">Situação do follow-up<select value={lead.followUp} onChange={(event) => onUpdate({ followUp: event.target.value as FollowUpStatus })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{followUps.map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label">Motivo do retorno<select value={lead.returnReason} onChange={(event) => onUpdate({ returnReason: event.target.value as ReturnReason })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{returnReasons.map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label sm:col-span-2">Data e hora do retorno<input type="datetime-local" value={lead.returnAt ?? ""} onChange={(event) => onUpdate({ returnAt: event.target.value || undefined })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]" /></label></div><button disabled={loading || !lead.returnAt} onClick={onSchedule} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#a8ddd5] bg-[#eafaf6] text-sm font-bold text-[#087f69] disabled:opacity-50"><CalendarClock size={17} />Agendar retorno</button><p className="mt-3 flex items-center gap-2 text-xs text-[#78909c]"><Check size={14} className="text-[#08a89c]" />Alterações sincronizadas com a base da OctaReview</p></section>

      <section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Informações e contato</p><div className="mt-4 space-y-4"><label className="commercial-label">Responsável<div className="commercial-field"><UserRound size={18} /><input value={lead.responsible} onChange={(event) => { onUpdate({ responsible: event.target.value }); setDraft({ ...draft, responsible: event.target.value }); }} /></div></label><label className="commercial-label">Telefone<div className="commercial-field"><Phone size={18} /><input value={lead.phone} onChange={(event) => { onUpdate({ phone: event.target.value }); setDraft({ ...draft, phone: event.target.value }); }} inputMode="tel" /></div></label><label className="commercial-label">E-mail<div className="commercial-field"><Mail size={18} /><input value={lead.email} onChange={(event) => { onUpdate({ email: event.target.value }); setDraft({ ...draft, email: event.target.value }); }} inputMode="email" /></div></label><label className="commercial-label">Observações<textarea value={lead.notes} onChange={(event) => onUpdate({ notes: event.target.value })} rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#d9e5ea] bg-white p-3 text-sm leading-6 text-[#264a60] outline-none focus:border-[#08a89c]" placeholder="Contexto da conversa, objeções e próximos passos" /></label></div><div className="mt-4 grid grid-cols-2 gap-3"><a href={`tel:${lead.phone}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9e5ea] text-sm font-semibold text-[#34566a]"><Phone size={16} />Ligar</a><a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#bfe9e2] bg-[#eafaf6] text-sm font-semibold text-[#087f69]"><MessageCircle size={16} />WhatsApp</a></div></section>

      <section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-[#fff1ec] text-[#d7613e]"><Target size={19} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Oportunidade principal</p><p className="mt-2 text-[16px] leading-7 text-[#405e70]">{lead.opportunity}</p><div className="mt-4 rounded-2xl bg-[#eef8f8] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#52807f]">Abordagem recomendada</p><p className="mt-2 text-sm font-medium leading-6 text-[#264a60]">“{lead.approach}”</p></div></section>

      {lead.returnAt && <div className="flex items-center gap-3 rounded-2xl border border-[#f3dfb7] bg-[#fff9ec] p-4 text-sm font-semibold text-[#8e650d]"><CalendarClock size={19} /><span><span className="block">{lead.returnReason}</span><span className="mt-0.5 block text-xs font-medium">{formatDateTime(lead.returnAt)}</span></span></div>}
      {error && <div className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"><CircleAlert className="mt-0.5 shrink-0" size={17} />{error}</div>}

      <section className="rounded-[22px] border border-[#cde8e5] bg-[#f4fbfa] p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#52807f]">Diagnóstico</p><p className="mt-2 text-sm leading-6 text-[#526b7c]">O relatório fica vinculado a este lead e atualiza a oportunidade comercial.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{hasReport && <button onClick={onReport} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#052b58] px-4 text-sm font-bold text-white"><Presentation size={18} />Abrir diagnóstico</button>}<button disabled={loading} onClick={() => onDiagnostic(lead.id === "studio-aurora" ? "demo" : "live")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#078b86] px-4 text-sm font-bold text-white disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <FileSearch size={18} />}{loading ? "Gerando..." : hasReport ? "Atualizar diagnóstico" : "Gerar diagnóstico"}</button></div></section>

      <section className="rounded-[22px] border border-[#bfe9e2] bg-white p-5"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eafaf6] text-[#087f69]"><Handshake size={21} /></span><div><p className="font-semibold">Fechamento</p><p className="mt-1 text-sm leading-6 text-[#708592]">Cole o link de compra e abra a mensagem pronta no canal escolhido.</p></div></div><label className="commercial-label mt-4">Link de compra<div className="commercial-field"><CircleDollarSign size={18} /><input value={lead.purchaseUrl} onChange={(event) => onUpdate({ purchaseUrl: event.target.value })} inputMode="url" placeholder="https://seu-checkout.com/..." /></div></label><div className="mt-3 grid grid-cols-2 gap-3">{canWhatsapp ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#18a978] px-3 text-center text-sm font-bold text-white"><MessageCircle size={17} />WhatsApp</a> : <button disabled className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dbe6e7] px-3 text-sm font-bold text-[#8ba0a7]"><MessageCircle size={17} />WhatsApp</button>}{canEmail ? <a href={mailUrl} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#052b58] px-3 text-center text-sm font-bold text-white"><Mail size={17} />E-mail</a> : <button disabled className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dbe6e7] px-3 text-sm font-bold text-[#8ba0a7]"><Mail size={17} />E-mail</button>}</div><button disabled={loading} onClick={onClose} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#a8ddd5] bg-[#eafaf6] text-sm font-bold text-[#087f69] disabled:opacity-50"><Check size={18} />Registrar fechamento e iniciar implantação</button></section>

      <section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Histórico</p><div className="mt-4 space-y-4"><TimelineItem title="Lead criado" detail={formatDateTime(lead.createdAt)} /><TimelineItem title="Último contato" detail={formatDateTime(lead.lastContactAt)} />{lead.clientSince && <TimelineItem title="Virou cliente" detail={new Intl.DateTimeFormat("pt-BR").format(new Date(`${lead.clientSince}T12:00:00`))} />}</div></section>
      <button onClick={onVisit} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold ${visited ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#d9e5ea] bg-white text-[#34566a]"}`}>{visited ? <Check size={18} /> : <Play size={18} />}{visited ? "Visita iniciada" : "Iniciar visita"}</button>
    </div>
  );
}

function TimelineItem({ title, detail }: { title: string; detail: string }) {
  return <div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-[#08a89c]" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-[#78909c]">{detail}</p></div></div>;
}

function ReportView({ report, onBack, onPresent }: { report: DiagnosticReport; onBack: () => void; onPresent: () => void }) {
  return <div className="space-y-4"><button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[#526b7c]"><ArrowLeft size={18} />Voltar ao lead</button><div className="sticky top-[76px] z-30 flex items-center justify-between rounded-2xl border border-[#dbe7ec] bg-white/95 p-3 shadow-sm backdrop-blur"><div className="min-w-0"><p className="text-xs text-[#78909c]">Diagnóstico vinculado ao lead</p><p className="truncate text-sm font-semibold">{report.business.title}</p></div><button onClick={onPresent} className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-[#052b58] px-4 text-sm font-semibold text-white"><Presentation size={16} />Apresentar</button></div><DiagnosticReportView report={report} /></div>;
}

function PlatesView() {
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Operação</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Placas</h1><p className="mt-2 text-sm leading-6 text-[#708592]">Visão inicial do estoque comercial.</p></div><DemoBadge /><div className="grid grid-cols-2 gap-3"><div className="rounded-[20px] border border-[#dbe7ec] bg-white p-4"><p className="text-3xl font-semibold">12</p><p className="mt-1 text-sm text-[#708592]">Disponíveis</p></div><div className="rounded-[20px] border border-[#dbe7ec] bg-white p-4"><p className="text-3xl font-semibold">4</p><p className="mt-1 text-sm text-[#708592]">Ativas</p></div></div><section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7f6] text-[#087f78]"><PackageCheck size={21} /></span><div><p className="font-semibold">Ativação na próxima etapa</p><p className="mt-2 text-sm leading-6 text-[#708592]">Cada placa manterá uma URL permanente, vinculada ao cliente no momento da ativação.</p></div></div></section></div>;
}

function MoreView() {
  const items = [{ icon: BookOpen, title: "Manual comercial", detail: "Produto, abordagem e roteiro de visita" }, { icon: MessageCircle, title: "Quebra de objeções", detail: "Respostas rápidas para a conversa" }, { icon: ClipboardCheck, title: "Fechamento e implantação", detail: "Checklist da venda ao cliente ativo" }];
  return <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Apoio</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Mais ferramentas</h1><div className="mt-5 space-y-3"><Link href={withBasePath("/adm/")} className="flex min-h-[82px] w-full items-center gap-4 rounded-[20px] border border-[#bfe5e1] bg-[#f2fbfa] p-4 text-left"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#dff4f1] text-[#087f78]"><Building2 size={20} /></span><span className="min-w-0 flex-1"><span className="block font-semibold">Painel de gestão</span><span className="mt-1 block text-sm leading-5 text-[#708592]">Operação interna, clientes e cobrança</span></span><ChevronRight size={18} className="text-[#8aa0ab]" /></Link>{items.map(({ icon: Icon, title, detail }) => <button key={title} className="flex min-h-[82px] w-full items-center gap-4 rounded-[20px] border border-[#dbe7ec] bg-white p-4 text-left"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7f6] text-[#087f78]"><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm leading-5 text-[#708592]">{detail}</span></span><ChevronRight size={18} className="text-[#8aa0ab]" /></button>)}</div><div className="mt-5 rounded-[20px] border border-dashed border-[#cbdade] p-5 text-center"><p className="text-sm font-semibold">OctaReview comercial</p><p className="mt-2 text-sm leading-6 text-[#708592]">Leads, diagnósticos e atualizações são sincronizados com o banco da organização.</p></div></div>;
}

function BottomNavigation({ active, onNavigate }: { active: MainView; onNavigate: (view: MainView) => void }) {
  return <nav aria-label="Navegação comercial" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9e5ea] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"><div className="mx-auto grid h-[72px] max-w-[760px] grid-cols-4 px-2">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} aria-current={active === id ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold ${active === id ? "text-[#078b86]" : "text-[#7f929d]"}`}><Icon size={20} strokeWidth={active === id ? 2.3 : 1.8} /><span className="truncate">{label}</span></button>)}</div></nav>;
}
