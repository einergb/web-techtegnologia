import Link from "next/link";
import type { Metadata } from "next";
import { apiGet, ApiError } from "@/lib/api";
import { Categoria, Producto, formatCop } from "@/lib/contracts";
import { allowedImageUrl } from "@/lib/image-url";
import Icon from "@/components/icon";

type Search = { q?: string; categoriaId?: string; page?: string };
type Store = { iva?: number };

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catálogo de tecnología | TechStore Colombia", description: "Busca productos de tecnología disponibles en TechStore Colombia." };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const page = Math.max(0, Number.parseInt(params.page || "0", 10) || 0);
  const query = new URLSearchParams({ page: String(page), size: "12" });
  if (params.q) query.set("q", params.q);
  if (params.categoriaId) query.set("categoriaId", params.categoriaId);
  const linkForPage = (nextPage: number) => { const next = new URLSearchParams({ page: String(nextPage) }); if (params.q) next.set("q", params.q); if (params.categoriaId) next.set("categoriaId", params.categoriaId); return `/catalogo?${next.toString()}`; };
  const linkForCategory = (categoryId: number) => { const next = new URLSearchParams({ page: "0", categoriaId: String(categoryId) }); if (params.q) next.set("q", params.q); return `/catalogo?${next.toString()}`; };
  let products: Producto[] = [];
  let categories: Categoria[] = [];
  let store: Store | null = null;
  let error = "";
  try { [products, categories, store] = await Promise.all([apiGet<Producto[]>(`/api/catalogo/productos?${query.toString()}`), apiGet<Categoria[]>("/api/catalogo/categorias"), apiGet<Store>("/api/catalogo/tienda").catch(() => null)]); }
  catch (cause) { error = cause instanceof ApiError ? cause.message : "No pudimos cargar el catálogo."; }
  const selected = categories.find((category) => String(category.id) === params.categoriaId);
  return <main className="container-page min-h-[70vh] py-8 md:py-10">
    <nav aria-label="Ruta de navegación" className="text-body-sm text-on-surface-variant"><Link href="/" className="hover:text-secondary">Inicio</Link><span className="px-2">/</span><span className="font-semibold text-on-surface">Catálogo</span></nav>
    <div className="mt-6 grid gap-5 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-label-sm font-bold uppercase tracking-[.14em] text-secondary">TechStore Colombia</p><h1 className="mt-1 font-display text-headline-lg font-bold">{selected?.nombre || "Catálogo"}</h1><p className="mt-2 text-body-md text-on-surface-variant">Busca tecnología para trabajar, crear y disfrutar.</p></div><form action="/catalogo" className="flex h-11 w-full gap-2 md:max-w-lg"><input name="q" defaultValue={params.q} placeholder="Buscar productos…" aria-label="Buscar productos" className="min-w-0 flex-1 rounded-lg border border-surface-high bg-white px-3 text-body-sm"/><button className="rounded-lg bg-primary px-4 text-label-sm font-bold text-white">Buscar</button></form></div>
    {store?.iva !== undefined && <p className="mt-4 inline-flex rounded-full bg-secondary-container px-3 py-1 text-label-sm font-semibold text-secondary">IVA: {new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 2 }).format(store.iva > 1 ? store.iva / 100 : store.iva)}</p>}
    <nav id="categorias" aria-label="Filtrar por categoría" className="mt-6 flex gap-2 overflow-x-auto pb-2"><Link href={params.q ? `/catalogo?q=${encodeURIComponent(params.q)}` : "/catalogo"} className={`whitespace-nowrap rounded-full border px-4 py-2 text-label-sm font-semibold ${!params.categoriaId ? "border-secondary bg-secondary text-white" : "border-surface-high bg-white"}`}>Todas</Link>{categories.map((category) => <Link key={category.id} href={linkForCategory(category.id)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-label-sm font-semibold ${params.categoriaId === String(category.id) ? "border-secondary bg-secondary text-white" : "border-surface-high bg-white hover:border-secondary"}`}>{category.nombre}</Link>)}</nav>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-y border-surface-high py-3"><p className="text-body-sm text-on-surface-variant">Mostrando {products.length} productos</p>{params.q && <p className="text-body-sm text-on-surface-variant">Búsqueda: <strong className="text-on-surface">{params.q}</strong></p>}</div>
    {error ? <p role="status" className="mt-6 rounded-lg border border-surface-high bg-white p-5 text-body-sm text-on-surface-variant">{error}</p> : products.length ? <><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">{products.map((product) => { const image = allowedImageUrl(product.imagenUrl); return <article key={product.id} className="overflow-hidden rounded-lg border border-surface-high bg-white transition hover:-translate-y-0.5 hover:shadow-md"><Link href={`/producto/${product.id}`}><div className="grid aspect-square place-items-center bg-surface-low p-5">{image ? <img src={image} alt={product.nombre} className="h-full w-full object-contain"/> : <Icon name="box" className="h-14 w-14 text-outline"/>}</div><div className="p-4"><p className="text-label-sm font-semibold uppercase text-on-surface-variant">{product.categoria}</p><h2 className="mt-1 line-clamp-2 min-h-10 text-body-md font-semibold">{product.nombre}</h2><p className="mt-3 font-display text-price-card font-bold">{formatCop(product.precio)}</p></div></Link></article>; })}</div><nav aria-label="Paginación del catálogo" className="mt-8 flex justify-center gap-3">{page > 0 && <Link href={linkForPage(page - 1)} className="rounded-lg border border-surface-high bg-white px-4 py-2 text-label-sm font-semibold">← Anterior</Link>}<span className="px-3 py-2 text-body-sm text-on-surface-variant">Página {page + 1}</span>{products.length === 12 && <Link href={linkForPage(page + 1)} className="rounded-lg border border-surface-high bg-white px-4 py-2 text-label-sm font-semibold">Siguiente →</Link>}</nav></> : <p className="mt-6 rounded-lg border border-dashed border-outline-variant bg-white p-6 text-body-sm text-on-surface-variant">No encontramos productos con estos criterios.</p>}
  </main>;
}
