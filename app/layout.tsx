import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { EvaluationProvider } from "@/lib/evaluation-context";
import { UserProvider } from "@/lib/user-context";
import { AlertProvider } from "@/lib/alert-context";
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
        <AlertProvider>
          <UserProvider>
            <EvaluationProvider>
          {/* Navbar */}
          <Navbar />

          {/* Main Layout with Sidebar */}
          <div className="flex min-h-[calc(100vh-64px)]">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
              <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
                {children}
              </div>

              {/* Footer */}
              <Footer />
            </main>
          </div>
            </EvaluationProvider>
          </UserProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
