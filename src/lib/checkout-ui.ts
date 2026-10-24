import type { Carrito } from "@/lib/contracts";

export function cartViewState(loading: boolean, error: string, cart: Carrito | null): "loading" | "error" | "empty" | "ready" {
  if (loading) return "loading";
  if (error) return "error";
  return cart?.items.length ? "ready" : "empty";
}

export function requiresLogin(status: number) {
  return status === 401;
}

export function productQuantityLabel(count: number) {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}

export function paymentDisabled(pending: boolean, addressId: string, itemCount: number) {
  return pending || !addressId || itemCount === 0;
}
