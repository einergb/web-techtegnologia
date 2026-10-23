import OrderHistory from "@/components/order-history";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mis pedidos | TechStore Colombia", robots: { index: false, follow: false } };

export default function OrdersPage() { return <OrderHistory/>; }
