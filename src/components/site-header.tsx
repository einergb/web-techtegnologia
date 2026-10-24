"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icon from "@/components/icon";
import AnnouncementBar from "@/components/storefront/announcement-bar";

type Category = { id: number; nombre: string };
type Props = { store: { nombre?: string; envioGratisDesde?: number } | null };

export default function SiteHeader({ store }: Props) {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let active = true;
    const refreshCart = () => {
      fetch("/api/backend/api/carrito", { cache: "no-store" }).then(async (response) => {
        if (!response.ok) return;
        const cart = await response.json();
        if (active) setCartCount(Array.isArray(cart.items) ? cart.items.reduce((n: number, item: { cantidad?: number }) => n + (item.cantidad || 0), 0) : 0);
      }).catch(() => undefined);
    };
    window.addEventListener("techstore:cart-updated", refreshCart);
    fetch("/api/backend/api/catalogo/categorias", { cache: "no-store" }).then(async (response) => {
      if (response.ok) { const data = await response.json(); if (active && Array.isArray(data)) setCategories(data); }
    }).catch(() => undefined);
    refreshCart();
    fetch("/api/backend/api/admin/inventario/stock-bajo", { cache: "no-store" }).then((response) => {
      if (active && response.ok) setIsAdmin(true);
    }).catch(() => undefined);
    return () => { active = false; window.removeEventListener("techstore:cart-updated", refreshCart); };
  }, []);

  if (pathname.startsWith("/admin")) return null;
  const activeHome = pathname === "/";
  const activeCatalog = pathname === "/catalogo";
  return <>
    <AnnouncementBar freeShippingFrom={store?.envioGratisDesde}/>
    <header className="sticky top-0 z-40 border-b border-outline-variant/60 bg-surface-container-lowest shadow-sm">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-space-md px-margin-mobile md:px-margin">
        <div className="flex flex-1 items-center gap-space-lg">
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="TechStore Colombia, inicio"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary font-display text-headline-sm font-bold text-on-secondary shadow-sm transition-transform group-hover:scale-105"><Icon name="bolt" className="h-6 w-6"/></span><span className="font-display text-headline-md font-bold tracking-tight text-on-surface">TechStore <span className="text-label-md font-medium text-secondary">Colombia</span></span></Link>
          {!activeCatalog && <form action="/catalogo" method="get" className="relative hidden max-w-md flex-1 items-center lg:flex"><Icon name="search" className="absolute left-3 h-5 w-5 text-on-surface-variant"/><input name="q" className="w-full rounded-lg border border-outline-variant/70 bg-surface-container-low py-2 pl-10 pr-4 text-body-sm text-on-surface transition-all placeholder:text-on-surface-variant focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20" placeholder="Busca teclados, audífonos, celulares..." type="search" aria-label="Buscar productos"/></form>}
        </div>
        <nav aria-label="Navegación principal" className="hidden items-center gap-space-lg md:flex">
          <Link href="/" aria-current={activeHome ? "page" : undefined} className={`${activeHome ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"} border-b-2 pb-1 text-label-md font-bold transition-colors duration-150`}>Inicio</Link>
          <Link href="/catalogo" aria-current={activeCatalog ? "page" : undefined} className={`${activeCatalog ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"} border-b-2 pb-1 text-label-md font-bold transition-colors duration-150`}>Catálogo</Link>
          <div className="group relative"><Link href="/catalogo" className="flex items-center gap-1 py-1 text-label-md font-medium text-on-surface-variant transition-colors duration-150 hover:text-primary">Categorías<Icon name="expand_more" className="h-[18px] w-[18px]"/></Link><div className="invisible absolute left-0 top-full z-50 mt-2 hidden w-56 rounded-xl border border-outline-variant/60 bg-surface-container-lowest py-2 opacity-0 shadow-xl transition group-hover:visible group-hover:block group-hover:opacity-100 group-focus-within:visible group-focus-within:block group-focus-within:opacity-100">{categories.map((category) => <Link key={category.id} href={`/catalogo?categoriaId=${category.id}`} className="block px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">{category.nombre}</Link>)}{!categories.length && <Link href="/catalogo" className="block px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">Ver categorías</Link>}</div></div>
          {isAdmin && <Link href="/admin" className="hidden items-center gap-1.5 rounded-lg border border-secondary/30 px-3 py-1.5 text-label-sm text-secondary transition-colors hover:bg-secondary-fixed/30 sm:inline-flex"><Icon name="admin_panel_settings" className="h-4 w-4"/>Consola Admin</Link>}
        </nav>
        <div className="flex items-center gap-space-md"><Link href="/cuenta" className="flex items-center gap-2 transition-opacity hover:opacity-80" aria-label="Mi cuenta"><span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-container-high"><Icon name="person" className="h-5 w-5 text-on-surface-variant"/></span><span className="hidden text-label-md font-medium text-on-surface xl:inline">Mi cuenta</span></Link><Link href="/carrito" aria-label={cartCount === null ? "Abrir carrito de compras" : `Abrir carrito de compras, ${cartCount} productos`} className="relative flex items-center justify-center rounded-lg bg-surface-container p-2.5 transition-colors duration-100 hover:bg-surface-container-high active:scale-95"><Icon name="shopping_cart" className="h-[22px] w-[22px] text-on-surface"/>{cartCount !== null && cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-primary shadow-sm">{cartCount}</span>}</Link></div>
      </div>
    </header>
  </>;
}
