import type { Metadata } from "next";
import RouteRedirect from "../components/route-redirect";

export const metadata: Metadata = {
  title: "OctaReview Comercial",
  description: "Leads, follow-ups, diagnósticos e clientes em uma experiência mobile.",
};

export default function CommercialPage() {
  return <RouteRedirect to="/app/" />;
}
