import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { EvaluationProvider } from "@/lib/evaluation-context";
import { UserProvider } from "@/lib/user-context";
import { AlertProvider } from "@/lib/alert-context";
import { CommentProvider } from "@/lib/comments-context";
import { DocumentProvider } from "@/lib/documents-context";
import { DashboardConfigProvider } from "@/lib/dashboard-config-context";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { AppConfigProvider } from "@/components/providers/app-config-provider";
import { ThemeWrapper } from "@/components/providers/theme-wrapper";
import { getPublicConfig } from "@/lib/services/app-config-service";
import "./globals.css";

export const metadata: Metadata = {
  title: "PF Scoring - Project Finance",
  description:
    "Application de Scoring Project Finance - Conforme IFC, EBRD, Basel, Bank Al-Maghrib",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getPublicConfig();
  const themeMode = config.THEME_MODE === "light" ? "" : "dark";

  return (
    <html lang="fr" className={themeMode}>
      <body className="font-sans antialiased bg-background text-foreground">
        <AppConfigProvider initial={config}>
          <ThemeWrapper>
            <ReactQueryProvider>
              <AlertProvider>
                <CommentProvider>
                  <DocumentProvider>
                    <DashboardConfigProvider>
                      <UserProvider>
                        <EvaluationProvider>
                          {/* Navbar */}
                          <Navbar />

                          {/* Main Layout with Sidebar */}
                          <div className="flex min-h-[calc(100vh-64px)]">
                            {/* Sidebar */}
                            <Sidebar />

                            {/* Main Content */}
                            <main className="flex-1 flex flex-col w-full md:w-auto">
                              <div className="flex-1 p-3 md:p-6 max-w-7xl w-full mx-auto">
                                {children}
                              </div>

                              {/* Footer */}
                              <Footer />
                            </main>
                          </div>
                        </EvaluationProvider>
                      </UserProvider>
                    </DashboardConfigProvider>
                  </DocumentProvider>
                </CommentProvider>
              </AlertProvider>
            </ReactQueryProvider>
          </ThemeWrapper>
        </AppConfigProvider>
      </body>
    </html>
  );
}
