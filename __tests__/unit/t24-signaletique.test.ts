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
import { donneesClient, resoudreGroupe } from "@/lib/clients/enregistrement";
import {
  VALEURS_CLIENT_VIDES,
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

  it("provenance : T24 si des champs repris restent, date de synchro seulement sur rapatriement", () => {
    const d = donneesClient({
      nom: "A",
      champsT24: ["nom", "nom", "ice"],
      importT24: true,
      dateRevueKYC: "2026-02-01",
    });
    expect(d.sourceDonnees).toBe("T24");
    expect(d.champsT24).toEqual(["nom", "ice"]);
    expect(d.dateSynchroT24).toBeInstanceOf(Date);
    expect(d.dateRevueKYC).toEqual(new Date("2026-02-01"));
    expect(d).not.toHaveProperty("groupe");
    expect(d).not.toHaveProperty("importT24");
    const manuel = donneesClient({ champsT24: [] });
    expect(manuel.sourceDonnees).toBe("MANUELLE");
    expect(manuel).not.toHaveProperty("dateSynchroT24");
  });

  it("groupe : retrouvé par code, sinon par nom, sinon créé dans la banque du client", async () => {
    const findFirst = jest.fn();
    const create = jest.fn().mockResolvedValue({ id: "nouveau" });
    const db = { groupeAffaires: { findFirst, create } };

    findFirst.mockResolvedValueOnce({ id: "g1" });
    expect(
      await resoudreGroupe(db, { code: "G1", nom: "Atlas" }, { entiteId: "e1" })
    ).toBe("g1");
    expect(findFirst.mock.calls[0][0].where).toEqual({
      code: "G1",
      entiteId: "e1",
    });

    findFirst.mockReset().mockResolvedValue(null);
    expect(
      await resoudreGroupe(
        db,
        { code: null, nom: "Sahara" },
        { entiteId: "e1", depuisT24: true }
      )
    ).toBe("nouveau");
    expect(findFirst.mock.calls[0][0].where.nom).toEqual({
      equals: "Sahara",
      mode: "insensitive",
    });
    expect(create.mock.calls[0][0].data).toMatchObject({
      code: null,
      nom: "Sahara",
      entiteId: "e1",
      sourceDonnees: "MANUELLE",
    });

    expect(await resoudreGroupe(db, undefined, {})).toBeUndefined();
    expect(await resoudreGroupe(db, null, {})).toBeNull();
  });
});
