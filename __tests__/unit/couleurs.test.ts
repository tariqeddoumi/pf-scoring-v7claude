import { clarte, texteSur } from "@/lib/couleurs";

describe("texte lisible sur la couleur principale", () => {
  it("blanc sur une couleur foncée, presque-noir sur une couleur claire", () => {
    expect(texteSur("#1e3a8a")).toBe("oklch(1 0 0)");
    expect(texteSur("#c2410c")).toBe("oklch(1 0 0)");
    expect(texteSur("#facc15")).toBe("oklch(0.2 0.02 250)");
    expect(texteSur("#ffffff")).toBe("oklch(0.2 0.02 250)");
    expect(texteSur("oklch(0.55 0.13 250)")).toBe("oklch(1 0 0)");
    expect(texteSur("oklch(0.9 0.1 100)")).toBe("oklch(0.2 0.02 250)");
  });
  it("couleurs moyennes : le texte le plus contrasté (WCAG), pas un seuil de clarté", () => {
    expect(texteSur("#0ea5e9")).toBe("oklch(0.2 0.02 250)");
    expect(texteSur("#22c55e")).toBe("oklch(0.2 0.02 250)");
    expect(texteSur("#0f766e")).toBe("oklch(1 0 0)");
    expect(texteSur("#2563eb")).toBe("oklch(1 0 0)");
  });
  it("couleur illisible : on laisse le thème", () => {
    expect(clarte("rouge")).toBeNull();
    expect(texteSur("var(--x)")).toBeNull();
  });
});
