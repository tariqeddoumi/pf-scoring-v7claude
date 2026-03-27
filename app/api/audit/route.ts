import { NextResponse } from "next/server";

interface AuditLogEntry {
  id: string;
  projectId?: string;
  utilisateurId: string;
  action: string;
  details: string;
  timestamp: Date;
}

// Mock data pour l'audit
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: "1",
    projectId: "1",
    utilisateurId: "user-1",
    action: "création",
    details: "Projet créé",
    timestamp: new Date("2024-01-15"),
  },
  {
    id: "2",
    projectId: "1",
    utilisateurId: "user-1",
    action: "modification",
    details: "Score mis à jour: 78.5",
    timestamp: new Date("2024-03-27"),
  },
  {
    id: "3",
    projectId: "2",
    utilisateurId: "user-1",
    action: "création",
    details: "Projet créé",
    timestamp: new Date("2024-02-01"),
  },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  // TODO: Implémenter avec Prisma
  if (projectId) {
    return NextResponse.json(
      mockAuditLogs.filter((log) => log.projectId === projectId)
    );
  }

  return NextResponse.json(mockAuditLogs);
}

export async function POST() {
  // TODO: Implémenter la création de log audit
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
