import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api-config";

export type ApiProblem = { status?: number; detail?: string; title?: string; errores?: Record<string, string> };

export class ApiError extends Error {
  constructor(message: string, readonly status?: number, readonly fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
  }
}

function publicMessage(problem: ApiProblem, status?: number) {
  if (status !== undefined && status >= 500) return "Tuvimos un problema en el servidor. Intenta de nuevo más tarde.";
  const message = problem.detail || problem.title;
  if (!message || /https?:\/\/|\n\s*at\s|stack ?trace|exception|traceback/i.test(message)) {
    return status ? `No se pudo cargar la información (${status}).` : "No fue posible conectar con el servidor. Intenta de nuevo más tarde.";
  }
  return message.slice(0, 240);
}

export async function apiGet<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(new URL(path, `${getApiBaseUrl()}/`), { headers: { Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  } catch {
    throw new ApiError("No fue posible conectar con el servidor. Intenta de nuevo más tarde.");
  }
  if (!response.ok) {
    let problem: ApiProblem = {};
    try { problem = await response.json() as ApiProblem; } catch { /* Response may have no JSON body. */ }
    throw new ApiError(publicMessage(problem, response.status), response.status, problem.errores);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function apiGetProtected<T>(path: string): Promise<T> {
  const token = (await cookies()).get("techstore_access")?.value;
  if (!token) throw new ApiError("Inicia sesión para consultar esta información.", 401);
  let response: Response;
  try {
    response = await fetch(new URL(path, `${getApiBaseUrl()}/`), {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ApiError("No fue posible conectar con el servidor. Intenta de nuevo más tarde.");
  }
  if (!response.ok) {
    let problem: ApiProblem = {};
    try { problem = await response.json() as ApiProblem; } catch { /* Error responses may have no JSON body. */ }
    throw new ApiError(publicMessage(problem, response.status), response.status, problem.errores);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
