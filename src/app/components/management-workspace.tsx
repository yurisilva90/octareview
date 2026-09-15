"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight, ArrowUpRight, Bell,
  Blocks, Building2, CalendarClock, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleDollarSign, CircleHelp, CircleUserRound, Clock3,
  CreditCard, FileBarChart, Filter, Gauge, Handshake, Headphones,
  LayoutDashboard, ListFilter, Mail, Menu, PackageCheck, PanelLeftClose,
  Plus, ReceiptText, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Tags, Target, UserCog, UsersRound, WalletCards, X, Zap,
} from "lucide-react";

type View = "overview" | "leads" | "distribution" | "customers" | "billing" | "catalog" | "plates" | "team" | "settings";
type LeadStatus = "Novo" | "Em contato" | "Diagnóstico" | "Proposta" | "Negociação";
type CustomerStatus = "Implantação" | "Ativo" | "Em risco" | "Inadimplente" | "Cancelado";
type BillingStatus = "Pago" | "Pendente" | "Vencido" | "Agendado";

type Lead = {
  id: string; company: string; category: string; city: string; status: LeadStatus;
  potential: "Alto" | "Médio" | "Baixo"; owner: string; source: string; due: string; score: number;
};

type Customer = {
  id: string; company: string; contact: string; plan: string; status: CustomerStatus;
  owner: string; since: string; mrr: number; units: number; tags: string[]; health: number;
};

const leads: Lead[] = [
  { id: "L-2048", company: "Studio Aurora", category: "Beleza", city: "Teresópolis", status: "Diagnóstico", potential: "Alto", owner: "Yuri Silva", source: "Prospecção externa", due: "Hoje, 14:30", score: 92 },
  { id: "L-2047", company: "Bella Pizzaria", category: "Alimentação", city: "Teresópolis", status: "Proposta", potential: "Alto", owner: "Mariana Costa", source: "Indicação", due: "Hoje, 15:30", score: 88 },
  { id: "L-2046", company: "Odonto Prime", category: "Saúde", city: "Petrópolis", status: "Novo", potential: "Médio", owner: "Não atribuído", source: "Diagnóstico online", due: "Distribuir agora", score: 76 },
  { id: "L-2045", company: "Oficina Torque", category: "Automotivo", city: "Teresópolis", status: "Em contato", potential: "Médio", owner: "Yuri Silva", source: "Rota comercial", due: "Amanhã, 10:00", score: 68 },
  { id: "L-2044", company: "Hotel da Serra", category: "Hotelaria", city: "Nova Friburgo", status: "Negociação", potential: "Alto", owner: "Mariana Costa", source: "Evento", due: "18 set., 11:00", score: 95 },
];

const customers: Customer[] = [
  { id: "C-0184", company: "Clínica Serra", contact: "Carla Menezes", plan: "Reputação Pro", status: "Ativo", owner: "Yuri Silva", since: "01 set. 2026", mrr: 697, units: 1, tags: ["Saúde", "Onboarding concluído"], health: 91 },
  { id: "C-0183", company: "Grupo Sabor & Arte", contact: "Rafael Nunes", plan: "Multiunidade", status: "Ativo", owner: "Mariana Costa", since: "18 ago. 2026", mrr: 1890, units: 4, tags: ["Alimentação", "Expansão", "VIP"], health: 84 },
  { id: "C-0182", company: "Pousada Horizonte", contact: "Luciana Alves", plan: "Reputação Essencial", status: "Em risco", owner: "Yuri Silva", since: "02 jul. 2026", mrr: 397, units: 1, tags: ["Hotelaria", "Baixo uso"], health: 42 },
  { id: "C-0181", company: "Academia Evo", contact: "João Pedro", plan: "Reputação Pro + SEO", status: "Inadimplente", owner: "Mariana Costa", since: "14 jun. 2026", mrr: 1094, units: 2, tags: ["Fitness", "Cobrança"], health: 31 },
  { id: "C-0180", company: "Casa Verde Móveis", contact: "André Paiva", plan: "Reputação Essencial", status: "Implantação", owner: "Yuri Silva", since: "12 set. 2026", mrr: 397, units: 1, tags: ["Varejo", "Implantação"], health: 67 },
];

const invoices = [
  { id: "FAT-3981", customer: "Clínica Serra", type: "Mensalidade", due: "15 set. 2026", value: 697, status: "Pago" as BillingStatus },
  { id: "FAT-3980", customer: "Academia Evo", type: "Mensalidade", due: "12 set. 2026", value: 1094, status: "Vencido" as BillingStatus },
  { id: "FAT-3979", customer: "Grupo Sabor & Arte", type: "Mensalidade", due: "18 set. 2026", value: 1890, status: "Agendado" as BillingStatus },
  { id: "FAT-3978", customer: "Casa Verde Móveis", type: "Implantação", due: "20 set. 2026", value: 890, status: "Pendente" as BillingStatus },
];

const products = [
  { name: "Reputação Essencial", kind: "Plano base", billing: "Recorrente", price: "R$ 397/mês", customers: 28, active: true },
  { name: "Reputação Pro", kind: "Plano base", billing: "Recorrente", price: "R$ 697/mês", customers: 16, active: true },
  { name: "SEO Local", kind: "Adicional", billing: "Recorrente", price: "R$ 397/mês", customers: 11, active: true },
  { name: "Gestão de anúncios", kind: "Adicional", billing: "Recorrente", price: "Sob proposta", customers: 6, active: true },
  { name: "Fotos + tour 360º", kind: "Projeto", billing: "Pagamento único", price: "Sob proposta", customers: 4, active: true },
  { name: "Site de conversão", kind: "Projeto", billing: "Pagamento único", price: "Sob proposta", customers: 3, active: false },
];

