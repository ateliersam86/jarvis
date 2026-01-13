#!/usr/bin/env node

/**
 * JARVIS AUTO-HEALER - Automatic Error Detection & Delegation
 * 
 * Watches for:
 * - ESLint errors → Delegates to Gemini CLI
 * - TypeScript errors → Delegates to Gemini CLI
 * - Test failures → Delegates to Codex CLI
 * - Build failures → Reports to Opus
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { watch } from 'fs';
import { delegate } from './masterscript.mjs';

const execAsync = promisify(exec);

// Error Detection Patterns
const ERROR_PATTERNS = {
    lint: /error\s+.+\s+eslint/i,
    typescript: /error TS\d+:/i,
    test: /FAIL|Test failed/i,
    build: /Build failed|compilation error/i
};

/**
 * Run linter and detect errors
 */
async function checkLint() {
    try {
        await execAsync('npm run lint --silent', { cwd: process.cwd() });
        return { hasErrors: false };
    } catch (error) {
        const output = error.stdout || error.stderr;
        const errors = output.match(ERROR_PATTERNS.lint);

        if (errors) {
            console.log('🔍 Detected lint errors, delegating to Gemini...');
            return { hasErrors: true, type: 'lint', output };
        }
        return { hasErrors: false };
    }
}

/**
 * Run TypeScript check
 */
async function checkTypes() {
    try {
        await execAsync('npx tsc --noEmit', { cwd: process.cwd() });
        return { hasErrors: false };
    } catch (error) {
        const output = error.stdout || error.stderr;
        const errors = output.match(ERROR_PATTERNS.typescript);

        if (errors) {
            console.log('🔍 Detected TypeScript errors, delegating to Gemini...');
            return { hasErrors: true, type: 'typescript', output };
        }
        return { hasErrors: false };
    }
}

/**
 * Auto-heal detected errors
 */
async function autoHeal(errorType, errorOutput) {
    console.log(`\n🏥 AUTO-HEALING ${errorType.toUpperCase()} errors...\n`);

    const prompts = {
        lint: 'Fix all ESLint errors in the project',
        typescript: 'Fix all TypeScript type errors',
        test: 'Fix failing tests',
        build: 'Fix build errors'
    };

    const result = await delegate(prompts[errorType], { yolo: true });

    if (result.success) {
        console.log('✅ Auto-heal completed successfully');
        // Sync to Unraid
        await execAsync('./sync-to-unraid.sh');
        console.log('📤 Changes synced to Unraid');
    } else {
        console.error('❌ Auto-heal failed, escalating to Opus...');
    }
}

/**
 * Watch mode - continuous monitoring
 */
async function watchMode() {
    console.log('👁️  JARVIS AUTO-HEALER - Watching for errors...\n');

    // Check every 30 seconds
    setInterval(async () => {
        const lintCheck = await checkLint();
        if (lintCheck.hasErrors) {
            await autoHeal('lint', lintCheck.output);
        }

        const typeCheck = await checkTypes();
        if (typeCheck.hasErrors) {
            await autoHeal('typescript', typeCheck.output);
        }
    }, 30000);
}

/**
 * One-time check mode
 */
async function checkOnce() {
    console.log('🔍 Running one-time health check...\n');

    const lintCheck = await checkLint();
    const typeCheck = await checkTypes();

    if (lintCheck.hasErrors || typeCheck.hasErrors) {
        console.log('⚠️  Errors detected, run with --heal to auto-fix');
        process.exit(1);
    } else {
        console.log('✅ No errors detected');
        process.exit(0);
    }
}

// CLI
const args = process.argv.slice(2);

if (args.includes('--watch')) {
    watchMode();
} else if (args.includes('--heal')) {
    checkOnce().then(async () => {
        const lintCheck = await checkLint();
        if (lintCheck.hasErrors) await autoHeal('lint', lintCheck.output);

        const typeCheck = await checkTypes();
        if (typeCheck.hasErrors) await autoHeal('typescript', typeCheck.output);
    });
} else {
    checkOnce();
}
