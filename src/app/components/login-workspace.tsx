"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/site";

function destination() {
  return window.sessionStorage.getItem("octareview:after-login") ?? "/app/";
}

function finishLogin() {
  const next = destination();
  window.sessionStorage.removeItem("octareview:after-login");
  window.location.assign(withBasePath(next));
}

export default function LoginWorkspace() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) finishLogin();
    });
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(undefined); setMessage(undefined);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("O Supabase ainda não foi conectado ao site.");
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      finishLogin();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível entrar.");
    } finally { setLoading(false); }
  }

  async function sendMagicLink() {
    setLoading(true); setError(undefined); setMessage(undefined);
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("O Supabase ainda não foi conectado ao site.");
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}${withBasePath(destination())}` },
      });
      if (otpError) throw otpError;
      setMessage("Link de acesso enviado. Confira seu e-mail.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar o link.");
    } finally { setLoading(false); }
  }

  return <main className="grid min-h-screen bg-[#f3f7fa] lg:grid-cols-[1.1fr_.9fr]"><section className="hidden bg-[linear-gradient(145deg,#052b58,#087d87)] p-12 text-white lg:flex lg:flex-col lg:justify-between"><Image src={withBasePath("/octareview-wordmark.png")} alt="OctaReview" width={210} height={70} className="h-14 w-auto object-contain object-left brightness-0 invert" /><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-teal-200">Uma plataforma, três experiências</p><h1 className="mt-5 text-5xl font-semibold leading-tight tracking-[-.05em]">Da primeira prospecção ao relacionamento recorrente.</h1><div className="mt-8 space-y-4 text-sm text-teal-50">{["Comercial e diagnósticos em campo", "Gestão central de leads, clientes e cobrança", "Portal do cliente conectado à mesma base"].map((item) => <p key={item} className="flex items-center gap-3"><CheckCircle2 className="size-5 text-teal-300" />{item}</p>)}</div></div><p className="text-xs text-teal-200">OctaReview · Reviews, insights e um amanhã mais forte</p></section><section className="flex items-center justify-center p-5 sm:p-10"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,.09)] sm:p-9"><Image src={withBasePath("/octareview-wordmark.png")} alt="OctaReview" width={180} height={60} className="mb-8 h-12 w-auto object-contain object-left lg:hidden" /><p className="text-[11px] font-bold uppercase tracking-[.18em] text-teal-600">Acesso seguro</p><h2 className="mt-2 text-3xl font-bold tracking-[-.04em] text-slate-950">Entrar na OctaReview</h2><p className="mt-2 text-sm leading-6 text-slate-500">Use o acesso criado pelo administrador da sua organização.</p><form onSubmit={signIn} className="mt-7 space-y-4"><label className="block text-xs font-semibold text-slate-600">E-mail<div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3"><Mail className="size-4 text-slate-400" /><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div></label><label className="block text-xs font-semibold text-slate-600">Senha<div className="mt-2 flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3"><KeyRound className="size-4 text-slate-400" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div></label>{error && <p className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}{message && <p className="rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">{message}</p>}<button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#075f6a] text-sm font-bold text-white disabled:opacity-60">{loading ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Entrar</button></form><button disabled={loading || !email} onClick={() => void sendMagicLink()} className="mt-3 h-11 w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 disabled:opacity-50">Enviar link de acesso por e-mail</button><p className="mt-6 text-center text-[11px] leading-5 text-slate-400">Novos usuários são convidados pelo administrador. Não há cadastro público.</p></div></section></main>;
}
