#!/usr/bin/env node

/**
 * 🐍 OUROBOROS - Self-Improvement Loop
 * 
 * 1. Checks for Lint/Build errors
 * 2. Delegates fixes to Gemini via MasterScript
 * 3. Verifies fixes
 * 4. Commits changes
 */

import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import util from 'util';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'web');

function log(msg) {
    console.log(`[${new Date().toISOString()}] 🐍 ${msg}`);
}

async function runCommand(command, cwd) {
    try {
        const { stdout, stderr } = await execAsync(command, { cwd, maxBuffer: 1024 * 1024 * 5 }); // 5MB buffer
        return { success: true, stdout, stderr };
    } catch (error) {
        return { success: false, stdout: error.stdout, stderr: error.stderr, error };
    }
}

async function gitCommit(message) {
    const status = await runCommand('git status --porcelain', ROOT_DIR);
    if (!status.stdout.trim()) {
        log('No changes to commit.');
        return;
    }

    await runCommand('git add .', ROOT_DIR);
    await runCommand(`git commit -m "${message}"`, ROOT_DIR);
    log(`Committed: ${message}`);
}

async function main() {
    log('Starting Ouroboros cycle...');

    // 1. Collect Lint Errors
    log('Running Lint...');
    const lintResult = await runCommand('npm run lint -- --format json', WEB_DIR);
    let lintErrors = [];

    if (lintResult.stdout) {
        try {
            // Find JSON in output (sometimes there's noise)
            const jsonStart = lintResult.stdout.indexOf('[');
            const jsonEnd = lintResult.stdout.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = lintResult.stdout.substring(jsonStart, jsonEnd + 1);
                const lintData = JSON.parse(jsonStr);

                // Filter only errors (severity 2)
                lintData.forEach(file => {
                    const errors = file.messages.filter(m => m.severity === 2);
                    if (errors.length > 0) {
                        lintErrors.push({
                            filePath: path.relative(WEB_DIR, file.filePath),
                            messages: errors.map(e => `Line ${e.line}: ${e.message} (${e.ruleId})`)
                        });
                    }
                });
            }
        } catch (e) {
            log('Failed to parse lint output: ' + e.message);
        }
    }

    // 2. Collect Build Errors
    log('Running Build...');
    const buildResult = await runCommand('npm run build', WEB_DIR);
    let buildErrorText = '';

    if (!buildResult.success) {
        // Extract meaningful error from stderr/stdout
        buildErrorText = (buildResult.stderr || buildResult.stdout || '').substring(0, 2000);
    }

    // 3. Analyze & Act
    const hasLintErrors = lintErrors.length > 0;
    const hasBuildErrors = !buildResult.success;

    if (!hasLintErrors && !hasBuildErrors) {
        log('✅ System healthy. No actions needed.');
        return;
    }

    log(`Found issues: ${lintErrors.length} files with lint errors, Build broken: ${hasBuildErrors}`);

    // Construct Prompt
    let prompt = "Act as a Code Healer. Fix the following errors in the 'web' directory:\n\n";

    if (hasLintErrors) {
        prompt += "### LINT ERRORS\n";
        lintErrors.slice(0, 5).forEach(f => { // Limit to 5 files to fit context
            prompt += `File: ${f.filePath}\n${f.messages.join('\n')}\n\n`;
        });
        if (lintErrors.length > 5) prompt += `...and ${lintErrors.length - 5} more files.\n`;
    }

    if (hasBuildErrors) {
        prompt += `### BUILD ERRORS\n${buildErrorText}\n`;
    }

    prompt += "\nUse 'replace' or 'write_file' to fix these issues directly. run 'npm run lint' or 'npm run build' to verify if needed.";

    // 4. Invoke Gemini via MasterScript
    log('Delegating to Gemini...');
    // We use a simplified call to avoid complex escaping issues in shell
    // by passing the prompt through an environment variable or a temp file if needed.
    // For now, we'll try direct argument, but formatted carefully.

    // Create a temp file for the prompt to be safe
    const promptFile = path.join(ROOT_DIR, '.gemini', 'tmp', `ouroboros_prompt_${Date.now()}.txt`);
    await fs.mkdir(path.dirname(promptFile), { recursive: true });
    await fs.writeFile(promptFile, prompt);

    // Read it back in the sub-process or pass it as string?
    // Masterscript expects prompt as arg. 
    // Let's pass a short prompt and ask it to read the file? 
    // No, Masterscript isn't that smart yet. Let's just pass the string, escaping it.
    // Actually, spawning node directly allows passing args without shell parsing issues.

    const child = spawn('node', ['scripts/masterscript.mjs', prompt, '--model', 'gemini:pro', '--task-type', 'fix_bug'], {
        cwd: ROOT_DIR,
        stdio: 'inherit'
    });

    await new Promise((resolve) => {
        child.on('close', resolve);
    });

    // Clean up
    await fs.unlink(promptFile).catch(() => { });

    // 5. Verify Fixes
    log('Verifying fixes...');
    const verifyLint = await runCommand('npm run lint', WEB_DIR);
    const verifyBuild = await runCommand('npm run build', WEB_DIR);

    if (verifyLint.success && verifyBuild.success) {
        log('✅ Fixes verified successfully.');
        await gitCommit('Ouroboros: Auto-fixed lint and build errors');
    } else {
        log('❌ Fixes failed verification.');
        if (!verifyLint.success) log('Lint still failing.');
        if (!verifyBuild.success) log('Build still failing.');
    }
}

main().catch(err => {
    console.error('Fatal Ouroboros Error:', err);
    process.exit(1);
});
