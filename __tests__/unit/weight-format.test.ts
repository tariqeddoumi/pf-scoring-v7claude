import {
  formatPart,
  formatPoidsDetail,
  partRelative,
  sommeFratrie,
} from "@/lib/weight-format";

describe("sommeFratrie", () => {
  test("additionne les poids, les absents comptant pour zéro", () => {
    expect(sommeFratrie([{ weight: 10 }, { weight: 15 }, { weight: null }])).toBe(25);
    expect(sommeFratrie([])).toBe(0);
    expect(sommeFratrie(null)).toBe(0);
  });
});

describe("partRelative", () => {
  test("rapporte le poids à la somme de sa fratrie", () => {
    // Le moteur divise par la somme des poids : c'est la seule lecture qui
    // corresponde au calcul.
    expect(partRelative(10, 100)).toBe(10);
    expect(partRelative(50, 200)).toBe(25);
  });

  test("ne rapporte rien lorsque la fratrie totalise zéro", () => {
    expect(partRelative(10, 0)).toBeNull();
    expect(partRelative(10, -5)).toBeNull();
  });

  test("un poids absent n'a pas de part", () => {
    expect(partRelative(null, 100)).toBeNull();
    expect(partRelative(undefined, 100)).toBeNull();
  });
});

describe("formatPart", () => {
  test("un poids de 10 parmi neuf domaines totalisant 110 ne vaut ni 10 % ni 1000 %", () => {
    // Les deux lectures que donnaient les écrans étaient fausses : « {weight}% »
    // affichait 10 %, et « weight × 100 » affichait 1000 %.
    expect(formatPart(10, 110)).toBe("9,1 %");
  });

  test("affiche une décimale sous 10 %, aucune au-delà", () => {
    expect(formatPart(5, 100)).toBe("5,0 %");
    expect(formatPart(25, 100)).toBe("25 %");
  });

  test("la virgule est la séparatrice décimale", () => {
    expect(formatPart(10, 110)).toContain(",");
    expect(formatPart(10, 110)).not.toContain(".");
  });

  test("les parts d'une fratrie totalisent 100 %", () => {
    const freres = [{ weight: 10 }, { weight: 15 }, { weight: 12 }];
    const somme = sommeFratrie(freres);
    const total = freres.reduce((s, f) => s + (partRelative(f.weight, somme) ?? 0), 0);
    expect(total).toBeCloseTo(100, 6);
  });

  test("rien n'est affiché quand la part n'a pas de sens", () => {
    expect(formatPart(10, 0)).toBeNull();
  });
});

describe("formatPoidsDetail", () => {
  test("donne la part puis le poids brut, pour lever toute ambiguïté", () => {
    const detail = formatPoidsDetail(10, 110);
    expect(detail).toContain("9,1 %");
    expect(detail).toContain("poids saisi 10");
    expect(detail).toContain("110");
  });

  test("dit explicitement qu'un nœud n'est pas pondéré", () => {
    expect(formatPoidsDetail(null, 110)).toBe("Sans pondération");
  });

  test("signale une fratrie de poids nuls plutôt que d'inventer une part", () => {
    expect(formatPoidsDetail(10, 0)).toMatch(/part indéterminée/);
  });
});
