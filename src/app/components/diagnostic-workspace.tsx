"use client";

import { useState, type FormEvent } from "react";
import {
  ArrowRight, BarChart3, Building2, Check, ChevronRight, CircleAlert,
  Clock3, ExternalLink, FileSearch, LoaderCircle, MapPin, MessageSquareText,
  Radar, Search, ShieldCheck, Sparkles, Star, Target, UsersRound,
} from "lucide-react";
import type { DiagnosticPillar, DiagnosticReport, PillarStatus } from "@/lib/types";

const statusStyles: Record<PillarStatus, { label: string; className: string; dot: string }> = {
  strong: { label: "Forte", className: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  attention: { label: "Em atenção", className: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  opportunity: { label: "Oportunidade", className: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  unknown: { label: "A confirmar", className: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const pillarIcons: Record<DiagnosticPillar["id"], typeof Star> = {
  reputation: Star, management: MessageSquareText, profile: Building2,
  visibility: Radar, competition: UsersRound,
};

const numberFormat = new Intl.NumberFormat("pt-BR");

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Star }) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-full bg-[#eff2ff] text-[#5366d9]"><Icon size={17} strokeWidth={1.8} /></div>
      </div>
      <p className="mt-6 text-[32px] font-semibold tracking-[-0.04em] text-[#18213c]">{value}</p>
      <p className="mt-1 text-sm leading-5 text-[#74809d]">{detail}</p>
    </div>
  );
}

function PillarCard({ pillar }: { pillar: DiagnosticPillar }) {
  const status = statusStyles[pillar.status];
  const Icon = pillarIcons[pillar.id];
  return (
    <article className="surface flex min-h-[265px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border border-[#e5e9f4] bg-white text-[#5366d9] shadow-sm"><Icon size={19} strokeWidth={1.8} /></div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}>
          <span className={`size-1.5 rounded-full ${status.dot}`} />{status.label}
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-[#74809d]">{pillar.label}</p>
      <h3 className="mt-1 text-xl font-semibold tracking-[-0.025em] text-[#18213c]">{pillar.headline}</h3>
      <p className="mt-3 text-sm leading-6 text-[#65708c]">{pillar.summary}</p>
      <div className="mt-auto space-y-2 border-t border-[#edf0f7] pt-4">
        {pillar.evidence.map((item) => <p key={item} className="flex items-start gap-2 text-xs leading-5 text-[#7f89a2]"><Check className="mt-0.5 shrink-0 text-[#8c99c6]" size={13} />{item}</p>)}
      </div>
    </article>
  );
}

export default function DiagnosticWorkspace() {
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ businessName: "Barbearia Firmados", location: "Teresópolis, Brasil", category: "" });

  async function generate(mode: "live" | "demo") {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          location: form.location,
          category: form.category.trim() || undefined,
          mode,
          maxCompetitors: 10,
          maxReviews: 40,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível gerar o diagnóstico.");
      setReport(data);
      requestAnimationFrame(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ocorreu um erro inesperado.");
    } finally { setLoading(false); }
  }

  function submit(event: FormEvent) { event.preventDefault(); void generate("live"); }

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#18213c]">
      <header className="border-b border-[#e8ebf3] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:h-[72px] sm:px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#5366d9] text-white shadow-[0_8px_24px_rgba(83,102,217,.28)]"><Sparkles size={17} fill="currentColor" /></div>
            <div><p className="text-[17px] font-semibold tracking-[-0.03em]">Reputta</p><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[#8993ab]">Inteligência local</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#e6eaf3] bg-[#fafbfe] px-3 py-1.5 text-xs font-medium text-[#66718b]">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
            <span className="sm:hidden">Apify</span><span className="hidden sm:inline">Apify conectado</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-5 pb-12 sm:px-5 sm:py-8 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-10">
        <aside>
          <div className="surface overflow-hidden lg:sticky lg:top-6">
            <div className="border-b border-[#edf0f6] p-5 sm:p-6">
              <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-[#eff2ff] text-[#5366d9] sm:mb-5"><FileSearch size={21} /></div>
              <p className="eyebrow">Novo diagnóstico</p>
              <h1 className="mt-2 text-[24px] font-semibold leading-7 tracking-[-0.04em] sm:text-[26px] sm:leading-8">Encontre a oportunidade antes da visita.</h1>
              <p className="mt-3 text-sm leading-6 text-[#74809d]">Informe a empresa e a cidade. Se quiser, escolha outro mercado para comparar.</p>
            </div>
            <form onSubmit={submit} className="space-y-4 p-5 sm:p-6">
              <label className="field-label">Empresa<div className="field-wrap"><Building2 size={17} /><input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Nome no Google" autoComplete="organization" enterKeyHint="next" required /></div></label>
              <label className="field-label">Cidade ou região<div className="field-wrap"><MapPin size={17} /><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ex.: Teresópolis, RJ" autoComplete="address-level2" enterKeyHint="go" required /></div></label>
              <label className="field-label">Categoria de comparação <span className="font-normal text-[#929bb0]">(opcional)</span><div className="field-wrap"><Search size={17} /><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Automática pelo perfil" enterKeyHint="go" /></div></label>
              <div className="rounded-xl border border-[#e5e9f4] bg-[#fafbfe] px-3.5 py-3 text-[11px] leading-5 text-[#74809d]"><strong className="font-semibold text-[#56617c]">Como funciona:</strong> vazio usa a categoria principal do Google. Preenchido compara com o mercado escolhido. A busca usa até 10 concorrentes e 40 avaliações.</div>
              {error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-700"><CircleAlert className="mt-0.5 shrink-0" size={15} />{error}</div>}
              <button disabled={loading} className="primary-button" type="submit">{loading ? <LoaderCircle className="animate-spin" size={17} /> : <Sparkles size={17} />}{loading ? "Localizando empresa e mercado..." : "Gerar diagnóstico"}{!loading && <ArrowRight size={16} />}</button>
              <button disabled={loading} className="secondary-button" type="button" onClick={() => void generate("demo")}>Ver diagnóstico de exemplo</button>
              <div className="flex items-start gap-2 pt-1 text-[11px] leading-5 text-[#8a94aa]"><Clock3 className="mt-0.5 shrink-0" size={13} />A coleta ao vivo pode levar alguns minutos e consumir créditos da sua conta Apify.</div>
            </form>
          </div>
        </aside>

        <section className="min-w-0">
          {!report ? <EmptyState /> : <DiagnosticReportView report={report} />}
        </section>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="surface flex min-h-[430px] flex-col items-center justify-center px-5 py-10 text-center sm:min-h-[650px] sm:px-6">
      <div className="relative mb-7"><div className="absolute inset-0 scale-150 rounded-full bg-[#eff2ff] blur-2xl" /><div className="relative flex size-20 items-center justify-center rounded-[24px] border border-[#dfe4f5] bg-white text-[#5366d9] shadow-[0_20px_60px_rgba(52,65,122,.12)]"><Target size={32} strokeWidth={1.5} /></div></div>
      <p className="eyebrow">Diagnóstico comercial v1</p>
      <h2 className="mt-3 max-w-xl text-[26px] font-semibold leading-8 tracking-[-0.04em] sm:text-3xl">Uma leitura clara do negócio, pronta para orientar a conversa.</h2>
      <p className="mt-4 max-w-lg text-[15px] leading-7 text-[#74809d]">O relatório separa dados observados, inferências e limitações. Nenhuma promessa de posição e nenhuma nota opaca.</p>
      <div className="mt-10 grid w-full max-w-2xl gap-3 sm:grid-cols-3">{["5 pilares explicáveis", "Comparação competitiva", "3 prioridades comerciais"].map((item, index) => <div key={item} className="rounded-2xl border border-[#e8ebf3] bg-[#fafbfe] px-4 py-5"><span className="mx-auto flex size-7 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#5366d9] shadow-sm">{index + 1}</span><p className="mt-3 text-xs font-medium text-[#66718b]">{item}</p></div>)}</div>
    </div>
  );
}

export function DiagnosticReportView({ report }: { report: DiagnosticReport }) {
  return (
    <div id="report" className="scroll-mt-6 space-y-6">
      <section className="surface overflow-hidden">
        <div className="relative border-b border-[#edf0f6] px-5 py-6 sm:px-6 sm:py-7 lg:px-8">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(83,102,217,.13),transparent_65%)]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-[#eff2ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5366d9]">{report.mode === "live" ? "Dados ao vivo" : "Demonstração"}</span><span className="text-xs text-[#8b95aa]">{new Date(report.generatedAt).toLocaleString("pt-BR")}</span></div><h2 className="mt-5 text-3xl font-semibold tracking-[-0.045em] lg:text-4xl">{report.business.title}</h2><p className="mt-2 flex items-center gap-2 text-sm text-[#74809d]"><MapPin size={14} />{report.business.address ?? report.input.location}</p></div>
            {report.business.url && <a className="secondary-button w-auto px-4" href={report.business.url} target="_blank" rel="noreferrer">Abrir perfil <ExternalLink size={14} /></a>}
          </div>
        </div>
        <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1fr_260px] lg:px-8">
          <div><p className="eyebrow">Leitura executiva</p><p className="mt-3 max-w-3xl text-lg leading-8 text-[#34405f]">{report.summary.narrative}</p></div>
          <div className="rounded-2xl border border-[#dfe4f5] bg-[#f7f8ff] p-5"><p className="text-xs font-medium text-[#7d88a3]">Perfil identificado</p><p className="mt-2 text-lg font-semibold leading-6 text-[#3c4aa7]">{report.summary.profile}</p></div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Nota atual" value={report.summary.rating?.toFixed(1) ?? "—"} detail={`${report.summary.reviewsCount === null ? "—" : numberFormat.format(report.summary.reviewsCount)} avaliações`} icon={Star} />
        <MetricCard label="Posição observada" value={report.summary.searchRank ? `${report.summary.searchRank}ª` : "—"} detail={`Busca por “${report.input.category}”`} icon={MapPin} />
        <MetricCard label="Taxa de resposta" value={report.summary.responseRate === null ? "—" : `${report.summary.responseRate}%`} detail={`Amostra de ${report.summary.responseSampleSize} avaliações`} icon={MessageSquareText} />
        <MetricCard label="Completude essencial" value={`${report.summary.profileCompleteness}%`} detail="5 campos públicos verificados" icon={ShieldCheck} />
      </section>

      <section><div className="mb-4"><p className="eyebrow">Diagnóstico por dimensão</p><h2 className="section-title">Cinco pilares, com evidência.</h2></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{report.pillars.map((pillar) => <PillarCard key={pillar.id} pillar={pillar} />)}</div></section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <div className="surface overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#edf0f6] px-6 py-5"><div><p className="eyebrow">Cenário competitivo</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Quem disputa atenção na busca</h2></div><BarChart3 className="text-[#8c99c6]" size={21} /></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-[#fafbfe] text-[10px] uppercase tracking-[0.12em] text-[#8d96aa]"><tr><th className="px-6 py-3 font-semibold">Empresa</th><th className="px-4 py-3 font-semibold">Busca</th><th className="px-4 py-3 font-semibold">Nota</th><th className="px-4 py-3 font-semibold">Avaliações</th><th className="px-6 py-3 font-semibold">Site</th></tr></thead><tbody className="divide-y divide-[#edf0f6]">{report.competitors.map((row) => <tr key={row.placeId ?? row.name} className={row.isTarget ? "bg-[#f7f8ff]" : "bg-white"}><td className="px-6 py-4 font-medium text-[#26314d]"><div className="flex items-center gap-2">{row.isTarget && <span className="size-1.5 rounded-full bg-[#5366d9]" />}{row.name}{row.isTarget && <span className="rounded bg-[#e8ebff] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#5366d9]">Alvo</span>}</div></td><td className="px-4 py-4 text-[#65708c]">{row.searchRank ? `${row.searchRank}ª` : "—"}</td><td className="px-4 py-4 text-[#65708c]">{row.rating?.toFixed(1) ?? "—"}</td><td className="px-4 py-4 text-[#65708c]">{row.reviews === null ? "—" : numberFormat.format(row.reviews)}</td><td className="px-6 py-4">{row.website ? <Check size={15} className="text-emerald-500" /> : <span className="text-[#a6adbd]">—</span>}</td></tr>)}</tbody></table></div>
        </div>
        <div className="surface overflow-hidden">
          <div className="border-b border-[#edf0f6] px-6 py-5"><p className="eyebrow">Voz do cliente</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em]">Temas da amostra</h2></div>
          <div className="space-y-5 p-6">{report.themes.length ? report.themes.slice(0, 6).map((theme) => { const positive = Math.round((theme.positive / theme.mentions) * 100); const negative = Math.round((theme.negative / theme.mentions) * 100); return <div key={theme.id}><div className="mb-2 flex items-center justify-between gap-3"><p className="text-sm font-medium text-[#34405f]">{theme.label}</p><p className="text-xs text-[#8993aa]">{theme.mentions} menções</p></div><div className="flex h-1.5 overflow-hidden rounded-full bg-[#edf0f6]"><span className="bg-emerald-400" style={{ width: `${positive}%` }} /><span className="bg-rose-400" style={{ width: `${negative}%` }} /></div></div>; }) : <div className="rounded-xl bg-[#fafbfe] p-4 text-sm leading-6 text-[#74809d]">A amostra não trouxe texto suficiente para identificar temas.</div>}</div>
        </div>
      </section>

      <section><p className="eyebrow">Argumento comercial</p><h2 className="section-title">Prioridades para a conversa.</h2><div className="mt-4 grid gap-4 lg:grid-cols-3">{report.opportunities.map((item, index) => <article key={item.id} className="surface p-6"><div className="flex items-center justify-between"><span className="flex size-8 items-center justify-center rounded-full bg-[#18213c] text-xs font-semibold text-white">0{index + 1}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.priority === "alta" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-700"}`}>Prioridade {item.priority}</span></div><h3 className="mt-5 text-lg font-semibold leading-6 tracking-[-0.025em]">{item.title}</h3><div className="mt-4 space-y-3 text-sm leading-6"><p className="text-[#65708c]"><strong className="font-semibold text-[#3d4966]">Evidência:</strong> {item.evidence}</p><p className="text-[#65708c]"><strong className="font-semibold text-[#3d4966]">Impacto:</strong> {item.impact}</p></div><div className="mt-5 flex items-start gap-2 border-t border-[#edf0f6] pt-4 text-sm font-medium leading-5 text-[#5366d9]"><ChevronRight className="mt-0.5 shrink-0" size={15} />{item.solution}</div></article>)}</div></section>

      <section className="surface grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
        <div><p className="eyebrow">Como calculamos</p><div className="mt-4 space-y-3">{report.methodology.map((item, index) => <p key={item} className="flex gap-3 text-sm leading-6 text-[#65708c]"><span className="font-mono text-xs font-semibold text-[#8c99c6]">0{index + 1}</span>{item}</p>)}</div></div>
        <div><p className="eyebrow">Limites desta versão</p><div className="mt-4 space-y-3">{report.limitations.map((item) => <p key={item} className="flex gap-3 text-sm leading-6 text-[#65708c]"><CircleAlert className="mt-1 shrink-0 text-amber-500" size={14} />{item}</p>)}</div></div>
      </section>
    </div>
  );
}
