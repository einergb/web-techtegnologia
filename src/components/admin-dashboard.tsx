"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { InventarioReporte, VentasReporte, formatCop } from "@/lib/contracts";

type Problem = { detail?: string };
const dateInput = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;

export default function AdminDashboard() {
  const [inventory, setInventory] = useState<InventarioReporte | null>(null);
  const [sales, setSales] = useState<VentasReporte | null>(null);
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate()-30); return dateInput(d); });
  const [to, setTo] = useState(() => dateInput(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (start = from, end = to) => {
    setLoading(true); setError("");
    try {
      const since = new Date(`${start}T00:00:00`).toISOString();
      const until = new Date(`${end}T23:59:59`).toISOString();
      const [inventoryResponse, salesResponse] = await Promise.all([
        fetch("/api/backend/api/admin/reportes/inventario", { cache: "no-store" }),
        fetch(`/api/backend/api/admin/reportes/ventas?${new URLSearchParams({ desde: since, hasta: until })}`, { cache: "no-store" }),
      ]);
      const [inventoryData, salesData] = await Promise.all([inventoryResponse.json().catch(() => ({})), salesResponse.json().catch(() => ({}))]) as [InventarioReporte & Problem, VentasReporte & Problem];
      if (inventoryResponse.status === 401 || salesResponse.status === 401) { setError("La sesión expiró. Inicia sesión de nuevo."); return; }
      if (inventoryResponse.status === 403 || salesResponse.status === 403) { setError("Tu cuenta no tiene permisos de administrador."); return; }
      if (!inventoryResponse.ok || !salesResponse.ok) { setError(inventoryData.detail || salesData.detail || "No se pudieron cargar los informes."); return; }
      setInventory(inventoryData); setSales(salesData);
    } catch { setError("No pudimos conectar con el servidor de informes."); }
    finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { void load(); }, [load]);
  function filter(event: FormEvent) { event.preventDefault(); void load(from, to); }

  return <section className="mt-7"><form onSubmit={filter} className="flex flex-wrap items-end gap-3 rounded-lg border border-[#e0e8ed] bg-white p-4"><div><label htmlFor="from" className="mb-1 block text-xs font-semibold">Desde</label><input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded border border-[#dce5ea] px-3 text-sm"/></div><div><label htmlFor="to" className="mb-1 block text-xs font-semibold">Hasta</label><input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded border border-[#dce5ea] px-3 text-sm"/></div><button disabled={loading} className="h-10 rounded bg-[#136a63] px-4 text-sm font-bold text-white disabled:opacity-60">Aplicar fechas</button></form>
    {error ? <p role="alert" className="mt-5 rounded-lg bg-[#fff4f2] p-4 text-sm text-[#9c2921]">{error}</p> : loading ? <p role="status" className="mt-5 rounded-lg bg-white p-5 text-sm text-[#647174]">Cargando informes…</p> : inventory && sales ? <><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Pedidos",sales.pedidos],["Pedidos pagados",sales.pedidosPagados],["Ingresos",formatCop(sales.ingresos)],["Ticket promedio",formatCop(sales.ticketPromedio)]].map(([label,value]) => <article key={String(label)} className="rounded-lg border border-[#e0e8ed] bg-white p-5"><p className="text-xs font-semibold text-[#647174]">{label}</p><p className="display mt-2 text-2xl font-bold">{value}</p></article>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-2"><section className="rounded-lg border border-[#e0e8ed] bg-white p-5"><h2 className="display text-lg font-bold">Ventas por día</h2>{sales.ventasPorDia.length ? <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto border-b border-[#e0e8ed] pb-2">{sales.ventasPorDia.map((day) => { const max = Math.max(1, ...sales.ventasPorDia.map((v) => v.ingresos)); const height = Math.max(4, Math.round(day.ingresos / max * 100)); return <div key={day.dia} title={`${day.dia}: ${formatCop(day.ingresos)} · ${day.pedidos} pedidos`} className="flex min-w-5 flex-1 flex-col items-center justify-end gap-2"><span className="w-full rounded-t bg-[#136a63]" style={{ height: `${height}%` }}/><span className="whitespace-nowrap text-[9px] text-[#647174]">{day.dia.slice(5)}</span></div>; })}</div> : <p className="mt-4 text-sm text-[#647174]">No hay ventas para este periodo.</p>}</section><section className="rounded-lg border border-[#e0e8ed] bg-white p-5"><h2 className="display text-lg font-bold">Inventario</h2><div className="mt-3 grid grid-cols-3 gap-2 text-sm"><p><span className="block text-xs text-[#647174]">Productos</span><strong>{inventory.productos}</strong></p><p><span className="block text-xs text-[#647174]">Unidades</span><strong>{inventory.unidades}</strong></p><p><span className="block text-xs text-[#647174]">Valor inventario</span><strong>{formatCop(inventory.valorInventario)}</strong></p></div><h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-[#647174]">Bajo umbral</h3>{inventory.bajoUmbral.length ? <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#f4faff] text-[#647174]"><tr><th className="p-2">Producto</th><th className="p-2">SKU</th><th className="p-2">Stock</th><th className="p-2">Mínimo</th></tr></thead><tbody>{inventory.bajoUmbral.map((item) => <tr key={item.productoId} className="border-t border-[#e0e8ed]"><td className="p-2 font-semibold">{item.nombre}</td><td className="p-2">{item.sku}</td><td className="p-2">{item.stock}</td><td className="p-2">{item.stockMinimo}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-sm text-[#647174]">No hay productos bajo el umbral.</p>}</section></div><section className="mt-5 rounded-lg border border-[#e0e8ed] bg-white p-5"><h2 className="display text-lg font-bold">Productos con más ventas</h2>{sales.topProductos.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#f4faff] text-xs text-[#647174]"><tr><th className="p-3">Producto</th><th className="p-3">Unidades</th><th className="p-3">Ingresos</th></tr></thead><tbody>{sales.topProductos.map((item) => <tr key={item.productoId} className="border-t border-[#e0e8ed]"><td className="p-3 font-semibold">{item.nombre}</td><td className="p-3">{item.unidades}</td><td className="p-3">{formatCop(item.ingresos)}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-sm text-[#647174]">No hay datos de ventas en este periodo.</p>}</section></> : null}
  </section>;
}
