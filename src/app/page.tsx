import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import { Categoria, Producto, formatCop } from "@/lib/contracts";

export const dynamic = "force-dynamic";

type Store = { nombre?: string; moneda?: string; envioGratisDesde?: number; iva?: number };

async function getStorefront() {
  try {
    const [store, categories, products] = await Promise.all([
      apiGet<Store>("/api/catalogo/tienda"),
      apiGet<Categoria[]>("/api/catalogo/categorias"),
      apiGet<Producto[]>("/api/catalogo/productos?page=0&size=8"),
    ]);
    return { store, categories, products, error: "" };
  } catch (error) {
    return { store: null, categories: [], products: [], error: error instanceof ApiError ? error.message : "No pudimos cargar la tienda." };
  }
}

export default async function Home() {
  const { store, categories, products, error } = await getStorefront();
  return <>
    <div className="bg-[#136a63] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white">{store?.envioGratisDesde ? `Envío gratis desde ${formatCop(store.envioGratisDesde)}` : "Compra segura en Colombia"} · Compra protegida</div>
    <main>
      <section className="container-page py-7 md:py-10">
        <div className="relative isolate min-h-[350px] overflow-hidden rounded-xl bg-[#152a33] text-white md:min-h-[390px]">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,#286776_0%,transparent_36%),linear-gradient(115deg,#13262e_10%,#1c414b_72%,#276a70)]"/>
          <div className="absolute -right-12 top-4 hidden h-[360px] w-[480px] rotate-[-12deg] items-center justify-center md:flex"><div className="absolute h-[310px] w-[310px] rounded-full border border-white/10 bg-white/[.04]"/><div className="absolute h-[240px] w-[240px] rounded-full border border-white/10"/><div className="relative flex h-[175px] w-[280px] -rotate-6 flex-col justify-between rounded-[20px] border border-white/30 bg-gradient-to-br from-[#d2e5e6] via-[#82999b] to-[#213439] p-4 shadow-2xl"><div className="h-2 w-12 rounded-full bg-black/60"/><div className="self-end text-[10px] font-bold tracking-[.4em] text-white/80">PRO</div><div className="flex items-end justify-between"><span className="text-[11px] font-semibold text-white/80">SERIE X</span><span className="h-12 w-12 rounded-xl border border-white/30 bg-black/60 shadow-inner"/></div></div></div>
          <div className="max-w-[680px] px-7 py-11 md:px-14 md:py-[72px]"><span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.17em]"><span className="h-1.5 w-1.5 rounded-full bg-[#9fe4d8]"/>Tecnología que te mueve</span><h1 className="display mt-5 max-w-[570px] text-[38px] font-bold leading-[1.08] tracking-[-.035em] md:text-[52px]">Todo lo que necesitas, <span className="text-[#a5eee4]">a un clic.</span></h1><p className="mt-4 max-w-[430px] text-[15px] leading-6 text-white/75">Descubre tecnología para trabajar, crear y disfrutar. Compra fácil, con respaldo colombiano.</p><Link href="/catalogo" className="mt-7 inline-flex h-11 items-center gap-3 rounded bg-[#a83128] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#8e281f]">Explorar productos <span aria-hidden="true">→</span></Link><div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/70"><span>✓ Pagos protegidos</span><span>✓ Garantía oficial</span><span>✓ Envíos nacionales</span></div></div>
        </div>
      </section>

      <section className="container-page pb-12">
        <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#136a63]">Explora la tienda</p><h2 className="display mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">Compra por categoría</h2></div><Link href="/catalogo" className="text-sm font-semibold text-[#a83128]">Ver todo <span aria-hidden="true">→</span></Link></div>
        {categories.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">{categories.slice(0,6).map((category, index) => <Link key={category.id} href={`/catalogo?categoriaId=${category.id}`} className="group rounded-lg border border-[#e0e8ed] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#136a63]/40 hover:shadow-[0_4px_16px_rgba(22,29,32,.06)]"><span className={`mb-5 grid h-11 w-11 place-items-center rounded-lg text-xl ${index%3===0?"bg-[#fbe9e6] text-[#a83128]":index%3===1?"bg-[#e4f5f1] text-[#136a63]":"bg-[#eef4fa] text-[#465b69]"}`}>{["⌘","◉","▱","⌁","◎","⌂"][index%6]}</span><span className="block text-sm font-bold">{category.nombre}</span><span className="mt-1 block text-xs text-[#647174]">Explorar <span aria-hidden="true">→</span></span></Link>)}</div> : <div className="rounded-lg border border-dashed border-[#d5e0e6] bg-white/60 p-6 text-sm text-[#647174]">Las categorías aparecerán aquí cuando la tienda esté conectada.</div>}
      </section>

      <section className="bg-white py-12"><div className="container-page"><div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#136a63]">Selección TechStore</p><h2 className="display mt-1 text-2xl font-semibold tracking-tight md:text-[28px]">Encuentra tu próximo favorito</h2></div><Link href="/catalogo" className="text-sm font-semibold text-[#a83128]">Ver catálogo <span aria-hidden="true">→</span></Link></div>
      {error ? <div role="status" className="rounded-lg border border-[#e0e8ed] bg-[#f4faff] px-5 py-6"><p className="font-semibold">Conecta con la tienda para ver el catálogo</p><p className="mt-1 text-sm text-[#647174]">{error}</p></div> : products.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-5">{products.map((product) => <article key={product.id} className="group overflow-hidden rounded-lg border border-[#e0e8ed] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(22,29,32,.06)]"><Link href={`/producto/${product.id}`}><div className="relative grid aspect-square place-items-center bg-[#f4faff] p-5">{product.imagenUrl ? <img src={product.imagenUrl} alt={product.nombre} className="h-full w-full object-contain"/> : <span aria-hidden="true" className="text-6xl text-[#b4c2c9]">◈</span>}<span className="absolute left-3 top-3 rounded-full bg-[#e4f5f1] px-2.5 py-1 text-[10px] font-bold text-[#136a63]">{product.stockDisponible} disponibles</span></div><div className="p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-[#647174]">{product.marca || product.categoria || "Tecnología"}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5">{product.nombre}</h3><p className="display mt-3 text-lg font-bold">{formatCop(product.precio)}</p></div></Link></article>)}</div> : <div className="rounded-lg border border-dashed border-[#d5e0e6] bg-[#f4faff] p-6 text-sm text-[#647174]">Todavía no hay productos disponibles para mostrar.</div>}</div></section>
    </main>
    <footer className="bg-[#152a33] py-8 text-white"><div className="container-page flex flex-col justify-between gap-3 text-sm sm:flex-row sm:items-center"><span className="display font-bold">tech<span className="text-[#a5eee4]">store</span> Colombia</span><span className="text-white/60">Tecnología con respaldo local · {store?.nombre || "TechStore Colombia"}</span></div></footer>
  </>;
}
