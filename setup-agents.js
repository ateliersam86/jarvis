import { execSync } from 'child_process';

console.log("\x1b[36m🤖 AI Agents Setup (Windows/Mac/Linux)\x1b[0m");
console.log("=======================================");

const runCommand = (cmd) => {
    try {
        execSync(cmd, { stdio: 'inherit' });
        return true;
    } catch (e) {
        return false;
    }
};

// 1. Install Global Packages if missing
console.log("\n📦 Checking dependencies...");
if (!runCommand('gemini --version')) {
    console.log("Installing Gemini CLI...");
    runCommand('npm install -g @google/gemini-cli');
}
if (!runCommand('codex --version')) {
    console.log("Installing Codex CLI...");
    runCommand('npm install -g @openai/codex');
}

// 2. Auth Gemini
console.log("\n🔑 Setting up Gemini Auth...");
if (process.env.GEMINI_API_KEY) {
    console.log("✅ GEMINI_API_KEY found in environment.");
} else {
    console.log("⚠️  GEMINI_API_KEY not found. Please add it to your .env file.");
    console.log("   Get it here: https://aistudio.google.com/app/apikey");
}

// 3. Auth Codex
console.log("\n🔑 Setting up Codex Auth...");
console.log("Launching Codex login (browser)...");
try {
    runCommand('codex auth login');
} catch (e) {
    console.log("❌ Codex login skipped or failed.");
}

console.log("\n✅ Setup finished! You can now run 'npm run healer'");
