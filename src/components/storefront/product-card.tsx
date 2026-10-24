import Link from "next/link";
import { Producto, formatCop } from "@/lib/contracts";
import { allowedImageUrl } from "@/lib/image-url";
import Icon from "@/components/icon";
import AddToCart from "@/components/add-to-cart";

export default function ProductCard({ product, variant = "home" }: { product: Producto; variant?: "home" | "catalogo" }) {
  const image = allowedImageUrl(product.imagenUrl);
  if (variant === "catalogo") {
    const attributes = Object.entries(product.atributos || {}).filter(([, value]) => value !== "" && value != null).slice(0, 2);
    return <article className="group flex flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition-all duration-200 hover:shadow-md">
      <div>
        <Link href={`/producto/${product.id}`} aria-label={`Ver ${product.nombre}`} className="relative flex h-52 items-center justify-center overflow-hidden bg-surface-container-low p-4">
          {image ? <img src={image} alt={product.nombre} className="h-40 w-auto object-contain transition-transform duration-300 group-hover:scale-105"/> : <Icon name="image" className="h-14 w-14 text-outline"/>}
        </Link>
        <div className="space-y-2 p-4">
          <span className="text-label-sm text-on-surface-variant">{product.categoria}</span>
          <Link href={`/producto/${product.id}`} className="block"><h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-secondary">{product.nombre}</h2></Link>
          {attributes.length > 0 && <div className="flex flex-wrap gap-1.5 pt-1">{attributes.map(([key, value]) => <span key={key} className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">{key}: {value}</span>)}</div>}
        </div>
      </div>
      <div className="p-4 pt-0">
        <div className="mb-3 flex items-baseline justify-between gap-2 border-t border-outline-variant pt-3">
          <p className="font-price-card text-price-card text-on-surface">{formatCop(product.precio)}</p>
          {product.garantiaMeses > 0 && <span className="shrink-0 text-[11px] font-semibold text-secondary">Garantía {product.garantiaMeses}m</span>}
        </div>
        <AddToCart productId={product.id} disabled={product.stockDisponible <= 0} icon="shopping_cart" className="h-auto w-full justify-center rounded-lg px-3 py-2 text-label-md active:scale-[.98]"/>
      </div>
    </article>;
  }
  return <article className="group flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md">
    <div><Link href={`/producto/${product.id}`} aria-label={`Ver ${product.nombre}`} className="relative flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-low p-3">{image ? <img src={image} alt={product.nombre} className="h-full w-full rounded object-cover transition-transform duration-300 group-hover:scale-105"/> : <Icon name="image" className="h-14 w-14 text-outline"/>}</Link><div className="mt-4 space-y-1"><span className="text-label-sm font-medium text-on-surface-variant">{product.categoria}</span><Link href={`/producto/${product.id}`} className="block"><h3 className="line-clamp-1 font-headline-sm text-headline-sm font-bold text-on-surface transition-colors group-hover:text-secondary">{product.nombre}</h3></Link></div></div>
    <div className="mt-5 flex items-center justify-between gap-2 border-t border-outline-variant/60 pt-3"><div><span className="text-[11px] font-semibold uppercase text-on-surface-variant">Precio</span><p className="font-price-card text-price-card font-bold text-on-surface">{formatCop(product.precio)}</p></div><AddToCart productId={product.id} disabled={product.stockDisponible <= 0} fullWidth={false} autoHeight label="Añadir" icon="add" className="gap-1 rounded-lg px-3 py-2 text-label-sm transition-transform active:scale-95"/></div>
  </article>;
}
