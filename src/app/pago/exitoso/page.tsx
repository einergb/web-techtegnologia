import Link from "next/link";

export default function PaymentReturnPage() {
  return <main className="container-page grid min-h-[75vh] place-content-center py-12 text-center"><span aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e4f5f1] text-2xl text-[#136a63]">✓</span><h1 className="display mt-5 text-3xl font-bold">Volviste de la pasarela</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#647174]">La confirmación del pago la procesa el backend al validar el webhook. Revisa el estado actualizado en tus pedidos; esta página no marca la compra como pagada.</p><Link href="/pedidos" className="mx-auto mt-6 rounded bg-[#136a63] px-5 py-3 text-sm font-bold text-white">Consultar mis pedidos</Link></main>;
}
