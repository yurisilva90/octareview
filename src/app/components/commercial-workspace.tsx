"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, Building2, CalendarClock, Check,
  ChevronRight, CircleAlert, CircleDollarSign, ClipboardCheck,
  FileSearch, Home, LoaderCircle, MapPin, MessageCircle, MoreHorizontal,
  Navigation, PackageCheck, Play, Plus, Presentation, Radar,
  Route, Search, Sparkles, Star, Target, UserRound, UsersRound, X,
} from "lucide-react";
import type { DiagnosticReport } from "@/lib/types";
import { DiagnosticReportView } from "./diagnostic-workspace";

type MainView = "today" | "prospects" | "diagnostic" | "plates" | "more";
type View = MainView | "prospect";
type Priority = "Alta" | "Média" | "Baixa";

type Prospect = {
  id: string;
  name: string;
  category: string;
  location: string;
  distance: string;
  rating: number;
  reviews: number;
  priority: Priority;
  status: string;
  profile: string;
  opportunity: string;
  approach: string;
  returnAt?: string;
};

const prospects: Prospect[] = [
  {
    id: "studio-aurora",
    name: "Studio Aurora",
    category: "Salão de beleza",
    location: "Centro, Teresópolis",
    distance: "0,8 km",
    rating: 4.6,
    reviews: 128,
    priority: "Alta",
    status: "Planejado",
    profile: "Presença local em desenvolvimento",
    opportunity: "A reputação é competitiva, mas a empresa aparece fora do grupo de maior destaque na busca analisada.",
    approach: "Quero mostrar onde o Studio já está forte e três oportunidades objetivas para transformar essa reputação em mais presença local.",
  },
  {
    id: "bella-pizzaria",
    name: "Bella Pizzaria",
    category: "Pizzaria",
    location: "Várzea, Teresópolis",
    distance: "1,4 km",
    rating: 4.4,
    reviews: 347,
    priority: "Alta",
    status: "Retorno",
    profile: "Alto potencial de relacionamento",
    opportunity: "O volume de clientes e avaliações cria espaço para medir relacionamento, retorno e conversão além do Google.",
    approach: "Vocês já atraem muita opinião pública. A proposta é transformar cada ponto de contato em reputação, relacionamento e dados.",
    returnAt: "Hoje, 15:30",
  },
  {
    id: "oficina-torque",
    name: "Oficina Torque",
    category: "Oficina mecânica",
    location: "Alto, Teresópolis",
    distance: "2,1 km",
    rating: 4.8,
    reviews: 42,
    priority: "Média",
    status: "Novo",
    profile: "Boa reputação, baixo volume",
    opportunity: "A nota transmite confiança, mas ainda há pouca prova social diante de concorrentes mais conhecidos.",
    approach: "O atendimento já é bem avaliado. Quero mostrar como tornar essa satisfação mais visível para quem ainda não conhece a oficina.",
  },
];

const navItems: Array<{ id: MainView; label: string; icon: typeof Home }> = [
  { id: "today", label: "Hoje", icon: Home },
  { id: "prospects", label: "Prospects", icon: UsersRound },
  { id: "diagnostic", label: "Diagnóstico", icon: Radar },
  { id: "plates", label: "Placas", icon: PackageCheck },
  { id: "more", label: "Mais", icon: MoreHorizontal },
];

const priorityStyle: Record<Priority, string> = {
  Alta: "border-[#ffd9ce] bg-[#fff2ed] text-[#c65331]",
  Média: "border-[#f8e2ae] bg-[#fff9e9] text-[#9b6a05]",
  Baixa: "border-[#dce3ee] bg-[#f7f9fc] text-[#63708a]",
};

