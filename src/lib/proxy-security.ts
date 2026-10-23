import { isIP } from "node:net";
import { PROXY_ALLOWED_PREFIXES } from "./proxy-allowlist";

export type PathValidation = { ok: true; path: string } | { ok: false };

export function validateProxyPath(rawPath: string): PathValidation {
  const segments = rawPath.split("/");
  if (!segments.length || segments.some((segment) => !segment)) return { ok: false };
  const safe: string[] = [];
  for (const raw of segments) {
    let decoded = raw;
    for (let round = 0; round < 10; round += 1) {
      if (decoded === "." || decoded === ".." || /[\\/\u0000-\u001f\u007f]/.test(decoded)) return { ok: false };
      let next: string;
      try { next = decodeURIComponent(decoded); } catch { return { ok: false }; }
      if (next === decoded) break;
      decoded = next;
      if (round === 9) return { ok: false };
    }
    if (!decoded || decoded === "." || decoded === ".." || /[\\/\u0000-\u001f\u007f]/.test(decoded)) return { ok: false };
    safe.push(encodeURIComponent(decoded));
  }
  const path = safe.join("/");
  if (!path.startsWith("api/")) return { ok: false };
  return { ok: true, path };
}

export function isAllowedProxyPath(path: string): boolean {
  return PROXY_ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function isOriginAllowed(origin: string | null, siteUrl: string, publicHost: string | null): boolean {
  if (!origin) return true;
  let parsed: URL;
  try { parsed = new URL(origin); } catch { return false; }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  try {
    if (parsed.origin === new URL(siteUrl).origin) return true;
  } catch { /* Compare against the public request host below. */ }
  return Boolean(publicHost && parsed.host.toLowerCase() === publicHost.toLowerCase());
}

export function validRequestId(value: string | null): string | null {
  if (!value || value.length > 128 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}

export function filterForwardHeaders(input: { authorization?: string | null; contentType?: string | null; accept?: string | null; requestId?: string | null; clientIp?: string | null }): Headers {
  const headers = new Headers();
  if (input.authorization) headers.set("Authorization", input.authorization);
  if (input.contentType) headers.set("Content-Type", input.contentType);
  if (input.accept) headers.set("Accept", input.accept);
  if (input.requestId) headers.set("X-Request-Id", input.requestId);
  if (input.clientIp) headers.set("X-Forwarded-For", input.clientIp);
  return headers;
}

export function filterResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  const contentType = upstream.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  return headers;
}

export function isValidClientIp(value: string | null): value is string {
  return Boolean(value && isIP(value));
}
