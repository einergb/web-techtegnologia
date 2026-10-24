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

  return <section className="space-y-5"><form onSubmit={filter} className="flex flex-wrap items-end gap-3 rounded-xl border border-surface-high bg-white p-4"><div><label htmlFor="from" className="mb-1 block text-label-sm font-semibold">Desde</label><input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-lg border border-surface-high px-3 text-body-sm"/></div><div><label htmlFor="to" className="mb-1 block text-label-sm font-semibold">Hasta</label><input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-lg border border-surface-high px-3 text-body-sm"/></div><button disabled={loading} className="h-10 rounded-lg bg-secondary px-4 text-label-sm font-bold text-white disabled:opacity-60">Aplicar fechas</button></form>
    {error ? <p role="alert" className="rounded-lg bg-error/5 p-4 text-body-sm text-error">{error}</p> : loading ? <p role="status" className="rounded-lg bg-white p-5 text-body-sm text-on-surface-variant">Cargando informes…</p> : inventory && sales ? <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Pedidos",sales.pedidos],["Pedidos pagados",sales.pedidosPagados],["Ingresos",formatCop(sales.ingresos)],["Ticket promedio",formatCop(sales.ticketPromedio)]].map(([label,value]) => <article key={String(label)} className="rounded-xl border border-surface-high bg-white p-5"><p className="text-label-sm font-semibold text-on-surface-variant">{label}</p><p className="mt-2 font-display text-headline-md font-bold">{value}</p></article>)}</div><div className="grid gap-5 xl:grid-cols-2"><section id="ventas" className="scroll-mt-24 rounded-xl border border-surface-high bg-white p-5"><h2 className="font-display text-headline-sm font-bold">Ventas por día</h2>{Array.isArray(sales.ventasPorDia) && sales.ventasPorDia.length > 0 ? <div className="mt-5 flex h-48 items-end gap-2 overflow-x-auto border-b border-surface-high pb-2">{sales.ventasPorDia.map((day) => { const max = Math.max(1, ...sales.ventasPorDia.map((v) => v.ingresos)); const height = Math.max(4, Math.round(day.ingresos / max * 100)); return <div key={day.dia} title={`${day.dia}: ${formatCop(day.ingresos)} · ${day.pedidos} pedidos`} className="flex min-w-5 flex-1 flex-col items-center justify-end gap-2"><span className="w-full rounded-t bg-secondary" style={{ height: `${height}%` }}/><span className="whitespace-nowrap text-[9px] text-on-surface-variant">{day.dia.slice(5)}</span></div>; })}</div> : <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-body-sm"><thead className="bg-surface text-label-sm text-on-surface-variant"><tr><th className="p-3">Fecha</th><th className="p-3">Pedidos</th><th className="p-3">Ingresos</th></tr></thead><tbody><tr><td colSpan={3} className="p-3 text-on-surface-variant">El backend no entregó datos diarios para este periodo.</td></tr></tbody></table></div>}</section><section id="inventario" className="scroll-mt-24 rounded-xl border border-surface-high bg-white p-5"><h2 className="font-display text-headline-sm font-bold">Inventario</h2><div className="mt-3 grid grid-cols-3 gap-2 text-body-sm"><p><span className="block text-label-sm text-on-surface-variant">Productos</span><strong>{inventory.productos}</strong></p><p><span className="block text-label-sm text-on-surface-variant">Unidades</span><strong>{inventory.unidades}</strong></p><p><span className="block text-label-sm text-on-surface-variant">Valor inventario</span><strong>{formatCop(inventory.valorInventario)}</strong></p></div><h3 className="mt-5 text-label-sm font-bold uppercase tracking-wider text-on-surface-variant">Bajo umbral</h3>{inventory.bajoUmbral.length ? <div className="mt-2 overflow-x-auto"><table className="w-full text-left text-body-sm"><thead className="bg-surface text-on-surface-variant"><tr><th className="p-2">Producto</th><th className="p-2">SKU</th><th className="p-2">Stock</th><th className="p-2">Mínimo</th></tr></thead><tbody>{inventory.bajoUmbral.map((item) => <tr key={item.productoId} className="border-t border-surface-high"><td className="p-2 font-semibold">{item.nombre}</td><td className="p-2">{item.sku}</td><td className="p-2">{item.stock}</td><td className="p-2">{item.stockMinimo}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-body-sm text-on-surface-variant">No hay productos bajo el umbral.</p>}</section></div><section className="rounded-xl border border-surface-high bg-white p-5"><h2 className="font-display text-headline-sm font-bold">Productos con más ventas</h2>{sales.topProductos.length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-body-sm"><thead className="bg-surface text-label-sm text-on-surface-variant"><tr><th className="p-3">Producto</th><th className="p-3">Unidades</th><th className="p-3">Ingresos</th></tr></thead><tbody>{sales.topProductos.map((item) => <tr key={item.productoId} className="border-t border-surface-high"><td className="p-3 font-semibold">{item.nombre}</td><td className="p-3">{item.unidades}</td><td className="p-3">{formatCop(item.ingresos)}</td></tr>)}</tbody></table></div> : <p className="mt-3 text-body-sm text-on-surface-variant">No hay datos de ventas en este periodo.</p>}</section></> : null}
  </section>;
}
