import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import { Categoria, Producto, formatCop } from "@/lib/contracts";
import { allowedImageUrl } from "@/lib/image-url";
import { storeBenefits } from "@/lib/store-content";
import Icon from "@/components/icon";

export const dynamic = "force-dynamic";

async function getStorefront() {
  try {
    const [categories, products] = await Promise.all([
      apiGet<Categoria[]>("/api/catalogo/categorias"),
      apiGet<Producto[]>("/api/catalogo/productos?page=0&size=8"),
    ]);
    return { categories, products, error: "" };
  } catch (error) {
    return { categories: [], products: [], error: error instanceof ApiError ? error.message : "No pudimos cargar la tienda." };
  }
}

export default async function Home() {
  const { categories, products, error } = await getStorefront();
  const hero = products[0];
  const heroImage = allowedImageUrl(hero?.imagenUrl);
  return <main>
    <section className="container-page py-6 md:py-9">
      <div className="grid min-h-[390px] overflow-hidden rounded-xl bg-secondary text-white md:grid-cols-[1.1fr_.9fr]">
        <div className="flex flex-col justify-center px-6 py-10 md:px-12 md:py-14">
          <p className="text-label-sm font-bold uppercase tracking-[.14em] text-secondary-container">Tecnología para tu día a día</p>
          <h1 className="mt-4 max-w-[580px] font-display text-display-mobile font-bold leading-tight md:text-display">Todo lo que necesitas, a un clic.</h1>
          <p className="mt-4 max-w-[440px] text-body-md text-white/80">Descubre productos de tecnología disponibles en TechStore Colombia.</p>
          <Link href="/catalogo" className="mt-7 inline-flex h-12 w-fit items-center gap-3 rounded-lg bg-primary px-5 text-label-md font-bold text-white transition hover:bg-primary-container">Explorar catálogo <Icon name="arrow"/></Link>
        </div>
        <div className="relative grid min-h-[260px] place-items-center bg-white/5 p-8">
          {heroImage ? <><img src={heroImage} alt={hero?.nombre || "Producto destacado de TechStore"} className="max-h-[330px] w-full object-contain"/><div className="absolute inset-x-5 bottom-5 rounded-lg bg-white p-4 text-on-surface shadow-lg"><p className="text-label-sm font-semibold text-secondary">Producto destacado</p><p className="mt-1 line-clamp-1 font-display text-lg font-bold">{hero?.nombre}</p><p className="mt-1 font-display text-price-card font-bold">{formatCop(hero!.precio)}</p><Link href={`/producto/${hero!.id}`} className="mt-2 inline-flex items-center gap-2 text-label-sm font-bold text-primary">Ver producto <Icon name="arrow" className="h-4 w-4"/></Link></div></> : <div className="text-center"><Icon name="box" className="mx-auto h-16 w-16 text-white/70"/><p className="mt-3 text-body-sm text-white/75">Explora el catálogo de la tienda</p></div>}
        </div>
      </div>
    </section>

    <section id="categorias" className="container-page py-8">
      <div className="mb-5 flex items-end justify-between"><div><p className="text-label-sm font-bold uppercase tracking-[.14em] text-secondary">Explora la tienda</p><h2 className="mt-1 font-display text-headline-md font-semibold">Compra por categoría</h2></div><Link href="/catalogo" className="text-label-sm font-bold text-primary">Ver catálogo <span aria-hidden="true">→</span></Link></div>
      {categories.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{categories.slice(0, 6).map((category) => <Link key={category.id} href={`/catalogo?categoriaId=${category.id}`} className="group rounded-lg border border-surface-high bg-white p-4 transition hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-md"><span className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-surface-low text-secondary"><Icon name="box"/></span><span className="block text-label-md font-bold">{category.nombre}</span><span className="mt-1 block text-body-sm text-on-surface-variant">Explorar <span aria-hidden="true">→</span></span></Link>)}</div> : <p className="rounded-lg border border-dashed border-outline-variant bg-white p-6 text-body-sm text-on-surface-variant">Las categorías aparecerán aquí cuando la tienda esté conectada.</p>}
    </section>

    <section className="mt-7 bg-white py-11"><div className="container-page"><div className="mb-6 flex items-end justify-between"><div><p className="text-label-sm font-bold uppercase tracking-[.14em] text-secondary">Selección TechStore</p><h2 className="mt-1 font-display text-headline-md font-semibold">Productos destacados</h2></div><Link href="/catalogo" className="text-label-sm font-bold text-primary">Ver catálogo <span aria-hidden="true">→</span></Link></div>
      {error ? <div role="status" className="rounded-lg border border-surface-high bg-surface px-5 py-6"><p className="font-semibold">Conecta con la tienda para ver el catálogo</p><p className="mt-1 text-body-sm text-on-surface-variant">{error}</p></div> : products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">{products.map((product) => { const image = allowedImageUrl(product.imagenUrl); return <article key={product.id} className="group overflow-hidden rounded-lg border border-surface-high bg-white transition hover:-translate-y-0.5 hover:shadow-md"><Link href={`/producto/${product.id}`}><div className="grid aspect-square place-items-center bg-surface-low p-5">{image ? <img src={image} alt={product.nombre} className="h-full w-full object-contain"/> : <Icon name="box" className="h-14 w-14 text-outline"/>}</div><div className="p-4"><p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">{product.categoria}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-body-md font-semibold leading-5">{product.nombre}</h3><p className="mt-3 font-display text-price-card font-bold">{formatCop(product.precio)}</p></div></Link></article>; })}</div> : <p className="rounded-lg border border-dashed border-outline-variant bg-surface p-6 text-body-sm text-on-surface-variant">Todavía no hay productos disponibles para mostrar.</p>}
    </div></section>
    <section className="container-page grid gap-3 py-10 md:grid-cols-3">{storeBenefits.map((benefit) => <article key={benefit.title} className="flex gap-3 rounded-lg bg-surface-low p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-secondary"><Icon name={benefit.icon}/></span><div><h2 className="text-label-md font-bold">{benefit.title}</h2><p className="mt-1 text-body-sm text-on-surface-variant">{benefit.description}</p></div></article>)}</section>
  </main>;
}
