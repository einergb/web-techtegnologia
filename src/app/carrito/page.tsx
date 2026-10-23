import CartView from "@/components/cart-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Carrito | TechStore Colombia", robots: { index: false, follow: false } };

export default function CartPage() {
  return <CartView/>;
}
