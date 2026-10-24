import Link from "next/link";
import PurchaseSteps from "@/components/purchase-steps";

export default function PaymentReturnPage() {
  return <main className="container-page min-h-[75vh] py-8 md:py-10"><PurchaseSteps current={5}/><div className="grid min-h-[55vh] place-content-center py-10 text-center"><span aria-hidden="true" className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary-container text-2xl text-secondary">✓</span><h1 className="font-display mt-5 text-headline-lg font-bold">Volviste de la pasarela</h1><p className="mx-auto mt-3 max-w-lg text-body-md leading-6 text-on-surface-variant">La confirmación del pago la procesa el backend al validar el webhook. Revisa el estado actualizado en tus pedidos; esta página no marca la compra como pagada.</p><Link href="/pedidos" className="mx-auto mt-6 rounded-lg bg-secondary px-5 py-3 text-label-md font-bold text-white">Consultar mis pedidos</Link></div></main>;
}
