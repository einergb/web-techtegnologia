import Link from "next/link";
import type { Metadata } from "next";
import { apiGet, ApiError } from "@/lib/api";
import { Categoria, Producto, formatCop } from "@/lib/contracts";
import { catalogApiPage, catalogHref, normalizeCatalogFilters, productCountLabel } from "@/lib/catalog";
import { catalogCopy } from "@/content/catalogo";
import Icon from "@/components/icon";
import ProductCard from "@/components/storefront/product-card";

type Search = { q?: string; categoriaId?: string; page?: string };
type Store = { envioGratisDesde?: number; iva?: number };
const PAGE_SIZE = 12;
export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  const params = await searchParams;
  const filters = normalizeCatalogFilters(params);
  const page = catalogApiPage(params.page);
  return {
    title: "Catálogo | TechStore Colombia",
    description: "Explora el catálogo de productos de TechStore Colombia.",
    ...(filters.q || page > 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const filters = normalizeCatalogFilters(params);
  const apiPage = catalogApiPage(params.page);
  const pageNumber = apiPage + 1;
  const query = new URLSearchParams({ page: String(apiPage), size: String(PAGE_SIZE) });
  if (filters.q) query.set("q", filters.q);
  if (filters.categoriaId) query.set("categoriaId", filters.categoriaId);

  let products: Producto[] = [];
  let categories: Categoria[] = [];
  let store: Store | null = null;
  let error = "";
  try {
    [products, categories, store] = await Promise.all([
      apiGet<Producto[]>(`/api/catalogo/productos?${query.toString()}`),
      apiGet<Categoria[]>("/api/catalogo/categorias"),
      apiGet<Store>("/api/catalogo/tienda").catch(() => null),
    ]);
  } catch (cause) {
    error = cause instanceof ApiError ? cause.message : "No pudimos cargar el catálogo.";
  }

  const selected = categories.find((category) => String(category.id) === filters.categoriaId);
  const activeFilters = Number(Boolean(filters.q)) + Number(Boolean(filters.categoriaId));
  const clearQueryHref = catalogHref({ categoriaId: filters.categoriaId });
  const categoryHref = (id: number) => catalogHref({ ...filters, categoriaId: String(id) });
  const pageHref = (next: number) => catalogHref(filters, next);
  const hasNext = products.length === PAGE_SIZE;

  return <>
    <div className="border-t border-outline-variant bg-surface-container-low py-2.5">
      <div className="mx-auto flex max-w-7xl items-center px-margin-mobile md:px-margin">
        <form action="/catalogo" method="get" className="relative w-full md:max-w-xl">
          <Icon name="search" className="absolute left-3 top-2.5 h-5 w-5 text-on-surface-variant"/>
          <input name="q" defaultValue={filters.q || ""} placeholder="Busca teclados, audífonos, celulares…" type="text" aria-label="Buscar productos" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-10 pr-10 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"/>
          {filters.categoriaId && <input type="hidden" name="categoriaId" value={filters.categoriaId}/>}
          {filters.q && <Link href={clearQueryHref} aria-label="Limpiar búsqueda" className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"><Icon name="close" className="h-5 w-5"/></Link>}
        </form>
      </div>
    </div>

    <main className="mx-auto min-h-[70vh] w-full max-w-7xl flex-grow px-margin-mobile py-6 md:px-margin">
      <div className="mb-6 flex flex-col justify-between gap-4 border-b border-outline-variant pb-5 md:flex-row md:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-label-sm font-bold uppercase tracking-wider text-secondary"><Icon name="verified" className="h-4 w-4"/><span>{catalogCopy.eyebrow}</span></div>
          <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">Catálogo de Productos</h1>
          <p className="mt-1 text-body-md text-on-surface-variant">{catalogCopy.subtitle}</p>
        </div>
        {typeof store?.iva === "number" && store.iva > 0 && <div className="flex items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-container px-3 py-1 text-label-sm font-semibold text-on-secondary-fixed"><span className="h-2 w-2 animate-pulse rounded-full bg-secondary"/>Precios con IVA incluido</span></div>}
      </div>

      <section aria-label="Controles del catálogo" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-label-md font-semibold text-on-surface">Mostrando {productCountLabel(products.length)}</span>
          {activeFilters > 0 && <span className="hidden h-1.5 w-1.5 rounded-full bg-outline-variant sm:inline-block"/>}
          {selected && <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-label-sm text-on-surface"><span>Filtro: {selected.nombre}</span><Link href={catalogHref({ q: filters.q })} aria-label={`Quitar filtro ${selected.nombre}`} className="hover:text-primary"><Icon name="close" className="h-3 w-3"/></Link></span>}
          {filters.q && <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container-low px-2.5 py-1 text-label-sm text-on-surface"><span>Búsqueda: {filters.q}</span><Link href={clearQueryHref} aria-label="Quitar búsqueda" className="hover:text-primary"><Icon name="close" className="h-3 w-3"/></Link></span>}
        </div>
        {activeFilters > 0 && <Link href="/catalogo" className="inline-flex items-center gap-1 text-label-sm font-semibold text-primary transition-colors hover:text-primary-container"><Icon name="restart_alt" className="h-4 w-4"/><span>Limpiar filtros</span></Link>}
      </section>

      {error ? <section role="alert" className="rounded-xl border border-error/30 bg-error-container p-5 text-on-error-container"><h2 className="font-headline-sm text-headline-sm font-semibold">No pudimos cargar el catálogo</h2><p className="mt-1 text-body-sm">{error}</p><Link href={pageHref(pageNumber)} className="mt-4 inline-flex rounded-lg bg-primary px-3.5 py-1.5 text-label-sm font-semibold text-on-primary hover:bg-primary-container">Reintentar</Link></section> : <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-3">
          <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
              <h2 className="flex items-center gap-2 font-headline-sm text-headline-sm font-bold text-on-surface"><Icon name="tune" className="h-5 w-5 text-secondary"/><span>Filtros</span></h2>
              {activeFilters > 0 && <span className="text-label-sm font-semibold text-secondary">{activeFilters} {activeFilters === 1 ? "Activo" : "Activos"}</span>}
            </div>
            <div className="mb-6 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface">Categorías</h3>
              <div role="radiogroup" aria-label="Filtrar por categoría" className="space-y-2 text-label-sm text-on-surface">
                {categories.map((category) => {
                  const checked = filters.categoriaId === String(category.id);
                  return <Link key={category.id} role="radio" aria-checked={checked} href={checked ? catalogHref({ q: filters.q }) : categoryHref(category.id)} className="group flex items-center justify-between" tabIndex={checked || !filters.categoriaId ? 0 : -1}>
                    <span className="flex items-center gap-2"><span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded-full border ${checked ? "border-secondary" : "border-outline-variant"}`}>{checked && <span className="h-2 w-2 rounded-full bg-secondary"/>}</span><span className={`${checked ? "font-semibold text-secondary" : "group-hover:text-secondary"}`}>{category.nombre}</span></span>
                  </Link>;
                })}
              </div>
            </div>
          </section>
          {typeof store?.envioGratisDesde === "number" && <div className="rounded-lg border border-secondary/30 bg-secondary-container/30 p-4"><div className="flex items-start gap-2.5"><Icon name="local_shipping" className="h-5 w-5 text-secondary"/><div><h3 className="text-label-md font-bold text-secondary">{catalogCopy.shippingTitle}</h3><p className="mt-0.5 text-body-sm text-on-surface-variant">{catalogCopy.shippingPrefix} {formatCop(store.envioGratisDesde)} {catalogCopy.shippingSuffix}</p></div></div></div>}
        </aside>

        <section aria-label="Productos del catálogo" className="space-y-6 lg:col-span-9">
          {products.length > 0 ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.id} product={product} variant="catalogo"/>)}</div> : activeFilters > 0 ? <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5 transition-all duration-200 md:p-6"><div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-start gap-3.5"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container-lowest text-secondary"><Icon name="lightbulb" className="h-5 w-5"/></div><div><h2 className="font-headline-sm text-base font-semibold text-on-surface">¿No encontraste lo que buscabas?</h2><p className="mt-0.5 text-body-sm text-on-surface-variant">{filters.q ? <>No encontramos coincidencias para <span className="font-semibold text-on-surface">&quot;{filters.q}&quot;</span>. Prueba con otra búsqueda o quita algunos filtros activos.</> : "No hay productos en esta categoría. Prueba otra categoría o quita los filtros activos."}</p></div></div><Link href="/catalogo" className="shrink-0 self-end rounded-lg bg-secondary px-3.5 py-1.5 text-label-sm text-on-secondary transition-colors hover:bg-secondary/90 sm:self-center">Ver todo el catálogo</Link></div></div> : <p className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-6 text-body-sm text-on-surface-variant">Aún no hay productos disponibles</p>}
          {(products.length > 0 || apiPage > 0) && <nav aria-label="Paginación de catálogo" className="flex items-center justify-between border-t border-outline-variant pb-2 pt-6">
            {apiPage > 0 ? <Link href={pageHref(pageNumber - 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface-variant transition-colors hover:bg-surface-container-low"><Icon name="chevron_left" className="h-4 w-4"/><span>Anterior</span></Link> : <span aria-disabled="true" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface-variant opacity-50"><Icon name="chevron_left" className="h-4 w-4"/><span>Anterior</span></span>}
            <div className="flex items-center gap-1"><span aria-current="page" className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-label-sm font-bold text-on-secondary">{pageNumber}</span></div>
            {hasNext ? <Link href={pageHref(pageNumber + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface transition-colors hover:bg-surface-container-low"><span>Siguiente</span><Icon name="chevron_right" className="h-4 w-4"/></Link> : <span aria-disabled="true" className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-label-sm text-on-surface-variant opacity-50"><span>Siguiente</span><Icon name="chevron_right" className="h-4 w-4"/></span>}
          </nav>}
        </section>
      </div>}
    </main>
  </>;
}
