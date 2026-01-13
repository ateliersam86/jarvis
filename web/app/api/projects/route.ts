import { NextResponse } from 'next/server';

// Redirect old /api/projects to new /api/v1/projects
// This maintains backward compatibility while using the new Prisma-based API
export async function GET(request: Request) {
  const url = new URL(request.url);
  const newUrl = url.origin + '/api/v1/projects';
  return NextResponse.redirect(newUrl, 307);
}