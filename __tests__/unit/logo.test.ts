/**
 * Logo de l'outil ou d'une banque : adresse, chemin, ou image déposée depuis l'administration.
 */
import { motifLogoInvalide, LOGO_TAILLE_MAX } from "@/lib/logo";
import { cleCatalogue } from "@/lib/config-catalogue";

const png = (octets: number) => `data:image/png;base64,${"A".repeat(Math.ceil((octets * 4) / 3))}`;

describe("logo", () => {
  it("accepte une adresse https, un chemin et une image déposée", () => {
    expect(motifLogoInvalide("")).toBeNull();
    expect(motifLogoInvalide("https://www.banque.ma/logo.png")).toBeNull();
    expect(motifLogoInvalide("/logos/banque.svg")).toBeNull();
    expect(motifLogoInvalide(png(10_000))).toBeNull();
    expect(motifLogoInvalide("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBeNull();
  });
  it("refuse une image trop lourde, un autre format ou une adresse non sécurisée", () => {
    expect(motifLogoInvalide(png(LOGO_TAILLE_MAX + 1024))).toContain("trop lourde");
    expect(motifLogoInvalide("data:text/html;base64,PGgxPg==")).not.toBeNull();
    expect(motifLogoInvalide("http://www.banque.ma/logo.png")).not.toBeNull();
    expect(motifLogoInvalide("javascript:alert(1)")).not.toBeNull();
  });
  it("crée la clé du logo publique, dans l'identité de l'outil", () => {
    expect(cleCatalogue("APP_LOGO_URL")).toMatchObject({ isPublic: true, category: "branding", type: "url" });
  });
});
