import { describe, expect, it } from "vitest";
import { getClientIp } from "./client-ip";
import { filterForwardHeaders, filterResponseHeaders, isAllowedProxyPath, isOriginAllowed, validateProxyPath } from "./proxy-security";

describe("validación de ruta del proxy", () => {
  it.each(["api/../admin", "api/%2e%2e/admin", "api/%252e%252e/admin", "api/%2fadmin", "api/%255cadmin", "api//admin", "api/a\\b", "api/%00", "../api/catalogo"]) ("rechaza %s", (path) => {
    expect(validateProxyPath(path).ok).toBe(false);
  });
  it("normaliza segmentos válidos sin alterar su significado", () => {
    expect(validateProxyPath("api/catalogo/productos/42")).toEqual({ ok: true, path: "api/catalogo/productos/42" });
  });
});

describe("allowlist y origen", () => {
  it("limita destinos a prefijos usados por la tienda", () => {
    expect(isAllowedProxyPath("api/carrito/items/1")).toBe(true);
    expect(isAllowedProxyPath("api/admin/reportes/ventas")).toBe(true);
    expect(isAllowedProxyPath("api/admin/usuarios")).toBe(false);
  });
  it("acepta mismo sitio o host público y rechaza un origen ajeno", () => {
    expect(isOriginAllowed("https://shop.example", "https://shop.example", "proxy.internal")).toBe(true);
    expect(isOriginAllowed("https://shop.example", "http://localhost:3000", "shop.example")).toBe(true);
    expect(isOriginAllowed("https://evil.example", "https://shop.example", "shop.example")).toBe(false);
  });
});

describe("IP de cliente", () => {
  const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name.toLowerCase()] ?? null });
  it("prioriza Cloudflare, luego primer forwarded y luego socket; valida cada IP", () => {
    expect(getClientIp(headers({ "cf-connecting-ip": "2001:db8::1", "x-forwarded-for": "192.0.2.1" }), "192.0.2.2")).toBe("2001:db8::1");
    expect(getClientIp(headers({ "cf-connecting-ip": "invalid", "x-forwarded-for": "192.0.2.1, 192.0.2.2" }), "192.0.2.3")).toBe("192.0.2.1");
    expect(getClientIp(headers({ "x-forwarded-for": "invalid" }), "192.0.2.3")).toBe("192.0.2.3");
    expect(getClientIp(headers({}), "bad")).toBeNull();
  });
});

describe("filtrado de cabeceras", () => {
  it("solo construye cabeceras permitidas hacia API y cliente", () => {
    const headers = filterForwardHeaders({ authorization: "Bearer token", contentType: "application/json", accept: "application/json", requestId: "req-1", clientIp: "192.0.2.1" });
    expect([...headers.keys()].sort()).toEqual(["accept", "authorization", "content-type", "x-forwarded-for", "x-request-id"]);
    const response = filterResponseHeaders(new Headers({ "Content-Type": "application/json", "Set-Cookie": "secret=1", Connection: "close", "X-Internal": "hidden" }));
    expect([...response.keys()]).toEqual(["content-type"]);
  });
});
