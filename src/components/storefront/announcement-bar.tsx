import { formatCop } from "@/lib/contracts";
import Icon from "@/components/icon";

export default function AnnouncementBar({ freeShippingFrom }: { freeShippingFrom?: number }) {
  return <aside className="flex items-center justify-center gap-space-sm border-b border-secondary-container/20 bg-secondary px-margin-mobile py-2 text-center text-label-sm tracking-wide text-on-secondary md:px-margin">
    {freeShippingFrom != null && <><Icon name="local_shipping" className="h-4 w-4"/><span>Envíos gratis a toda Colombia por compras mayores a {formatCop(freeShippingFrom)}</span></>}
    <span className="hidden opacity-40 sm:inline">|</span>
    <span className="hidden items-center gap-1 sm:inline-flex"><Icon name="verified_user" className="h-4 w-4"/>Pagos 100% seguros</span>
  </aside>;
}
