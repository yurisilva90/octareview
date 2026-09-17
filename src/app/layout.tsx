import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { withBasePath } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: "OctaReview — Inteligência comercial e reputação",
  description: "Gestão comercial, diagnóstico de presença local e reputação para negócios.",
  applicationName: "OctaReview",
  manifest: withBasePath("/manifest.webmanifest"),
  icons: {
    icon: withBasePath("/octareview-icon.png"),
    apple: withBasePath("/octareview-icon.png"),
  },
  appleWebApp: {
    capable: true,
    title: "OctaReview",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#052b58",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
