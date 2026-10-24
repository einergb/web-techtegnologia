import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { Carrito, CarritoItem } from "@/lib/contracts";
import { AddressForm, CartItemRow, CouponBox, EmptyCart, OrderSummary } from "@/components/checkout/checkout-components";
import { cartViewState, paymentDisabled, productQuantityLabel, requiresLogin } from "@/lib/checkout-ui";

const item: CarritoItem = { id: 1, productoId: 20, sku: "SKU-20", nombreProducto: "Teclado", precioUnitario: 0, cantidad: 2, subtotal: 0, stockDisponible: 2 };
const cart: Carrito = { id: 1, usuarioId: 7, items: [item], subtotal: 0, costoEnvio: 0, iva: 0, total: 0 };

describe("checkout presentation", () => {
  it("pluralizes product counts", () => {
    expect(productQuantityLabel(1)).toBe("1 producto");
    expect(productQuantityLabel(2)).toBe("2 productos");
  });

  it("distinguishes unauthenticated, network error, empty and populated cart states", () => {
    expect(requiresLogin(401)).toBe(true);
    expect(cartViewState(false, "No fue posible conectar", null)).toBe("error");
    expect(cartViewState(false, "", { ...cart, items: [] })).toBe("empty");
    expect(cartViewState(false, "", cart)).toBe("ready");
  });

  it("shows a stock rejection in the affected product row and clamps increase at available stock", () => {
    const html = renderToStaticMarkup(<CartItemRow item={item} pending={false} error="Stock insuficiente" onQuantity={() => undefined} onRemove={() => undefined}/>);
    expect(html).toContain("Stock insuficiente");
    expect(html).toContain('aria-label="Aumentar cantidad de Teclado"');
    expect(html).toContain("disabled=");
  });

  it("renders a coupon validation error next to the coupon field", () => {
    const html = renderToStaticMarkup(<CouponBox value="NO-VALIDO" onChange={() => undefined} coupon={null} message="Cupón vencido" pending={false} onApply={() => undefined} onRemove={() => undefined}/>);
    expect(html).toContain("Código de cupón");
    expect(html).toContain("Cupón vencido");
  });

  it("blocks payment while pending or without a delivery address", () => {
    expect(paymentDisabled(true, "1", 1)).toBe(true);
    expect(paymentDisabled(false, "", 1)).toBe(true);
    expect(paymentDisabled(false, "1", 1)).toBe(false);
    const pendingHtml = renderToStaticMarkup(<OrderSummary cart={cart} mode="checkout" pending={true} disabled={false} gateway="WOMPI" onGatewayChange={() => undefined} onSubmit={() => undefined}/>);
    const noAddressHtml = renderToStaticMarkup(<OrderSummary cart={cart} mode="checkout" pending={false} disabled={true} gateway="WOMPI" onGatewayChange={() => undefined} onSubmit={() => undefined}/>);
    expect(pendingHtml).toContain('disabled=""');
    expect(noAddressHtml).toContain('disabled=""');
    expect(noAddressHtml).toContain("Agrega o selecciona una dirección de envío");
  });

  it("uses a backend-calculated placeholder when shipping is unknown", () => {
    const unknownShipping = { ...cart, costoEnvio: undefined } as unknown as Carrito;
    const html = renderToStaticMarkup(<OrderSummary cart={unknownShipping} mode="cart"/>);
    expect(html).toContain("Costo de envío");
    expect(html).toContain("Se calcula al crear el pedido");
  });

  it("retains address values when the server returns a validation error", () => {
    const value = { alias: "Casa", destinatario: "María Pérez", telefono: "300 000 0000", departamento: "Bogotá D.C.", ciudad: "Bogotá", direccion: "Calle 1 # 2-3", indicaciones: "Apto 2", esPrincipal: true };
    const html = renderToStaticMarkup(<AddressForm value={value} errors={{ destinatario: "El destinatario no es válido" }} pending={false} onChange={() => undefined} onSubmit={() => undefined}/>);
    expect(html).toContain('value="María Pérez"');
    expect(html).toContain('value="Calle 1 # 2-3"');
    expect(html).toContain("El destinatario no es válido");
  });

  it("shows the single-action empty-cart card", () => {
    const html = renderToStaticMarkup(<EmptyCart/>);
    expect(html).toContain("Tu carrito está esperando algo genial");
    expect(html).toContain("Explorar catálogo");
    expect(html).not.toContain("Ver ofertas del día");
  });
});
