import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const activePath = path.join(process.cwd(), '..', '.memory', 'active_project.json');
        const data = await fs.readFile(activePath, 'utf-8');
        const activeProject = JSON.parse(data);

        return NextResponse.json(activeProject);
    } catch (error) {
        console.error('Error reading active project:', error);
        return NextResponse.json({ error: 'Failed to read active project' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { projectId } = await request.json();

        if (!projectId) {
            return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
        }

        const activeProject = {
            projectId,
            switchedAt: new Date().toISOString(),
            switchedBy: 'user'
        };

        const activePath = path.join(process.cwd(), '..', '.memory', 'active_project.json');
        await fs.writeFile(activePath, JSON.stringify(activeProject, null, 2));

        return NextResponse.json({ success: true, activeProject });
    } catch (error) {
        console.error('Error switching project:', error);
        return NextResponse.json({ error: 'Failed to switch project' }, { status: 500 });
    }
}
