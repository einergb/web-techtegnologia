import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SessionActions from "@/components/session-actions";
import AdminDashboard from "@/components/admin-dashboard";
import Icon from "@/components/icon";
import { getApiBaseUrl } from "@/lib/api-config";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración | TechStore Colombia", robots: { index: false, follow: false } };

const navigation = [
  { href: "/admin#resumen", label: "Resumen", icon: "box" },
  { href: "/admin#inventario", label: "Inventario", icon: "box" },
  { href: "/admin#ventas", label: "Reportes de ventas", icon: "arrow" },
] as const;

export default async function AdminPage() {
  const accessToken = (await cookies()).get("techstore_access")?.value;
  if (!accessToken) redirect("/cuenta");
  let accessStatus = 502;
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/admin/inventario/stock-bajo`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    accessStatus = response.status;
  } catch { accessStatus = 502; }
  if (accessStatus === 401) redirect("/cuenta");
  return <main className="min-h-screen bg-surface lg:pl-[260px]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-surface-high bg-white lg:flex">
      <Link href="/" className="flex h-[78px] items-center gap-3 border-b border-surface-high px-6" aria-label="TechStore Colombia, inicio"><span className="grid h-10 w-10 place-items-center rounded-lg bg-secondary font-display text-sm font-bold text-white">TS</span><span className="font-display text-lg font-bold">TechStore<small className="block font-body text-[10px] font-semibold uppercase tracking-widest text-secondary">Administración</small></span></Link>
      <nav aria-label="Navegación administrativa" className="flex-1 space-y-1 px-3 py-6">{navigation.map((item, index) => <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-label-sm font-semibold ${index === 0 ? "bg-secondary-container/50 text-secondary" : "text-on-surface-variant hover:bg-surface-low"}`}><Icon name={item.icon} className="h-[18px] w-[18px]"/>{item.label}</Link>)}</nav>
      <Link href="/" className="border-t border-surface-high px-6 py-5 text-label-sm font-semibold text-on-surface-variant hover:text-primary">← Volver a la tienda</Link>
    </aside>
    <div className="min-h-screen">
      <header className="flex min-h-[78px] items-center justify-between border-b border-surface-high bg-white px-4 md:px-8"><div><p className="text-label-sm text-on-surface-variant">TechStore Colombia / Administración</p><h1 className="font-display text-headline-sm font-bold">Centro de operaciones</h1></div><SessionActions/></header>
      <nav aria-label="Navegación administrativa móvil" className="flex gap-3 overflow-x-auto border-b border-surface-high bg-white px-4 py-3 lg:hidden">{navigation.map((item) => <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-lg bg-surface px-3 py-2 text-label-sm font-semibold text-on-surface-variant">{item.label}</Link>)}</nav>
      <div className="mx-auto max-w-[1440px] px-4 py-7 md:px-8"><div id="resumen" className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-label-sm font-bold uppercase tracking-[.14em] text-secondary">Resumen de la tienda</p><p className="mt-1 text-body-sm text-on-surface-variant">Indicadores calculados por el backend.</p></div></div>
        {accessStatus === 403 ? <p role="alert" className="rounded-lg border border-error/20 bg-error/5 p-5 text-body-sm text-error">Tu cuenta no tiene permisos de administrador. La API denegó el acceso.</p> : accessStatus >= 500 ? <p role="status" className="rounded-lg border border-surface-high bg-white p-5 text-body-sm text-on-surface-variant">No pudimos verificar permisos con el backend. Intenta de nuevo más tarde.</p> : <AdminDashboard/>}
      </div>
    </div>
  </main>;
}
