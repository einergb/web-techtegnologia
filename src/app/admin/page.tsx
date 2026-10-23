import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SessionActions from "@/components/session-actions";
import AdminDashboard from "@/components/admin-dashboard";
import { getApiBaseUrl } from "@/lib/api-config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Administración | TechStore Colombia", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const accessToken = (await cookies()).get("techstore_access")?.value;
  if (!accessToken) redirect("/cuenta");
  let accessStatus = 502;
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/admin/inventario/stock-bajo`, { headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    accessStatus = response.status;
  } catch { accessStatus = 502; }
  if (accessStatus === 401) redirect("/cuenta");
  return <main className="container-page min-h-[70vh] py-12"><Link href="/" className="text-sm font-semibold text-[#136a63]">← Volver a la tienda</Link><div className="mt-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#136a63]">Centro de operaciones</p><h1 className="display mt-1 text-3xl font-bold">Administración</h1></div><SessionActions/></div>{accessStatus === 403 ? <p role="alert" className="mt-6 rounded-lg border border-[#f1d1cd] bg-[#fff4f2] p-5 text-sm text-[#9c2921]">Tu cuenta no tiene permisos de administrador. La API denegó el acceso.</p> : accessStatus >= 500 ? <p role="status" className="mt-6 rounded-lg border border-[#e0e8ed] bg-white p-5 text-sm text-[#647174]">No pudimos verificar permisos con el backend. Intenta de nuevo más tarde.</p> : <AdminDashboard/>}</main>;
}
