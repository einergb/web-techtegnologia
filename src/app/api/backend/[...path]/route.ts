import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/api-config";
import { getClientIp } from "@/lib/client-ip";
import { isAllowedProxyPath, filterForwardHeaders, filterResponseHeaders, isOriginAllowed, validateProxyPath, validRequestId } from "@/lib/proxy-security";

const ACCESS_COOKIE = "techstore_access";
const REFRESH_COOKIE = "techstore_refresh";
const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const PROXY_TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = Math.max(1, Number.parseInt(process.env.PROXY_MAX_BODY_BYTES || String(8 * 1024 * 1024), 10) || 8 * 1024 * 1024);
type AuthResponse = { token?: string; refreshToken?: string; tipo?: string; expiraEnSegundos?: number; nombre?: string; rol?: string };

function errorResponse(status: number, mensaje: string) {
  return NextResponse.json({ mensaje }, { status });
}

function cookieOptions() {
  return { httpOnly: true, secure: (process.env.SITE_URL || "http://localhost:3000").startsWith("https://"), sameSite: "lax" as const, path: "/" };
}

async function readBoundedBody(request: NextRequest): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("body-too-large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(new ArrayBuffer(length));
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

function responseFromUpstream(upstream: Response) {
  return new NextResponse(upstream.body, { status: upstream.status, headers: filterResponseHeaders(upstream.headers) });
}

async function forward(request: NextRequest, method: string) {
  if (!ALLOWED_METHODS.has(method)) return errorResponse(405, "Método no permitido.");
  const rawPathname = request.url.split("?", 1)[0];
  const rawPath = rawPathname.startsWith("/api/backend/") ? rawPathname.slice("/api/backend/".length) : "";
  const validatedPath = validateProxyPath(rawPath);
  if (!validatedPath.ok) return errorResponse(400, "La ruta solicitada no es válida.");
  const path = validatedPath.path;
  if (!isAllowedProxyPath(path)) return errorResponse(404, "La ruta solicitada no está disponible.");
  const modifiesData = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  if (modifiesData && !isOriginAllowed(request.headers.get("origin"), process.env.SITE_URL || "http://localhost:3000", request.headers.get("host"))) {
    return errorResponse(403, "Origen de la solicitud no permitido.");
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return errorResponse(413, "El cuerpo de la solicitud es demasiado grande.");

  const cookieStore = await cookies();
  const isLogin = path === "api/auth/login" && method === "POST";
  const isRefresh = path === "api/auth/refresh" && method === "POST";
  const isLogout = path === "api/auth/logout" && method === "POST";
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  const socketIp = (request as NextRequest & { ip?: string }).ip;
  const clientIp = getClientIp(request.headers, socketIp);
  const headers = filterForwardHeaders({
    authorization: !isLogin && !isRefresh && !isLogout && accessToken ? `Bearer ${accessToken}` : null,
    contentType: request.headers.get("content-type"),
    accept: request.headers.get("accept") || "application/json",
    requestId: validRequestId(request.headers.get("x-request-id")),
    clientIp,
  });
  if ((isRefresh || isLogout) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let body: BodyInit | undefined;
  try {
    if (method !== "GET") {
      if (isRefresh || isLogout) body = JSON.stringify({ refreshToken: refreshToken || "" });
      else body = await readBoundedBody(request);
    }
  } catch (error) {
    if (error instanceof RangeError) return errorResponse(413, "El cuerpo de la solicitud es demasiado grande.");
    return errorResponse(400, "No se pudo leer el cuerpo de la solicitud.");
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${getApiBaseUrl()}/${path}${request.nextUrl.search}`, { method, headers, body, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(PROXY_TIMEOUT_MS) });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") return errorResponse(504, "El servidor tardó demasiado en responder. Intenta de nuevo.");
    return errorResponse(502, "No fue posible conectar con el servidor. Intenta de nuevo más tarde.");
  }

  if (isLogin && upstream.ok) {
    let data: AuthResponse;
    try { data = await upstream.json() as AuthResponse; } catch { return errorResponse(502, "No fue posible iniciar la sesión."); }
    if (!data.token || !data.refreshToken) return errorResponse(502, "No fue posible iniciar la sesión.");
    const response = NextResponse.json({ nombre: data.nombre, rol: data.rol, expiraEnSegundos: data.expiraEnSegundos }, { status: upstream.status });
    response.cookies.set(ACCESS_COOKIE, data.token, { ...cookieOptions(), maxAge: Math.max(1, data.expiraEnSegundos || 7200) });
    response.cookies.set(REFRESH_COOKIE, data.refreshToken, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 });
    return response;
  }

  if (isRefresh && upstream.ok) {
    let data: AuthResponse;
    try { data = await upstream.json() as AuthResponse; } catch { return errorResponse(502, "No fue posible renovar la sesión."); }
    if (!data.token || !data.refreshToken) return errorResponse(502, "No fue posible renovar la sesión.");
    const response = NextResponse.json({ nombre: data.nombre, rol: data.rol, expiraEnSegundos: data.expiraEnSegundos }, { status: upstream.status });
    response.cookies.set(ACCESS_COOKIE, data.token, { ...cookieOptions(), maxAge: Math.max(1, data.expiraEnSegundos || 7200) });
    response.cookies.set(REFRESH_COOKIE, data.refreshToken, { ...cookieOptions(), maxAge: 7 * 24 * 60 * 60 });
    return response;
  }

  if (isRefresh && upstream.status >= 400 && upstream.status < 500 && upstream.status !== 429) {
    const response = responseFromUpstream(upstream);
    response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  }

  if (isLogout) {
    const response = responseFromUpstream(upstream);
    response.cookies.set(ACCESS_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    response.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  }
  return responseFromUpstream(upstream);
}

async function handler(request: NextRequest) {
  return forward(request, request.method);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const HEAD = handler;
export const OPTIONS = handler;
