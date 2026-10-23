"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Carrito, Direccion, Pedido, SesionPago, ValidacionCupon, formatCop } from "@/lib/contracts";

type Problem = { detail?: string; errores?: Record<string, string> };
type NewAddress = Omit<Direccion, "id">;
const emptyAddress: NewAddress = { alias: "", destinatario: "", telefono: "", departamento: "", ciudad: "", direccion: "", indicaciones: "", esPrincipal: false };

export default function CheckoutFlow() {
  const router = useRouter();
  const [cart, setCart] = useState<Carrito | null>(null);
  const [addresses, setAddresses] = useState<Direccion[]>([]);
  const [addressId, setAddressId] = useState("");
  const [newAddress, setNewAddress] = useState(false);
  const [address, setAddress] = useState(emptyAddress);
  const [gateway, setGateway] = useState("WOMPI");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<ValidacionCupon | null>(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [order, setOrder] = useState<Pedido | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [cartResponse, addressResponse] = await Promise.all([
          fetch("/api/backend/api/carrito", { cache: "no-store" }),
          fetch("/api/backend/api/direcciones", { cache: "no-store" }),
        ]);
        if (cartResponse.status === 401 || addressResponse.status === 401) { router.push("/cuenta"); return; }
        const cartData = await cartResponse.json().catch(() => ({})) as Carrito & Problem;
        const addressData = await addressResponse.json().catch(() => ({})) as Direccion[] & Problem;
        if (!cartResponse.ok) throw new Error(cartData.detail || "No se pudo cargar el carrito.");
        if (!addressResponse.ok) throw new Error((addressData as Problem).detail || "No se pudieron cargar tus direcciones.");
        setCart(cartData); setAddresses(addressData as Direccion[]);
        const primary = (addressData as Direccion[]).find((item) => item.esPrincipal);
        if (primary) setAddressId(String(primary.id));
        else if ((addressData as Direccion[]).length) setAddressId(String((addressData as Direccion[])[0].id));
      } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo cargar el checkout."); }
      finally { setLoading(false); }
    }
    void load();
  }, [router]);

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setFieldErrors({});
    const required: Array<Exclude<keyof NewAddress, "esPrincipal">> = ["destinatario", "telefono", "departamento", "ciudad", "direccion"];
    const errors: Record<string, string> = {};
    for (const field of required) if (!address[field].trim()) errors[field] = "Este campo es obligatorio.";
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setPending(true);
    try {
      const response = await fetch("/api/backend/api/direcciones", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(address) });
      const data = await response.json().catch(() => ({})) as Direccion & Problem;
      if (response.status === 401) { router.push("/cuenta"); return; }
      if (!response.ok) { setError(data.detail || "No se pudo guardar la dirección."); setFieldErrors(data.errores || {}); return; }
      setAddresses((current) => [...current, data]); setAddressId(String(data.id)); setNewAddress(false); setAddress(emptyAddress);
    } catch { setError("No pudimos conectar con la tienda."); }
    finally { setPending(false); }
  }

  async function createOrderAndPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setFieldErrors({});
    if (!order && !addressId) { setError("Agrega o selecciona una dirección de entrega."); return; }
    setPending(true);
    try {
      let currentOrder = order;
      if (!currentOrder) {
        const orderResponse = await fetch("/api/backend/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ direccionId: Number(addressId), ...(coupon ? { cuponId: coupon.id } : {}) }) });
        const orderData = await orderResponse.json().catch(() => ({})) as Pedido & Problem;
        if (orderResponse.status === 401) { router.push("/cuenta"); return; }
        if (!orderResponse.ok) { setError(orderData.detail || "No se pudo crear el pedido."); setFieldErrors(orderData.errores || {}); return; }
        currentOrder = orderData; setOrder(orderData);
      }

      const key = idempotencyKey || crypto.randomUUID();
      if (!idempotencyKey) setIdempotencyKey(key);
      const paymentResponse = await fetch("/api/backend/api/pagos/sesion", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ pedidoId: currentOrder.id, pasarela: gateway, claveIdempotencia: key }) });
      const paymentData = await paymentResponse.json().catch(() => ({})) as SesionPago & Problem;
      if (paymentResponse.status === 401) { router.push("/cuenta"); return; }
      if (!paymentResponse.ok) { setError(paymentData.detail || "El pedido se creó, pero no pudimos abrir el pago. Puedes reintentar sin crear otro pedido."); setFieldErrors(paymentData.errores || {}); return; }
      const paymentUrl = new URL(paymentData.urlPago);
      const hostAllowed = gateway === "WOMPI" ? paymentUrl.hostname === "wompi.co" || paymentUrl.hostname.endsWith(".wompi.co") : paymentUrl.hostname === "epayco.co" || paymentUrl.hostname.endsWith(".epayco.co");
      if (paymentUrl.protocol !== "https:" || !hostAllowed) { setError("La API devolvió una dirección de pago que no coincide con la pasarela seleccionada. Contacta soporte antes de continuar."); return; }
      window.location.assign(paymentUrl.toString());
    } catch (cause) {
      setError(cause instanceof TypeError ? "No se pudo iniciar el pago. Si el pedido alcanzó a crearse, consulta tus pedidos antes de intentarlo de nuevo." : "No pudimos conectar con la tienda.");
    } finally { setPending(false); }
  }

  async function validateCoupon() {
    setCouponMessage(""); setCoupon(null);
    if (!couponCode.trim()) { setCouponMessage("Escribe un código de cupón."); return; }
    if (!cart) return;
    try {
      const query = new URLSearchParams({ codigo: couponCode.trim(), monto: String(cart.subtotal) });
      const response = await fetch(`/api/backend/api/cupones/validar?${query.toString()}`, { cache: "no-store", headers: { Accept: "application/json" } });
      const data = await response.json().catch(() => ({})) as ValidacionCupon & Problem;
      if (!response.ok) { setCouponMessage(data.detail || "El cupón no es válido para este pedido."); return; }
      setCoupon(data); setCouponMessage(`Descuento calculado por la API: ${formatCop(data.descuento)}. Se confirmará al crear el pedido.`);
    } catch { setCouponMessage("No pudimos validar el cupón con la tienda."); }
  }

  if (loading) return <main className="container-page min-h-[70vh] py-12"><p role="status" className="rounded-lg bg-white p-6 text-sm text-[#647174]">Cargando checkout…</p></main>;
  return <main className="container-page min-h-[75vh] py-10"><Link href="/carrito" className="text-sm font-semibold text-[#136a63]">← Volver al carrito</Link><h1 className="display mt-5 text-3xl font-bold">Finalizar compra</h1>{error && <p role="alert" className="mt-5 rounded-lg bg-[#fff4f2] p-4 text-sm text-[#9c2921]">{error}</p>}{fieldErrors && Object.keys(fieldErrors).length > 0 && <ul className="mt-3 list-inside list-disc text-sm text-[#9c2921]">{Object.entries(fieldErrors).map(([field, message]) => <li key={field}>{field}: {message}</li>)}</ul>}
    {order ? <section className="mt-6 rounded-lg border border-[#e0e8ed] bg-white p-5"><p className="text-sm text-[#647174]">Pedido creado</p><p className="display mt-1 text-xl font-bold">{order.numero} · {formatCop(order.total)}</p><p className="mt-1 text-xs text-[#647174]">El estado lo determina el backend al recibir confirmación de la pasarela.</p></section> : null}
    {!cart?.items?.length && !order ? <div className="mt-6 rounded-lg bg-white p-6 text-sm">Tu carrito está vacío. <Link className="font-semibold text-[#a83128]" href="/catalogo">Volver al catálogo</Link></div> : <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]"><section className="space-y-5"><div className="rounded-lg border border-[#e0e8ed] bg-white p-5"><div className="flex items-center justify-between"><h2 className="display text-lg font-bold">Dirección de entrega</h2>{addresses.length > 0 && !order && <button type="button" onClick={() => setNewAddress((value) => !value)} className="text-sm font-semibold text-[#136a63]">{newAddress ? "Elegir guardada" : "Agregar nueva"}</button>}</div>{newAddress || addresses.length === 0 ? <form onSubmit={createAddress} className="mt-4 grid gap-3 sm:grid-cols-2">{([["destinatario","Nombre de quien recibe"],["telefono","Teléfono"],["departamento","Departamento"],["ciudad","Ciudad"],["direccion","Dirección"],["alias","Nombre para identificarla"]] as const).map(([field,label]) => <div key={field}><label htmlFor={field} className="mb-1 block text-xs font-semibold">{label}{["destinatario","telefono","departamento","ciudad","direccion"].includes(field) ? " *" : ""}</label><input id={field} value={address[field]} onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))} className="h-10 w-full rounded border border-[#dce5ea] px-3 text-sm" aria-invalid={Boolean(fieldErrors[field])}/>{fieldErrors[field] && <p className="mt-1 text-xs text-[#a83128]">{fieldErrors[field]}</p>}</div>)}<div className="sm:col-span-2"><label htmlFor="indicaciones" className="mb-1 block text-xs font-semibold">Indicaciones (opcional)</label><textarea id="indicaciones" value={address.indicaciones} onChange={(event) => setAddress((current) => ({ ...current, indicaciones: event.target.value }))} className="w-full rounded border border-[#dce5ea] px-3 py-2 text-sm" rows={2}/></div><button disabled={pending} className="h-10 rounded bg-[#136a63] px-4 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2">Guardar dirección</button></form> : <div className="mt-4 space-y-2">{addresses.map((item) => <label key={item.id} className="flex cursor-pointer gap-3 rounded border border-[#e0e8ed] p-3 text-sm"><input type="radio" name="address" value={item.id} checked={addressId === String(item.id)} onChange={() => setAddressId(String(item.id))}/><span><strong>{item.alias || item.destinatario}</strong><span className="block text-xs leading-5 text-[#647174]">{item.direccion}, {item.ciudad}, {item.departamento}<br/>{item.destinatario} · {item.telefono}</span></span></label>)}</div>}</div>
      {cart?.items?.length ? <div className="rounded-lg border border-[#e0e8ed] bg-white p-5"><h2 className="display text-lg font-bold">Productos ({cart.items.length})</h2><ul className="mt-3 divide-y divide-[#e0e8ed]">{cart.items.map((item) => <li key={item.id} className="flex justify-between gap-3 py-3 text-sm"><span>{item.nombreProducto} × {item.cantidad}</span><strong>{formatCop(item.subtotal)}</strong></li>)}</ul></div> : null}</section>
      <aside className="h-fit rounded-lg border border-[#e0e8ed] bg-white p-5"><h2 className="display text-lg font-bold">Resumen del pedido</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-[#647174]">Subtotal</dt><dd>{formatCop(order?.subtotal ?? cart?.subtotal ?? 0)}</dd></div>{order ? <div className="flex justify-between"><dt className="text-[#647174]">Descuento aplicado</dt><dd>{formatCop(order.descuento)}</dd></div> : coupon && <p className="text-xs text-[#136a63]">Cupón {coupon.codigo} validado por la API</p>}<div className="flex justify-between"><dt className="text-[#647174]">IVA</dt><dd>{formatCop(order?.iva ?? cart?.iva ?? 0)}</dd></div><div className="flex justify-between"><dt className="text-[#647174]">Envío</dt><dd>{formatCop(order?.costoEnvio ?? cart?.costoEnvio ?? 0)}</dd></div><div className="flex justify-between border-t border-[#e0e8ed] pt-3 text-base font-bold"><dt>Total {order ? "del pedido" : "estimado por API"}</dt><dd>{formatCop(order?.total ?? cart?.total ?? 0)}</dd></div></dl>{!order && <div className="mt-4"><label htmlFor="coupon" className="mb-1 block text-xs font-semibold">Código de descuento</label><div className="flex gap-2"><input id="coupon" value={couponCode} onChange={(event) => { setCouponCode(event.target.value); setCoupon(null); setCouponMessage(""); }} className="h-10 min-w-0 flex-1 rounded border border-[#dce5ea] px-3 text-sm"/><button type="button" onClick={validateCoupon} className="rounded border border-[#dce5ea] px-3 text-xs font-bold">Validar</button></div>{couponMessage && <p role="status" className="mt-2 text-xs text-[#647174]">{couponMessage}</p>}</div>}{!order && <form onSubmit={createOrderAndPayment} className="mt-5"><label htmlFor="gateway" className="mb-1 block text-xs font-semibold">Pasarela de pago</label><select id="gateway" value={gateway} onChange={(event) => { if (event.target.value !== gateway) setIdempotencyKey(""); setGateway(event.target.value); }} className="h-10 w-full rounded border border-[#dce5ea] bg-white px-3 text-sm"><option value="WOMPI">Wompi</option><option value="EPAYCO">ePayco</option></select><button disabled={pending || !cart?.items?.length} className="mt-3 h-11 w-full rounded bg-[#a83128] text-sm font-bold text-white disabled:opacity-60">{pending ? "Procesando…" : "Crear pedido y continuar al pago"}</button></form>}{order && <form onSubmit={createOrderAndPayment} className="mt-5"><label htmlFor="gateway-retry" className="mb-1 block text-xs font-semibold">Pasarela de pago</label><select id="gateway-retry" value={gateway} onChange={(event) => { if (event.target.value !== gateway) setIdempotencyKey(""); setGateway(event.target.value); }} className="h-10 w-full rounded border border-[#dce5ea] bg-white px-3 text-sm"><option value="WOMPI">Wompi</option><option value="EPAYCO">ePayco</option></select><button disabled={pending} className="mt-3 h-11 w-full rounded bg-[#a83128] text-sm font-bold text-white disabled:opacity-60">{pending ? "Abriendo pago…" : "Reintentar sesión de pago"}</button></form>}<p className="mt-3 text-xs leading-5 text-[#647174]">Los valores finales los calcula y valida la API al crear el pedido.</p></aside></div>}
  </main>;
}
