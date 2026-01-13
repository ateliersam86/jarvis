
import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_OAUTH_CONFIG } from '@/lib/google/oauth-config';
import { cloudCodeClient } from '@/lib/google/cloud-code-client';
import { redis } from '@/lib/redis';
// const redis = new Redis(...); // Removed manual instantiation

export async function POST(req: NextRequest) {
    try {
        const { code, refreshToken } = await req.json();
        let accessToken = '';
        let newRefreshToken = '';

        // 1. Exchange Code if provided
        if (code) {
            const params = new URLSearchParams({
                client_id: GOOGLE_OAUTH_CONFIG.clientId,
                client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
                code: code,
                redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
                grant_type: 'authorization_code',
            });

            const tokenRes = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            if (!tokenRes.ok) {
                const err = await tokenRes.text();
                return NextResponse.json({ error: `Token exchange failed: ${err}` }, { status: 400 });
            }

            const tokens = await tokenRes.json();
            accessToken = tokens.access_token;
            newRefreshToken = tokens.refresh_token;
        }
        // 2. Or use Refresh Token
        else if (refreshToken) {
            const params = new URLSearchParams({
                client_id: GOOGLE_OAUTH_CONFIG.clientId,
                client_secret: GOOGLE_OAUTH_CONFIG.clientSecret,
                refresh_token: refreshToken,
                grant_type: 'refresh_token',
            });

            const tokenRes = await fetch(GOOGLE_OAUTH_CONFIG.tokenUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params.toString(),
            });

            if (!tokenRes.ok) {
                return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
            }
            const tokens = await tokenRes.json();
            accessToken = tokens.access_token;
        } else {
            return NextResponse.json({ error: 'Missing code or refresh token' }, { status: 400 });
        }

        if (accessToken) {
            // Save to Redis so Workers can access it
            await redis.set('jarvis:auth:google:tokens', JSON.stringify({
                accessToken,
                refreshToken: newRefreshToken || refreshToken,
                updatedAt: Date.now()
            }));
        }

        // 3. Fetch Quota using access token
        const projectInfo = await cloudCodeClient.resolveProjectId(accessToken);
        const quotaData = await cloudCodeClient.fetchAvailableModels(accessToken, projectInfo.projectId);

        return NextResponse.json({
            quota: quotaData,
            refreshToken: newRefreshToken || refreshToken, // Return new one only if we exchanged code
            accessToken: accessToken, // Frontend might want to cache it short-term
            projectInfo
        });

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}
