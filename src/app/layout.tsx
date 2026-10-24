import type { Metadata } from "next";
import { Hanken_Grotesk, Outfit } from "next/font/google";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { apiGet } from "@/lib/api";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: "TechStore Colombia | Tecnología para tu día a día",
  description: "Encuentra tecnología, accesorios y equipos para cada momento.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const storePromise = apiGet<{ nombre?: string; envioGratisDesde?: number }>("/api/catalogo/tienda").catch(() => null);
  return <LayoutContent storePromise={storePromise}>{children}</LayoutContent>;
}

async function LayoutContent({ children, storePromise }: { children: React.ReactNode; storePromise: Promise<{ nombre?: string; envioGratisDesde?: number } | null> }) {
  const store = await storePromise;
  return (
    <html lang="es-CO">
      <body className={`${outfit.variable} ${hanken.variable}`}><SiteHeader store={store}/>{children}<SiteFooter storeName={store?.nombre}/></body>
    </html>
  );
}
