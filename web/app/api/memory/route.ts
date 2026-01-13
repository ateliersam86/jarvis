import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MEMORY_ROOT = path.join(process.cwd(), '..', '.memory');

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('project');

        // Get active project if not specified
        let activeProjectId = projectId;
        if (!activeProjectId) {
            const activePath = path.join(MEMORY_ROOT, 'active_project.json');
            const activeData = await fs.readFile(activePath, 'utf-8');
            const active = JSON.parse(activeData);
            activeProjectId = active.projectId;
        }

        const safeProjectId = activeProjectId || 'jarvis';
        const projectDir = path.join(MEMORY_ROOT, 'projects', safeProjectId);

        // Read all worker memory files
        const workers = await Promise.all([
            fs.readFile(path.join(projectDir, 'gemini.json'), 'utf-8').then(JSON.parse).catch(() => null),
            fs.readFile(path.join(projectDir, 'claude.json'), 'utf-8').then(JSON.parse).catch(() => null),
            fs.readFile(path.join(projectDir, 'chatgpt.json'), 'utf-8').then(JSON.parse).catch(() => null),
        ]);

        // Read conductor state
        const conductorPath = path.join(projectDir, 'conductor_state.json');
        const conductor = await fs.readFile(conductorPath, 'utf-8').then(JSON.parse).catch(() => null);

        // Read project memory
        const projectMemoryPath = path.join(projectDir, 'PROJECT_MEMORY.md');
        const projectMemory = await fs.readFile(projectMemoryPath, 'utf-8').catch(() => '');

        return NextResponse.json({
            projectId: activeProjectId,
            workers: {
                gemini: workers[0],
                claude: workers[1],
                chatgpt: workers[2],
            },
            conductor,
            projectMemory,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error reading memory files:', error);
        return NextResponse.json({ error: 'Failed to read memory files' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { files } = data; // Record<string, string> where key is relative path from .memory

        if (!files || typeof files !== 'object') {
            return NextResponse.json({ error: 'Invalid files payload' }, { status: 400 });
        }

        const results = [];
        for (const [relPath, content] of Object.entries(files)) {
            // Security check: ensure path is within .memory
            const fullPath = path.join(MEMORY_ROOT, relPath);
            if (!fullPath.startsWith(MEMORY_ROOT)) {
                results.push({ path: relPath, status: 'error', message: 'Forbidden path' });
                continue;
            }

            try {
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, typeof content === 'string' ? content : JSON.stringify(content, null, 4));
                results.push({ path: relPath, status: 'success' });
            } catch (err) {
                results.push({ path: relPath, status: 'error', message: (err as Error).message });
            }
        }

        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[/api/memory] POST error:', error);
        return NextResponse.json({ error: 'Failed to update memory' }, { status: 500 });
    }
}
