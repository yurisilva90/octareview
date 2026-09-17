import type { Metadata } from "next";
import AuthGate from "../components/auth-gate";
import ManagementWorkspace from "../components/management-live-workspace";

export const metadata: Metadata = {
  title: "Gestão interna | OctaReview",
  description: "Painel interno para operação comercial, clientes, produtos, placas e cobrança.",
};

export default function AdminPage() {
  return <AuthGate redirectTo="/adm/"><ManagementWorkspace /></AuthGate>;
}
