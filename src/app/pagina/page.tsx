import type { Metadata } from "next";
import PublicSmartPage from "@/app/components/public-smart-page";

export const metadata: Metadata = { title: "Página inteligente | OctaReview", description: "Conecte-se com este estabelecimento." };

export default function PublicPageRoute() {
  return <PublicSmartPage />;
}
