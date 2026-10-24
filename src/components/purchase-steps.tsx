const steps = ["Carrito", "Dirección", "Revisión", "Pago", "Confirmación"];

export default function PurchaseSteps({ current }: { current: number }) {
  return <nav aria-label="Pasos de compra" className="mt-6 overflow-x-auto rounded-xl border border-surface-high bg-white px-4 py-4">
    <ol className="flex min-w-[560px] items-center">
      {steps.map((step, index) => { const number = index + 1; const done = number < current; const active = number === current; return <li key={step} className="flex flex-1 items-center last:flex-none"><div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full text-label-sm font-bold ${active || done ? "bg-secondary text-white" : "bg-surface-high text-on-surface-variant"}`}>{number}</span><span className={`text-label-sm font-semibold ${active ? "text-on-surface" : "text-on-surface-variant"}`}>{step}</span></div>{number < steps.length && <span aria-hidden="true" className={`mx-3 h-px flex-1 ${done ? "bg-secondary" : "bg-surface-high"}`}/>}</li>; })}
    </ol>
  </nav>;
}
