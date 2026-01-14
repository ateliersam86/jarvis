#!/usr/bin/env node
/**
 * Orchestrator Tests - Masterscript unit tests
 * Run with: node --test tests/orchestrator.test.mjs
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTERSCRIPT = path.join(__dirname, '..', 'scripts', 'masterscript.mjs');

// Helper to run masterscript with args
function runMasterscript(args, timeout = 30000) {
    return new Promise((resolve, reject) => {
        const proc = spawn('node', [MASTERSCRIPT, ...args], {
            cwd: path.join(__dirname, '..'),
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout
        });

        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (data) => { stdout += data.toString(); });
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
            resolve({ code, stdout, stderr });
        });

        proc.on('error', reject);

        // Close stdin immediately
        proc.stdin.end();
    });
}

describe('Masterscript CLI', () => {
    it('should show help with --help flag', async () => {
        const result = await runMasterscript(['--help']);
        assert.strictEqual(result.code, 0, 'Exit code should be 0');
        assert.ok(result.stdout.includes('JARVIS MASTERSCRIPT'), 'Should contain JARVIS MASTERSCRIPT');
        assert.ok(result.stdout.includes('--model'), 'Should contain --model option');
        assert.ok(result.stdout.includes('--swarm'), 'Should contain --swarm option');
        assert.ok(result.stdout.includes('--plan-first'), 'Should contain --plan-first option');
        assert.ok(result.stdout.includes('--include'), 'Should contain --include option');
    });

    it('should list models with --list-models flag', async () => {
        const result = await runMasterscript(['--list-models']);
        assert.strictEqual(result.code, 0, 'Exit code should be 0');
        assert.ok(result.stdout.includes('gemini'), 'Should list gemini models');
    });

    it('should show status with --status flag', async () => {
        const result = await runMasterscript(['--status']);
        assert.strictEqual(result.code, 0, 'Exit code should be 0');
        assert.ok(result.stdout.includes('JARVIS SYSTEM STATUS'), 'Should contain status header');
        assert.ok(result.stdout.includes('Gemini CLI'), 'Should show Gemini CLI status');
        assert.ok(result.stdout.includes('Claude CLI'), 'Should show Claude CLI status');
        assert.ok(result.stdout.includes('Codex CLI'), 'Should show Codex CLI status');
    });
});

describe('Plan-First Mode', () => {
    it('should show PLAN-FIRST MODE message when flag is used', async () => {
        const result = await runMasterscript(['test plan', '--plan-first', '--model', 'gemini:flash'], 60000);
        // Even if execution fails, should show plan-first mode
        assert.ok(
            result.stdout.includes('PLAN-FIRST MODE') || result.stderr.includes('PLAN-FIRST MODE'),
            'Should indicate plan-first mode is active'
        );
    });
});

describe('Context Injection', () => {
    it('should show Context Injection message when --include is used', async () => {
        const result = await runMasterscript([
            'test injection',
            '--include', 'README.md',
            '--plan-first',
            '--model', 'gemini:flash'
        ], 60000);

        assert.ok(
            result.stdout.includes('Context Injection') || result.stderr.includes('Context Injection'),
            'Should indicate context injection is active'
        );
    });
});

console.log('\\n🧪 Orchestrator Tests\\n');
console.log('Run with: node --test tests/orchestrator.test.mjs');
