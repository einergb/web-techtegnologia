"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import type { Carrito, CarritoItem, Direccion, Pedido, ValidacionCupon } from "@/lib/contracts";
import { formatCop } from "@/lib/contracts";
import { colombiaDepartments } from "@/content/colombia";
import { checkoutTrustCopy } from "@/content/checkout";
import Icon from "@/components/icon";
import PurchaseSteps from "@/components/purchase-steps";

export function CheckoutShell({ current, isCheckout, children, aside }: { current: number; isCheckout: boolean; children: ReactNode; aside?: ReactNode }) {
  return <>
    <section className="w-full border-b border-outline-variant bg-surface-container-lowest py-4">
      <div className="mx-auto max-w-7xl px-margin-mobile md:px-margin">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
          <Link href="/" className="transition-colors hover:text-primary">Tienda</Link><Icon name="chevron_right" className="h-[14px] w-[14px]"/>
          <Link href="/carrito" className={isCheckout ? "transition-colors hover:text-primary" : "font-semibold text-on-surface"}>Carrito de compras</Link>
          {isCheckout && <><Icon name="chevron_right" className="h-[14px] w-[14px]"/><span aria-current="page" className="font-semibold text-on-surface">Proceso de pago seguro</span></>}
        </div>
        <PurchaseSteps current={current}/>
      </div>
    </section>
    <main className="mx-auto min-h-[70vh] w-full max-w-7xl flex-grow bg-surface px-margin-mobile py-8 md:px-margin">
      {aside ? <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12"><div className="space-y-8 lg:col-span-7 xl:col-span-8">{children}</div><aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-5 xl:col-span-4">{aside}</aside></div> : children}
    </main>
  </>;
}

export function EmptyCart() {
  return <section className="mx-auto max-w-4xl rounded-lg border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-fixed/30 text-secondary"><Icon name="shopping_basket" className="h-8 w-8"/></div>
    <h1 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">Tu carrito está esperando algo genial</h1>
    <p className="mx-auto mt-2 max-w-md text-body-md text-on-surface-variant">Explora el catálogo y encuentra productos para agregar a tu compra.</p>
    <Link href="/catalogo" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-label-md text-label-md font-semibold text-on-primary shadow-sm transition-all hover:bg-primary-container hover:opacity-90 active:scale-95"><Icon name="explore" className="h-[18px] w-[18px]"/><span>Explorar catálogo</span></Link>
  </section>;
}

export function CartItemRow({ item, pending, error, onQuantity, onRemove }: { item: CarritoItem; pending: boolean; error?: string; onQuantity: (quantity: number) => void; onRemove: () => void }) {
  return <article className="group flex flex-col items-start justify-between gap-4 rounded-lg px-2 py-4 transition-colors hover:bg-surface/40 sm:flex-row sm:items-center">
    <div className="flex w-full items-center gap-4 sm:w-auto">
      <Link href={`/producto/${item.productoId}`} aria-label={`Ver ${item.nombreProducto}`} className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface p-1.5"><Icon name="image" className="h-9 w-9 text-outline"/></Link>
      <div className="min-w-0 flex-1">
        <Link href={`/producto/${item.productoId}`} className="font-headline-sm text-headline-sm font-semibold leading-snug text-on-surface transition-colors hover:text-primary">{item.nombreProducto}</Link>
        {item.stockDisponible > 0 && <span className="mt-1 inline-flex items-center rounded-full border border-secondary/20 bg-secondary-container/30 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">En stock</span>}
        <p className="mt-1 text-body-sm text-on-surface-variant">{formatCop(item.precioUnitario)} c/u</p>
        <p className="mt-1 font-price-card text-price-card text-on-surface sm:hidden">{formatCop(item.subtotal)}</p>
      </div>
    </div>
    <div className="flex w-full items-center justify-between pt-2 sm:w-auto sm:gap-6 sm:pt-0">
      <p className="hidden text-right font-price-card text-price-card text-on-surface sm:block">{formatCop(item.subtotal)}</p>
      <div className="flex items-center rounded-lg border border-outline-variant bg-surface-container-lowest shadow-sm">
        <button type="button" aria-label={`Reducir cantidad de ${item.nombreProducto}`} disabled={pending || item.cantidad <= 1} onClick={() => onQuantity(item.cantidad - 1)} className="flex h-8 w-8 items-center justify-center rounded-l text-on-surface-variant transition-colors hover:bg-surface hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"><Icon name="remove" className="h-4 w-4"/></button>
        <span aria-live="polite" className="flex h-8 w-8 items-center justify-center font-code-metric text-body-md font-semibold text-on-surface">{item.cantidad}</span>
        <button type="button" aria-label={`Aumentar cantidad de ${item.nombreProducto}`} disabled={pending || item.cantidad >= item.stockDisponible} onClick={() => onQuantity(item.cantidad + 1)} className="flex h-8 w-8 items-center justify-center rounded-r text-on-surface-variant transition-colors hover:bg-surface hover:text-secondary disabled:cursor-not-allowed disabled:opacity-40"><Icon name="add" className="h-4 w-4"/></button>
      </div>
      <button type="button" aria-label={`Eliminar ${item.nombreProducto}`} title="Eliminar producto" disabled={pending} onClick={onRemove} className="flex items-center justify-center rounded-lg p-2 text-outline transition-colors hover:bg-error-container/30 hover:text-primary disabled:opacity-50"><Icon name="delete" className="h-5 w-5"/></button>
    </div>
    {error && <p role="alert" className="w-full rounded-lg border border-error/20 bg-error-container p-3 text-body-sm text-on-error-container">{error}</p>}
  </article>;
}

