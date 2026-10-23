"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Carrito, formatCop } from "@/lib/contracts";

export default function CartView() {
  const router = useRouter();
  const [cart, setCart] = useState<Carrito | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyProduct, setBusyProduct] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/backend/api/carrito", { cache: "no-store", headers: { Accept: "application/json" } });
      if (response.status === 401) { router.push("/cuenta"); return; }
      const data = await response.json().catch(() => ({})) as Carrito & { detail?: string };
      if (!response.ok) { setError(data.detail || "No se pudo cargar tu carrito."); return; }
      setCart(data);
    } catch { setError("No pudimos conectar con la tienda."); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function mutate(productId: number, operation: "remove" | "quantity", quantity?: number) {
    setBusyProduct(productId); setError("");
    try {
      const response = await fetch(`/api/backend/api/carrito/items/${productId}`, {
        method: operation === "remove" ? "DELETE" : "PUT",
        ...(operation === "quantity" ? { headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ productoId: productId, cantidad: quantity }) } : {}),
      });
      if (response.status === 401) { router.push("/cuenta"); return; }
      if (!response.ok) { const data = await response.json().catch(() => ({})) as { detail?: string }; setError(data.detail || "No se pudo actualizar el carrito."); return; }
      if (response.status === 204) await load(); else setCart(await response.json() as Carrito);
    } catch { setError("No pudimos conectar con la tienda."); }
    finally { setBusyProduct(null); }
  }

  async function clearCart() {
    setError("");
    try { const response = await fetch("/api/backend/api/carrito", { method: "DELETE" }); if (response.status === 401) { router.push("/cuenta"); return; } if (!response.ok) { setError("No se pudo vaciar el carrito."); return; } await load(); }
    catch { setError("No pudimos conectar con la tienda."); }
  }

  return <main className="container-page min-h-[75vh] py-10"><Link href="/catalogo" className="text-sm font-semibold text-[#136a63]">← Seguir comprando</Link><div className="mt-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-[#136a63]">Tu compra</p><h1 className="display text-3xl font-bold">Carrito</h1></div>{cart?.items?.length ? <button onClick={clearCart} className="text-sm font-semibold text-[#a83128]">Vaciar carrito</button> : null}</div>
    {loading ? <p role="status" className="mt-8 rounded-lg bg-white p-6 text-sm text-[#647174]">Cargando tu carrito…</p> : error ? <p role="alert" className="mt-8 rounded-lg bg-[#fff4f2] p-5 text-sm text-[#9c2921]">{error}</p> : !cart?.items?.length ? <div className="mt-8 rounded-lg border border-dashed border-[#d5e0e6] bg-white p-8 text-center"><p className="font-semibold">Tu carrito está vacío</p><Link href="/catalogo" className="mt-4 inline-flex rounded bg-[#a83128] px-5 py-3 text-sm font-bold text-white">Explorar catálogo</Link></div> : <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]"><section className="space-y-3">{cart.items.map((item) => <article key={item.productoId} className="flex flex-wrap items-center gap-4 rounded-lg border border-[#e0e8ed] bg-white p-4"><div className="min-w-0 flex-1"><Link href={`/producto/${item.productoId}`} className="font-semibold hover:text-[#a83128]">{item.nombreProducto}</Link><p className="mt-1 text-xs text-[#647174]">SKU {item.sku} · {formatCop(item.precioUnitario)} c/u</p><p className="mt-1 text-xs text-[#647174]">Disponibles al consultar: {item.stockDisponible}</p></div><label className="text-xs text-[#647174]">Cantidad<input aria-label={`Cantidad de ${item.nombreProducto}`} type="number" min={1} defaultValue={item.cantidad} disabled={busyProduct === item.productoId} onBlur={(event) => { const next = Number(event.currentTarget.value); if (next !== item.cantidad && next > 0) void mutate(item.productoId, "quantity", next); }} className="ml-2 h-9 w-16 rounded border border-[#dce5ea] px-2 text-sm text-[#161d20]"/></label><div className="text-right"><p className="font-bold">{formatCop(item.subtotal)}</p><button onClick={() => mutate(item.productoId, "remove")} disabled={busyProduct === item.productoId} className="mt-1 text-xs font-semibold text-[#a83128] disabled:opacity-60">Quitar</button></div></article>)}</section><aside className="h-fit rounded-lg border border-[#e0e8ed] bg-white p-5"><h2 className="display text-lg font-bold">Resumen</h2><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-[#647174]">Subtotal</dt><dd>{formatCop(cart.subtotal)}</dd></div><div className="flex justify-between"><dt className="text-[#647174]">IVA</dt><dd>{formatCop(cart.iva)}</dd></div><div className="flex justify-between"><dt className="text-[#647174]">Envío</dt><dd>{formatCop(cart.costoEnvio)}</dd></div><div className="flex justify-between border-t border-[#e0e8ed] pt-3 text-base font-bold"><dt>Total calculado por tienda</dt><dd>{formatCop(cart.total)}</dd></div></dl><p className="mt-3 text-xs leading-5 text-[#647174]">El total definitivo se confirma al crear el pedido.</p><Link href="/checkout" className="mt-5 flex h-11 items-center justify-center rounded bg-[#a83128] text-sm font-bold text-white">Continuar al checkout</Link></aside></div>}
  </main>;
}
