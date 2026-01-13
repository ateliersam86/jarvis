import ProjectDashboard from '@/components/ProjectDashboard';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 font-mono relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Project Dashboard - Full Screen */}
      <div className="relative z-10 flex-1 p-6">
        <ProjectDashboard projectId={projectId} />
      </div>
    </main>
  );
}
