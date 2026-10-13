jest.mock("@/lib/services/app-config-service", () => ({
  getAppConfig: jest.fn(),
}));

import { getAppConfig } from "@/lib/services/app-config-service";
import {
  configT24,
  configurationIncompleteT24,
  lireClientT24,
  urlT24,
} from "@/lib/services/t24/connecteur";
import {
  dateT24,
  normaliserClient,
  normaliserGroupe,
  paysLisible,
} from "@/lib/services/t24/normalisation";
import { clientDeDemonstration } from "@/lib/services/t24/simulation";
import { createClientSchema } from "@/lib/validation-schemas";
import {
  donneesClient,
  ecritureActionnaires,
  provenanceT24,
  resoudreGroupe,
} from "@/lib/clients/enregistrement";
import {
  lireAttestation,
  signerAttestation,
  type AttestationClient,
} from "@/lib/services/t24/attestation";
import {
  VALEURS_CLIENT_VIDES,
  controlesActionnariat,
  nouvelleLigneActionnaire,
  versLignesActionnaires,
  versPayloadActionnaires,
  versPayloadClient,
  versValeursClient,
} from "@/lib/clients/saisie";

const config = getAppConfig as jest.Mock;

describe("lecture d'une réponse T24", () => {
  it("noms de l'application CUSTOMER (OFS / bus de services)", () => {
    const fiche = normaliserClient("100234", {
      "SHORT.NAME": "ATLAS ENERGIE",
      "NAME.1": "ATLAS ENERGIE HOLDING",
      "NAME.2": "S.A.",
      STREET: ["12 BD ZERKTOUNI", "ETAGE 4"],
      "TOWN.COUNTRY": "CASABLANCA",
      RESIDENCE: "MA",
      SECTOR: "1001",
      "ACCOUNT.OFFICER": "45",
      "CUSTOMER.SINCE": "20150312",
      "BIRTH.INCORP.DATE": "20080101",
      "LEGAL.DOC.NAME": ["ICE", "RC", "IF"],
      "LEGAL.ID": ["001234567000089", "RC 98765 Casablanca", "40123456"],
      "CUSTOMER.LIABILITY": "200100",
    });
    expect(fiche).not.toBeNull();
    expect(fiche!.champs).toMatchObject({
      nom: "ATLAS ENERGIE",
      raisonSociale: "ATLAS ENERGIE HOLDING S.A.",
      adresse: "12 BD ZERKTOUNI ETAGE 4",
      ville: "CASABLANCA",
      pays: "Maroc",
      dateRelation: "2015-03-12",
      dateCreationSociete: "2008-01-01",
      ice: "001234567000089",
      registreCommerce: "RC 98765 Casablanca",
      identifiantFiscal: "40123456",
    });
    // Codes sans libellé (secteur 1001, gestionnaire 45) : non repris.
    expect(fiche!.champs.secteur).toBeUndefined();
    expect(fiche!.champs.gestionnaire).toBeUndefined();
    expect(fiche!.groupe).toEqual({ code: "200100", nom: null });
  });

  it("API Transact (enveloppe body, camelCase)", () => {
    const fiche = normaliserClient("100234", {
      header: { status: "success", id: "XYZ" },
      body: [
        {
          customerId: "100234",
          shortName: "Atlas Énergie",
          customerSince: "2015-03-12",
          accountOfficerName: "Salma Bennani",
          industryName: "Énergies renouvelables",
          legalDetails: [
            { legalDocumentName: "ICE", legalId: "001 234 567 000 089" },
          ],
          internalRating: "BBB",
          kycStatus: "Vérifiée",
          amlRisk: "HIGH",
          email: "pas-un-courriel",
        },
      ],
    });
    expect(fiche!.champs).toMatchObject({
      nom: "Atlas Énergie",
      gestionnaire: "Salma Bennani",
      secteur: "Énergies renouvelables",
      ice: "001234567000089",
      ratingInterne: "BBB",
      statusKYC: "Vérifiée",
      niveauRisqueLBC: "Élevé",
    });
    expect(fiche!.champs.email).toBeUndefined();
    expect(fiche!.codeClientT24).toBe("100234");
  });

  it("client isolé : CUSTOMER.LIABILITY égal au code client n'est pas un groupe", () => {
    expect(
      normaliserClient("100234", {
        "SHORT.NAME": "X",
        "CUSTOMER.LIABILITY": "100234",
      })!.groupe
    ).toBeNull();
  });

  it("valeurs hors référentiel écartées, correspondance explicite prioritaire", () => {
    const fiche = normaliserClient(
      "7",
      {
        shortName: "Y",
        internalRating: "Z9",
        local: { ref: { ice: "123456789012345", grp: "G1" } },
      },
      { ice: "local.ref.ice", groupeCode: "local.ref.grp" }
    );
    expect(fiche!.champs.ratingInterne).toBeUndefined();
    expect(fiche!.champs.ice).toBe("123456789012345");
    expect(fiche!.groupe?.code).toBe("G1");
  });

  it("groupe, dates et pays", () => {
    expect(
      normaliserGroupe("G1", {
        body: { groupName: "Groupe Atlas", residence: "MA" },
      })
    ).toMatchObject({
      code: "G1",
      nom: "Groupe Atlas",
      paysSiege: "Maroc",
    });
    expect(dateT24("20240131")).toBe("2024-01-31");
    expect(dateT24("31/01/2024")).toBeUndefined();
    expect(paysLisible("SN")).toBe("Sénégal");
    expect(paysLisible("Maroc")).toBe("Maroc");
    expect(normaliserClient("1", "texte")).toBeNull();
  });
});

