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
import "./globals.css";

export const metadata: Metadata = {
  title: "PF Scoring - Project Finance",
  description:
    "Application de Scoring Project Finance - Conforme IFC, EBRD, Basel, Bank Al-Maghrib",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="font-sans antialiased bg-slate-950 text-slate-100">
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
      </body>
    </html>
  );
}
