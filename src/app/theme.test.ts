import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("tokens de la portada", () => {
  it("conserva radios y tamaño responsivo del H1 definidos en el tema", () => {
    const css = readFileSync(new URL("./globals.css", import.meta.url), "utf8");
    const page = readFileSync(new URL("../components/storefront/home-sections.tsx", import.meta.url), "utf8");
    expect(css).toMatch(/--radius:\s*2px/);
    expect(css).toMatch(/--radius-lg:\s*4px/);
    expect(css).toMatch(/--radius-xl:\s*8px/);
    expect(css).toMatch(/--radius-full:\s*12px/);
    expect(css).toMatch(/--radius-2xl:\s*16px/);
    expect(css).toMatch(/--text-display:\s*44px/);
    expect(css).toMatch(/--text-display--line-height:\s*52px/);
    expect(page).toMatch(/<h1[^>]*md:text-display/);
  });
});