export default function CommercialWorkspace() {
  const [view, setView] = useState<View>("today");
  const [selectedId, setSelectedId] = useState(prospects[0].id);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [presentation, setPresentation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [visited, setVisited] = useState<string[]>([]);
  const [filter, setFilter] = useState<"Todos" | "Alta" | "Retorno">("Todos");
  const [form, setForm] = useState({ businessName: "", location: "Teresópolis, Brasil", category: "" });

  const selected = prospects.find((item) => item.id === selectedId) ?? prospects[0];
  const filteredProspects = useMemo(() => prospects.filter((item) => (
    filter === "Todos" || item.priority === filter || item.status === filter
  )), [filter]);

  function navigate(next: MainView) {
    setView(next);
    setPresentation(false);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProspect(prospect: Prospect) {
    setSelectedId(prospect.id);
    setForm({ businessName: prospect.name, location: prospect.location, category: prospect.category });
    setView("prospect");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function requestReport(mode: "live" | "demo") {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          location: form.location,
          category: form.category.trim() || undefined,
          maxCompetitors: 10,
          maxReviews: 40,
          mode,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível gerar o diagnóstico.");
      setReport(data);
      setView("diagnostic");
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function submitDiagnostic(event: FormEvent) {
    event.preventDefault();
    void requestReport("live");
  }

  if (presentation && report) {
    return (
      <main className="min-h-[100dvh] bg-[#f3f6fb] px-3 pb-10 pt-16 text-[#172039] sm:px-6">
        <button className="fixed left-1/2 top-3 z-50 flex h-11 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#172039] px-4 text-sm font-semibold text-white shadow-xl" onClick={() => setPresentation(false)}>
          <X size={16} /> Sair da apresentação
        </button>
        <div className="mx-auto max-w-[920px]"><DiagnosticReportView report={report} /></div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f3f6fb] pb-24 text-[#172039]">
      <CommercialHeader />
      <div className="mx-auto w-full max-w-[760px] px-4 py-5 sm:px-6 sm:py-7">
        {view === "today" && <TodayView routeStarted={routeStarted} onStart={() => { setRouteStarted(true); setView("prospects"); }} onOpen={openProspect} onAll={() => setView("prospects")} />}
        {view === "prospects" && <ProspectsView filter={filter} onFilter={setFilter} items={filteredProspects} onOpen={openProspect} onNew={() => navigate("diagnostic")} />}
        {view === "prospect" && <ProspectView prospect={selected} visited={visited.includes(selected.id)} loading={loading} onBack={() => setView("prospects")} onVisit={() => setVisited((items) => items.includes(selected.id) ? items : [...items, selected.id])} onReport={() => void requestReport(selected.id === "studio-aurora" ? "demo" : "live")} onDiagnostic={() => navigate("diagnostic")} error={error} />}
        {view === "diagnostic" && <DiagnosticView form={form} setForm={setForm} onSubmit={submitDiagnostic} onDemo={() => void requestReport("demo")} loading={loading} error={error} report={report} onPresent={() => setPresentation(true)} />}
        {view === "plates" && <PlatesView />}
        {view === "more" && <MoreView />}
      </div>
      <BottomNavigation active={view === "prospect" ? "prospects" : view} onNavigate={navigate} />
    </main>
  );
}

function CommercialHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e7f0] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[760px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#5667df] text-white shadow-[0_8px_20px_rgba(86,103,223,.25)]"><Sparkles size={17} fill="currentColor" /></div>
          <div><p className="text-[15px] font-bold tracking-[-0.02em]">Área comercial</p><p className="text-xs text-[#7b86a0]">Teresópolis · modo campo</p></div>
        </div>
        <button aria-label="Perfil comercial" className="flex size-10 items-center justify-center rounded-full border border-[#dfe5ef] bg-[#f7f9fc] text-[#536078]"><UserRound size={18} /></button>
      </div>
    </header>
  );
}

function DemoBadge() {
  return <span className="inline-flex items-center rounded-full border border-[#dce3f7] bg-[#f1f4ff] px-2.5 py-1 text-xs font-semibold text-[#5667c9]">Dados de demonstração</span>;
}

function TodayView({ routeStarted, onStart, onOpen, onAll }: { routeStarted: boolean; onStart: () => void; onOpen: (item: Prospect) => void; onAll: () => void }) {
  const date = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[26px] bg-[#172039] p-5 text-white shadow-[0_18px_50px_rgba(23,32,57,.18)] sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="text-sm capitalize text-[#aeb8d0]">{date}</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Seu dia de vendas</h1></div><DemoBadge /></div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[{ value: "8", label: "prioridades" }, { value: "3", label: "retornos" }, { value: "0/6", label: "visitas" }].map((item) => <div key={item.label} className="rounded-2xl bg-white/8 px-3 py-3.5"><p className="text-xl font-semibold">{item.value}</p><p className="mt-1 text-xs text-[#aeb8d0]">{item.label}</p></div>)}
        </div>
        <button onClick={onStart} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff7657] px-4 text-sm font-bold text-white shadow-[0_10px_25px_rgba(255,118,87,.23)]">
          <Navigation size={18} />{routeStarted ? "Continuar prospecção" : "Começar prospecção"}<ArrowRight size={17} />
        </button>
      </section>

      <section className="rounded-[22px] border border-[#e2e7f0] bg-white p-5">
        <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">Ritmo de hoje</p><p className="mt-1 text-lg font-semibold">0 de 6 visitas concluídas</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-[#eef1ff] text-[#5667df]"><Route size={19} /></span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0f5]"><div className="h-full w-[4%] rounded-full bg-[#5667df]" /></div>
        <div className="mt-3 flex items-center justify-between text-xs text-[#7b86a0]"><span>Meta diária</span><span>Próxima: Centro</span></div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">Próxima oportunidade</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Preparada para abordar</h2></div><button onClick={onAll} className="text-sm font-semibold text-[#5667c9]">Ver todas</button></div>
        <ProspectCard prospect={prospects[0]} onOpen={() => onOpen(prospects[0])} featured />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button onClick={() => onOpen(prospects[1])} className="rounded-[20px] border border-[#e2e7f0] bg-white p-4 text-left"><CalendarClock size={20} className="text-[#e06d45]" /><p className="mt-4 text-2xl font-semibold">3</p><p className="mt-1 text-sm text-[#69758d]">Retornos pendentes</p></button>
        <div className="rounded-[20px] border border-[#e2e7f0] bg-white p-4"><CircleDollarSign size={20} className="text-[#32a275]" /><p className="mt-4 text-2xl font-semibold">R$ 0</p><p className="mt-1 text-sm text-[#69758d]">Fechado hoje</p></div>
      </section>
    </div>
  );
}

function ProspectCard({ prospect, onOpen, featured = false }: { prospect: Prospect; onOpen: () => void; featured?: boolean }) {
  return (
    <article className={`rounded-[22px] border bg-white ${featured ? "border-[#cfd7ff] shadow-[0_12px_32px_rgba(54,70,140,.08)]" : "border-[#e2e7f0]"}`}>
      <button onClick={onOpen} className="w-full p-5 text-left">
        <div className="flex items-start justify-between gap-3"><div><p className="text-lg font-semibold tracking-[-0.025em]">{prospect.name}</p><p className="mt-1 text-sm text-[#768198]">{prospect.category} · {prospect.distance}</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityStyle[prospect.priority]}`}>{prospect.priority}</span></div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm"><span className="flex items-center gap-1.5 font-semibold"><Star size={15} fill="#f4b63f" className="text-[#f4b63f]" />{prospect.rating.toFixed(1)}</span><span className="text-[#758097]">{prospect.reviews} avaliações</span><span className="rounded-lg bg-[#f3f5f9] px-2 py-1 text-xs font-medium text-[#657089]">{prospect.status}</span></div>
        <div className="mt-4 border-t border-[#edf0f5] pt-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8c96aa]">Perfil</p><div className="mt-2 flex items-center justify-between gap-3"><p className="text-sm font-semibold leading-5 text-[#3f4c66]">{prospect.profile}</p><ChevronRight size={18} className="shrink-0 text-[#8c97ad]" /></div></div>
      </button>
    </article>
  );
}

function ProspectsView({ filter, onFilter, items, onOpen, onNew }: { filter: "Todos" | "Alta" | "Retorno"; onFilter: (filter: "Todos" | "Alta" | "Retorno") => void; items: Prospect[]; onOpen: (item: Prospect) => void; onNew: () => void }) {
  return (
    <div>
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">CRM de campo</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Prospects</h1></div><button onClick={onNew} className="flex size-12 items-center justify-center rounded-2xl bg-[#5667df] text-white shadow-lg" aria-label="Adicionar prospect"><Plus size={21} /></button></div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{(["Todos", "Alta", "Retorno"] as const).map((item) => <button key={item} onClick={() => onFilter(item)} className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold ${filter === item ? "border-[#5667df] bg-[#5667df] text-white" : "border-[#dfe4ed] bg-white text-[#657089]"}`}>{item}</button>)}</div>
      <div className="mt-4 space-y-3">{items.map((prospect) => <ProspectCard key={prospect.id} prospect={prospect} onOpen={() => onOpen(prospect)} />)}</div>
    </div>
  );
}

