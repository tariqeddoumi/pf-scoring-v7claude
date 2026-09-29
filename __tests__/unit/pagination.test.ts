import { lirePagination, PAGINATION_LIMITE_MAX } from "@/lib/validation-schemas";

const params = (q: string) => new URLSearchParams(q);

describe("lirePagination", () => {
  test("applique les valeurs par défaut quand rien n'est demandé", () => {
    expect(lirePagination(params(""), 50)).toEqual({ page: 1, limit: 50 });
  });

  test("borne une limite trop grande au lieu d'échouer", () => {
    // Les écrans demandaient limit=200 ; le schéma refusait au-delà de 100 et la
    // route répondait 400, si bien qu'aucune liste ne s'affichait.
    expect(lirePagination(params("limit=1000"), 50).limit).toBe(
      PAGINATION_LIMITE_MAX
    );
  });

  test("accepte une limite à l'intérieur des bornes", () => {
    expect(lirePagination(params("limit=200"), 50).limit).toBe(200);
    expect(lirePagination(params("limit=25"), 50).limit).toBe(25);
  });

  test("ramène une limite nulle ou négative à un", () => {
    expect(lirePagination(params("limit=0"), 50).limit).toBe(1);
    expect(lirePagination(params("limit=-10"), 50).limit).toBe(1);
  });

  test("ignore une valeur illisible", () => {
    expect(lirePagination(params("limit=abc&page=xyz"), 50)).toEqual({
      page: 1,
      limit: 50,
    });
  });

  test("ramène une page inférieure à un", () => {
    expect(lirePagination(params("page=0"), 50).page).toBe(1);
  });

  test("conserve une page valide", () => {
    expect(lirePagination(params("page=3"), 50).page).toBe(3);
  });
});