const nav: Array<{ id: View; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "leads", label: "Leads", icon: Target },
  { id: "distribution", label: "Distribuição", icon: SlidersHorizontal },
  { id: "customers", label: "Clientes", icon: Building2 },
  { id: "billing", label: "Cobrança", icon: WalletCards },
  { id: "catalog", label: "Produtos e planos", icon: Blocks },
  { id: "plates", label: "Placas", icon: PackageCheck },
  { id: "team", label: "Equipe e acessos", icon: UsersRound },
  { id: "settings", label: "Configurações", icon: Settings2 },
];

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const tone = {
  Alto: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Médio: "bg-amber-50 text-amber-700 border-amber-200",
  Baixo: "bg-slate-50 text-slate-600 border-slate-200",
  Ativo: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Implantação: "bg-blue-50 text-blue-700 border-blue-200",
  "Em risco": "bg-amber-50 text-amber-700 border-amber-200",
  Inadimplente: "bg-rose-50 text-rose-700 border-rose-200",
  Cancelado: "bg-slate-50 text-slate-600 border-slate-200",
  Pago: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Pendente: "bg-amber-50 text-amber-700 border-amber-200",
  Vencido: "bg-rose-50 text-rose-700 border-rose-200",
  Agendado: "bg-blue-50 text-blue-700 border-blue-200",
} as Record<string, string>;

function Pill({ children, variant }: { children: React.ReactNode; variant?: string }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone[variant ?? String(children)] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>{children}</span>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,.04)] ${className}`}>{children}</section>;
}

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
    <div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-teal-600">{eyebrow}</p><h1 className="mt-1 text-2xl font-bold tracking-[-.04em] text-slate-950 lg:text-[30px]">{title}</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>
    {action}
  </div>;
}

function Metric({ label, value, change, icon: Icon, accent = "teal" }: { label: string; value: string; change: string; icon: ComponentType<{ className?: string }>; accent?: "teal" | "blue" | "amber" | "violet" }) {
  const styles = { teal: "bg-teal-50 text-teal-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-600", violet: "bg-violet-50 text-violet-600" };
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-[-.04em] text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-500"><span className="font-semibold text-emerald-600">{change}</span> no período</p></div><span className={`rounded-xl p-2.5 ${styles[accent]}`}><Icon className="size-5" /></span></div></Card>;
}

function Button({ children, secondary = false, onClick }: { children: React.ReactNode; secondary?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${secondary ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50" : "bg-[#075f6a] text-white shadow-sm hover:bg-[#064f59]"}`}>{children}</button>;
}

