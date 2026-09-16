"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  ContactRound,
  FileText,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  LogOut,
  Menu,
  MessageSquareText,
  Nfc,
  Settings,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/site";

type Establishment = {
  id: number;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  lifecycle_status: string;
  google_profile_url: string | null;
};

const sections = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Minha presença", icon: Store },
  { label: "Reputação", icon: MessageSquareText },
  { label: "Placas", icon: Nfc },
  { label: "Equipe", icon: Users },
  { label: "Página e links", icon: Link2 },
  { label: "Contatos", icon: ContactRound },
  { label: "Relatórios", icon: BarChart3 },
  { label: "Serviços", icon: FileText },
  { label: "Configurações", icon: Settings },
];

function formatLocation(establishment: Establishment) {
  return [establishment.city, establishment.state].filter(Boolean).join(" · ") || "Localização não informada";
}

export default function ClientWorkspace() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(() => Boolean(getSupabaseBrowserClient()));
  const [error, setError] = useState<string>();
  const [email, setEmail] = useState("");
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedId, setSelectedId] = useState<number>();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    void (async () => {
      const [{ data: userData }, { data, error: queryError }] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("accounts")
          .select("id,name,category,city,state,lifecycle_status,google_profile_url")
          .in("lifecycle_status", ["onboarding", "active", "at_risk", "delinquent", "inactive"])
          .order("name"),
      ]);

      setEmail(userData.user?.email ?? "");
      if (queryError) setError("Não foi possível carregar os estabelecimentos vinculados ao acesso.");
      else {
        const rows = (data ?? []) as Establishment[];
        setEstablishments(rows);
        setSelectedId(rows[0]?.id);
      }
      setLoading(false);
    })();
  }, []);

  const selected = useMemo(
    () => establishments.find((item) => item.id === selectedId),
    [establishments, selectedId],
  );

  async function signOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    window.location.assign(withBasePath("/login/"));
  }

  return (
    <div className="min-h-screen bg-[#f4f7f8] text-slate-950 lg:grid lg:grid-cols-[258px_1fr]">
      {menuOpen && <button aria-label="Fechar menu" className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <aside className={`${menuOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-40 flex w-[278px] flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:w-auto lg:translate-x-0`}>
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-5">
          <Image src={withBasePath("/octareview-wordmark.png")} alt="OctaReview" width={170} height={56} className="h-10 w-auto object-contain object-left" />
          <button className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setMenuOpen(false)}><X className="size-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {sections.map(({ label, icon: Icon }, index) => (
            <button key={label} disabled={index !== 0} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${index === 0 ? "bg-teal-50 text-teal-800" : "text-slate-500 disabled:cursor-default"}`}>
              <Icon className="size-[18px]" />
              <span className="flex-1">{label}</span>
              {index !== 0 && <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">próxima fase</span>}
            </button>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button onClick={() => void signOut()} className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-sm font-semibold text-slate-500 hover:bg-slate-50"><LogOut className="size-[18px]" /> Sair</button>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-[68px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button className="rounded-xl border border-slate-200 p-2.5 text-slate-600 lg:hidden" onClick={() => setMenuOpen(true)}><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">Painel do cliente</p>
            <p className="truncate text-[11px] text-slate-400">{email || "Acesso do estabelecimento"}</p>
          </div>
          {establishments.length > 0 && (
            <label className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:flex">
              <Building2 className="size-4 text-teal-700" />
              <select value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))} className="h-10 max-w-[250px] bg-transparent text-sm font-semibold outline-none">
                {establishments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
          )}
        </header>

        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
          {loading ? (
            <div className="flex min-h-[55vh] items-center justify-center"><LoaderCircle className="size-7 animate-spin text-teal-700" /></div>
          ) : error ? (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">{error}</section>
          ) : !selected ? (
            <section className="mx-auto mt-16 max-w-xl text-center">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Building2 className="size-6" /></span>
              <h1 className="mt-5 text-2xl font-bold tracking-[-.03em]">Nenhum estabelecimento disponível</h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">O painel usa a mesma empresa criada no comercial, sem duplicação. Quando o acesso ao estabelecimento for vinculado, ele aparecerá aqui.</p>
            </section>
          ) : (
            <>
              <section className="flex flex-col gap-5 border-b border-slate-200 pb-7 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-teal-700">Visão geral</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-[-.045em] sm:text-4xl">{selected.name}</h1>
                  <p className="mt-2 text-sm text-slate-500">{selected.category || "Categoria não informada"} · {formatLocation(selected)}</p>
                </div>
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><ShieldCheck className="size-4" /> Acesso protegido por estabelecimento</span>
              </section>

              <section className="py-7">
                <div className="grid gap-4 md:grid-cols-3">
                  <article className="md:col-span-2">
                    <p className="text-sm font-bold">Métricas do estabelecimento</p>
                    <div className="mt-4 rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.05)]">
                      <BarChart3 className="size-7 text-teal-700" />
                      <h2 className="mt-5 text-lg font-bold">Aguardando eventos reais</h2>
                      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Interações por NFC e QR, cliques, contatos e conversões serão exibidos depois que o módulo de eventos for conectado. Nenhum dado fictício é usado nesta área.</p>
                    </div>
                  </article>
                  <article>
                    <p className="text-sm font-bold">Presença no Google</p>
                    <div className="mt-4 rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,.05)]">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${selected.google_profile_url ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{selected.google_profile_url ? "Dados públicos" : "Não conectado"}</span>
                      <p className="mt-4 text-sm leading-6 text-slate-500">A integração oficial e os dados de reputação serão conectados na etapa própria do painel do cliente.</p>
                    </div>
                  </article>
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
