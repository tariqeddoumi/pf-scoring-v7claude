import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types";
import { getGradeColor } from "@/lib/scoring-engine";

interface ProjectListProps {
  projects: Project[];
}

export function ProjectList({ projects }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Aucun projet trouvé</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="block"
        >
          <Card className="p-6 hover:bg-secondary/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{project.nom}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {project.description}
                </p>
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline">{project.secteur}</Badge>
                  <Badge variant="outline">
                    {project.montant.toLocaleString()} MAD
                  </Badge>
                </div>
              </div>

              <div className="text-right ml-4">
                <Badge variant="secondary">{project.status}</Badge>
                {project.scoreGlobal !== null && (
                  <div
                    className={`mt-2 text-2xl font-bold ${getGradeColor(project.grade!)}`}
                  >
                    {project.grade}
                  </div>
                )}
                {!project.scoreGlobal && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Non scoré
                  </p>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
