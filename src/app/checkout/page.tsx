import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { apiGet, apiGetProtected, ApiError } from "@/lib/api";
import type { Carrito, Direccion } from "@/lib/contracts";
import CheckoutFlow from "@/components/checkout-flow";

type Store = { iva?: number };
type Search = { cupon?: string };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout | TechStore Colombia", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  try {
    const [cart, addresses, store] = await Promise.all([
      apiGetProtected<Carrito>("/api/carrito"),
      apiGetProtected<Direccion[]>("/api/direcciones"),
      apiGet<Store>("/api/catalogo/tienda").catch(() => null),
    ]);
    return <CheckoutFlow initialCart={cart} initialAddresses={addresses} ivaRate={store?.iva} initialCouponCode={params.cupon || ""}/>;
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 401) redirect("/cuenta?returnUrl=%2Fcheckout");
    return <CheckoutFlow initialError={cause instanceof ApiError ? cause.message : "No pudimos conectar con la tienda."} initialCouponCode={params.cupon || ""}/>;
  }
}