export function CouponBox({ value, onChange, coupon, message, pending, onApply, onRemove }: { value: string; onChange: (value: string) => void; coupon: ValidacionCupon | null; message: string; pending: boolean; onApply: (event: FormEvent<HTMLFormElement>) => void; onRemove: () => void }) {
  return <div className="mt-6 rounded-lg border-t border-outline-variant bg-surface/50 p-4 pt-5">
    <form onSubmit={onApply} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1"><Icon name="local_offer" className="absolute left-3 top-2.5 h-[18px] w-[18px] text-on-surface-variant"/><input value={value} onChange={(event) => onChange(event.target.value)} aria-label="Código de cupón" placeholder="Código de cupón" type="text" className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2 pl-9 pr-3 font-label-md text-label-md text-on-surface placeholder:text-outline transition-all focus:border-secondary focus:outline-none focus:ring-[3px] focus:ring-secondary/15"/></div>
      <button disabled={pending} className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary px-5 py-2 font-label-md text-label-md font-semibold text-on-secondary shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"><Icon name="check_circle" className="h-4 w-4"/><span>{pending ? "Validando…" : "Aplicar"}</span></button>
    </form>
    {coupon && <div className="mt-3 flex flex-wrap items-center gap-2"><div className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary-container/40 px-3 py-1 font-label-sm text-label-sm font-semibold text-on-secondary-fixed-variant"><Icon name="verified" className="h-4 w-4 text-secondary"/><span>Cupón {coupon.codigo} aplicado</span><button type="button" aria-label="Quitar cupón" onClick={onRemove} className="ml-1 transition-colors hover:text-primary"><Icon name="close" className="h-[14px] w-[14px]"/></button></div>{coupon.descuento > 0 && <span className="text-[12px] font-medium text-secondary">¡Ahorraste {formatCop(coupon.descuento)}!</span>}</div>}
    {message && <p role="alert" className="mt-2 rounded-lg bg-error-container p-2 text-body-sm text-on-error-container">{message}</p>}
  </div>;
}

export function AddressCard({ address, selected, onSelect }: { address: Direccion; selected: boolean; onSelect: () => void }) {
  return <label className={`flex cursor-pointer items-start gap-3 rounded-lg p-3.5 transition-colors ${selected ? "border-2 border-secondary bg-secondary-fixed/20" : "border border-outline-variant bg-surface-container-lowest hover:border-outline"}`}>
    <input type="radio" name="deliveryAddress" checked={selected} onChange={onSelect} className="mt-1 accent-secondary focus:ring-secondary"/>
    <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 font-label-md text-label-md font-semibold text-on-surface">{address.alias || address.destinatario}{address.esPrincipal && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold text-on-secondary">Principal</span>}</span><span className="mt-1 block text-body-sm leading-5 text-on-surface-variant">{address.destinatario} · {address.telefono}<br/>{address.direccion}{address.indicaciones ? `, ${address.indicaciones}` : ""}<br/>{address.ciudad}, {address.departamento}</span></span>
  </label>;
}

