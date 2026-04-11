import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@pfscoring.ma";
  const password = "Admin@123456"; // À changer en production

  try {
    // Vérifier si l'utilisateur existe
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`✓ Utilisateur ${email} existe déjà`);
      return;
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom: "Admin",
        prenom: "PF Scoring",
        role: "admin",
      },
    });

    console.log("✓ Utilisateur admin créé:");
    console.log(`  Email: ${user.email}`);
    console.log(`  Rôle: ${user.role}`);
    console.log(`\n⚠️  Mot de passe temporaire: ${password}`);
    console.log(
      "   Veuillez le changer immédiatement après la première connexion."
    );
  } catch (error) {
    console.error("Erreur:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
