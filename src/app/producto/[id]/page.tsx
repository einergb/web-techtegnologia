import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import AddToCart from "@/components/add-to-cart";
import { formatCop, Producto } from "@/lib/contracts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await apiGet<Producto>(`/api/catalogo/productos/${encodeURIComponent(id)}`);
    return { title: `${product.nombre} | TechStore Colombia`, description: product.descripcion?.slice(0, 155) || `${product.nombre} disponible en TechStore Colombia.` };
  } catch { return { title: "Producto | TechStore Colombia" }; }
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let product: Producto | null = null;
  let errorMessage = "";
  try { product = await apiGet<Producto>(`/api/catalogo/productos/${encodeURIComponent(id)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); errorMessage = error instanceof ApiError ? error.message : "No pudimos cargar este producto."; }
  if (!product) return <main className="container-page min-h-[70vh] py-12"><h1 className="display text-2xl font-bold">No pudimos cargar el producto</h1><p role="status" className="mt-2 text-sm text-[#647174]">{errorMessage}</p><Link href="/catalogo" className="mt-5 inline-flex text-sm font-semibold text-[#a83128]">Volver al catálogo</Link></main>;
  return <main className="container-page min-h-screen py-10"><Link href="/catalogo" className="text-sm font-semibold text-[#136a63]">← Volver al catálogo</Link><div className="mt-7 grid gap-8 md:grid-cols-2"><div><div className="grid min-h-[340px] place-items-center rounded-xl bg-white p-8">{product.imagenUrl ? <img src={product.imagenUrl} alt={product.nombre} className="max-h-[420px] w-full object-contain"/> : <span aria-hidden="true" className="text-8xl text-[#b4c2c9]">◈</span>}</div>{product.imagenes.length > 1 && <div aria-label="Galería de imágenes" className="mt-3 grid grid-cols-4 gap-3">{product.imagenes.map((image) => <div key={image.id} className="grid aspect-square place-items-center rounded border border-[#e0e8ed] bg-white p-2"><img src={image.url} alt={`${product.nombre}${image.esPrincipal ? " imagen principal" : ""}`} className="h-full w-full object-contain"/></div>)}</div>}</div><section className="py-2"><p className="text-xs font-bold uppercase tracking-widest text-[#136a63]">{product.marca || product.categoria}</p><h1 className="display mt-2 text-3xl font-bold md:text-4xl">{product.nombre}</h1><p className="mt-2 text-xs text-[#647174]">SKU: {product.sku}</p><p className="display mt-6 text-3xl font-bold">{formatCop(product.precio)}</p><p className="mt-3 inline-flex rounded-full bg-[#e4f5f1] px-3 py-1 text-xs font-bold text-[#136a63]">{product.stockDisponible} disponibles al consultar</p>{product.descripcion && <p className="mt-6 whitespace-pre-line text-sm leading-6 text-[#475459]">{product.descripcion}</p>}<p className="mt-4 text-sm"><strong>Garantía:</strong> {product.garantiaMeses} meses</p><AddToCart productId={product.id}/>{product.atributos && <dl className="mt-8 divide-y divide-[#e0e8ed] rounded-lg border border-[#e0e8ed] bg-white px-4">{Object.entries(product.atributos).map(([name, value]) => <div key={name} className="flex justify-between gap-4 py-3 text-sm"><dt className="text-[#647174]">{name}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>}</section></div></main>;
}
