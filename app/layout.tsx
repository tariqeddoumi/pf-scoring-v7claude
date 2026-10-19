import type { Metadata } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardConfigProvider } from "@/lib/dashboard-config-context";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { AppConfigProvider } from "@/components/providers/app-config-provider";
import { VisibiliteScoresProvider } from "@/components/providers/visibilite-scores";
import { ThemeWrapper } from "@/components/providers/theme-wrapper";
import { getPublicConfig } from "@/lib/services/app-config-service";
import "./globals.css";

export const metadata: Metadata = {
  title: "PF Scoring - Project Finance",
  description:
    "Application de Scoring Project Finance - Conforme IFC, EBRD, Basel, Bank Al-Maghrib",
};

/**
 * Rendu à chaque requête : le nom de l'outil, la couleur et le thème viennent du
 * paramétrage en base. Pré-rendues à la compilation, les pages statiques gardaient le
 * paramétrage du moment de la compilation (souvent les valeurs par défaut) pendant que
 * les pages dynamiques — fiches client et projet, scoring — prenaient le paramétrage
 * réel : deux apparences et deux noms d'outil selon l'écran.
 */
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getPublicConfig();
  // Le mode clair est le défaut de la direction visuelle ; le sombre reste un choix
  // explicite de la banque. La classe est posée au rendu serveur pour éviter le
  // clignotement au chargement.
  const themeMode = config.THEME_MODE === "dark" ? "dark" : "";

  return (
    <html lang="fr" className={themeMode}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AppConfigProvider initial={config}>
          <ThemeWrapper>
            <ReactQueryProvider>
              <DashboardConfigProvider>
                <VisibiliteScoresProvider>
                  <AppShell>{children}</AppShell>
                </VisibiliteScoresProvider>
              </DashboardConfigProvider>
            </ReactQueryProvider>
          </ThemeWrapper>
        </AppConfigProvider>
      </body>
    </html>
  );
}
