import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const webDir = path.join(rootDir, 'web');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m"
};

const log = (msg, color = colors.reset) => console.log(`${color}${msg}${colors.reset}`);
const info = (msg) => log(`ℹ️  ${msg}`, colors.cyan);
const success = (msg) => log(`✅ ${msg}`, colors.green);
const warn = (msg) => log(`⚠️  ${msg}`, colors.yellow);
const error = (msg) => log(`❌ ${msg}`, colors.red);

const ask = (question) => new Promise((resolve) => rl.question(`${colors.bright}${question} ${colors.reset}`, resolve));

const run = (cmd, cwd = rootDir) => {
    try {
        execSync(cmd, { cwd, stdio: 'inherit' });
        return true;
    } catch (e) {
        error(`Command failed: ${cmd}`);
        return false;
    }
};

async function main() {
    console.clear();
    log(`
    ╔════════════════════════════════════════╗
    ║           JARVIS ZERO-CONFIG           ║
    ║        Initialization Protocol         ║
    ╚════════════════════════════════════════╝
    `, colors.cyan);

    // 1. Root Dependencies
    info("Installing Root Dependencies...");
    run('npm install');
    success("Root dependencies installed.");

    // 2. Environment Configuration
    info("Configuring Environment...");
    const rootEnvPath = path.join(rootDir, '.env');
    const webEnvPath = path.join(webDir, '.env');
    let envContent = '';
    
    if (fs.existsSync(rootEnvPath)) {
        envContent = fs.readFileSync(rootEnvPath, 'utf8');
        success("Existing root .env found.");
    } else if (fs.existsSync(webEnvPath)) {
        // Fallback: Check if web/.env exists and copy to root
        info("Root .env missing, but found web/.env. Syncing upwards...");
        envContent = fs.readFileSync(webEnvPath, 'utf8');
        fs.writeFileSync(rootEnvPath, envContent);
        success("Synced web/.env to root .env.");
    } else {
        warn("No .env found. Let's set it up.");
        const geminiKey = await ask("Enter your Google Gemini API Key (Press Enter to skip):");
        if (geminiKey.trim()) {
            envContent += `GEMINI_API_KEY=${geminiKey.trim()}\n`;
        }
        
        // Add other defaults if needed
        envContent += `NODE_ENV=development\n`;
        
        fs.writeFileSync(rootEnvPath, envContent);
        success(".env created.");
    }

    // 3. Web Dependencies & Setup
    info("Setting up Web Dashboard...");
    if (!fs.existsSync(webDir)) {
        error("Web directory not found!");
        process.exit(1);
    }

    // Sync .env to web/.env (if it was created fresh at root and missing in web)
    if (!fs.existsSync(webEnvPath)) {
        info("Syncing .env to web/.env...");
        fs.writeFileSync(webEnvPath, envContent);
    }

    info("Installing Web Dependencies (this may take a moment)...");
    run('npm install', webDir);
    success("Web dependencies installed.");

    // 4. Database Setup (Prisma)
    info("Initializing Database...");
    // Generate Prisma Client
    run('npx prisma generate', webDir);
    
    // Push DB Schema (creates sqlite db file)
    run('npx prisma db push', webDir);
    success("Database initialized.");

    // 5. Finalize
    log(`
    ══════════════════════════════════════════
    🎉 SETUP COMPLETE!
    
    To start the system:
      ${colors.bright}npm run dev${colors.reset}    (Starts Web Dashboard + API)
      ${colors.bright}npm run healer${colors.reset} (Starts Auto-Healer)
    
    Access Dashboard at: http://localhost:3000
    ══════════════════════════════════════════
    `, colors.green);

    rl.close();
}

main().catch(err => {
    error(err);
    rl.close();
});
