import { Prisma } from "@prisma/client";
import { messagePublic } from "@/lib/erreur-publique";

describe("message d'erreur montré à l'utilisateur", () => {
  it("masque les erreurs de base de données", () => {
    const e = new Prisma.PrismaClientKnownRequestError(
      "Invalid `prisma.client.update()` invocation: …",
      {
        code: "P2025",
        clientVersion: "5.20.0",
      }
    );
    expect(messagePublic(e, "Erreur serveur")).toBe("Erreur serveur");
    expect(messagePublic(new Error("ligne 1\nligne 2"), "Erreur")).toBe(
      "Erreur"
    );
    expect(
      messagePublic(new Error("connect ECONNREFUSED 10.0.0.1:5432"), "Erreur")
    ).toBe("Erreur");
    expect(messagePublic("texte", "Erreur")).toBe("Erreur");
  });

  it("garde les messages métier", () => {
    expect(messagePublic(new Error("Client non trouvé"), "Erreur")).toBe(
      "Client non trouvé"
    );
    expect(
      messagePublic(
        new Error("Ce dossier n'appartient pas à votre périmètre."),
        "Erreur"
      )
    ).toBe("Ce dossier n'appartient pas à votre périmètre.");
  });
});
