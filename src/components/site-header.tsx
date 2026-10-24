"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { formatCop } from "@/lib/contracts";
import Icon from "@/components/icon";

type Props = { store: { nombre?: string; envioGratisDesde?: number } | null };

export default function SiteHeader({ store }: Props) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/backend/api/carrito", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const cart = await response.json();
      if (active) setCartCount(Array.isArray(cart.items) ? cart.items.reduce((n: number, item: { cantidad?: number }) => n + (item.cantidad || 0), 0) : 0);
      const adminResponse = await fetch("/api/backend/api/admin/inventario/stock-bajo", { cache: "no-store" });
      if (active && adminResponse.ok) setIsAdmin(true);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  if (pathname.startsWith("/admin")) return null;
  return <>
    <div className="bg-secondary px-4 py-2 text-center text-label-sm font-semibold text-white">{store?.envioGratisDesde ? `Envío gratis desde ${formatCop(store.envioGratisDesde)}` : "Descubre tecnología para tu día a día"} · Pagos disponibles en checkout</div>
    <header className="sticky top-0 z-30 border-b border-surface-high bg-white/95 backdrop-blur">
      <div className="container-page flex min-h-[76px] items-center gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="TechStore Colombia, inicio"><span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-white"><Icon name="bolt" /></span><span className="font-display text-xl font-bold leading-5 tracking-tight">TechStore<small className="mt-1 block font-body text-[10px] font-semibold uppercase tracking-[.16em] text-secondary">Colombia</small></span></Link>
        <form action="/catalogo" className="hidden h-11 flex-1 items-center gap-3 rounded-lg border border-surface-high bg-surface px-3 md:flex"><Icon name="search" className="text-on-surface-variant"/><input name="q" aria-label="Buscar productos" placeholder="Buscar productos en TechStore" className="w-full bg-transparent text-body-sm outline-none placeholder:text-on-surface-variant"/><button className="text-label-sm font-semibold text-secondary">Buscar</button></form>
        <nav aria-label="Navegación principal" className="ml-auto flex items-center gap-3 text-label-sm font-semibold sm:gap-5"><Link href="/" className="hidden hover:text-primary sm:block">Inicio</Link><Link href="/catalogo" className="hover:text-primary">Catálogo</Link><Link href="/catalogo#categorias" className="hidden hover:text-primary md:block">Categorías</Link><Link href="/cuenta" aria-label="Mi cuenta" className="grid h-10 w-10 place-items-center rounded-lg border border-surface-high hover:text-primary"><Icon name="account"/></Link><Link href="/carrito" aria-label={cartCount === null ? "Carrito" : `Carrito, ${cartCount} productos`} className="relative grid h-10 w-10 place-items-center rounded-lg bg-primary text-white hover:bg-primary-container"><Icon name="cart"/>{cartCount !== null && cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[10px] font-bold text-white">{cartCount}</span>}</Link>{isAdmin && <Link href="/admin" className="hidden text-label-sm font-semibold text-secondary lg:block">Consola</Link>}</nav>
      </div>
      <form action="/catalogo" className="container-page flex h-10 items-center gap-2 pb-2 md:hidden"><Icon name="search" className="text-on-surface-variant"/><input name="q" aria-label="Buscar productos" placeholder="Buscar productos" className="w-full rounded-lg border border-surface-high bg-surface px-3 py-2 text-body-sm"/></form>
      <nav aria-label="Navegación móvil" className="container-page flex gap-6 overflow-x-auto pb-3 text-label-sm font-semibold md:hidden"><Link href="/">Inicio</Link><Link href="/catalogo">Catálogo</Link><Link href="/catalogo#categorias">Categorías</Link></nav>
    </header>
  </>;
}
