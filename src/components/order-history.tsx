"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pedido, formatCop } from "@/lib/contracts";

export default function OrderHistory() {
  const router = useRouter();
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/backend/api/pedidos", { cache: "no-store" }).then(async (response) => {
      if (response.status === 401) { router.push("/cuenta"); return; }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) { setError(data.detail || "No se pudieron cargar tus pedidos."); return; }
      setOrders(data as Pedido[]);
    }).catch(() => setError("No pudimos conectar con la tienda.")).finally(() => setLoading(false));
  }, [router]);
  return <main className="container-page min-h-[75vh] py-10"><Link href="/" className="text-sm font-semibold text-[#136a63]">← Volver a la tienda</Link><h1 className="display mt-5 text-3xl font-bold">Mis pedidos</h1>{loading ? <p role="status" className="mt-6 rounded-lg bg-white p-5 text-sm text-[#647174]">Cargando pedidos…</p> : error ? <p role="alert" className="mt-6 rounded-lg bg-[#fff4f2] p-5 text-sm text-[#9c2921]">{error}</p> : orders.length ? <div className="mt-6 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-lg border border-[#e0e8ed] bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><div><p className="text-xs text-[#647174]">Pedido {order.numero}</p><p className="mt-1 font-semibold">{new Date(order.creadoEn).toLocaleDateString("es-CO", { dateStyle: "long" })}</p></div><span className="h-fit rounded-full bg-[#eef4fa] px-3 py-1 text-xs font-bold">{order.estado}</span></div><div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-[#e0e8ed] pt-3 text-sm"><span>{order.items.length} productos</span><strong>{formatCop(order.total)}</strong></div><Link href={`/pedidos/${order.id}`} className="mt-3 inline-flex text-sm font-semibold text-[#a83128]">Ver detalle →</Link></article>)}</div> : <div className="mt-6 rounded-lg border border-dashed border-[#d5e0e6] bg-white p-7 text-sm text-[#647174]">Aún no tienes pedidos.</div>}</main>;
}