function Overview({ go }: { go: (view: View) => void }) {
  const pipeline = [
    { label: "Novos", value: 34, color: "bg-sky-400" }, { label: "Contato", value: 21, color: "bg-blue-500" },
    { label: "Diagnóstico", value: 15, color: "bg-indigo-500" }, { label: "Proposta", value: 9, color: "bg-violet-500" },
    { label: "Negociação", value: 6, color: "bg-teal-500" }, { label: "Fechados", value: 4, color: "bg-emerald-500" },
  ];
  return <>
    <PageTitle eyebrow="Central de operação" title="Bom dia, Yuri" description="Uma visão consolidada do comercial, clientes, receita e tarefas que precisam de atenção hoje." action={<Button onClick={() => go("leads")}><Plus className="size-4" /> Novo lead</Button>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="MRR ativo" value="R$ 31.486" change="+12,4%" icon={CircleDollarSign} accent="teal" />
      <Metric label="Leads em aberto" value="85" change="+18 novos" icon={Target} accent="blue" />
      <Metric label="Clientes ativos" value="47" change="+4 este mês" icon={Building2} accent="violet" />
      <Metric label="Recebimento previsto" value="R$ 36.920" change="92% confirmado" icon={ReceiptText} accent="amber" />
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <Card className="p-5 lg:p-6">
        <div className="flex items-start justify-between"><div><h2 className="font-bold text-slate-900">Funil comercial</h2><p className="mt-1 text-xs text-slate-500">Volume por etapa nos últimos 30 dias</p></div><button onClick={() => go("leads")} className="text-xs font-semibold text-teal-700">Ver pipeline</button></div>
        <div className="mt-7 grid grid-cols-3 gap-3 md:grid-cols-6">
          {pipeline.map((item, index) => <div key={item.label} className="relative"><div className="flex h-36 items-end rounded-xl bg-slate-50 p-2"><div className={`w-full rounded-lg ${item.color}`} style={{ height: `${35 + item.value * 2}%`, maxHeight: "100%" }} /></div><p className="mt-2 text-[11px] font-semibold text-slate-500">{item.label}</p><p className="text-lg font-bold text-slate-900">{item.value}</p>{index < pipeline.length - 1 && <ArrowRight className="absolute -right-2 top-16 z-10 hidden size-3 text-slate-300 md:block" />}</div>)}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500"><span><strong className="text-slate-900">R$ 84 mil</strong> em oportunidades</span><span><strong className="text-slate-900">18,6%</strong> de conversão</span><span><strong className="text-slate-900">12 dias</strong> de ciclo médio</span></div>
      </Card>
      <Card className="overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Atenção hoje</h2><p className="mt-1 text-xs text-slate-500">Prioridades calculadas pela operação</p></div>
        <div className="divide-y divide-slate-100">
          {[{ icon: Clock3, color: "text-amber-600 bg-amber-50", n: "8", title: "Follow-ups vencem hoje", sub: "3 de alto potencial", target: "leads" as View }, { icon: UserCog, color: "text-blue-600 bg-blue-50", n: "3", title: "Leads sem responsável", sub: "Regra de distribuição pendente", target: "distribution" as View }, { icon: CreditCard, color: "text-rose-600 bg-rose-50", n: "2", title: "Cobranças vencidas", sub: "R$ 1.491 em aberto", target: "billing" as View }, { icon: Gauge, color: "text-violet-600 bg-violet-50", n: "2", title: "Clientes em risco", sub: "Queda de uso ou resultado", target: "customers" as View }].map((item) => <button key={item.title} onClick={() => go(item.target)} className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50"><span className={`rounded-xl p-2 ${item.color}`}><item.icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800">{item.title}</span><span className="block text-xs text-slate-500">{item.sub}</span></span><span className="text-lg font-bold text-slate-900">{item.n}</span><ChevronRight className="size-4 text-slate-300" /></button>)}
        </div>
      </Card>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      <Card className="p-5 lg:col-span-2"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Receita recorrente</h2><p className="mt-1 text-xs text-slate-500">Evolução simulada do MRR</p></div><Pill>Últimos 6 meses</Pill></div><div className="mt-8 flex h-40 items-end gap-3 border-b border-slate-200">{[42, 51, 48, 63, 74, 88].map((height, i) => <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] font-semibold text-slate-400">{[18, 21, 20, 24, 27, 31][i]}k</span><div className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-[#075f6a] to-[#19a5aa]" style={{ height: `${height}%` }} /></div>)}</div><div className="mt-2 flex justify-around text-[10px] text-slate-400"><span>Abr</span><span>Mai</span><span>Jun</span><span>Jul</span><span>Ago</span><span>Set</span></div></Card>
      <Card className="p-5"><h2 className="font-bold text-slate-900">Saúde da base</h2><p className="mt-1 text-xs text-slate-500">47 clientes monitorados</p><div className="mx-auto mt-6 flex size-36 items-center justify-center rounded-full" style={{ background: "conic-gradient(#0f9f86 0 76%, #f59e0b 76% 91%, #ef4444 91% 100%)" }}><div className="flex size-24 flex-col items-center justify-center rounded-full bg-white"><strong className="text-3xl text-slate-950">82</strong><span className="text-[10px] text-slate-500">saúde média</span></div></div><div className="mt-5 grid grid-cols-3 text-center text-xs"><div><strong className="block text-emerald-600">36</strong><span className="text-slate-500">Saudáveis</span></div><div><strong className="block text-amber-600">7</strong><span className="text-slate-500">Atenção</span></div><div><strong className="block text-rose-600">4</strong><span className="text-slate-500">Em risco</span></div></div></Card>
    </div>
  </>;
}

function LeadsView({ select }: { select: (lead: Lead) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const shown = useMemo(() => leads.filter((lead) => (status === "Todos" || lead.status === status) && [lead.company, lead.category, lead.city, lead.owner].join(" ").toLowerCase().includes(query.toLowerCase())), [query, status]);
  return <><PageTitle eyebrow="Operação comercial" title="Gestão de leads" description="Acompanhe o funil completo, a origem, o responsável e o próximo passo de cada oportunidade." action={<div className="flex gap-2"><Button secondary><FileBarChart className="size-4" /> Exportar</Button><Button><Plus className="size-4" /> Novo lead</Button></div>} />
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{[{ n: 85, l: "Total aberto" }, { n: 18, l: "Novos" }, { n: 15, l: "Diagnóstico" }, { n: 9, l: "Propostas" }, { n: 4, l: "Fechados/mês" }].map((item) => <Card key={item.l} className="p-4"><strong className="text-xl text-slate-950">{item.n}</strong><p className="mt-1 text-[11px] text-slate-500">{item.l}</p></Card>)}</div>
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row"><label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search className="size-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar empresa, cidade ou responsável" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"><option>Todos</option>{["Novo", "Em contato", "Diagnóstico", "Proposta", "Negociação"].map((item) => <option key={item}>{item}</option>)}</select><Button secondary><Filter className="size-4" /> Mais filtros</Button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Lead</th><th className="px-4 py-3">Etapa</th><th className="px-4 py-3">Potencial</th><th className="px-4 py-3">Responsável</th><th className="px-4 py-3">Próxima ação</th><th className="px-4 py-3">Score</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{shown.map((lead) => <tr key={lead.id} onClick={() => select(lead)} className="cursor-pointer hover:bg-slate-50"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{lead.company}</div><div className="mt-1 text-xs text-slate-500">{lead.category} · {lead.city} · {lead.source}</div></td><td className="px-4 py-4"><Pill>{lead.status}</Pill></td><td className="px-4 py-4"><Pill variant={lead.potential}>{lead.potential}</Pill></td><td className="px-4 py-4 text-sm text-slate-700">{lead.owner}</td><td className="px-4 py-4 text-sm text-slate-700">{lead.due}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-16 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{ width: `${lead.score}%` }} /></div><span className="text-xs font-semibold">{lead.score}</span></div></td><td className="px-4 py-4"><ChevronRight className="size-4 text-slate-300" /></td></tr>)}</tbody></table></div>
    </Card>
  </>;
}

