import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "@/components/login-form";
import SessionActions from "@/components/session-actions";

export const metadata: Metadata = { title: "Mi cuenta | TechStore Colombia", robots: { index: false, follow: false } };

export default function AccountPage() {
  return <main className="container-page grid min-h-[75vh] place-content-center py-12"><div className="w-[min(440px,calc(100vw-32px))]"><Link href="/" className="text-sm font-semibold text-[#136a63]">← Volver a la tienda</Link><h1 className="display mt-7 text-3xl font-bold">Ingresa a tu cuenta</h1><p className="mt-2 text-sm leading-6 text-[#647174]">Usa tu correo y contraseña de TechStore Colombia.</p><LoginForm/><div className="mt-4"><SessionActions/></div><Link href="/pedidos" className="mt-4 inline-flex text-sm font-semibold text-[#136a63]">Consultar mis pedidos</Link></div></main>;
}
