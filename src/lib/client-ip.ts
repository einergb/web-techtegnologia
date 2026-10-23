import { isIP } from "node:net";

export type ClientIpHeaders = Pick<Headers, "get">;

function validIp(value: string | null | undefined): string | null {
  const candidate = value?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

/** CF-Connecting-IP, primer X-Forwarded-For y finalmente la IP del socket. */
export function getClientIp(headers: ClientIpHeaders, socketIp?: string | null): string | null {
  const cloudflare = validIp(headers.get("cf-connecting-ip"));
  if (cloudflare) return cloudflare;

  const forwarded = headers.get("x-forwarded-for")?.split(",", 1)[0];
  const proxyIp = validIp(forwarded);
  if (proxyIp) return proxyIp;

  return validIp(socketIp);
}
