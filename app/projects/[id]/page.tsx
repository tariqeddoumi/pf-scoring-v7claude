export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Détails du projet</h1>
      <p className="mt-2 text-muted-foreground">Projet ID : {id}</p>
    </div>
  );
}
