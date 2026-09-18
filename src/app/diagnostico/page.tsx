"use client";

import { useEffect, useState } from "react";
import { BarChart3, Building2, CheckCircle2, CircleAlert, LockKeyhole, MapPin, Star } from "lucide-react";
import type { DiagnosticReport } from "@/lib/types";

type State = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; report: DiagnosticReport; businessName: string };

const format = new Intl.NumberFormat("pt-BR");

export default function PublicDiagnosticPage() {
  const [state, setState] = useState<State>({ status: "loading" });
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);

  async function registerInterest() {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!token || !url || !key) return setConnectionMessage("Não foi possível registrar seu interesse agora.");
    try {
      const response = await fetch(`${url}/functions/v1/public-diagnostic`, { method: "POST", headers: { "Content-Type": "application/json", apikey: key }, body: JSON.stringify({ token, action: "connect_started" }) });
      const payload = await response.json() as { message?: string; error?: string };
      setConnectionMessage(response.ok ? (payload.message ?? "Seu interesse foi registrado.") : (payload.error ?? "Não foi possível registrar seu interesse agora."));
    } catch { setConnectionMessage("Não foi possível registrar seu interesse agora."); }
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!token || !url || !key) {
      setState({ status: "error", message: !token ? "Este link de diagnóstico é inválido." : "A configuração pública ainda não está disponível." });
      return;
    }
    void fetch(`${url}/functions/v1/public-diagnostic`, {
      method: "POST", headers: { "Content-Type": "application/json", apikey: key }, body: JSON.stringify({ token, action: "load" }),
    }).then(async (response) => ({ response, payload: await response.json() as { report?: DiagnosticReport; businessName?: string; error?: string } }))
      .then(({ response, payload }) => {
        if (!response.ok || !payload.report) throw new Error(payload.error ?? "Não foi possível carregar este diagnóstico.");
        setState({ status: "ready", report: payload.report, businessName: payload.businessName ?? payload.report.business.title });
      }).catch((error: unknown) => setState({ status: "error", message: error instanceof Error ? error.message : "Não foi possível carregar este diagnóstico." }));
  }, []);

  if (state.status === "loading") return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-600">Preparando seu diagnóstico…</main>;
  if (state.status === "error") return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><section className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><CircleAlert className="mx-auto text-amber-500" size={30} /><h1 className="mt-4 text-xl font-bold text-slate-900">Diagnóstico indisponível</h1><p className="mt-2 text-sm leading-6 text-slate-600">{state.message}</p></section></main>;
  const { report } = state;
  return <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-[#18213c] sm:py-12"><div className="mx-auto max-w-4xl space-y-5">
    <header className="rounded-3xl bg-[#18213c] p-6 text-white shadow-xl sm:p-9"><p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-200">Diagnóstico inicial</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{state.businessName}</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Analisamos dados públicos de reputação, presença e concorrência para identificar oportunidades reais.</p></header>
    <section className="grid gap-3 sm:grid-cols-3"><Metric icon={Star} label="Nota atual" value={report.summary.rating?.toFixed(1) ?? "—"} detail={`${report.summary.reviewsCount === null ? "—" : format.format(report.summary.reviewsCount)} avaliações`} /><Metric icon={BarChart3} label="Concorrentes" value={String(report.competitors.filter((item) => !item.isTarget).length)} detail="empresas comparadas" /><Metric icon={MapPin} label="Oportunidades" value={String(report.opportunities.length)} detail="prioridades encontradas" /></section>
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-xs font-bold uppercase tracking-[.15em] text-indigo-600">Leitura executiva</p><p className="mt-3 text-lg leading-8 text-slate-700">{report.summary.narrative}</p><div className="mt-7 grid gap-3 md:grid-cols-3">{report.opportunities.slice(0, 3).map((item) => <article key={item.id} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold text-slate-900">{item.title}</p><p className="mt-2 text-sm leading-6 text-slate-600">{item.evidence}</p></article>)}</div></section>
    <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-6 sm:p-8"><div className="flex gap-4"><LockKeyhole className="mt-1 shrink-0 text-indigo-600" size={22} /><div><p className="font-bold text-indigo-950">Libere a análise completa</p><p className="mt-2 text-sm leading-6 text-indigo-900">Ao conectar seu Perfil da Empresa no Google, será possível cruzar este diagnóstico com dados oficiais da sua operação. A conexão será disponibilizada após a configuração e aprovação da integração.</p>{connectionMessage ? <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17} />{connectionMessage}</p> : <button onClick={() => void registerInterest()} className="mt-5 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white">Quero liberar a análise completa</button>}</div></div></section>
    <p className="px-2 text-center text-xs leading-5 text-slate-500">Dados públicos analisados em {new Date(report.generatedAt).toLocaleDateString("pt-BR")}. Informações não disponíveis não foram estimadas.</p>
  </div></main>;
}

function Metric({ icon: Icon, label, value, detail }: { icon: typeof Star; label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Icon size={18} className="text-indigo-600" /><p className="mt-5 text-xs font-bold uppercase tracking-[.13em] text-slate-500">{label}</p><p className="mt-1 text-3xl font-bold text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-500">{detail}</p></article>;
}
