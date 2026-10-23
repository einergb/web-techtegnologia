import type { Metadata } from "next";
import SiteHeader from "@/components/site-header";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "TechStore Colombia | Tecnología para tu día a día",
  description: "Encuentra tecnología, accesorios y equipos para cada momento.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO">
      <body><SiteHeader/>{children}</body>
    </html>
  );
}
