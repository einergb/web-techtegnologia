/** Prefijos de API que usa actualmente el frontend. Mantener esta lista acotada. */
export const PROXY_ALLOWED_PREFIXES = [
  "api/auth/login",
  "api/auth/logout",
  "api/auth/refresh",
  "api/catalogo",
  "api/carrito",
  "api/direcciones",
  "api/pedidos",
  "api/pagos/sesion",
  "api/cupones/validar",
  "api/admin/reportes",
  "api/admin/inventario/stock-bajo",
] as const;

export function isProxyPathAllowed(path: string): boolean {
  return path.startsWith("api/") && PROXY_ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
