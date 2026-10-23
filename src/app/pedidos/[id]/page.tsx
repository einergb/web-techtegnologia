import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiGetProtected, ApiError } from "@/lib/api";
import { Pedido, formatCop } from "@/lib/contracts";

export const metadata: Metadata = { title: "Detalle de pedido | TechStore Colombia", robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order: Pedido | null = null;
  let errorMessage = "";
  try { order = await apiGetProtected<Pedido>(`/api/pedidos/${encodeURIComponent(id)}`); }
  catch (error) { if (error instanceof ApiError && error.status === 401) return <main className="container-page min-h-[70vh] py-12"><h1 className="display text-2xl font-bold">Inicia sesión para ver este pedido</h1><Link href="/cuenta" className="mt-4 inline-flex text-sm font-semibold text-[#a83128]">Ir a mi cuenta</Link></main>; if (error instanceof ApiError && error.status === 404) notFound(); errorMessage = error instanceof ApiError ? error.message : "No pudimos cargar el pedido."; }
  if (!order) return <main className="container-page min-h-[70vh] py-12"><h1 className="display text-2xl font-bold">No pudimos cargar el pedido</h1><p role="status" className="mt-2 text-sm text-[#647174]">{errorMessage}</p><Link href="/pedidos" className="mt-5 inline-flex text-sm font-semibold text-[#a83128]">Volver a mis pedidos</Link></main>;
  return <main className="container-page min-h-[75vh] py-10"><Link href="/pedidos" className="text-sm font-semibold text-[#136a63]">← Mis pedidos</Link><div className="mt-6 rounded-lg border border-[#e0e8ed] bg-white p-6"><p className="text-xs text-[#647174]">Pedido {order.numero}</p><h1 className="display mt-1 text-2xl font-bold">{order.estado}</h1><p className="mt-2 text-sm text-[#647174]">El estado mostrado procede del backend. La redirección de una pasarela por sí sola no confirma el pago.</p><ul className="mt-5 divide-y divide-[#e0e8ed]">{order.items.map((item) => <li key={item.id} className="flex justify-between gap-3 py-3 text-sm"><span>{item.nombreProducto} × {item.cantidad}</span><strong>{formatCop(item.subtotal)}</strong></li>)}</ul><dl className="ml-auto mt-4 max-w-sm space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCop(order.subtotal)}</dd></div><div className="flex justify-between"><dt>Descuento</dt><dd>{formatCop(order.descuento)}</dd></div><div className="flex justify-between"><dt>IVA</dt><dd>{formatCop(order.iva)}</dd></div><div className="flex justify-between"><dt>Envío</dt><dd>{formatCop(order.costoEnvio)}</dd></div><div className="flex justify-between border-t border-[#e0e8ed] pt-2 text-base font-bold"><dt>Total</dt><dd>{formatCop(order.total)}</dd></div></dl></div></main>;
}
