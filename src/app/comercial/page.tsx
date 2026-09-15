import type { Metadata } from "next";
import CommercialWorkspace from "../components/commercial-workspace";

export const metadata: Metadata = {
  title: "OctaReview Comercial",
  description: "Leads, follow-ups, diagnósticos e clientes em uma experiência mobile.",
};

export default function CommercialPage() {
  return <CommercialWorkspace />;
}
