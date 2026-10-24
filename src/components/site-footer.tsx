"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter({ storeName }: { storeName?: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <footer className="mt-16 bg-on-surface py-9 text-white"><div className="container-page flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="font-display text-lg font-bold">TechStore Colombia</p><p className="mt-1 text-body-sm text-white/65">{storeName || "Tecnología para tu día a día"}</p></div><nav aria-label="Enlaces del pie de página" className="flex flex-wrap gap-5 text-body-sm text-white/80"><Link href="/catalogo" className="hover:text-white">Catálogo</Link><Link href="/cuenta" className="hover:text-white">Mi cuenta</Link><Link href="/pedidos" className="hover:text-white">Mis pedidos</Link></nav></div></footer>;
}
