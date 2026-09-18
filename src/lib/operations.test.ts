import { describe, expect, it } from "vitest";
import { buildClosurePlan, buildFollowUpPayload, buildInvoiceContactLink, resequencePriorities } from "./operations";

describe("operations helpers", () => {
  it("creates a scheduled follow-up with a valid future date", () => {
    const payload = buildFollowUpPayload({ organizationId: 7, accountId: 12, actorId: "user-1", reason: "follow_proposal", dueAt: "2026-09-20T14:00" });

    expect(payload).toMatchObject({ organization_id: 7, account_id: 12, created_by: "user-1", reason: "follow_proposal", status: "scheduled" });
    expect(new Date(payload.due_at).valueOf()).toBe(new Date("2026-09-20T14:00").valueOf());
  });

  it("rejects a follow-up without a due date", () => {
    expect(() => buildFollowUpPayload({ organizationId: 7, accountId: 12, actorId: "user-1", reason: "onboarding", dueAt: "" })).toThrow("Informe a data do retorno.");
  });

  it("converts a won lead into onboarding with an implementation follow-up", () => {
    const plan = buildClosurePlan({ organizationId: 7, accountId: 12, actorId: "user-1", responsibleMemberId: 4, dueAt: "2026-09-21T10:00" });

    expect(plan.account).toMatchObject({ lifecycle_status: "onboarding", pipeline_stage: "won", follow_up_status: "post_sale" });
    expect(plan.followUp).toMatchObject({ reason: "onboarding", responsible_member_id: 4, status: "scheduled" });
    expect(plan.activity.title).toBe("Fechamento registrado");
  });

  it("builds a WhatsApp link only when the contact has a phone", () => {
    expect(buildInvoiceContactLink({ channel: "whatsapp", phone: "(21) 99999-0000", email: "", paymentUrl: "https://pay.example/1", description: "Plano mensal" })).toContain("wa.me/5521999990000");
    expect(buildInvoiceContactLink({ channel: "whatsapp", phone: "", email: "", paymentUrl: "https://pay.example/1", description: "Plano mensal" })).toBeNull();
  });

  it("renumbers rules sequentially after reordering", () => {
    expect(resequencePriorities([9, 3, 12])).toEqual([{ id: 9, priority: 1 }, { id: 3, priority: 2 }, { id: 12, priority: 3 }]);
  });
});
