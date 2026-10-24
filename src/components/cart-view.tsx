"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Carrito, CarritoItem, ValidacionCupon } from "@/lib/contracts";
import { cartViewState, productQuantityLabel, requiresLogin } from "@/lib/checkout-ui";
import { CheckoutShell, CartItemRow, CouponBox, EmptyCart, OrderSummary } from "@/components/checkout/checkout-components";

type Problem = { detail?: string; mensaje?: string };
type Props = { initialCart?: Carrito; initialError?: string; ivaRate?: number };

export default function CartView({ initialCart, initialError = "", ivaRate }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<Carrito | null>(initialCart || null);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(!initialCart && !initialError);
  const [busyProduct, setBusyProduct] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<ValidacionCupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponPending, setCouponPending] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  async function authRedirect() {
    router.push(`/cuenta?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/backend/api/carrito", { cache: "no-store", headers: { Accept: "application/json" } });
      if (requiresLogin(response.status)) { await authRedirect(); return; }
      const data = await response.json().catch(() => ({})) as Carrito & Problem;
      if (!response.ok) { setError(data.detail || data.mensaje || "No pudimos cargar el carrito. Intenta de nuevo."); return; }
      setCart(data); setRowErrors({});
    } catch { setError("No pudimos conectar con la tienda. Intenta de nuevo."); }
    finally { setLoading(false); }
  }

  async function mutate(item: CarritoItem, operation: "remove" | "quantity", quantity?: number) {
    setBusyProduct(item.productoId); setError(""); setAnnouncement("");
    setRowErrors((current) => { const next = { ...current }; delete next[item.productoId]; return next; });
    try {
      const response = await fetch(`/api/backend/api/carrito/items/${item.productoId}`, {
        method: operation === "remove" ? "DELETE" : "PUT",
        ...(operation === "quantity" ? { headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ productoId: item.productoId, cantidad: quantity }) } : {}),
      });
      if (requiresLogin(response.status)) { await authRedirect(); return; }
      if (!response.ok) {
        const problem = await response.json().catch(() => ({})) as Problem;
        const message = problem.detail || problem.mensaje || "No se pudo actualizar este producto.";
        if (response.status === 409 || response.status === 422) setRowErrors((current) => ({ ...current, [item.productoId]: message }));
        else setError(message);
        return;
      }
      if (response.status === 204) await load();
      else setCart(await response.json() as Carrito);
      window.dispatchEvent(new Event("techstore:cart-updated"));
      setAnnouncement(operation === "remove" ? `${item.nombreProducto} eliminado del carrito.` : "Cantidad actualizada.");
    } catch { setRowErrors((current) => ({ ...current, [item.productoId]: "No pudimos conectar con la tienda. Intenta actualizar de nuevo." })); }
    finally { setBusyProduct(null); }
  }

  async function clearCart() {
    if (!window.confirm("¿Quieres vaciar el carrito?")) return;
    setClearing(true); setError("");
    try {
      const response = await fetch("/api/backend/api/carrito", { method: "DELETE", headers: { Accept: "application/json" } });
      if (requiresLogin(response.status)) { await authRedirect(); return; }
      if (!response.ok) { const problem = await response.json().catch(() => ({})) as Problem; setError(problem.detail || problem.mensaje || "No se pudo vaciar el carrito."); return; }
      setCoupon(null); setCouponCode(""); setAnnouncement("Carrito vacío."); window.dispatchEvent(new Event("techstore:cart-updated")); await load();
    } catch { setError("No pudimos conectar con la tienda. Intenta de nuevo."); }
    finally { setClearing(false); }
  }

  async function applyCoupon(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setCouponMessage(""); setCoupon(null);
    if (!couponCode.trim() || !cart) { setCouponMessage("Escribe un código de cupón."); return; }
    setCouponPending(true);
    try {
      const query = new URLSearchParams({ codigo: couponCode.trim(), monto: String(cart.subtotal) });
      const response = await fetch(`/api/backend/api/cupones/validar?${query.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({})) as ValidacionCupon & Problem;
      if (requiresLogin(response.status)) { await authRedirect(); return; }
      if (!response.ok) { setCouponMessage(data.detail || data.mensaje || "El cupón no es válido para este pedido."); return; }
      setCoupon(data); setCouponCode(data.codigo); setCouponMessage("");
    } catch { setCouponMessage("No pudimos conectar con la tienda al validar el cupón."); }
    finally { setCouponPending(false); }
  }

  function removeCoupon() { setCoupon(null); setCouponCode(""); setCouponMessage(""); }

  const count = cart?.items.reduce((total, item) => total + item.cantidad, 0) || 0;
  const viewState = cartViewState(loading, error, cart);
  const content = viewState === "loading" ? <div role="status" className="skeleton h-64 rounded-lg" aria-label="Cargando carrito"/> : viewState === "error" ? <section role="alert" className="rounded-lg border border-error/20 bg-error-container p-6 text-on-error-container"><h1 className="font-headline-sm text-headline-sm font-bold">No pudimos cargar tu carrito</h1><p className="mt-2 text-body-sm">{error}</p><button type="button" onClick={() => void load()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-label-sm text-label-sm font-semibold text-on-primary hover:bg-primary-container">Reintentar</button></section> : !cart?.items.length ? <EmptyCart/> : <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
    <div className="mb-5 flex items-center justify-between gap-3 border-b border-outline-variant pb-4">
      <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-secondary"/><h1 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">Tu Carrito de Compras ({productQuantityLabel(count)})</h1></div>
      <button type="button" disabled={clearing || busyProduct !== null} onClick={() => void clearCart()} className="shrink-0 text-label-sm font-semibold text-primary transition-colors hover:text-primary-container disabled:opacity-50">{clearing ? "Vaciando…" : "Vaciar carrito"}</button>
    </div>
    <div aria-live="polite" className="sr-only">{announcement}</div>
    <div className="divide-y divide-outline-variant">
      {cart.items.map((item) => <CartItemRow key={item.productoId} item={item} pending={busyProduct !== null || clearing} error={rowErrors[item.productoId]} onQuantity={(quantity) => void mutate(item, "quantity", quantity)} onRemove={() => void mutate(item, "remove")}/>)}
    </div>
    <CouponBox value={couponCode} onChange={(value) => { setCouponCode(value); setCoupon(null); setCouponMessage(""); }} coupon={coupon} message={couponMessage} pending={couponPending} onApply={(event) => void applyCoupon(event)} onRemove={removeCoupon}/>
  </div>;

  return <CheckoutShell current={1} isCheckout={false} aside={!loading && !error && cart?.items.length ? <OrderSummary cart={cart} coupon={coupon} ivaRate={ivaRate} mode="cart"/> : undefined}>
    {content}
    {error && <p className="sr-only">El carrito no se pudo consultar; usa Reintentar para volver a intentarlo.</p>}
  </CheckoutShell>;
}
