"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, CalendarClock, Check,
  ChevronRight, CircleAlert, CircleDollarSign, ClipboardCheck,
  FileSearch, Handshake, Home, LoaderCircle, Mail, MapPin, MessageCircle,
  MoreHorizontal, Navigation, PackageCheck, Phone, Play, Plus,
  Presentation, Route, Search, Star, Target, UserRound, UsersRound, X,
} from "lucide-react";
import type { DiagnosticReport } from "@/lib/types";
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

const initialLeads: Lead[] = [
  {
    id: "studio-aurora", name: "Studio Aurora", category: "Salão de beleza",
    location: "Centro, Teresópolis", distance: "0,8 km", rating: 4.6, reviews: 128,
    potential: "Alto", stage: "Novo", followUp: "Retorno agendado", returnReason: "Enviar diagnóstico",
    returnAt: "2026-09-15T14:30", responsible: "Yuri Silva", phone: "5521998765432",
    email: "contato@studioaurora.com.br", notes: "Pedir para falar com a proprietária. Maior movimento depois das 14h.",
    profile: "Presença local em desenvolvimento",
    opportunity: "A reputação é competitiva, mas a empresa aparece fora do grupo de maior destaque na busca analisada.",
    approach: "Quero mostrar onde o Studio já está forte e três oportunidades objetivas para transformar essa reputação em mais presença local.",
    purchaseUrl: "", createdAt: "2026-09-12T10:20", lastContactAt: "2026-09-14T16:10",
  },
  {
    id: "bella-pizzaria", name: "Bella Pizzaria", category: "Pizzaria",
    location: "Várzea, Teresópolis", distance: "1,4 km", rating: 4.4, reviews: 347,
    potential: "Alto", stage: "Proposta enviada", followUp: "Aguardando retorno", returnReason: "Decisão com sócio",
    returnAt: "2026-09-15T15:30", responsible: "Yuri Silva", phone: "5521998123456",
    email: "administracao@bellapizzaria.com.br", notes: "Proposta apresentada. Decisão será feita com o segundo sócio.",
    profile: "Alto potencial de relacionamento",
    opportunity: "O volume de clientes e avaliações cria espaço para medir relacionamento, retorno e conversão além do Google.",
    approach: "Vocês já atraem muita opinião pública. A proposta é transformar cada ponto de contato em reputação, relacionamento e dados.",
    purchaseUrl: "", createdAt: "2026-09-08T09:00", lastContactAt: "2026-09-14T11:40",
  },
  {
    id: "oficina-torque", name: "Oficina Torque", category: "Oficina mecânica",
    location: "Alto, Teresópolis", distance: "2,1 km", rating: 4.8, reviews: 42,
    potential: "Médio", stage: "Contato iniciado", followUp: "Retorno agendado", returnReason: "Cobrar proposta",
    returnAt: "2026-09-16T10:00", responsible: "Yuri Silva", phone: "5521997456789",
    email: "oficinatorque@email.com", notes: "Cliente prefere contato por WhatsApp antes das 11h.",
    profile: "Boa reputação, baixo volume",
    opportunity: "A nota transmite confiança, mas ainda há pouca prova social diante de concorrentes mais conhecidos.",
    approach: "O atendimento já é bem avaliado. Quero mostrar como tornar essa satisfação mais visível para quem ainda não conhece a oficina.",
    purchaseUrl: "", createdAt: "2026-09-13T13:15", lastContactAt: "2026-09-15T09:20",
  },
  {
    id: "clinica-serra", name: "Clínica Serra", category: "Clínica de saúde",
    location: "Agriões, Teresópolis", distance: "1,9 km", rating: 4.9, reviews: 86,
    potential: "Alto", stage: "Cliente ativo", followUp: "Pós-venda", returnReason: "Resultados do primeiro mês",
    returnAt: "2026-09-19T11:00", responsible: "Yuri Silva", phone: "5521997001122",
    email: "gestao@clinicaserra.com.br", notes: "Onboarding concluído. Acompanhar adesão da equipe e primeiras avaliações captadas.",
    profile: "Cliente em implantação",
    opportunity: "Consolidar a rotina de solicitação e resposta para manter o crescimento sustentável da reputação.",
    approach: "Vamos revisar os primeiros resultados e ajustar a rotina para a equipe conseguir manter o processo sem atrito.",
    purchaseUrl: "", createdAt: "2026-08-22T15:30", lastContactAt: "2026-09-13T17:10", clientSince: "2026-09-01",
  },
];

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
  const [view, setView] = useState<View>("today");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedId, setSelectedId] = useState(initialLeads[0].id);
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("octareview-leads-v1");
      if (saved) {
        try { setLeads(JSON.parse(saved) as Lead[]); } catch { /* mantém os dados iniciais */ }
      }
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("octareview-leads-v1", JSON.stringify(leads));
  }, [hydrated, leads]);

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
    setLeads((items) => items.map((lead) => lead.id === id ? { ...lead, ...patch } : lead));
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
    };
    setLeads((items) => [lead, ...items]); setSelectedId(id);
    return id;
  }

  function saveWithoutDiagnostic(event: FormEvent) {
    event.preventDefault();
    if (!draft.businessName.trim() || !draft.location.trim()) return;
    createLead(); setView("lead"); window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function requestReport(mode: "live" | "demo", leadId?: string) {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: draft.businessName, location: draft.location, category: draft.category.trim() || undefined, maxCompetitors: 10, maxReviews: 40, mode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível gerar o diagnóstico.");
      const report = data as DiagnosticReport;
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
        {view === "today" && <TodayView leads={leads} routeStarted={routeStarted} onStart={() => setRouteStarted(true)} onOpen={openLead} onAll={() => navigate("leads")} onNew={startNewLead} />}
        {view === "leads" && <LeadsView search={search} onSearch={setSearch} potential={potentialFilter} onPotential={setPotentialFilter} followUp={followUpFilter} onFollowUp={setFollowUpFilter} stage={stageFilter} onStage={setStageFilter} items={filteredLeads} onOpen={openLead} onNew={startNewLead} />}
        {view === "new-lead" && <NewLeadView draft={draft} setDraft={setDraft} loading={loading} error={error} onBack={() => navigate("leads")} onSave={saveWithoutDiagnostic} onDiagnostic={(mode) => void requestReport(mode)} />}
        {view === "lead" && selected && <LeadView lead={selected} visited={visited.includes(selected.id)} loading={loading} error={error} hasReport={Boolean(reports[selected.id])} draft={draft} setDraft={setDraft} onBack={() => navigate("leads")} onVisit={() => setVisited((items) => items.includes(selected.id) ? items : [...items, selected.id])} onUpdate={(patch) => updateLead(selected.id, patch)} onDiagnostic={(mode) => void requestReport(mode, selected.id)} onReport={() => setView("report")} />}
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
        <Image src="/octareview-wordmark.png" alt="OctaReview" width={150} height={50} className="h-10 w-auto object-contain" priority />
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

function LeadView({ lead, visited, loading, error, hasReport, draft, setDraft, onBack, onVisit, onUpdate, onDiagnostic, onReport }: { lead: Lead; visited: boolean; loading: boolean; error: string | null; hasReport: boolean; draft: LeadDraft; setDraft: (value: LeadDraft) => void; onBack: () => void; onVisit: () => void; onUpdate: (patch: Partial<Lead>) => void; onDiagnostic: (mode: "live" | "demo") => void; onReport: () => void }) {
  const closingMessage = `Olá! Segue o link para contratação da OctaReview: ${lead.purchaseUrl}`;
  const whatsappUrl = `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(closingMessage)}`;
  const mailUrl = `mailto:${lead.email}?subject=${encodeURIComponent("Link de contratação OctaReview")}&body=${encodeURIComponent(closingMessage)}`;
  const canWhatsapp = Boolean(lead.phone.replace(/\D/g, "") && lead.purchaseUrl.trim());
  const canEmail = Boolean(lead.email.trim() && lead.purchaseUrl.trim());
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[#526b7c]"><ArrowLeft size={18} />Voltar aos leads</button>
      <section className="overflow-hidden rounded-[24px] border border-[#dbe7ec] bg-white"><div className="bg-[linear-gradient(135deg,#052b58,#087d87)] p-5 text-white sm:p-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm text-[#bed7df]">{lead.category}</p><h1 className="mt-1 truncate text-[28px] font-semibold tracking-[-0.04em]">{lead.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-[#d1e2e6]"><MapPin size={15} />{lead.location}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${potentialStyle[lead.potential]}`}>{lead.potential}</span></div><div className="mt-5 flex items-center gap-4"><span className="flex items-center gap-1.5 text-lg font-semibold"><Star size={17} fill="#f4b63f" className="text-[#f4b63f]" />{lead.rating ? lead.rating.toFixed(1) : "—"}</span><span className="text-sm text-[#d1e2e6]">{lead.reviews} avaliações</span></div></div><div className="grid grid-cols-2 divide-x divide-[#eaf0f2] p-4"><div className="px-2"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8397a2]">Etapa</p><p className="mt-1 text-sm font-semibold">{lead.stage}</p></div><div className="px-4"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8397a2]">Follow-up</p><p className="mt-1 text-sm font-semibold">{lead.followUp}</p></div></div></section>

      <section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Controle do lead</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="commercial-label">Etapa<select value={lead.stage} onChange={(event) => onUpdate({ stage: event.target.value as LeadStage })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{stages.map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label">Potencial<select value={lead.potential} onChange={(event) => onUpdate({ potential: event.target.value as Potential })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{(["Alto", "Médio", "Baixo"] as const).map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label">Situação do follow-up<select value={lead.followUp} onChange={(event) => onUpdate({ followUp: event.target.value as FollowUpStatus })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{followUps.map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label">Motivo do retorno<select value={lead.returnReason} onChange={(event) => onUpdate({ returnReason: event.target.value as ReturnReason })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]">{returnReasons.map((item) => <option key={item}>{item}</option>)}</select></label><label className="commercial-label sm:col-span-2">Data e hora do retorno<input type="datetime-local" value={lead.returnAt ?? ""} onChange={(event) => onUpdate({ returnAt: event.target.value || undefined })} className="mt-2 h-12 w-full rounded-xl border border-[#d9e5ea] bg-white px-3 text-sm text-[#264a60]" /></label></div><p className="mt-3 flex items-center gap-2 text-xs text-[#78909c]"><Check size={14} className="text-[#08a89c]" />Alterações salvas neste dispositivo</p></section>

      <section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Informações e contato</p><div className="mt-4 space-y-4"><label className="commercial-label">Responsável<div className="commercial-field"><UserRound size={18} /><input value={lead.responsible} onChange={(event) => { onUpdate({ responsible: event.target.value }); setDraft({ ...draft, responsible: event.target.value }); }} /></div></label><label className="commercial-label">Telefone<div className="commercial-field"><Phone size={18} /><input value={lead.phone} onChange={(event) => { onUpdate({ phone: event.target.value }); setDraft({ ...draft, phone: event.target.value }); }} inputMode="tel" /></div></label><label className="commercial-label">E-mail<div className="commercial-field"><Mail size={18} /><input value={lead.email} onChange={(event) => { onUpdate({ email: event.target.value }); setDraft({ ...draft, email: event.target.value }); }} inputMode="email" /></div></label><label className="commercial-label">Observações<textarea value={lead.notes} onChange={(event) => onUpdate({ notes: event.target.value })} rows={4} className="mt-2 w-full resize-none rounded-xl border border-[#d9e5ea] bg-white p-3 text-sm leading-6 text-[#264a60] outline-none focus:border-[#08a89c]" placeholder="Contexto da conversa, objeções e próximos passos" /></label></div><div className="mt-4 grid grid-cols-2 gap-3"><a href={`tel:${lead.phone}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#d9e5ea] text-sm font-semibold text-[#34566a]"><Phone size={16} />Ligar</a><a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#bfe9e2] bg-[#eafaf6] text-sm font-semibold text-[#087f69]"><MessageCircle size={16} />WhatsApp</a></div></section>

      <section className="rounded-[22px] border border-[#dbe7ec] bg-white p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-[#fff1ec] text-[#d7613e]"><Target size={19} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Oportunidade principal</p><p className="mt-2 text-[16px] leading-7 text-[#405e70]">{lead.opportunity}</p><div className="mt-4 rounded-2xl bg-[#eef8f8] p-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#52807f]">Abordagem recomendada</p><p className="mt-2 text-sm font-medium leading-6 text-[#264a60]">“{lead.approach}”</p></div></section>

      {lead.returnAt && <div className="flex items-center gap-3 rounded-2xl border border-[#f3dfb7] bg-[#fff9ec] p-4 text-sm font-semibold text-[#8e650d]"><CalendarClock size={19} /><span><span className="block">{lead.returnReason}</span><span className="mt-0.5 block text-xs font-medium">{formatDateTime(lead.returnAt)}</span></span></div>}
      {error && <div className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"><CircleAlert className="mt-0.5 shrink-0" size={17} />{error}</div>}

      <section className="rounded-[22px] border border-[#cde8e5] bg-[#f4fbfa] p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#52807f]">Diagnóstico</p><p className="mt-2 text-sm leading-6 text-[#526b7c]">O relatório fica vinculado a este lead e atualiza a oportunidade comercial.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{hasReport && <button onClick={onReport} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#052b58] px-4 text-sm font-bold text-white"><Presentation size={18} />Abrir diagnóstico</button>}<button disabled={loading} onClick={() => onDiagnostic(lead.id === "studio-aurora" ? "demo" : "live")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#078b86] px-4 text-sm font-bold text-white disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <FileSearch size={18} />}{loading ? "Gerando..." : hasReport ? "Atualizar diagnóstico" : "Gerar diagnóstico"}</button></div></section>

      <section className="rounded-[22px] border border-[#bfe9e2] bg-white p-5"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eafaf6] text-[#087f69]"><Handshake size={21} /></span><div><p className="font-semibold">Fechamento</p><p className="mt-1 text-sm leading-6 text-[#708592]">Cole o link de compra e abra a mensagem pronta no canal escolhido.</p></div></div><label className="commercial-label mt-4">Link de compra<div className="commercial-field"><CircleDollarSign size={18} /><input value={lead.purchaseUrl} onChange={(event) => onUpdate({ purchaseUrl: event.target.value })} inputMode="url" placeholder="https://seu-checkout.com/..." /></div></label><div className="mt-3 grid grid-cols-2 gap-3">{canWhatsapp ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#18a978] px-3 text-center text-sm font-bold text-white"><MessageCircle size={17} />WhatsApp</a> : <button disabled className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dbe6e7] px-3 text-sm font-bold text-[#8ba0a7]"><MessageCircle size={17} />WhatsApp</button>}{canEmail ? <a href={mailUrl} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#052b58] px-3 text-center text-sm font-bold text-white"><Mail size={17} />E-mail</a> : <button disabled className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#dbe6e7] px-3 text-sm font-bold text-[#8ba0a7]"><Mail size={17} />E-mail</button>}</div><button onClick={() => onUpdate({ stage: "Fechado", followUp: "Pós-venda", returnReason: "Implantação", clientSince: lead.clientSince ?? new Date().toISOString().slice(0, 10), lastContactAt: new Date().toISOString() })} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#a8ddd5] bg-[#eafaf6] text-sm font-bold text-[#087f69]"><Check size={18} />Registrar fechamento</button></section>

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
  return <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#78909c]">Apoio</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Mais ferramentas</h1><div className="mt-5 space-y-3">{items.map(({ icon: Icon, title, detail }) => <button key={title} className="flex min-h-[82px] w-full items-center gap-4 rounded-[20px] border border-[#dbe7ec] bg-white p-4 text-left"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f7f6] text-[#087f78]"><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm leading-5 text-[#708592]">{detail}</span></span><ChevronRight size={18} className="text-[#8aa0ab]" /></button>)}</div><div className="mt-5 rounded-[20px] border border-dashed border-[#cbdade] p-5 text-center"><p className="text-sm font-semibold">OctaReview comercial</p><p className="mt-2 text-sm leading-6 text-[#708592]">Nesta fase os leads ficam salvos no aparelho. A sincronização entre vendedores entra com banco de dados e login.</p></div></div>;
}

function BottomNavigation({ active, onNavigate }: { active: MainView; onNavigate: (view: MainView) => void }) {
  return <nav aria-label="Navegação comercial" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#d9e5ea] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"><div className="mx-auto grid h-[72px] max-w-[760px] grid-cols-4 px-2">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} aria-current={active === id ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold ${active === id ? "text-[#078b86]" : "text-[#7f929d]"}`}><Icon size={20} strokeWidth={active === id ? 2.3 : 1.8} /><span className="truncate">{label}</span></button>)}</div></nav>;
}
