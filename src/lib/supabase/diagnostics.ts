import { buildDiagnostic } from "@/lib/diagnostic";
import { demoInput, demoMarketRecords, demoTargetRecords } from "@/lib/demo";
import type { DiagnosticInput, DiagnosticReport } from "@/lib/types";
import { getSupabaseBrowserClient } from "./client";

export type DiagnosticRequest = DiagnosticInput & {
  mode: "live" | "demo";
  accountId?: number;
  responsible?: string;
  phone?: string;
  email?: string;
};

export async function requestDiagnostic(input: DiagnosticRequest): Promise<DiagnosticReport> {
  if (input.mode === "demo") {
    return buildDiagnostic({
      input: demoInput,
      targetRecords: demoTargetRecords,
      marketRecords: demoMarketRecords,
      mode: "demo",
    });
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("O Supabase ainda não foi conectado. Configure a URL e a publishable key do projeto.");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error("Entre na OctaReview para gerar um diagnóstico ao vivo.");
  }

  const { data, error } = await supabase.functions.invoke<DiagnosticReport>("diagnostics", {
    body: input,
  });
  if (error) throw new Error(error.message || "Não foi possível gerar o diagnóstico.");
  if (!data) throw new Error("O diagnóstico não retornou dados.");
  return data;
}
