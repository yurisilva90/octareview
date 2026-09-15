import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "OctaReview — Inteligência comercial e reputação",
  description: "Gestão comercial, diagnóstico de presença local e reputação para negócios.",
  applicationName: "OctaReview",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/octareview-icon.png",
    apple: "/octareview-icon.png",
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