function ProspectView({ prospect, visited, loading, onBack, onVisit, onReport, onDiagnostic, error }: { prospect: Prospect; visited: boolean; loading: boolean; onBack: () => void; onVisit: () => void; onReport: () => void; onDiagnostic: () => void; error: string | null }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-[#5f6c84]"><ArrowLeft size={18} />Voltar aos prospects</button>
      <section className="overflow-hidden rounded-[24px] border border-[#e2e7f0] bg-white">
        <div className="bg-[#172039] p-5 text-white sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-[#aeb8d0]">{prospect.category}</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.04em]">{prospect.name}</h1><p className="mt-2 flex items-center gap-2 text-sm text-[#c7cfdf]"><MapPin size={15} />{prospect.location} · {prospect.distance}</p></div><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityStyle[prospect.priority]}`}>{prospect.priority}</span></div><div className="mt-5 flex items-center gap-4"><span className="flex items-center gap-1.5 text-lg font-semibold"><Star size={17} fill="#f4b63f" className="text-[#f4b63f]" />{prospect.rating.toFixed(1)}</span><span className="text-sm text-[#c7cfdf]">{prospect.reviews} avaliações</span></div></div>
        <div className="p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">Perfil identificado</p><p className="mt-2 text-xl font-semibold leading-7 text-[#3746a7]">{prospect.profile}</p></div>
      </section>
      <section className="rounded-[22px] border border-[#e2e7f0] bg-white p-5"><div className="flex size-10 items-center justify-center rounded-xl bg-[#fff1ec] text-[#d7613e]"><Target size={19} /></div><p className="mt-4 text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">Oportunidade principal</p><p className="mt-2 text-[16px] leading-7 text-[#46536d]">{prospect.opportunity}</p></section>
      <section className="rounded-[22px] border border-[#dce2fb] bg-[#f6f7ff] p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#7b86ba]">Abordagem recomendada</p><p className="mt-3 text-[16px] font-medium leading-7 text-[#36415d]">“{prospect.approach}”</p></section>
      {prospect.returnAt && <div className="flex items-center gap-3 rounded-2xl border border-[#f3dfb7] bg-[#fff9ec] p-4 text-sm font-semibold text-[#8e650d]"><CalendarClock size={19} />Retorno agendado: {prospect.returnAt}</div>}
      {error && <div className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"><CircleAlert className="mt-0.5 shrink-0" size={17} />{error}</div>}
      <div className="grid gap-3 sm:grid-cols-2"><button onClick={onReport} disabled={loading} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5667df] px-4 text-sm font-bold text-white shadow-lg">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Presentation size={18} />}{loading ? "Preparando diagnóstico..." : prospect.id === "studio-aurora" ? "Apresentar diagnóstico" : "Gerar diagnóstico ao vivo"}</button><button onClick={onVisit} className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold ${visited ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#dce2ec] bg-white text-[#4e5c76]"}`}>{visited ? <Check size={18} /> : <Play size={18} />}{visited ? "Visita iniciada" : "Iniciar visita"}</button></div>
      <button onClick={onDiagnostic} className="flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-[#647089]"><FileSearch size={17} />Editar dados da análise</button>
    </div>
  );
}

function DiagnosticView({ form, setForm, onSubmit, onDemo, loading, error, report, onPresent }: { form: { businessName: string; location: string; category: string }; setForm: (value: { businessName: string; location: string; category: string }) => void; onSubmit: (event: FormEvent) => void; onDemo: () => void; loading: boolean; error: string | null; report: DiagnosticReport | null; onPresent: () => void }) {
  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-[#e2e7f0] bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">Nova análise</p><h1 className="mt-1 text-[26px] font-semibold tracking-[-0.04em]">Preparar diagnóstico</h1><p className="mt-2 text-sm leading-6 text-[#748097]">Localize a empresa, compare o mercado e prepare a conversa.</p></div><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#5667df]"><Radar size={21} /></span></div>
        <form onSubmit={onSubmit} className="mt-6 space-y-4"><label className="commercial-label">Empresa<div className="commercial-field"><Building2 size={18} /><input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} placeholder="Nome no Google" autoComplete="organization" required /></div></label><label className="commercial-label">Cidade ou região<div className="commercial-field"><MapPin size={18} /><input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Ex.: Teresópolis, RJ" required /></div></label><label className="commercial-label">Categoria de comparação <span className="font-normal text-[#909aaf]">(opcional)</span><div className="commercial-field"><Search size={18} /><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Automática pelo perfil" /></div></label>{error && <div className="flex gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"><CircleAlert className="mt-0.5 shrink-0" size={17} />{error}</div>}<button disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5667df] px-4 text-sm font-bold text-white shadow-lg" type="submit">{loading ? <LoaderCircle className="animate-spin" size={18} /> : <Sparkles size={18} />}{loading ? "Localizando empresa e mercado..." : "Gerar diagnóstico"}</button><button disabled={loading} className="flex min-h-11 w-full items-center justify-center text-sm font-semibold text-[#657089]" type="button" onClick={onDemo}>Abrir exemplo sem consumir créditos</button></form>
      </section>
      {report && <><div className="sticky top-[76px] z-30 flex items-center justify-between rounded-2xl border border-[#dce2f0] bg-white/95 p-3 shadow-sm backdrop-blur"><div><p className="text-xs text-[#7b86a0]">Relatório preparado</p><p className="text-sm font-semibold">{report.business.title}</p></div><button onClick={onPresent} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#172039] px-4 text-sm font-semibold text-white"><Presentation size={16} />Apresentar</button></div><DiagnosticReportView report={report} /></>}
    </div>
  );
}

function PlatesView() {
  return (
    <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">Operação</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Placas</h1><p className="mt-2 text-sm leading-6 text-[#748097]">Visão inicial do estoque comercial.</p></div><DemoBadge /><div className="grid grid-cols-2 gap-3"><div className="rounded-[20px] border border-[#e2e7f0] bg-white p-4"><p className="text-3xl font-semibold">12</p><p className="mt-1 text-sm text-[#6f7b92]">Disponíveis</p></div><div className="rounded-[20px] border border-[#e2e7f0] bg-white p-4"><p className="text-3xl font-semibold">4</p><p className="mt-1 text-sm text-[#6f7b92]">Ativas</p></div></div><section className="rounded-[22px] border border-[#e2e7f0] bg-white p-5"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#5667df]"><PackageCheck size={21} /></span><div><p className="font-semibold">Ativação na próxima etapa</p><p className="mt-2 text-sm leading-6 text-[#748097]">A placa manterá uma URL permanente. O painel apenas vinculará o ID à empresa e ao destino, sem regravar o NFC durante a venda.</p></div></div></section></div>
  );
}

function MoreView() {
  const items = [{ icon: BookOpen, title: "Manual comercial", detail: "Produto, abordagem e roteiro de visita" }, { icon: MessageCircle, title: "Quebra de objeções", detail: "Respostas rápidas para a conversa" }, { icon: ClipboardCheck, title: "Fechamento e ativação", detail: "Checklist dos próximos módulos" }];
  return <div><p className="text-xs font-bold uppercase tracking-[0.13em] text-[#8c96aa]">Apoio</p><h1 className="mt-1 text-[28px] font-semibold tracking-[-0.045em]">Mais ferramentas</h1><div className="mt-5 space-y-3">{items.map(({ icon: Icon, title, detail }) => <button key={title} className="flex min-h-[82px] w-full items-center gap-4 rounded-[20px] border border-[#e2e7f0] bg-white p-4 text-left"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#5667df]"><Icon size={20} /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm leading-5 text-[#758097]">{detail}</span></span><ChevronRight size={18} className="text-[#9aa3b5]" /></button>)}</div><div className="mt-5 rounded-[20px] border border-dashed border-[#ccd4e1] p-5 text-center"><p className="text-sm font-semibold">Primeira versão comercial</p><p className="mt-2 text-sm leading-6 text-[#7a859b]">CRM persistente, parceiros, rotas automáticas e pagamentos serão conectados nas próximas etapas.</p></div></div>;
}

function BottomNavigation({ active, onNavigate }: { active: MainView; onNavigate: (view: MainView) => void }) {
  return (
    <nav aria-label="Navegação comercial" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfe4ed] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid h-[72px] max-w-[760px] grid-cols-5 px-2">{navItems.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} aria-current={active === id ? "page" : undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold ${active === id ? "text-[#5667df]" : "text-[#8791a5]"}`}><Icon size={20} strokeWidth={active === id ? 2.3 : 1.8} /><span className="truncate">{label}</span></button>)}</div>
    </nav>
  );
}
