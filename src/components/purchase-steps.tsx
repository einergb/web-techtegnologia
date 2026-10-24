import Icon from "@/components/icon";

const steps = ["Carrito", "Dirección", "Revisión", "Pago", "Confirmación"];

export default function PurchaseSteps({ current }: { current: number }) {
  return <nav aria-label="Progreso de compra" className="py-2">
    <ol className="relative mx-auto flex max-w-4xl items-center justify-between">
      {steps.map((label, index) => {
        const number = index + 1;
        const completed = number < current;
        const active = number === current;
        return <li key={label} aria-current={active ? "step" : undefined} className={`flex flex-1 items-center gap-2 ${number > current ? "opacity-70" : ""} ${number === steps.length ? "flex-none" : ""}`}>
          <div className="flex items-center gap-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-label-sm text-label-sm font-bold ${completed ? "bg-secondary text-on-secondary shadow-sm" : active ? "bg-secondary text-on-secondary ring-4 ring-secondary-container/40" : "border border-outline-variant bg-surface text-outline"}`}>
              {completed ? <Icon name="check" className="h-4 w-4 text-white"/> : number}
            </span>
            <span className={`hidden whitespace-nowrap text-label-sm sm:inline ${active || completed ? "font-semibold text-secondary" : "font-medium text-on-surface-variant"} ${number === 3 || number === 4 ? "md:inline" : ""} ${number === 5 ? "lg:inline" : ""}`}>{number}. {label}</span>
          </div>
          {number < steps.length && <span aria-hidden="true" className={`mx-3 hidden h-0.5 flex-1 sm:block ${completed ? "bg-secondary" : "bg-outline-variant"}`}/>}
        </li>;
      })}
    </ol>
  </nav>;
}
