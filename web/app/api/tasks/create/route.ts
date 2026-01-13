import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGitHubIssue } from "@/lib/github";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, projectId, createIssue, priority = 0 } = body;

        if (!title || !projectId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Get Project to check for Repo URL
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { user: true }
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        let githubIssueId: number | null = null;
        let githubHtmlUrl: string | null = null;

        // 2. Create GitHub Issue if requested
        if (createIssue && project.repoUrl) {
            // Find GitHub Account for user
            const account = await prisma.account.findFirst({
                where: {
                    userId: session.user.id,
                    provider: 'github'
                }
            });

            if (account && account.access_token) {
                try {
                    const issue = await createGitHubIssue({
                        accessToken: account.access_token,
                        repoUrl: project.repoUrl,
                        title,
                        body: description || `Task created from Jarvis for project ${project.name}`,
                    });

                    githubIssueId = issue.id;
                    githubHtmlUrl = issue.html_url;
                } catch (ghError) {
                    console.error("Failed to create GitHub issue:", ghError);
                    // Don't fail the whole request, just log it. 
                    // Or maybe return a warning? For now, we proceed without GitHub link.
                }
            }
        }

        // 3. Create Task in DB
        const task = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                status: 'PENDING',
                projectId,
                githubIssueId,
                githubHtmlUrl,
                agentId: 'user', // Created by user
            }
        });

        return NextResponse.json({ task });

    } catch (error) {
        console.error("Error creating task:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
