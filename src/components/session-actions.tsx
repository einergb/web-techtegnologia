"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionActions() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function run(action: "refresh" | "logout") {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/backend/api/auth/${action}`, { method: "POST", headers: { Accept: "application/json" } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { detail?: string };
        setMessage(body.detail || "No se pudo actualizar la sesión.");
        return;
      }
      if (action === "logout") router.push("/");
      else setMessage("Sesión renovada.");
      router.refresh();
    } catch {
      setMessage("No fue posible conectar con el servidor.");
    } finally {
      setPending(false);
    }
  }

  return <div className="flex flex-wrap items-center gap-2"><button onClick={() => run("refresh")} disabled={pending} className="rounded border border-[#dce5ea] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60">Renovar sesión</button><button onClick={() => run("logout")} disabled={pending} className="rounded border border-[#dce5ea] bg-white px-3 py-2 text-xs font-semibold disabled:opacity-60">Cerrar sesión</button>{message && <span role="status" className="w-full text-xs text-[#647174]">{message}</span>}</div>;
}
