"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddToCart({ productId, disabled = false }: { productId: number; disabled?: boolean }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function add() {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/backend/api/carrito/items", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ productoId: productId, cantidad: quantity }) });
      const data = await response.json().catch(() => ({})) as { detail?: string };
      if (response.status === 401) { router.push("/cuenta"); return; }
      if (!response.ok) { setMessage(data.detail || "No se pudo agregar el producto."); return; }
      router.push("/carrito"); router.refresh();
    } catch { setMessage("No pudimos conectar con la tienda."); }
    finally { setPending(false); }
  }

  return <div className="mt-7"><div className="flex items-center gap-3"><label htmlFor="product-quantity" className="text-sm font-semibold">Cantidad</label><input id="product-quantity" type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} className="h-10 w-20 rounded border border-[#dce5ea] px-3"/></div><button onClick={add} disabled={pending || disabled} className="mt-4 h-12 w-full rounded bg-[#a83128] px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? "Agregando…" : "Agregar al carrito"}</button>{message && <p role="alert" className="mt-2 text-sm text-[#a83128]">{message}</p>}</div>;
}
