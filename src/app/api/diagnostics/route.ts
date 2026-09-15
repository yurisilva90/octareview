import { z } from "zod";
import { collectDiagnosticData } from "@/lib/apify";
import { buildDiagnostic } from "@/lib/diagnostic";
import { demoInput, demoMarketRecords, demoTargetRecords } from "@/lib/demo";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  mode: z.enum(["live", "demo"]).default("live"),
  businessName: z.string().trim().min(2).max(120).optional(),
  location: z.string().trim().min(2).max(160).optional(),
  category: z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().min(2).max(120).optional(),
  ),
  maxCompetitors: z.coerce.number().int().min(3).max(20).default(10),
  maxReviews: z.coerce.number().int().min(0).max(100).default(40),
});

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.parse(await request.json());
    if (parsed.mode === "demo") {
      return Response.json(buildDiagnostic({
        input: demoInput,
        targetRecords: demoTargetRecords,
        marketRecords: demoMarketRecords,
        mode: "demo",
      }));
    }

    const input = {
      businessName: parsed.businessName ?? "",
      location: parsed.location ?? "",
      category: parsed.category ?? "",
      maxCompetitors: parsed.maxCompetitors,
      maxReviews: parsed.maxReviews,
    };
    if (!input.businessName || !input.location) {
      return Response.json({ error: "Informe o nome da empresa e a localização." }, { status: 400 });
    }

    const collected = await collectDiagnosticData(input);
    return Response.json(buildDiagnostic({
      input: { ...input, category: collected.detectedCategory },
      targetRecords: collected.targetRecords,
      marketRecords: collected.marketRecords,
      mode: "live",
      actorId: collected.actorId,
    }));
  } catch (error) {
    const message = error instanceof z.ZodError
      ? "Revise os campos informados e tente novamente."
      : error instanceof Error
        ? error.message
        : "Não foi possível gerar o diagnóstico.";
    return Response.json({ error: message }, { status: 500 });
  }
}