describe("connecteur T24", () => {
  const env = { ...process.env };
  afterEach(() => {
    process.env = { ...env };
    config.mockReset();
  });

  it("désactivé par défaut : saisie manuelle", async () => {
    config.mockResolvedValue({});
    const c = await configT24();
    expect(c.mode).toBe("desactive");
    expect(configurationIncompleteT24(c)).toMatch(/saisie manuelle/);
    await expect(lireClientT24("100")).rejects.toMatchObject({ statut: 503 });
  });

  it("mode api : adresse et identifiants exigés ; code encodé dans le chemin", async () => {
    config.mockResolvedValue({
      T24_MODE: "api",
      T24_URL_BASE: "https://esb.banque.ma/t24/",
    });
    delete process.env.T24_JETON;
    delete process.env.T24_UTILISATEUR;
    const c = await configT24();
    expect(configurationIncompleteT24(c)).toMatch(/identifiants/);
    process.env.T24_JETON = "x";
    expect(configurationIncompleteT24(c)).toBeNull();
    expect(urlT24(c, c.cheminClient, "100.2")).toBe(
      "https://esb.banque.ma/t24/party/customers/100.2"
    );
  });

  it("code invalide refusé avant tout appel", async () => {
    config.mockResolvedValue({ T24_MODE: "simulation" });
    await expect(lireClientT24("../admin")).rejects.toMatchObject({
      statut: 400,
    });
    const { fiche, simulation } = await lireClientT24("100234");
    expect(simulation).toBe(true);
    expect(fiche).toEqual(clientDeDemonstration("100234"));
  });

  it("mode api : réponse lue et normalisée, 404 traduit", async () => {
    config.mockResolvedValue({
      T24_MODE: "api",
      T24_URL_BASE: "https://t24.test",
    });
    process.env.T24_JETON = "jeton";
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ body: { shortName: "Atlas" } }), {
          status: 200,
        })
      )
      .mockResolvedValueOnce(new Response("", { status: 404 }));
    const { fiche } = await lireClientT24("100");
    expect(fiche.champs.nom).toBe("Atlas");
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: "Bearer jeton",
    });
    await expect(lireClientT24("101")).rejects.toMatchObject({ statut: 404 });
    fetchMock.mockRestore();
  });

  it("la simulation produit une fiche valide pour le schéma", () => {
    const f = clientDeDemonstration("ABC-9");
    expect(
      createClientSchema.safeParse({
        ...f.champs,
        codeClientT24: f.codeClientT24,
      }).success
    ).toBe(true);
  });
});

