import type { Metadata } from "next";
import ManagementWorkspace from "../components/management-workspace";

export const metadata: Metadata = {
  title: "Gestão interna | OctaReview",
  description: "Painel interno para operação comercial, clientes, produtos, placas e cobrança.",
};

export default function ManagementPage() {
  return <ManagementWorkspace />;
}
