"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Carrito, Direccion, Pedido, SesionPago, ValidacionCupon } from "@/lib/contracts";
import { formatCop } from "@/lib/contracts";
import type { ApiProblem } from "@/lib/api";
import { CheckoutShell, AddressCard, AddressForm, EmptyCart, OrderSummary } from "@/components/checkout/checkout-components";
import Icon from "@/components/icon";
import { paymentDisabled, requiresLogin } from "@/lib/checkout-ui";

type Problem = ApiProblem & { mensaje?: string };
type NewAddress = Omit<Direccion, "id">;
const emptyAddress: NewAddress = { alias: "", destinatario: "", telefono: "", departamento: "", ciudad: "", direccion: "", indicaciones: "", esPrincipal: false };
type Props = { initialCart?: Carrito; initialAddresses?: Direccion[]; initialError?: string; initialCouponCode?: string; ivaRate?: number };

export default function CheckoutFlow({ initialCart, initialAddresses = [], initialError = "", initialCouponCode = "", ivaRate }: Props) {
  const router = useRouter();
  const [cart] = useState<Carrito | null>(initialCart || null);
  const [addresses, setAddresses] = useState<Direccion[]>(initialAddresses);
  const [addressId, setAddressId] = useState(() => {
    const primary = initialAddresses.find((item) => item.esPrincipal);
    return String(primary?.id ?? initialAddresses[0]?.id ?? "");
  });
  const [newAddress, setNewAddress] = useState(initialAddresses.length === 0);
  const [address, setAddress] = useState(emptyAddress);
  const [gateway, setGateway] = useState("WOMPI");
  const [coupon, setCoupon] = useState<ValidacionCupon | null>(null);
  const [couponPending, setCouponPending] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [order, setOrder] = useState<Pedido | null>(null);
  const [error, setError] = useState(initialError);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const autoCouponStarted = useRef(false);
  const loadError = Boolean(initialError);

  const redirectToLogin = useCallback(async () => {
    router.push(`/cuenta?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  }, [router]);

  const validateCouponCode = useCallback(async (code: string) => {
    if (!cart || !code.trim()) return;
    setCouponMessage(""); setCoupon(null); setCouponPending(true);
    try {
      const query = new URLSearchParams({ codigo: code.trim(), monto: String(cart.subtotal) });
      const response = await fetch(`/api/backend/api/cupones/validar?${query.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({})) as ValidacionCupon & Problem;
      if (requiresLogin(response.status)) { await redirectToLogin(); return; }
      if (!response.ok) { setCouponMessage(data.detail || data.mensaje || "El cupón no es válido para este pedido."); return; }
      setCoupon(data);
    } catch { setCouponMessage("No pudimos conectar con la tienda al validar el cupón."); }
    finally { setCouponPending(false); }
  }, [cart, redirectToLogin]);

  useEffect(() => {
    if (initialCouponCode && cart && !autoCouponStarted.current) {
      autoCouponStarted.current = true;
      void validateCouponCode(initialCouponCode);
    }
  }, [initialCouponCode, cart, validateCouponCode]);

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setFieldErrors({}); setPending(true);
    const payload = { ...address, telefono: address.telefono.trim().replace(/\s+/g, " ") };
    try {
      const response = await fetch("/api/backend/api/direcciones", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({})) as Direccion & Problem;
      if (requiresLogin(response.status)) { await redirectToLogin(); return; }
      if (!response.ok) { setError(data.detail || data.mensaje || "No se pudo guardar la dirección."); setFieldErrors(data.errores || {}); return; }
      setAddresses((current) => [...current, data]); setAddressId(String(data.id)); setNewAddress(false); setAddress(emptyAddress); setError("");
    } catch { setError("No pudimos conectar con la tienda."); }
    finally { setPending(false); }
  }

  async function createOrderAndPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setFieldErrors({});
    if (!order && !addressId) { setError("Agrega o selecciona una dirección de entrega."); return; }
    if (pending) return;
    setPending(true);
    try {
      let currentOrder = order;
      if (!currentOrder) {
        const orderResponse = await fetch("/api/backend/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ direccionId: Number(addressId), ...(coupon ? { cuponId: coupon.id } : {}) }) });
        const orderData = await orderResponse.json().catch(() => ({})) as Pedido & Problem;
        if (orderResponse.status === 401) { await redirectToLogin(); return; }
        if (!orderResponse.ok) { setError(orderData.detail || orderData.mensaje || "No se pudo crear el pedido."); setFieldErrors(orderData.errores || {}); return; }
        currentOrder = orderData; setOrder(orderData);
      }

      const key = idempotencyKey || crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(key);
      const paymentResponse = await fetch("/api/backend/api/pagos/sesion", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ pedidoId: currentOrder.id, pasarela: gateway, claveIdempotencia: key }) });
      const paymentData = await paymentResponse.json().catch(() => ({})) as SesionPago & Problem;
      if (paymentResponse.status === 401) { await redirectToLogin(); return; }
      if (!paymentResponse.ok) { setError(paymentData.detail || paymentData.mensaje || "El pedido se creó, pero no pudimos abrir el pago. Puedes reintentar sin crear otro pedido."); setFieldErrors(paymentData.errores || {}); return; }
      const paymentUrl = new URL(paymentData.urlPago);
      const hostAllowed = gateway === "WOMPI" ? paymentUrl.hostname === "wompi.co" || paymentUrl.hostname.endsWith(".wompi.co") : paymentUrl.hostname === "epayco.co" || paymentUrl.hostname.endsWith(".epayco.co");
      if (paymentUrl.protocol !== "https:" || !hostAllowed) { setError("La API devolvió una dirección de pago que no coincide con la pasarela seleccionada. Contacta soporte antes de continuar."); return; }
      window.location.assign(paymentUrl.toString());
    } catch (cause) {
      setError(cause instanceof TypeError ? "No se pudo iniciar el pago. Si el pedido alcanzó a crearse, consulta tus pedidos antes de intentarlo de nuevo." : "No pudimos conectar con la tienda.");
    } finally { setPending(false); }
  }

  if (loadError) return <CheckoutShell current={2} isCheckout><section role="alert" className="rounded-lg border border-error/20 bg-error-container p-6 text-on-error-container"><h1 className="font-headline-sm text-headline-sm font-bold">No pudimos cargar el checkout</h1><p className="mt-2 text-body-sm">{error}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 rounded-lg bg-primary px-4 py-2 font-label-sm text-label-sm font-semibold text-on-primary hover:bg-primary-container">Reintentar</button></section></CheckoutShell>;

  if (cart && !cart.items.length && !order) return <CheckoutShell current={2} isCheckout><EmptyCart/></CheckoutShell>;

  const currentStep = order ? 4 : addressId ? 3 : 2;
  return <CheckoutShell current={currentStep} isCheckout aside={cart || order ? <OrderSummary cart={cart} order={order} coupon={coupon} ivaRate={ivaRate} mode="checkout" pending={pending || couponPending} disabled={paymentDisabled(pending || couponPending, addressId, cart?.items.length || 0)} gateway={gateway} onGatewayChange={(value) => { if (value !== gateway) setIdempotencyKey(""); setGateway(value); }} onSubmit={createOrderAndPayment}/> : undefined}>
    {error && <p role="alert" className="rounded-lg border border-error/20 bg-error-container p-4 text-body-sm text-on-error-container">{error}</p>}
    {couponMessage && <p role="alert" className="rounded-lg border border-error/20 bg-error-container p-4 text-body-sm text-on-error-container">{couponMessage}</p>}
    {order && <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5"><p className="text-body-sm text-on-surface-variant">Pedido creado</p><p className="mt-1 font-display text-headline-md font-bold text-on-surface">{order.numero} · {formatCop(order.total)}</p><p className="mt-1 text-body-sm text-on-surface-variant">El estado se actualizará cuando la pasarela confirme el pago.</p></section>}
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-outline-variant pb-4"><div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary font-label-sm text-label-sm font-bold text-on-secondary">2</span><div><h1 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">Dirección de envío</h1><p className="text-body-sm text-on-surface-variant">Selecciona dónde quieres recibir tu pedido.</p></div></div><span className="flex shrink-0 items-center gap-1 font-label-sm text-label-sm text-secondary"><Icon name="lock" className="h-4 w-4"/><span>Datos protegidos</span></span></div>
      {!newAddress && addresses.length > 0 && <div className="space-y-3">{addresses.map((item) => <AddressCard key={item.id} address={item} selected={addressId === String(item.id)} onSelect={() => setAddressId(String(item.id))}/>)}</div>}
      {!order && addresses.length > 0 && <button type="button" onClick={() => { const next = !newAddress; setNewAddress(next); setError(""); setFieldErrors({}); if (next) setAddressId(""); else { const primary = addresses.find((item) => item.esPrincipal); setAddressId(String(primary?.id ?? addresses[0]?.id ?? "")); } }} className="mt-4 text-label-sm font-semibold text-secondary transition-colors hover:text-primary">{newAddress ? "← Elegir dirección guardada" : "+ Agregar dirección nueva"}</button>}
      {!order && newAddress && <AddressForm value={address} errors={fieldErrors} pending={pending} onChange={setAddress} onSubmit={createAddress}/>}
    </section>
    {(cart?.items.length || order?.items.length) ? <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm"><h2 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">Revisión del pedido</h2><ul className="mt-3 divide-y divide-outline-variant">{(order?.items ?? cart?.items ?? []).map((item) => <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-body-sm"><span className="min-w-0"><span className="block font-semibold text-on-surface">{item.nombreProducto}</span><span className="text-on-surface-variant">Cantidad: {item.cantidad}</span></span><strong className="shrink-0 text-on-surface">{formatCop(item.subtotal)}</strong></li>)}</ul><Link href="/carrito" className="mt-2 inline-flex text-label-sm font-semibold text-secondary hover:underline">Editar carrito</Link></section> : null}
    {!addressId && !newAddress && <p role="status" className="text-body-sm text-on-surface-variant">Agrega o selecciona una dirección para continuar al pago.</p>}
  </CheckoutShell>;
}