describe("saisie de la signalétique", () => {
  it("formulaire → charge de l'API → schéma", () => {
    const charge = versPayloadClient({
      ...VALEURS_CLIENT_VIDES,
      nom: "Atlas",
      codeClientT24: "100234",
      ice: "001234567000089",
      groupeCode: "G1",
      groupeNom: "Groupe Atlas",
      fondsPropres: "-2500000",
      exerciceReference: "2025",
      ppe: "non",
    });
    expect(charge).toMatchObject({
      nom: "Atlas",
      groupe: { code: "G1", nom: "Groupe Atlas" },
      fondsPropres: -2500000,
      exerciceReference: 2025,
      ppe: false,
      raisonSociale: null,
    });
    expect(createClientSchema.safeParse(charge).success).toBe(true);
    expect(versPayloadClient({ groupeNom: "" })).toEqual({ groupe: null });
  });

  it("contrôles : ICE à 15 chiffres, code T24 sans caractère de chemin, exercice plausible", () => {
    const erreurs = createClientSchema.safeParse({
      nom: "Atlas",
      ice: "12345",
      codeClientT24: "a/b",
      exerciceReference: 1800,
    });
    expect(erreurs.success).toBe(false);
    const champs = erreurs.success
      ? []
      : erreurs.error.issues.map((i) => i.path[0]);
    expect(champs).toEqual(
      expect.arrayContaining(["ice", "codeClientT24", "exerciceReference"])
    );
  });

  it("fiche de l'API → formulaire (groupe, PPE, dates)", () => {
    const v = versValeursClient({
      nom: "Atlas",
      ppe: true,
      dateRevueKYC: "2026-01-15T00:00:00.000Z",
      groupeAffaires: { code: "G1", nom: "Groupe Atlas" },
      exposition: 0,
    });
    expect(v).toMatchObject({
      ppe: "oui",
      dateRevueKYC: "2026-01-15",
      groupeCode: "G1",
      groupeNom: "Groupe Atlas",
      exposition: "0",
      status: "Actif",
    });
  });

  it("données : dates converties, groupe et attestations écartés", () => {
    const d = donneesClient({
      nom: "A",
      dateRevueKYC: "2026-02-01",
      groupe: { code: "G1", nom: "Groupe" },
      attestationT24: "x.y",
    });
    expect(d.dateRevueKYC).toEqual(new Date("2026-02-01"));
    expect(d).not.toHaveProperty("groupe");
    expect(d).not.toHaveProperty("attestationT24");
    expect(d).not.toHaveProperty("champsT24");
  });

  it("attestation T24 : signée par le serveur, liée à l'utilisateur, infalsifiable", () => {
    process.env.JWT_SECRET = "secret-de-test-local-32-caracteres-min";
    const jeton = signerAttestation<AttestationClient>({
      t: "client",
      u: "user-1",
      c: "100",
      v: { nom: "Atlas", exposition: "5000" },
      g: { code: "G1", nom: "Groupe Atlas" },
    })!;
    expect(lireAttestation(jeton, "client", "user-1")?.v.nom).toBe("Atlas");
    expect(lireAttestation(jeton, "client", "user-2")).toBeNull();
    expect(lireAttestation(jeton, "groupe", "user-1")).toBeNull();
    const [corps, sig] = jeton.split(".");
    const falsifie = Buffer.from(
      Buffer.from(corps, "base64url").toString().replace("Atlas", "Autre")
    ).toString("base64url");
    expect(
      lireAttestation(`${falsifie}.${sig}`, "client", "user-1")
    ).toBeNull();
    expect(lireAttestation("n'importe.quoi", "client", "user-1")).toBeNull();
  });

  it("provenance : seuls les champs identiques aux valeurs attestées sont marqués T24", () => {
    const att: AttestationClient = {
      t: "client",
      u: "u",
      c: "100",
      v: { nom: "Atlas", exposition: "5000", ville: "Rabat" },
      g: { code: "G1", nom: "Groupe Atlas" },
      exp: Date.now() + 1000,
    };
    const p = provenanceT24(
      {
        nom: "Atlas",
        exposition: 5000,
        ville: "Casablanca",
        codeClientT24: "100",
        groupe: { code: "G1", nom: "Groupe Atlas" },
      },
      att,
      null
    )!;
    expect(p.champsT24.sort()).toEqual([
      "codeClientT24",
      "exposition",
      "groupeCode",
      "groupeNom",
      "nom",
    ]);
    expect(p.sourceDonnees).toBe("T24");
    expect(p.dateSynchroT24).toBeInstanceOf(Date);
    // Sans attestation, rien ne peut être déclaré T24 (création).
    expect(provenanceT24({ nom: "Atlas" }, null, null)).toEqual({
      champsT24: [],
      sourceDonnees: "MANUELLE",
    });
  });

  it("provenance en modification : une retouche retire la marque, le reste est conservé", () => {
    const p = provenanceT24({ nom: "Retouché" }, null, [
      "nom",
      "ice",
      "groupeNom",
    ])!;
    expect(p.champsT24).toEqual(["ice", "groupeNom"]);
    expect(p).not.toHaveProperty("dateSynchroT24");
    expect(
      provenanceT24({ groupe: null }, null, ["groupeNom", "ice"])!.champsT24
    ).toEqual(["ice"]);
    // Aucun champ repris touché, pas de rapatriement : rien à écrire.
    expect(provenanceT24({ telephone: "1" }, null, ["ice"])).toBeNull();
  });

  it("groupe : cherché et créé dans la banque du client uniquement", async () => {
    const findFirst = jest.fn();
    const create = jest.fn().mockResolvedValue({ id: "nouveau" });
    const update = jest.fn().mockResolvedValue({ id: "g1" });
    const db = { groupeAffaires: { findFirst, create, update } };

    findFirst.mockResolvedValueOnce({ id: "g1" });
    expect(
      await resoudreGroupe(db, { code: "G1", nom: "Atlas" }, { entiteId: "e1" })
    ).toBe("g1");
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(findFirst.mock.calls[0][0].where).toEqual({
      code: "G1",
      entiteId: "e1",
    });
    expect(update).not.toHaveBeenCalled();

    // Absent de la banque du client : créé là, jamais emprunté à une autre banque.
    findFirst.mockReset().mockResolvedValue(null);
    expect(
      await resoudreGroupe(db, { code: "G1", nom: "Atlas" }, { entiteId: "e2" })
    ).toBe("nouveau");
    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({
      code: "G1",
      entiteId: "e2",
      sourceDonnees: "MANUELLE",
    });

    findFirst.mockReset().mockResolvedValue(null);
    await resoudreGroupe(db, { code: null, nom: "Sahara" }, { entiteId: "e1" });
    expect(findFirst.mock.calls[0][0].where).toEqual({
      nom: { equals: "Sahara", mode: "insensitive" },
      entiteId: "e1",
    });

    expect(
      await resoudreGroupe(db, undefined, { entiteId: "e1" })
    ).toBeUndefined();
    expect(await resoudreGroupe(db, null, { entiteId: "e1" })).toBeNull();
  });

  it("groupe lu dans T24 : pays, secteur et notation enregistrés ou mis à jour", async () => {
    const fiche = {
      code: "G1",
      nom: "Groupe Atlas",
      paysSiege: "Maroc",
      secteurPrincipal: "Industrie",
      ratingGroupe: "BBB",
    };
    const create = jest.fn().mockResolvedValue({ id: "nouveau" });
    const update = jest.fn().mockResolvedValue({ id: "g1" });
    const findFirst = jest.fn().mockResolvedValue(null);
    const db = { groupeAffaires: { findFirst, create, update } };
    await resoudreGroupe(
      db,
      { code: "G1", nom: "Groupe Atlas" },
      { entiteId: "e1", ficheT24: fiche }
    );
    expect(create.mock.calls[0][0].data).toMatchObject({
      paysSiege: "Maroc",
      secteurPrincipal: "Industrie",
      ratingGroupe: "BBB",
      sourceDonnees: "T24",
    });
    findFirst.mockResolvedValue({ id: "g1" });
    await resoudreGroupe(
      db,
      { code: "G1", nom: "Groupe Atlas" },
      { entiteId: "e1", ficheT24: fiche }
    );
    expect(update.mock.calls[0][0]).toMatchObject({
      where: { id: "g1" },
      data: { ratingGroupe: "BBB", sourceDonnees: "T24" },
    });
    // Fiche d'un autre groupe : ignorée.
    update.mockClear();
    await resoudreGroupe(
      db,
      { code: "G2", nom: "Autre" },
      { entiteId: "e1", ficheT24: fiche }
    );
    expect(update).not.toHaveBeenCalled();
  });
});