type AddressFields = Omit<Direccion, "id">;
export function AddressForm({ value, errors, pending, onChange, onSubmit }: { value: AddressFields; errors: Record<string, string>; pending: boolean; onChange: (value: AddressFields) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const set = <K extends keyof AddressFields>(field: K, fieldValue: AddressFields[K]) => onChange({ ...value, [field]: fieldValue });
  const common = "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface focus:border-secondary focus:outline-none focus:ring-[3px] focus:ring-secondary/15";
  const field = (name: keyof AddressFields, label: string, required = false, placeholder?: string) => <div key={name}>
    <label htmlFor={`address-${name}`} className="mb-1 block font-label-sm text-label-sm font-semibold text-on-surface">{label}{required ? " *" : ""}</label>
    <input id={`address-${name}`} required={required} value={String(value[name])} onChange={(event) => set(name, event.target.value as never)} placeholder={placeholder} aria-invalid={Boolean(errors[name])} className={common}/>
    {errors[name] && <p className="mt-1 text-body-sm text-error">{errors[name]}</p>}
  </div>;
  return <form onSubmit={onSubmit} className="mt-5 space-y-5">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{field("destinatario", "Nombre completo", true)}<div><label htmlFor="address-telefono" className="mb-1 block font-label-sm text-label-sm font-semibold text-on-surface">Celular / WhatsApp *</label><div className="relative"><span className="absolute left-3 top-2.5 text-body-sm font-semibold text-outline">+57</span><input id="address-telefono" required value={value.telefono} onChange={(event) => set("telefono", event.target.value)} aria-invalid={Boolean(errors.telefono)} className={`${common} pl-12`}/></div>{errors.telefono && <p className="mt-1 text-body-sm text-error">{errors.telefono}</p>}</div>
      <div><label htmlFor="address-departamento" className="mb-1 block font-label-sm text-label-sm font-semibold text-on-surface">Departamento *</label><select id="address-departamento" required value={value.departamento} onChange={(event) => set("departamento", event.target.value)} aria-invalid={Boolean(errors.departamento)} className={common}><option value="">Selecciona un departamento</option>{colombiaDepartments.map((department) => <option key={department} value={department}>{department}</option>)}</select>{errors.departamento && <p className="mt-1 text-body-sm text-error">{errors.departamento}</p>}</div>
      {field("ciudad", "Ciudad o municipio", true)}
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div className="md:col-span-2">{field("direccion", "Dirección de residencia", true)}</div>{field("indicaciones", "Apto, Torre, Oficina", false, "Ej. Torre 2 Apto 501")}</div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{field("alias", "Nombre para identificarla")}
      <label className="flex items-center gap-2 self-end pb-2 font-label-sm text-label-sm text-on-surface"><input type="checkbox" checked={value.esPrincipal} onChange={(event) => set("esPrincipal", event.target.checked)} className="rounded border-outline-variant text-secondary focus:ring-secondary"/>Dirección principal</label>
    </div>
    <button disabled={pending} className="rounded-lg bg-secondary px-5 py-2.5 font-label-md text-label-md font-semibold text-on-secondary shadow-sm transition hover:opacity-90 disabled:opacity-60">{pending ? "Guardando…" : "Guardar dirección"}</button>
  </form>;
}

export function OrderSummary({ cart, order, coupon, ivaRate, mode, pending, disabled, gateway, onGatewayChange, onSubmit }: { cart: Carrito | null; order?: Pedido | null; coupon?: ValidacionCupon | null; ivaRate?: number; mode: "cart" | "checkout"; pending?: boolean; disabled?: boolean; gateway?: string; onGatewayChange?: (value: string) => void; onSubmit?: (event: FormEvent<HTMLFormElement>) => void }) {
  const subtotal = order?.subtotal ?? cart?.subtotal;
  const iva = order?.iva ?? cart?.iva;
  const shipping = order?.costoEnvio ?? cart?.costoEnvio;
  const total = order?.total ?? (coupon ? undefined : cart?.total);
  const itemCount = order?.items.reduce((count, item) => count + item.cantidad, 0) ?? cart?.items.reduce((count, item) => count + item.cantidad, 0) ?? 0;
  const ivaLabel = typeof ivaRate === "number" && ivaRate > 0 ? `IVA (${new Intl.NumberFormat("es-CO", { style: "percent", maximumFractionDigits: 2 }).format(ivaRate)})` : "IVA";
  const checkoutHref = coupon ? `/checkout?cupon=${encodeURIComponent(coupon.codigo)}` : "/checkout";
  return <>
    <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant pb-4"><h2 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">Resumen del pedido</h2><Icon name="receipt_long" className="h-5 w-5 text-secondary"/></div>
      <dl className="space-y-3 border-b border-outline-variant py-4 font-body-md text-body-md">
        <div className="flex items-center justify-between text-on-surface-variant"><dt>Subtotal ({itemCount} {itemCount === 1 ? "producto" : "productos"})</dt><dd className="font-semibold text-on-surface">{subtotal == null ? "Se calcula al crear el pedido" : formatCop(subtotal)}</dd></div>
        {order ? order.descuento > 0 && <div className="flex items-center justify-between text-secondary"><dt>Descuento cupón{coupon?.codigo ? ` (${coupon.codigo})` : ""}</dt><dd className="font-semibold">−{formatCop(order.descuento)}</dd></div> : coupon && coupon.descuento > 0 && <div className="flex items-center justify-between text-secondary"><dt>Descuento cupón ({coupon.codigo})</dt><dd className="font-semibold">−{formatCop(coupon.descuento)}</dd></div>}
        <div className="flex items-center justify-between text-on-surface-variant"><dt>Costo de envío</dt><dd className={shipping === 0 ? "font-bold text-secondary" : "font-semibold text-on-surface"}>{shipping == null ? "Se calcula al crear el pedido" : shipping === 0 ? "Gratis" : formatCop(shipping)}</dd></div>
        <div className="flex items-center justify-between text-on-surface-variant"><dt>{ivaLabel}</dt><dd>{iva == null ? "Se calcula al crear el pedido" : formatCop(iva)}</dd></div>
      </dl>
      <div className="border-b border-outline-variant py-4"><div className="mb-1 flex items-baseline justify-between gap-2"><span className="font-headline-sm text-headline-sm font-bold text-on-surface">Total a pagar</span><span className="font-price-hero text-price-hero font-bold tracking-tight text-on-surface">{total == null ? "Se calcula al crear el pedido" : formatCop(total)}</span></div></div>
      <div className="space-y-3 pt-5">
        {mode === "cart" ? <Link href={checkoutHref} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-headline-sm text-[16px] font-bold text-on-primary shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-container active:translate-y-0"><span>Continuar al pago seguro</span><Icon name="arrow_forward" className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1"/></Link> : <form onSubmit={onSubmit}><button disabled={pending || disabled} className="group flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3.5 font-headline-sm text-[16px] font-bold text-on-primary shadow-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-primary-container active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"><span>{pending ? "Procesando…" : "Continuar al pago seguro"}</span><Icon name="arrow_forward" className="h-[18px] w-[18px] transition-transform group-hover:translate-x-1"/></button></form>}
        {mode === "checkout" && disabled && <p className="text-center text-body-sm text-error">Agrega o selecciona una dirección de envío para continuar.</p>}
        <Link href="/catalogo" className="block w-full py-2.5 text-center font-label-md text-label-md font-semibold text-secondary transition-all hover:underline">← Continuar comprando</Link>
      </div>
      <div className="mt-6 border-t border-outline-variant pt-5">
        {mode === "checkout" ? <><p className="mb-3 text-center font-label-sm text-label-sm font-semibold text-on-surface-variant">Método de pago seguro</p><div className="grid grid-cols-2 gap-2">{["WOMPI", "EPAYCO"].map((name) => <label key={name} className={`flex cursor-pointer items-center gap-2 rounded-lg p-2.5 text-body-sm transition-colors ${gateway === name ? "border-2 border-secondary bg-secondary-fixed/20" : "border border-outline-variant bg-surface hover:border-outline"}`}><input type="radio" name="gateway" value={name} checked={gateway === name} onChange={() => onGatewayChange?.(name)} className="accent-secondary"/><span>{name === "WOMPI" ? "Wompi" : "ePayco"}</span></label>)}</div><p className="mt-3 text-center text-body-sm text-on-surface-variant">Serás redirigido a la pasarela de pago segura.</p></> : <p className="text-center text-body-sm text-on-surface-variant">Serás redirigido a la pasarela de pago segura.</p>}
        <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-secondary/20 bg-secondary-container/30 p-2.5 text-secondary"><Icon name="lock" className="h-[18px] w-[18px]"/><span className="font-label-sm text-label-sm font-semibold">{checkoutTrustCopy.security}</span></div>
      </div>
    </section>
    <TrustMiniCards/>
  </>;
}

export function TrustMiniCards() {
  if (!checkoutTrustCopy.confirmed) return null;
  return <div className="grid grid-cols-2 gap-3">{[checkoutTrustCopy.warranty, checkoutTrustCopy.returns].map((item) => <article key={item.title} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3"><Icon name="verified_user" className="mb-1 h-[22px] w-[22px] text-secondary"/><h3 className="font-label-md text-label-md font-bold text-on-surface">{item.title}</h3><p className="mt-0.5 text-[11px] leading-tight text-outline">{item.description}</p></article>)}</div>;
}
