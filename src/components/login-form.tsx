"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FieldErrors = Record<string, string>;
type LoginResult = { detail?: string; errores?: FieldErrors; nombre?: string; rol?: string };

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const errors: FieldErrors = {};
    if (!email) errors.email = "Escribe tu correo electrónico.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Revisa el formato del correo.";
    if (!password) errors.password = "Escribe tu contraseña.";
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }

    setPending(true);
    try {
      const response = await fetch("/api/backend/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({})) as LoginResult;
      if (!response.ok) {
        setError(result.detail || "No pudimos iniciar sesión. Revisa tus datos e intenta de nuevo.");
        setFieldErrors(result.errores || {});
        return;
      }
      const requestedPath = searchParams.get("returnUrl");
      let safeReturnPath: string | null = null;
      if (requestedPath?.startsWith("/")) {
        try {
          const candidate = new URL(requestedPath, window.location.origin);
          if (candidate.origin === window.location.origin) safeReturnPath = `${candidate.pathname}${candidate.search}${candidate.hash}`;
        } catch { /* Ignore malformed return paths and use the normal role redirect. */ }
      }
      router.push(safeReturnPath || (result.rol === "ADMIN" ? "/admin" : "/carrito"));
      router.refresh();
    } catch {
      setError("No pudimos conectar con TechStore. Intenta de nuevo más tarde.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} noValidate className="mt-6 space-y-4 rounded-lg border border-[#e0e8ed] bg-white p-5">
    {error && <p role="alert" className="rounded bg-[#ffefed] p-3 text-sm text-[#9c2921]">{error}</p>}
    <div><label htmlFor="email" className="mb-1 block text-sm font-semibold">Correo electrónico</label><input id="email" name="email" type="email" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "email-error" : undefined} className="h-11 w-full rounded border border-[#dce5ea] px-3 text-sm"/>{fieldErrors.email && <p id="email-error" className="mt-1 text-xs text-[#a83128]">{fieldErrors.email}</p>}</div>
    <div><label htmlFor="password" className="mb-1 block text-sm font-semibold">Contraseña</label><input id="password" name="password" type="password" autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "password-error" : undefined} className="h-11 w-full rounded border border-[#dce5ea] px-3 text-sm"/>{fieldErrors.password && <p id="password-error" className="mt-1 text-xs text-[#a83128]">{fieldErrors.password}</p>}</div>
    <button disabled={pending} className="h-11 w-full rounded bg-[#a83128] px-4 text-sm font-bold text-white disabled:opacity-60">{pending ? "Ingresando…" : "Iniciar sesión"}</button>
    <p className="text-xs leading-5 text-[#647174]">El token de sesión se guarda en una cookie protegida y no queda accesible al JavaScript del navegador.</p>
  </form>;
}