describe("actionnariat et bénéficiaires effectifs", () => {
  const ligne = (
    champs: Partial<ReturnType<typeof nouvelleLigneActionnaire>>
  ) => ({
    ...nouvelleLigneActionnaire(),
    ...champs,
  });

  it("lignes → charge : lignes vides ignorées, pourcentage à virgule lu", () => {
    const charge = versPayloadActionnaires([
      ligne({
        nom: " Karim Alaoui ",
        pourcentage: "40,5",
        beneficiaireEffectif: true,
      }),
      ligne({}),
      ligne({
        nom: "Atlas Holding",
        typePersonne: "Personne morale",
        pourcentage: "",
      }),
    ]);
    expect(charge).toEqual([
      expect.objectContaining({
        nom: "Karim Alaoui",
        pourcentageDetention: 40.5,
        beneficiaireEffectif: true,
        pays: null,
      }),
      expect.objectContaining({
        nom: "Atlas Holding",
        typePersonne: "Personne morale",
        pourcentageDetention: null,
      }),
    ]);
    expect(
      createClientSchema.safeParse({ nom: "Client", actionnaires: charge })
        .success
    ).toBe(true);
  });

  it("API → lignes : valeurs inconnues ramenées aux valeurs par défaut", () => {
    const [l] = versLignesActionnaires([
      {
        nom: "X",
        typePersonne: "?",
        qualite: "?",
        pourcentageDetention: 30,
        ppe: true,
      },
    ]);
    expect(l).toMatchObject({
      nom: "X",
      typePersonne: "Personne physique",
      qualite: "Actionnaire",
      pourcentage: "30",
      ppe: true,
    });
    expect(versLignesActionnaires(null)).toEqual([]);
  });

  it("contrôles : total > 100 %, détenteur au-delà du seuil non déclaré, aucun bénéficiaire, PPE", () => {
    const c = controlesActionnariat(
      [
        ligne({ nom: "A", pourcentage: "60" }),
        ligne({ nom: "B", pourcentage: "45", ppe: true }),
      ],
      25
    );
    expect(c).toMatchObject({
      total: 105,
      depasse: true,
      aucunBeneficiaire: true,
      aDeclarer: ["A", "B"],
      ppe: true,
    });
    // Une personne morale au-delà du seuil n'est pas un bénéficiaire effectif : on remonte la chaîne.
    expect(
      controlesActionnariat(
        [
          ligne({
            nom: "H",
            typePersonne: "Personne morale",
            pourcentage: "80",
          }),
        ],
        25
      ).aDeclarer
    ).toEqual([]);
  });

  it("schéma : somme des détentions limitée à 100 %, pourcentage borné", () => {
    const deux = (p1: number, p2: number) => ({
      nom: "Client",
      actionnaires: [
        { nom: "Aaa", pourcentageDetention: p1 },
        { nom: "Bbb", pourcentageDetention: p2 },
      ],
    });
    expect(createClientSchema.safeParse(deux(60, 40)).success).toBe(true);
    expect(createClientSchema.safeParse(deux(60, 41)).success).toBe(false);
    expect(createClientSchema.safeParse(deux(120, 0)).success).toBe(false);
    const morale = createClientSchema.safeParse({
      nom: "Client",
      actionnaires: [
        {
          nom: "Holding SA",
          typePersonne: "Personne morale",
          beneficiaireEffectif: true,
        },
      ],
    });
    expect(morale.success).toBe(false);
  });

  it("enregistrement : liste remplacée dans l'ordre saisi ; undefined ne touche à rien", () => {
    expect(ecritureActionnaires(undefined, "modification")).toBeUndefined();
    const liste = [
      {
        typePersonne: "Personne physique" as const,
        nom: "A",
        qualite: "Dirigeant" as const,
        beneficiaireEffectif: true,
        ppe: false,
      },
      {
        typePersonne: "Personne morale" as const,
        nom: "B",
        qualite: "Actionnaire" as const,
        beneficiaireEffectif: false,
        ppe: false,
        pourcentageDetention: 70,
      },
    ];
    const maj = ecritureActionnaires(liste, "modification")!;
    expect(maj).toHaveProperty("deleteMany", {});
    expect(
      maj.create.map((d) => [d.nom, d.ordre, d.pourcentageDetention])
    ).toEqual([
      ["A", 0, null],
      ["B", 1, 70],
    ]);
    expect(ecritureActionnaires(liste, "creation")).not.toHaveProperty(
      "deleteMany"
    );
    expect(ecritureActionnaires([], "modification")).toEqual({
      deleteMany: {},
      create: [],
    });
  });
});
