export type FollowUpReason = "send_diagnostic" | "follow_proposal" | "partner_decision" | "send_purchase_link" | "onboarding" | "first_month_results" | "renewal" | "billing" | "other";

type FollowUpInput = {
  organizationId: number;
  accountId: number;
  actorId?: string;
  responsibleMemberId?: number | null;
  reason: FollowUpReason;
  dueAt: string;
};

function requireDueAt(value: string) {
  if (!value.trim()) throw new Error("Informe a data do retorno.");
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new Error("Informe uma data de retorno válida.");
  return date.toISOString();
}

export function buildFollowUpPayload(input: FollowUpInput) {
  return {
    organization_id: input.organizationId,
    account_id: input.accountId,
    responsible_member_id: input.responsibleMemberId ?? null,
    created_by: input.actorId ?? null,
    reason: input.reason,
    status: "scheduled",
    due_at: requireDueAt(input.dueAt),
  };
}

export function buildClosurePlan(input: Omit<FollowUpInput, "reason">) {
  const closedAt = new Date().toISOString();
  return {
    account: {
      lifecycle_status: "onboarding",
      pipeline_stage: "won",
      follow_up_status: "post_sale",
      closed_at: closedAt,
      client_since: closedAt.slice(0, 10),
    },
    followUp: buildFollowUpPayload({ ...input, reason: "onboarding" }),
    activity: {
      organization_id: input.organizationId,
      account_id: input.accountId,
      actor_id: input.actorId ?? null,
      activity_type: "lead_closed",
      title: "Fechamento registrado",
      details: { next_step: "onboarding" },
      occurred_at: closedAt,
    },
  };
}

export function buildInvoiceContactLink(input: { channel: "whatsapp" | "email"; phone?: string | null; email?: string | null; paymentUrl?: string | null; description: string }) {
  if (!input.paymentUrl?.trim()) return null;
  const message = `Olá! Segue o link da cobrança: ${input.description}. ${input.paymentUrl}`;
  if (input.channel === "whatsapp") {
    const phone = (input.phone ?? "").replace(/\D/g, "");
    return phone ? `https://wa.me/${phone.startsWith("55") ? phone : `55${phone}`}?text=${encodeURIComponent(message)}` : null;
  }
  return input.email?.trim() ? `mailto:${encodeURIComponent(input.email.trim())}?subject=${encodeURIComponent(`Cobrança — ${input.description}`)}&body=${encodeURIComponent(message)}` : null;
}

export function resequencePriorities(ids: number[]) {
  return ids.map((id, index) => ({ id, priority: index + 1 }));
}
