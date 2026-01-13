import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Get target directory from args or default to current
const targetDir = process.argv[2] || process.cwd();

console.log(`\x1b[36m🚑 AI HEALER: Starting diagnosis on ${targetDir}...\x1b[0m`);

// Verify directory exists
if (!fs.existsSync(targetDir)) {
    console.error(`\x1b[31m❌ Directory not found: ${targetDir}\x1b[0m`);
    process.exit(1);
}

// 1. Run Type Check
console.log("👉 Checking TypeScript types...");
try {
    // Run tsc in the target directory
    execSync('npx tsc --noEmit', { stdio: 'pipe', cwd: targetDir });
    console.log("\x1b[32m✅ No type errors found.\x1b[0m");
} catch (error) {
    console.log("\x1b[31m❌ Type errors detected!\x1b[0m");
    const output = error.stdout ? error.stdout.toString() : "Unknown error";

    // Construct prompt for Gemini
    const prompt = `I found these TypeScript errors in the project at ${targetDir}. Please analyze them and provide the FIXED code for the affected files. 
    IMPORTANT: Do NOT try to use any tools. Just output the corrected code inside markdown code blocks like \`\`\`typescript ... \`\`\`.
    
    Errors:\n${output.substring(0, 4000)}`;

    try {
        console.log("🤖 Asking Gemini for fixes...");
        // Ensure Gemini runs in the correct context if needed, though for prompt it doesn't matter much
        execSync(`gemini "${prompt}"`, { stdio: 'inherit', cwd: targetDir });
    } catch (geminiError) {
        console.error("❌ Failed to run Gemini:", geminiError.message);
    }
}

// 2. Run Lint Check
console.log("\n👉 Checking Linting...");
try {
    execSync('npm run lint', { stdio: 'pipe', cwd: targetDir });
    console.log("\x1b[32m✅ No lint errors found.\x1b[0m");
} catch (error) {
    console.log("\x1b[31m❌ Lint errors detected!\x1b[0m");
    console.log("💡 Tip: Run 'gemini \"Fix lint errors\"' to resolve.");
}

console.log("\n\x1b[36m🏁 Healer finished.\x1b[0m");
