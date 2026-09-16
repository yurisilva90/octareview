import type { Metadata } from "next";
import RouteRedirect from "../components/route-redirect";

export const metadata: Metadata = {
  title: "Gestão interna | OctaReview",
  description: "Painel interno para operação comercial, clientes, produtos, placas e cobrança.",
};

export default function ManagementPage() {
  return <RouteRedirect to="/adm/" />;
}
