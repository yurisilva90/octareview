import type { Metadata } from "next";
import AuthGate from "../components/auth-gate";
import ClientWorkspace from "../components/client-workspace";

export const metadata: Metadata = {
  title: "Painel do cliente | OctaReview",
  description: "Presença, reputação, placas, contatos e serviços do estabelecimento.",
};

export default function ClientPage() {
  return <AuthGate redirectTo="/cliente/"><ClientWorkspace /></AuthGate>;
}
