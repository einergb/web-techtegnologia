import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiGet, apiGetProtected, ApiError } from "@/lib/api";
import type { Carrito } from "@/lib/contracts";
import CartView from "@/components/cart-view";

type Store = { iva?: number };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Carrito | TechStore Colombia", robots: { index: false, follow: false } };

export default async function CartPage() {
  try {
    const [cart, store] = await Promise.all([
      apiGetProtected<Carrito>("/api/carrito"),
      apiGet<Store>("/api/catalogo/tienda").catch(() => null),
    ]);
    return <CartView initialCart={cart} ivaRate={store?.iva}/>;
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) redirect("/cuenta?returnUrl=%2Fcarrito");
    return <CartView initialError={cause instanceof ApiError ? cause.message : "No pudimos conectar con la tienda."}/>;
  }
}
