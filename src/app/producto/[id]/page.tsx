import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGet, ApiError } from "@/lib/api";
import AddToCart from "@/components/add-to-cart";
import { formatCop, Producto } from "@/lib/contracts";
import { allowedImageUrl } from "@/lib/image-url";
import Icon from "@/components/icon";

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
  let related: Producto[] = [];
  let errorMessage = "";
  try {
    product = await apiGet<Producto>(`/api/catalogo/productos/${encodeURIComponent(id)}`);
    if (product.categoriaId) {
      related = await apiGet<Producto[]>(`/api/catalogo/productos?categoriaId=${product.categoriaId}&page=0&size=12`);
      related = related.filter((item) => item.id !== product!.id).slice(0, 4);
    }
  } catch (error) { if (error instanceof ApiError && error.status === 404) notFound(); errorMessage = error instanceof ApiError ? error.message : "No pudimos cargar este producto."; }
  if (!product) return <main className="container-page min-h-[70vh] py-12"><h1 className="font-display text-headline-md font-bold">No pudimos cargar el producto</h1><p role="status" className="mt-2 text-body-sm text-on-surface-variant">{errorMessage}</p><Link href="/catalogo" className="mt-5 inline-flex text-label-sm font-semibold text-primary">Volver al catálogo</Link></main>;
  const mainImage = allowedImageUrl(product.imagenUrl);
  const gallery = (product.imagenes || []).map((image) => ({ ...image, safeUrl: allowedImageUrl(image.url) })).filter((image) => image.safeUrl);
  return <main className="container-page min-h-screen py-8 md:py-10">
    <nav aria-label="Ruta de navegación" className="text-body-sm text-on-surface-variant"><Link href="/" className="hover:text-secondary">Inicio</Link><span className="px-2">/</span><Link href="/catalogo" className="hover:text-secondary">Catálogo</Link><span className="px-2">/</span>{product.categoria && <><Link href={`/catalogo?categoriaId=${product.categoriaId}`} className="hover:text-secondary">{product.categoria}</Link><span className="px-2">/</span></>}<span className="font-semibold text-on-surface">{product.nombre}</span></nav>
    <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-12">
      <div><div className="grid min-h-[320px] place-items-center rounded-xl bg-white p-8 md:min-h-[480px]">{mainImage ? <img src={mainImage} alt={product.nombre} className="max-h-[440px] w-full object-contain"/> : <div className="text-center text-outline"><Icon name="box" className="mx-auto h-20 w-20"/><p className="mt-3 text-body-sm">Imagen no disponible</p></div>}</div>{gallery.length > 1 && <div aria-label="Galería de imágenes" className="mt-3 grid grid-cols-4 gap-3">{gallery.map((image) => <div key={image.id} className="grid aspect-square place-items-center rounded-lg border border-surface-high bg-white p-2"><img src={image.safeUrl!} alt={`${product.nombre}${image.esPrincipal ? " imagen principal" : ""}`} className="h-full w-full object-contain"/></div>)}</div>}</div>
      <section className="py-2"><p className="text-label-sm font-bold uppercase tracking-widest text-secondary">{product.marca || product.categoria}</p><h1 className="mt-2 font-display text-headline-lg-mobile font-bold md:text-headline-lg">{product.nombre}</h1><p className="mt-2 text-body-sm text-on-surface-variant">SKU: {product.sku}</p><p className="mt-6 font-display text-price-hero font-bold">{formatCop(product.precio)}</p><p className={`mt-3 inline-flex rounded-full px-3 py-1 text-label-sm font-bold ${product.stockDisponible > 0 ? "bg-secondary-container text-secondary" : "bg-surface-high text-on-surface-variant"}`}>{product.stockDisponible > 0 ? "Disponible" : "Agotado"}</p>{product.descripcion && <p className="mt-6 whitespace-pre-line text-body-md leading-7 text-on-surface-variant">{product.descripcion}</p>}<p className="mt-4 text-body-sm"><strong>Garantía:</strong> {product.garantiaMeses} meses</p><AddToCart productId={product.id} disabled={product.stockDisponible <= 0}/>{product.atributos && Object.keys(product.atributos).length > 0 && <dl className="mt-8 divide-y divide-surface-high rounded-lg border border-surface-high bg-white px-4">{Object.entries(product.atributos).map(([name, value]) => <div key={name} className="flex justify-between gap-4 py-3 text-body-sm"><dt className="text-on-surface-variant">{name}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>}</section>
    </div>
    {related.length > 0 && <section className="mt-14"><div className="mb-5 flex items-end justify-between"><div><p className="text-label-sm font-bold uppercase tracking-[.14em] text-secondary">Sigue explorando</p><h2 className="mt-1 font-display text-headline-md font-semibold">Más de {product.categoria}</h2></div><Link href={`/catalogo?categoriaId=${product.categoriaId}`} className="text-label-sm font-bold text-primary">Ver categoría →</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{related.map((item) => { const image = allowedImageUrl(item.imagenUrl); return <Link key={item.id} href={`/producto/${item.id}`} className="overflow-hidden rounded-lg border border-surface-high bg-white"><div className="grid aspect-square place-items-center bg-surface-low p-4">{image ? <img src={image} alt={item.nombre} className="h-full w-full object-contain"/> : <Icon name="box" className="h-12 w-12 text-outline"/>}</div><div className="p-3"><p className="line-clamp-2 min-h-10 text-body-sm font-semibold">{item.nombre}</p><p className="mt-2 font-display text-lg font-bold">{formatCop(item.precio)}</p></div></Link>; })}</div></section>}
  </main>;
}
