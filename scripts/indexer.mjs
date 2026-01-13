#!/usr/bin/env node

/**
 * JARVIS PROJECT INDEXER
 * 
 * Scans the current project to create a structured context map.
 * - Next.js Pages & Components
 * - Prisma Schema Models
 * - API Routes
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function indexProject(projectRoot) {
    console.log(`🔍 Indexing project at ${projectRoot}...`);

    const contextMap = {
        timestamp: new Date().toISOString(),
        structure: {
            pages: [],
            components: [],
            api: [],
            lib: [],
            styles: []
        },
        database: {
            models: [],
            enums: []
        },
        config: {}
    };

    // CRITICAL: Exclude node_modules at all levels
    const ignore = ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**', '**/.git/**'];

    // 1. Scan File Structure
    contextMap.structure.pages = await glob('web/app/**/page.{tsx,ts,jsx,js}', { cwd: projectRoot, ignore });
    contextMap.structure.components = await glob('web/components/**/*.{tsx,ts,jsx,js}', { cwd: projectRoot, ignore });
    contextMap.structure.api = await glob('web/app/api/**/*.{ts,js}', { cwd: projectRoot, ignore });
    contextMap.structure.lib = await glob('web/lib/**/*.{ts,js}', { cwd: projectRoot, ignore });
    contextMap.structure.styles = await glob('web/**/*.css', { cwd: projectRoot, ignore });

    // Also index scripts
    contextMap.structure.scripts = await glob('scripts/**/*.{mjs,js}', { cwd: projectRoot, ignore });

    // 2. Parse Prisma Schema (Simple Regex parser for speed)
    try {
        const prismaPath = path.join(projectRoot, 'web', 'prisma', 'schema.prisma');
        const content = await fs.readFile(prismaPath, 'utf-8');
        const modelRegex = /model\s+(\w+)\s+\{/g;
        const enumRegex = /enum\s+(\w+)\s+\{/g;

        let match;
        while ((match = modelRegex.exec(content)) !== null) {
            contextMap.database.models.push(match[1]);
        }
        while ((match = enumRegex.exec(content)) !== null) {
            contextMap.database.enums.push(match[1]);
        }
    } catch (e) {
        console.warn('⚠️ No Prisma schema found or readable');
    }

    // 3. Save Context Map
    const memoryDir = path.join(projectRoot, '.memory');
    await fs.mkdir(memoryDir, { recursive: true });

    const mapPath = path.join(memoryDir, 'context_map.json');
    await fs.writeFile(mapPath, JSON.stringify(contextMap, null, 2));

    console.log(`✅ Indexing complete. Map saved to ${mapPath}`);
    console.log(`   - ${contextMap.structure.pages.length} Pages`);
    console.log(`   - ${contextMap.structure.components.length} Components`);
    console.log(`   - ${contextMap.structure.api.length} API Routes`);
    console.log(`   - ${contextMap.structure.lib.length} Lib Files`);
    console.log(`   - ${contextMap.structure.scripts?.length || 0} Scripts`);
    console.log(`   - ${contextMap.database.models.length} DB Models`);

    return contextMap;
}

// Run if direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    indexProject(process.cwd());
}

export { indexProject };
