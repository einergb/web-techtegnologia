import CheckoutFlow from "@/components/checkout-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Checkout | TechStore Colombia", robots: { index: false, follow: false } };

export default function CheckoutPage() { return <CheckoutFlow/>; }