function DistributionView() {
  const [active, setActive] = useState(true);
  const [method, setMethod] = useState("Round-robin ponderado");
  const rules = [
    { priority: 1, name: "Saúde e odontologia", condition: "Categoria contém Saúde ou Odontologia", destination: "Yuri Silva", leads: 18, active: true },
    { priority: 2, name: "Região serrana", condition: "Cidade é Petrópolis ou Nova Friburgo", destination: "Mariana Costa", leads: 14, active: true },
    { priority: 3, name: "Alto potencial", condition: "Potencial é Alto e score ≥ 85", destination: "Time de fechamento", leads: 11, active: true },
    { priority: 4, name: "Fila geral", condition: "Qualquer lead sem regra anterior", destination: "Round-robin do time", leads: 42, active: true },
  ];
  return <><PageTitle eyebrow="Automação comercial" title="Distribuição de leads" description="Defina quem recebe cada lead por região, categoria, potencial, capacidade ou fila. As regras são avaliadas pela ordem de prioridade." action={<Button><Plus className="size-4" /> Nova regra</Button>} />
    <Card className="mb-5 p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div className="flex items-center gap-3"><span className={`rounded-xl p-3 ${active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}><Zap className="size-5" /></span><div><h2 className="font-bold text-slate-900">Distribuição automática</h2><p className="text-xs text-slate-500">{active ? "Ativa · novos leads entram nas regras abaixo" : "Pausada · novos leads ficam sem responsável"}</p></div></div><button onClick={() => setActive(!active)} className={`relative h-7 w-12 rounded-full transition ${active ? "bg-teal-600" : "bg-slate-300"}`} aria-label="Alternar distribuição"><span className={`absolute top-1 size-5 rounded-full bg-white shadow transition ${active ? "left-6" : "left-1"}`} /></button></div></Card>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]"><Card className="overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Regras ativas</h2><p className="mt-1 text-xs text-slate-500">Arraste no futuro para alterar a prioridade</p></div><div className="divide-y divide-slate-100">{rules.map((rule) => <div key={rule.priority} className="flex gap-3 p-4 lg:items-center"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{rule.priority}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-slate-900">{rule.name}</h3><Pill>Ativa</Pill></div><p className="mt-1 text-xs text-slate-500">Se: {rule.condition}</p><p className="mt-1 text-xs font-medium text-teal-700">Então: atribuir para {rule.destination}</p></div><div className="hidden text-right md:block"><strong className="text-sm text-slate-900">{rule.leads}</strong><p className="text-[10px] text-slate-500">leads/mês</p></div><button className="rounded-lg p-2 hover:bg-slate-100"><Settings2 className="size-4 text-slate-400" /></button></div>)}</div></Card>
      <div className="space-y-5"><Card className="p-5"><h2 className="font-bold text-slate-900">Regra de desempate</h2><p className="mt-1 text-xs leading-5 text-slate-500">Quando mais de uma pessoa atende à mesma condição.</p><select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-4 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"><option>Round-robin ponderado</option><option>Menor carteira ativa</option><option>Maior conversão</option><option>Distribuição manual</option></select><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-800">{method}</strong><br />Considera a capacidade definida para cada vendedor e alterna a entrega.</div></Card><Card className="p-5"><h2 className="font-bold text-slate-900">Capacidade do time</h2><div className="mt-4 space-y-4">{[{ name: "Yuri Silva", load: 72, n: "18/25" }, { name: "Mariana Costa", load: 84, n: "21/25" }, { name: "Time de fechamento", load: 50, n: "8/16" }].map((person) => <div key={person.name}><div className="flex justify-between text-xs"><span className="font-semibold text-slate-700">{person.name}</span><span className="text-slate-500">{person.n}</span></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full ${person.load > 80 ? "bg-amber-500" : "bg-teal-500"}`} style={{ width: `${person.load}%` }} /></div></div>)}</div></Card></div>
    </div>
  </>;
}

function CustomersView({ select }: { select: (customer: Customer) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const shown = customers.filter((customer) => (status === "Todos" || customer.status === status) && [customer.company, customer.contact, customer.plan, customer.owner, ...customer.tags].join(" ").toLowerCase().includes(query.toLowerCase()));
  return <><PageTitle eyebrow="Base de clientes" title="Clientes" description="Gerencie carteira, planos, tags, implantação, saúde, responsável e ciclo de vida após a venda." action={<Button><Plus className="size-4" /> Novo cliente</Button>} />
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row"><label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3"><Search className="size-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar cliente, plano ou tag" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>Todos</option>{["Implantação", "Ativo", "Em risco", "Inadimplente", "Cancelado"].map((item) => <option key={item}>{item}</option>)}</select><Button secondary><ListFilter className="size-4" /> Segmentos</Button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Cliente</th><th className="px-4 py-3">Plano / tags</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Responsável</th><th className="px-4 py-3">MRR</th><th className="px-4 py-3">Saúde</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{shown.map((customer) => <tr key={customer.id} onClick={() => select(customer)} className="cursor-pointer hover:bg-slate-50"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{customer.company}</div><div className="mt-1 text-xs text-slate-500">{customer.contact} · {customer.units} {customer.units === 1 ? "unidade" : "unidades"}</div></td><td className="px-4 py-4"><div className="text-sm font-medium text-slate-700">{customer.plan}</div><div className="mt-1 flex gap-1">{customer.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-600">{tag}</span>)}</div></td><td className="px-4 py-4"><Pill variant={customer.status}>{customer.status}</Pill></td><td className="px-4 py-4 text-sm text-slate-700">{customer.owner}</td><td className="px-4 py-4 text-sm font-semibold text-slate-900">{money.format(customer.mrr)}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><span className={`size-2 rounded-full ${customer.health >= 75 ? "bg-emerald-500" : customer.health >= 50 ? "bg-amber-500" : "bg-rose-500"}`} /><span className="text-sm font-semibold">{customer.health}</span></div></td><td className="px-4 py-4"><ChevronRight className="size-4 text-slate-300" /></td></tr>)}</tbody></table></div>
    </Card>
  </>;
}

function BillingView() {
  const [period, setPeriod] = useState("Setembro de 2026");
  return <><PageTitle eyebrow="Financeiro" title="Cobrança e recorrência" description="Controle mensalidades, recebimentos, inadimplência e recorrências. A conexão com a API do Asaas será feita em uma próxima etapa." action={<Button><Plus className="size-4" /> Nova cobrança</Button>} />
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 md:flex-row md:items-center"><span className="rounded-xl bg-white p-2 text-blue-600"><Blocks className="size-5" /></span><div className="flex-1"><strong>Asaas ainda não conectado</strong><p className="mt-0.5 text-xs text-blue-700">O painel e os campos de integração estão preparados. Nenhuma cobrança real será emitida nesta versão.</p></div><Button secondary>Configurar depois</Button></div>
    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="MRR" value="R$ 31.486" change="+12,4%" icon={RefreshCw} /><Metric label="Recebido no mês" value="R$ 28.920" change="91,8%" icon={CheckCircle2} accent="blue" /><Metric label="A receber" value="R$ 6.509" change="8 cobranças" icon={CalendarClock} accent="violet" /><Metric label="Inadimplência" value="R$ 1.491" change="4,3% da base" icon={CircleHelp} accent="amber" /></div>
    <Card className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center"><div className="flex-1"><h2 className="font-bold text-slate-900">Cobranças</h2><p className="mt-1 text-xs text-slate-500">Recorrentes e avulsas em uma única régua</p></div><select value={period} onChange={(e) => setPeriod(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option>Setembro de 2026</option><option>Agosto de 2026</option></select><Button secondary><Filter className="size-4" /> Filtrar</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Cobrança</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{invoices.map((invoice) => <tr key={invoice.id} className="hover:bg-slate-50"><td className="px-5 py-4 text-xs font-semibold text-slate-500">{invoice.id}</td><td className="px-4 py-4 text-sm font-semibold text-slate-900">{invoice.customer}</td><td className="px-4 py-4 text-sm text-slate-600">{invoice.type}</td><td className="px-4 py-4 text-sm text-slate-600">{invoice.due}</td><td className="px-4 py-4 text-sm font-semibold text-slate-900">{money.format(invoice.value)}</td><td className="px-4 py-4"><Pill variant={invoice.status}>{invoice.status}</Pill></td><td className="px-4 py-4"><ChevronRight className="size-4 text-slate-300" /></td></tr>)}</tbody></table></div></Card>
  </>;
}

function CatalogView() {
  return <><PageTitle eyebrow="Oferta comercial" title="Produtos e planos" description="Catálogo único para propostas, contratos, recorrências e liberação de recursos no futuro painel do cliente." action={<Button><Plus className="size-4" /> Novo produto</Button>} />
    <div className="mb-5 grid gap-4 md:grid-cols-3"><Card className="p-5"><span className="text-xs font-semibold text-slate-500">Planos base</span><strong className="mt-2 block text-2xl text-slate-950">2</strong><p className="mt-2 text-xs text-slate-500">Reputação como porta de entrada</p></Card><Card className="p-5"><span className="text-xs font-semibold text-slate-500">Adicionais recorrentes</span><strong className="mt-2 block text-2xl text-slate-950">4</strong><p className="mt-2 text-xs text-slate-500">SEO, anúncios, conteúdo e Analytics</p></Card><Card className="p-5"><span className="text-xs font-semibold text-slate-500">Projetos avulsos</span><strong className="mt-2 block text-2xl text-slate-950">5</strong><p className="mt-2 text-xs text-slate-500">Fotos, tour 360º, site e configurações</p></Card></div>
    <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full min-w-[840px] text-left"><thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Produto</th><th className="px-4 py-3">Categoria</th><th className="px-4 py-3">Cobrança</th><th className="px-4 py-3">Preço</th><th className="px-4 py-3">Clientes</th><th className="px-4 py-3">Status</th><th /></tr></thead><tbody className="divide-y divide-slate-100">{products.map((product) => <tr key={product.name} className="hover:bg-slate-50"><td className="px-5 py-4"><span className="font-semibold text-slate-900">{product.name}</span></td><td className="px-4 py-4"><Pill>{product.kind}</Pill></td><td className="px-4 py-4 text-sm text-slate-600">{product.billing}</td><td className="px-4 py-4 text-sm font-semibold text-slate-900">{product.price}</td><td className="px-4 py-4 text-sm text-slate-600">{product.customers}</td><td className="px-4 py-4"><Pill variant={product.active ? "Ativo" : "Cancelado"}>{product.active ? "Ativo" : "Inativo"}</Pill></td><td className="px-4 py-4"><ChevronRight className="size-4 text-slate-300" /></td></tr>)}</tbody></table></div></Card>
    <Card className="mt-5 p-5"><div className="flex items-start gap-3"><span className="rounded-xl bg-teal-50 p-2.5 text-teal-600"><Sparkles className="size-5" /></span><div><h3 className="font-bold text-slate-900">Acesso do cliente orientado pelo plano</h3><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">Cada produto poderá liberar módulos, limites, relatórios e permissões no futuro portal do cliente. O catálogo já separa recorrência de projetos avulsos para que cobrança e entrega usem a mesma configuração.</p></div></div></Card>
  </>;
}

function PlatesView() {
  const stages = [{ label: "Fabricadas", n: 320 }, { label: "Disponíveis", n: 84 }, { label: "Enviadas", n: 19 }, { label: "Ativadas", n: 186 }, { label: "Em uso", n: 172 }];
  return <><PageTitle eyebrow="Ativos físicos" title="Gestão de placas" description="Controle o ciclo completo das placas NFC/QR, vínculo com empresa, unidade e colaborador, além do histórico de atribuição." action={<Button><Plus className="size-4" /> Cadastrar lote</Button>} />
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{stages.map((stage, index) => <Card key={stage.label} className="relative p-4"><p className="text-xs text-slate-500">{stage.label}</p><strong className="mt-2 block text-2xl text-slate-950">{stage.n}</strong>{index < stages.length - 1 && <ArrowRight className="absolute -right-2.5 top-8 z-10 hidden size-5 rounded-full bg-white p-1 text-slate-400 shadow lg:block" />}</Card>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]"><Card className="overflow-hidden"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">Últimas movimentações</h2></div><div className="divide-y divide-slate-100">{[{ id: "A000184", type: "Principal", company: "Clínica Serra", event: "Ativada e vinculada", time: "Hoje, 10:42" }, { id: "P000892", type: "Colaborador", company: "Grupo Sabor & Arte", event: "Atribuída a Ana Lima", time: "Hoje, 09:18" }, { id: "A000183", type: "Principal", company: "Casa Verde Móveis", event: "Enviada", time: "Ontem, 16:32" }, { id: "P000891", type: "Colaborador", company: "Grupo Sabor & Arte", event: "Desvinculada", time: "Ontem, 14:10" }].map((plate) => <div key={plate.id} className="flex items-center gap-3 p-4"><span className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><PackageCheck className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex gap-2"><strong className="text-sm text-slate-900">{plate.id}</strong><Pill>{plate.type}</Pill></div><p className="mt-1 text-xs text-slate-500">{plate.company} · {plate.event}</p></div><span className="text-[10px] text-slate-400">{plate.time}</span></div>)}</div></Card><Card className="p-5"><h2 className="font-bold text-slate-900">Padrão de ativação</h2><div className="mt-4 space-y-3 text-xs text-slate-600">{["ID público permanente para NFC e QR", "Código secreto para primeira ativação", "Transferência somente com autorização", "Histórico de empresa e colaborador", "Rotas /n/ID e /q/ID para medir a origem"].map((item) => <div key={item} className="flex gap-2"><Check className="mt-0.5 size-3.5 shrink-0 text-teal-600" /><span>{item}</span></div>)}</div><Button secondary><Settings2 className="size-4" /> Configurar destinos</Button></Card></div>
  </>;
}

function TeamView() {
  return <><PageTitle eyebrow="Organização" title="Equipe e acessos" description="Defina papéis, carteira, capacidade comercial e permissões para administrador, comercial, financeiro, atendimento e cliente." action={<Button><Plus className="size-4" /> Convidar pessoa</Button>} />
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]"><Card className="overflow-hidden"><div className="divide-y divide-slate-100">{[{ name: "Yuri Silva", email: "yuri@octareview.com.br", role: "Administrador", leads: 18, customers: 24, status: "Ativo" }, { name: "Mariana Costa", email: "mariana@octareview.com.br", role: "Comercial", leads: 21, customers: 18, status: "Ativo" }, { name: "Felipe Ramos", email: "felipe@octareview.com.br", role: "Financeiro", leads: 0, customers: 47, status: "Ativo" }, { name: "Carla Souza", email: "carla@octareview.com.br", role: "Sucesso do cliente", leads: 0, customers: 15, status: "Convite enviado" }].map((person) => <div key={person.email} className="flex flex-wrap items-center gap-4 p-4"><span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#0a506e] to-[#13a5a2] text-sm font-bold text-white">{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="min-w-[180px] flex-1"><strong className="block text-sm text-slate-900">{person.name}</strong><span className="text-xs text-slate-500">{person.email}</span></div><Pill>{person.role}</Pill><div className="hidden w-20 text-center md:block"><strong className="block text-sm">{person.leads}</strong><span className="text-[10px] text-slate-500">leads</span></div><div className="hidden w-20 text-center md:block"><strong className="block text-sm">{person.customers}</strong><span className="text-[10px] text-slate-500">clientes</span></div><Pill variant={person.status === "Ativo" ? "Ativo" : undefined}>{person.status}</Pill><button className="p-2"><Settings2 className="size-4 text-slate-400" /></button></div>)}</div></Card><Card className="p-5"><h2 className="font-bold text-slate-900">Papéis da plataforma</h2><div className="mt-4 space-y-4">{[{ name: "Administrador", text: "Acesso integral à operação e configurações", icon: ShieldCheck }, { name: "Comercial / Parceiro", text: "Leads, diagnósticos, propostas e carteira", icon: Handshake }, { name: "Financeiro", text: "Cobranças, contratos e recebimentos", icon: CreditCard }, { name: "Sucesso do cliente", text: "Implantação, saúde e renovação", icon: Headphones }, { name: "Cliente", text: "Somente sua empresa, equipe e resultados", icon: CircleUserRound }].map((role) => <div key={role.name} className="flex gap-3"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><role.icon className="size-4" /></span><div><strong className="text-sm text-slate-800">{role.name}</strong><p className="mt-0.5 text-xs leading-5 text-slate-500">{role.text}</p></div></div>)}</div></Card></div>
  </>;
}

function SettingsView() {
  const groups = [
    { icon: Target, title: "Comercial", text: "Etapas do funil, motivos de retorno, potenciais, metas e campos personalizados", items: ["Funil de vendas", "Follow-ups", "Metas e SLA"] },
    { icon: Tags, title: "Tags e segmentação", text: "Tags globais para leads, clientes, cobrança e campanhas", items: ["Categorias", "Tags de cliente", "Segmentos salvos"] },
    { icon: Building2, title: "Painel do cliente", text: "Módulos, identidade, permissões e recursos exibidos por plano", items: ["Módulos padrão", "Marca e domínio", "Convites e acesso"] },
    { icon: Bell, title: "Comunicação", text: "Modelos de WhatsApp e e-mail, notificações e réguas automáticas", items: ["Templates", "Alertas internos", "Régua de cobrança"] },
    { icon: Blocks, title: "Integrações", text: "Conexões externas e chaves armazenadas de forma segura no servidor", items: ["Asaas", "Apify", "Google Business"] },
    { icon: ShieldCheck, title: "Segurança e auditoria", text: "Papéis, sessões, logs, consentimentos e política de dados", items: ["Permissões", "Log de atividades", "LGPD"] },
  ];
  return <><PageTitle eyebrow="Administração" title="Configurações" description="Centralize regras que afetam o comercial, a operação interna e o futuro portal do cliente." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{groups.map((group) => <Card key={group.title} className="p-5"><div className="flex items-start justify-between"><span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><group.icon className="size-5" /></span><button className="rounded-lg p-2 hover:bg-slate-50"><ChevronRight className="size-4 text-slate-400" /></button></div><h2 className="mt-4 font-bold text-slate-900">{group.title}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-slate-500">{group.text}</p><div className="mt-4 border-t border-slate-100 pt-3">{group.items.map((item) => <button key={item} className="flex w-full items-center justify-between py-2 text-left text-xs font-medium text-slate-600 hover:text-teal-700"><span>{item}</span><ChevronRight className="size-3" /></button>)}</div></Card>)}</div>
    <Card className="mt-5 p-5"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div className="flex gap-3"><span className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><ShieldCheck className="size-5" /></span><div><h3 className="font-bold text-slate-900">Proteção antes da publicação</h3><p className="mt-1 text-xs leading-5 text-slate-500">A rota está em modo de demonstração. Autenticação, papéis e bloqueio de acesso serão obrigatórios antes de conectar dados reais.</p></div></div><Button secondary>Revisar segurança</Button></div></Card>
  </>;
}

function DetailDrawer({ lead, customer, close }: { lead?: Lead; customer?: Customer; close: () => void }) {
  if (!lead && !customer) return null;
  const isLead = Boolean(lead);
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-[1px]" onClick={close}><aside className="h-full w-full max-w-[500px] overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 p-5 backdrop-blur"><div><p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">{isLead ? "Detalhes do lead" : "Visão 360º do cliente"}</p><h2 className="mt-1 text-xl font-bold text-slate-950">{lead?.company ?? customer?.company}</h2></div><button onClick={close} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"><X className="size-4" /></button></div><div className="space-y-5 p-5">
      {lead ? <><div className="flex flex-wrap gap-2"><Pill>{lead.status}</Pill><Pill variant={lead.potential}>{lead.potential}</Pill><Pill>Score {lead.score}</Pill></div><Card className="p-4"><p className="text-xs font-bold text-slate-900">Informações comerciais</p><div className="mt-4 grid grid-cols-2 gap-4 text-xs"><div><span className="text-slate-400">Responsável</span><strong className="mt-1 block text-slate-700">{lead.owner}</strong></div><div><span className="text-slate-400">Próxima ação</span><strong className="mt-1 block text-slate-700">{lead.due}</strong></div><div><span className="text-slate-400">Categoria</span><strong className="mt-1 block text-slate-700">{lead.category}</strong></div><div><span className="text-slate-400">Origem</span><strong className="mt-1 block text-slate-700">{lead.source}</strong></div></div></Card><Card className="p-4"><p className="text-xs font-bold text-slate-900">Próximo passo recomendado</p><p className="mt-2 text-sm leading-6 text-slate-600">Apresentar o diagnóstico, confirmar o decisor e agendar o retorno antes de enviar a proposta.</p></Card><div className="grid grid-cols-2 gap-2"><Button secondary><Mail className="size-4" /> E-mail</Button><Button><ArrowRight className="size-4" /> Abrir lead</Button></div></> : null}
      {customer ? <><div className="flex flex-wrap gap-2"><Pill variant={customer.status}>{customer.status}</Pill>{customer.tags.map((tag) => <Pill key={tag}>{tag}</Pill>)}<button className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-500"><Plus className="mr-1 inline size-3" /> Tag</button></div><div className="grid grid-cols-2 gap-3"><Card className="p-4"><span className="text-[10px] text-slate-400">MRR</span><strong className="mt-1 block text-lg">{money.format(customer.mrr)}</strong></Card><Card className="p-4"><span className="text-[10px] text-slate-400">Saúde</span><strong className="mt-1 block text-lg">{customer.health}/100</strong></Card></div><Card className="p-4"><p className="text-xs font-bold text-slate-900">Contrato e serviço</p><div className="mt-4 space-y-3 text-xs"><div className="flex justify-between"><span className="text-slate-400">Plano</span><strong>{customer.plan}</strong></div><div className="flex justify-between"><span className="text-slate-400">Cliente desde</span><strong>{customer.since}</strong></div><div className="flex justify-between"><span className="text-slate-400">Unidades</span><strong>{customer.units}</strong></div><div className="flex justify-between"><span className="text-slate-400">Responsável</span><strong>{customer.owner}</strong></div></div></Card><Card className="p-4"><p className="text-xs font-bold text-slate-900">Atalhos</p><div className="mt-3 grid grid-cols-2 gap-2">{["Cobranças", "Placas", "Implantação", "Relatórios"].map((item) => <button key={item} className="rounded-xl border border-slate-200 p-3 text-left text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-700">{item}<ChevronRight className="float-right size-3" /></button>)}</div></Card></> : null}
    </div></aside></div>;
}

export default function ManagementWorkspace() {
  const [view, setView] = useState<View>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead>();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>();
  const current = nav.find((item) => item.id === view) ?? nav[0];

  function navigate(next: View) { setView(next); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return <div className="min-h-screen bg-[#f5f7fa] text-slate-800">
    {sidebarOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${sidebarCompact ? "lg:w-[84px]" : "lg:w-[248px]"} w-[270px] lg:translate-x-0`}>
      <div className={`flex h-[72px] items-center border-b border-slate-100 px-5 ${sidebarCompact ? "lg:justify-center lg:px-3" : "justify-between"}`}><Image src={sidebarCompact ? "/octareview-icon.png" : "/octareview-wordmark.png"} alt="OctaReview" width={sidebarCompact ? 42 : 154} height={sidebarCompact ? 42 : 52} className={`${sidebarCompact ? "size-10 object-contain" : "h-10 w-[154px] object-contain object-left"}`} /><button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 lg:hidden"><X className="size-5" /></button></div>
      <div className={`mx-3 mt-4 rounded-xl border border-teal-100 bg-teal-50/70 p-3 ${sidebarCompact ? "lg:hidden" : ""}`}><p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Gestão interna</p><p className="mt-1 text-xs text-teal-800">Ambiente de demonstração</p></div>
      <nav className="mt-3 flex-1 space-y-1 overflow-y-auto px-3">{nav.map((item) => { const Icon = item.icon; const selected = item.id === view; return <button key={item.id} onClick={() => navigate(item.id)} title={item.label} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${selected ? "bg-[#075f6a] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"} ${sidebarCompact ? "lg:justify-center lg:px-0" : ""}`}><Icon className="size-[18px] shrink-0" /><span className={sidebarCompact ? "lg:hidden" : ""}>{item.label}</span></button>; })}</nav>
      <div className="border-t border-slate-100 p-3"><Link href="/comercial" className={`flex items-center gap-3 rounded-xl p-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 ${sidebarCompact ? "lg:justify-center" : ""}`}><ArrowUpRight className="size-[18px]" /><span className={sidebarCompact ? "lg:hidden" : ""}>Abrir app comercial</span></Link><div className={`mt-1 flex items-center gap-3 rounded-xl p-3 ${sidebarCompact ? "lg:justify-center" : ""}`}><span className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">YS</span><div className={`min-w-0 flex-1 ${sidebarCompact ? "lg:hidden" : ""}`}><strong className="block truncate text-xs text-slate-800">Yuri Silva</strong><span className="block text-[10px] text-slate-400">Administrador</span></div><ChevronDown className={`size-3 text-slate-400 ${sidebarCompact ? "lg:hidden" : ""}`} /></div></div>
    </aside>
    <div className={`transition-all ${sidebarCompact ? "lg:ml-[84px]" : "lg:ml-[248px]"}`}>
      <header className="sticky top-0 z-20 flex h-[72px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-7"><button onClick={() => setSidebarOpen(true)} className="rounded-xl border border-slate-200 p-2 lg:hidden"><Menu className="size-5" /></button><button onClick={() => setSidebarCompact(!sidebarCompact)} className="hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:block"><PanelLeftClose className={`size-5 transition ${sidebarCompact ? "rotate-180" : ""}`} /></button><div className="hidden h-6 w-px bg-slate-200 lg:block" /><div className="flex min-w-0 flex-1 items-center gap-2 text-sm"><current.icon className="hidden size-4 text-teal-600 sm:block" /><span className="truncate font-semibold text-slate-700">{current.label}</span></div><label className="hidden h-10 w-72 items-center gap-2 rounded-xl bg-slate-100 px-3 xl:flex"><Search className="size-4 text-slate-400" /><input placeholder="Buscar em toda a plataforma" className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-400">⌘K</kbd></label><button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 hover:bg-slate-50"><Bell className="size-[18px]" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-rose-500" /></button><button className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 sm:flex sm:items-center sm:gap-2"><CircleHelp className="size-4" /> Ajuda</button></header>
      <main className="mx-auto max-w-[1560px] p-4 sm:p-6 lg:p-8">
        {view === "overview" && <Overview go={navigate} />}
        {view === "leads" && <LeadsView select={(lead) => setSelectedLead(lead)} />}
        {view === "distribution" && <DistributionView />}
        {view === "customers" && <CustomersView select={(customer) => setSelectedCustomer(customer)} />}
        {view === "billing" && <BillingView />}
        {view === "catalog" && <CatalogView />}
        {view === "plates" && <PlatesView />}
        {view === "team" && <TeamView />}
        {view === "settings" && <SettingsView />}
      </main>
    </div>
    <DetailDrawer lead={selectedLead} customer={selectedCustomer} close={() => { setSelectedLead(undefined); setSelectedCustomer(undefined); }} />
  </div>;
}
