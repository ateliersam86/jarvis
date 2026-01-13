#!/usr/bin/env node

/**
 * JARVIS AUTO-VERIFY
 * Architecture: Check -> Fix -> Verify -> Health Update -> Gatekeep
 * 
 * Used by: sync-to-unraid.sh, pre-commit hooks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { delegate } from './masterscript.mjs';
import { ProjectIntelligence } from './lib/project-intelligence.mjs';

const execAsync = promisify(exec);
const WEB_DIR = path.join(process.cwd(), 'web');
const MAX_RETRIES = 3;

async function runChecks() {
    console.log('🔍 Verifying build integrity...');
    try {
        // Run Lint & Type Check
        // We run them sequentially to avoid mixed output, or could be parallel
        await execAsync('npm run lint', { cwd: WEB_DIR });
        await execAsync('npx tsc --noEmit', { cwd: WEB_DIR });

        return { success: true };
    } catch (error) {
        return {
            success: false,
            output: error.stdout || error.stderr || error.message
        };
    }
}

async function autoVerify() {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const result = await runChecks();

        if (result.success) {
            console.log('✅ Verification Passed');

            // Update health/expertise counters on all projects
            console.log('📊 Updating expertise counters...');
            await ProjectIntelligence.updateHealthState('jarvis');

            process.exit(0);
        }

        console.log(`⚠️ Errors Detected (Attempt ${attempt}/${MAX_RETRIES})`);
        console.log('─'.repeat(40));
        console.log(result.output.slice(0, 1000) + '...');
        console.log('─'.repeat(40));

        if (attempt < MAX_RETRIES) {
            console.log('🩹 Delegating fix to Gemini Pro...');
            try {
                const fixPrompt = `Fix these lint/type errors in the 'web' directory. 
                You are a Code Healer.
                Context: Next.js 15, React 19.
                
                ERRORS:
                ${result.output.slice(0, 5000)}`;

                await delegate(fixPrompt, {
                    model: 'gemini:pro',
                    taskType: 'fix_bug',
                    noParse: true
                });

                console.log('🔄 Fix applied, re-verifying...');
            } catch (e) {
                console.error('❌ Auto-fix failed:', e.message);
                process.exit(1);
            }
        }
    }

    console.error('⛔ Verification Failed: Errors persist after max retries.');
    process.exit(1);
}

autoVerify();
