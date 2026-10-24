"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/icon";

export default function AddToCart({ productId, disabled = false, className = "", label = "Añadir al carrito", icon, fullWidth = true, autoHeight = false }: { productId: number; disabled?: boolean; className?: string; label?: string; icon?: "add" | "shopping_cart" | "add_shopping_cart"; fullWidth?: boolean; autoHeight?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function add() {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/backend/api/carrito/items", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ productoId: productId, cantidad: 1 }) });
      const data = await response.json().catch(() => ({})) as { detail?: string };
      if (response.status === 401) { router.push(`/cuenta?returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "/")}`); return; }
      if (!response.ok) { setMessage(data.detail || "No se pudo agregar el producto."); return; }
      setMessage("Producto añadido al carrito."); window.dispatchEvent(new Event("techstore:cart-updated"));
    } catch { setMessage("No pudimos conectar con la tienda."); }
    finally { setPending(false); }
  }

  return <div className={fullWidth ? "w-full" : ""}><button type="button" onClick={add} disabled={pending || disabled} className={`inline-flex ${autoHeight ? "h-auto" : "h-12"} ${fullWidth ? "w-full" : "w-auto"} items-center gap-2 rounded-lg bg-primary px-5 text-label-md font-bold text-white transition hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
    {icon && <Icon name={icon} className="h-[18px] w-[18px]"/>}<span>{pending ? "Agregando…" : disabled ? "Producto agotado" : label}</span>
  </button>{message && <p aria-live="polite" role={message.includes("añadido") ? "status" : "alert"} className={`mt-2 text-body-sm ${message.includes("añadido") ? "text-secondary" : "text-error"}`}>{message}</p>}</div>;
}
