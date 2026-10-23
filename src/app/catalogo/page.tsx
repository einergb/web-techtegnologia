import Link from "next/link";
import type { Metadata } from "next";
import { apiGet, ApiError } from "@/lib/api";
import { Categoria, Producto, formatCop } from "@/lib/contracts";

type Search = { q?: string; categoriaId?: string; page?: string };

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Catálogo de tecnología | TechStore Colombia", description: "Busca computadores, celulares, audio, gaming y accesorios en TechStore Colombia." };

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const page = Math.max(0, Number.parseInt(params.page || "0", 10) || 0);
  const query = new URLSearchParams({ page: String(page), size: "12" });
  if (params.q) query.set("q", params.q);
  if (params.categoriaId) query.set("categoriaId", params.categoriaId);
  const linkForPage = (nextPage: number) => {
    const next = new URLSearchParams({ page: String(nextPage) });
    if (params.q) next.set("q", params.q);
    if (params.categoriaId) next.set("categoriaId", params.categoriaId);
    return `/catalogo?${next.toString()}`;
  };
  const linkForCategory = (categoryId: number) => {
    const next = new URLSearchParams({ page: "0", categoriaId: String(categoryId) });
    if (params.q) next.set("q", params.q);
    return `/catalogo?${next.toString()}`;
  };
  let products: Producto[] = [];
  let categories: Categoria[] = [];
  let error = "";
  try {
    [products, categories] = await Promise.all([
      apiGet<Producto[]>(`/api/catalogo/productos?${query.toString()}`),
      apiGet<Categoria[]>("/api/catalogo/categorias"),
    ]);
  } catch (cause) { error = cause instanceof ApiError ? cause.message : "No pudimos cargar el catálogo."; }
  return <main className="container-page min-h-screen py-10">
    <Link href="/" className="text-sm font-semibold text-[#136a63]">← Volver a la tienda</Link>
    <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#136a63]">TechStore Colombia</p><h1 className="display mt-1 text-3xl font-bold">Catálogo</h1><p className="mt-2 text-sm text-[#647174]">Busca tecnología para trabajar, crear y disfrutar.</p></div><form action="/catalogo" className="flex h-11 w-full max-w-lg gap-2"><input name="q" defaultValue={params.q} placeholder="Buscar productos…" aria-label="Buscar productos" className="min-w-0 flex-1 rounded border border-[#dce5ea] bg-white px-3 text-sm"/><button className="rounded bg-[#a83128] px-4 text-sm font-bold text-white">Buscar</button></form></div>
    <div className="mt-8 flex gap-2 overflow-x-auto pb-2"><Link href={params.q ? `/catalogo?q=${encodeURIComponent(params.q)}` : "/catalogo"} className="whitespace-nowrap rounded-full border border-[#dce5ea] bg-white px-4 py-2 text-xs font-semibold">Todas</Link>{categories.map((category) => <Link key={category.id} href={linkForCategory(category.id)} className="whitespace-nowrap rounded-full border border-[#dce5ea] bg-white px-4 py-2 text-xs font-semibold hover:border-[#136a63]">{category.nombre}</Link>)}</div>
    {error ? <p role="status" className="mt-8 rounded-lg border border-[#e0e8ed] bg-white p-5 text-sm text-[#647174]">{error}</p> : products.length ? <><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">{products.map((product) => <article key={product.id} className="overflow-hidden rounded-lg border border-[#e0e8ed] bg-white"><Link href={`/producto/${product.id}`}><div className="relative grid aspect-square place-items-center bg-[#eef4fa] p-5">{product.imagenUrl ? <img src={product.imagenUrl} alt={product.nombre} className="h-full w-full object-contain"/> : <span aria-hidden="true" className="text-5xl text-[#b4c2c9]">◈</span>}<span className="absolute left-3 top-3 rounded-full bg-[#e4f5f1] px-2 py-1 text-[10px] font-bold text-[#136a63]">{product.stockDisponible} disp.</span></div><div className="p-4"><p className="text-[10px] font-bold uppercase text-[#647174]">{product.marca || product.categoria || "Tecnología"}</p><h2 className="mt-1 min-h-10 text-sm font-semibold">{product.nombre}</h2><p className="display mt-3 text-lg font-bold">{formatCop(product.precio)}</p></div></Link></article>)}</div><nav aria-label="Paginación del catálogo" className="mt-8 flex justify-center gap-3">{page > 0 && <Link href={linkForPage(page-1)} className="rounded border border-[#dce5ea] bg-white px-4 py-2 text-sm font-semibold">← Anterior</Link>}<span className="px-3 py-2 text-sm text-[#647174]">Página {page+1}</span>{products.length === 12 && <Link href={linkForPage(page+1)} className="rounded border border-[#dce5ea] bg-white px-4 py-2 text-sm font-semibold">Siguiente →</Link>}</nav></> : <p className="mt-8 rounded-lg border border-dashed border-[#d5e0e6] bg-white p-6 text-sm text-[#647174]">No encontramos productos con estos criterios.</p>}
  </main>;
}
