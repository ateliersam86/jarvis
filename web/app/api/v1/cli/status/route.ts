import { NextResponse } from 'next/server';

/**
 * GET /api/v1/cli/status
 * Returns the status of CLI agents for the dashboard
 * 
 * Note: This is a mock endpoint. In production, this would query
 * the actual CLI status from the server running masterscript.
 * For now, it returns a static representation.
 */
export async function GET() {
    // In a real implementation, this would:
    // 1. Execute `node masterscript.mjs --status --json` on the server
    // 2. Parse the output and return structured data
    // 
    // For now, we return mock data that the dashboard can display
    // The actual status comes from the CLI when run locally

    const agents = [
        {
            id: 'gemini',
            name: 'Gemini CLI',
            status: 'connected' as const,
            model: 'gemini-3-pro-preview',
            icon: '🔷'
        },
        {
            id: 'claude',
            name: 'Claude CLI',
            status: 'not_authenticated' as const,
            model: 'claude-sonnet-4',
            icon: '🟣'
        },
        {
            id: 'openai',
            name: 'Codex CLI',
            status: 'connected' as const,
            model: 'gpt-5.2-codex',
            icon: '🔶'
        }
    ];

    return NextResponse.json({
        agents,
        timestamp: new Date().toISOString(),
        note: 'Run "jarvis --status" locally for real-time status'
    });
}
