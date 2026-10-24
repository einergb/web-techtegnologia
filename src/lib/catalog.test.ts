import { describe, expect, it } from "vitest";
import { catalogApiPage, catalogHref, normalizeCatalogFilters, productCountLabel } from "./catalog";

describe("catalog query helpers", () => {
  it("preserves active filters when building pagination links", () => {
    expect(catalogHref({ q: " teclado ", categoriaId: "4" }, 3)).toBe("/catalogo?page=3&q=teclado&categoriaId=4");
  });

  it("maps one-based URL pages to zero-based API pages", () => {
    expect(catalogApiPage("1")).toBe(0);
    expect(catalogApiPage("3")).toBe(2);
    expect(catalogApiPage("0")).toBe(0);
  });

  it("normalizes empty query values", () => {
    expect(normalizeCatalogFilters({ q: "  ", categoriaId: "" })).toEqual({ q: undefined, categoriaId: undefined });
  });

  it("serializes one category filter while keeping the search", () => {
    expect(catalogHref({ q: "mouse", categoriaId: "7" }, 1)).toBe("/catalogo?page=1&q=mouse&categoriaId=7");
  });

  it("uses the correct singular and plural", () => {
    expect(productCountLabel(1)).toBe("1 producto");
    expect(productCountLabel(2)).toBe("2 productos");
  });
});
