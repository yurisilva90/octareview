"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { withBasePath } from "@/lib/site";

export default function AuthGate({ children, redirectTo = "/app/" }: { children: ReactNode; redirectTo?: string }) {
  const [state, setState] = useState<"checking" | "authorized" | "demo">(
    () => getSupabaseBrowserClient() ? "checking" : "demo",
  );

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setState("authorized");
      else {
        window.sessionStorage.setItem("octareview:after-login", redirectTo);
        window.location.assign(withBasePath("/login/"));
      }
    });
  }, [redirectTo]);

  if (state === "checking") {
    return <main className="flex min-h-screen items-center justify-center bg-[#f3f7fa]"><LoaderCircle className="size-6 animate-spin text-[#075f6a]" /></main>;
  }

  return <>{state === "demo" && <div className="fixed inset-x-0 top-0 z-[100] bg-amber-100 px-3 py-1 text-center text-[10px] font-semibold text-amber-900">Modo demonstração · conecte o Supabase para exigir login e sincronizar dados</div>}{children}</>;
}
