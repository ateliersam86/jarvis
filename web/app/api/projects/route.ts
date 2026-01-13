import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Project } from '@/lib/types';

export async function GET() {
  try {
    const memoryDir = path.join(process.cwd(), '..', '.memory');
    const projectsPath = path.join(memoryDir, 'projects.json');
    const data = await fs.readFile(projectsPath, 'utf-8');
    const { projects } = JSON.parse(data);

    const now = new Date();
    const FIVE_MINUTES_MS = 5 * 60 * 1000;
    const allWorkers: Record<string, unknown>[] = [];

    const enrichedProjects = await Promise.all(
      projects.map(async (project: Project) => {
        let activeAgents = 0;
        const projectMemoryDir = path.join(memoryDir, 'projects', project.id);

        try {
          const files = await fs.readdir(projectMemoryDir);
          const jsonFiles = files.filter((f) => f.endsWith('.json'));

          for (const file of jsonFiles) {
            try {
              const filePath = path.join(projectMemoryDir, file);
              const fileContent = await fs.readFile(filePath, 'utf-8');
              const agentData = JSON.parse(fileContent);

              if (agentData.workerId && agentData.lastActive) {
                const lastActive = new Date(agentData.lastActive);
                if (now.getTime() - lastActive.getTime() < FIVE_MINUTES_MS) {
                  activeAgents++;
                }
                
                // Add to global workers list
                allWorkers.push({
                  ...agentData,
                  projectId: project.id,
                  // Ensure unique key for React lists if needed, though workerId+projectId is better
                  uniqueId: `${project.id}-${agentData.workerId}` 
                });
              }
            } catch (_err) {
              // Skip invalid or unreadable files
            }
          }
        } catch (_err) {
          // Project memory directory might not exist yet
        }

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          icon: project.icon,
          color: project.color,
          subdomain: project.subdomain,
          agentCount: activeAgents,
          status: activeAgents > 0 ? 'active' : 'idle',
        };
      })
    );

    return NextResponse.json({ projects: enrichedProjects, allWorkers });
  } catch (error) {
    console.error('Error reading projects:', error);
    return NextResponse.json({ error: 'Failed to read projects' }, { status: 500 });
  }
}