"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/icon";
import { homeCopy } from "@/content/home";

export default function SiteFooter({ storeName }: { storeName?: string }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <footer className="border-t border-outline-variant bg-surface-container-low"><div className="mx-auto w-full max-w-7xl px-margin-mobile py-space-xl md:px-margin"><div className="mb-12 grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-4"><div className="space-y-4 lg:col-span-2"><Link href="/" className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary font-bold text-on-secondary"><Icon name="bolt" className="h-5 w-5"/></span><span className="font-headline-md text-headline-md font-bold text-on-surface">{storeName || "TechStore Colombia"}</span></Link><p className="max-w-sm text-body-sm text-on-surface-variant">{homeCopy.footerDescription}</p></div><nav aria-label="Explorar tienda" className="space-y-3"><h2 className="text-label-md font-bold uppercase tracking-wider text-on-surface">Explorar</h2><ul className="space-y-2 text-body-sm text-on-surface-variant"><li><Link href="/catalogo" className="transition-colors duration-150 hover:text-primary">Catálogo</Link></li><li><Link href="/#categorias" className="transition-colors duration-150 hover:text-primary">Categorías</Link></li><li><Link href="/carrito" className="transition-colors duration-150 hover:text-primary">Carrito</Link></li></ul></nav><nav aria-label="Servicio al cliente" className="space-y-3"><h2 className="text-label-md font-bold uppercase tracking-wider text-on-surface">Mi cuenta</h2><ul className="space-y-2 text-body-sm text-on-surface-variant"><li><Link href="/cuenta" className="transition-colors duration-150 hover:text-primary">Mi cuenta</Link></li><li><Link href="/pedidos" className="transition-colors duration-150 hover:text-primary">Mis pedidos</Link></li></ul></nav></div><div className="flex flex-col items-center justify-between gap-4 border-t border-outline-variant pt-8 text-label-sm text-on-surface-variant sm:flex-row"><p>© {new Date().getFullYear()} TechStore Colombia. Todos los derechos reservados.</p></div></div></footer>;
}
