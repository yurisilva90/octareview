import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/site";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OctaReview",
    short_name: "OctaReview",
    description: "Inteligência comercial, diagnóstico e gestão de reputação.",
    start_url: withBasePath("/app/"),
    display: "standalone",
    background_color: "#f3f7fa",
    theme_color: "#052b58",
    icons: [
      {
        src: withBasePath("/octareview-icon.png"),
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
