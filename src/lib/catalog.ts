export type CatalogFilters = { q?: string; categoriaId?: string };

export function normalizeCatalogFilters(params: CatalogFilters) {
  const q = params.q?.trim() || undefined;
  const categoriaId = params.categoriaId?.trim() || undefined;
  return { q, categoriaId };
}

// La URL del catálogo usa páginas 1-based; la API recibe page 0-based.
export function catalogApiPage(value?: string) {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed - 1) : 0;
}

export function catalogHref(filters: CatalogFilters, page = 1) {
  const normalized = normalizeCatalogFilters(filters);
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, page)));
  if (normalized.q) params.set("q", normalized.q);
  if (normalized.categoriaId) params.set("categoriaId", normalized.categoriaId);
  return `/catalogo?${params.toString()}`;
}

export function productCountLabel(count: number) {
  return `${count} ${count === 1 ? "producto" : "productos"}`;
}
