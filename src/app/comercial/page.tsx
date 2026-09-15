import type { Metadata } from "next";
import CommercialWorkspace from "../components/commercial-workspace";

export const metadata: Metadata = {
  title: "Área comercial — Inteligência local",
  description: "Oportunidades, diagnósticos e rotina comercial em uma experiência mobile.",
};

export default function CommercialPage() {
  return <CommercialWorkspace />;
}
