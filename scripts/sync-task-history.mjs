import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../web/node_modules/@prisma/client');

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASK_FILE_PATH = path.join(__dirname, '../.memory/tasks/current.md');
const PROJECT_SLUG = 'jarvis';
const PROJECT_NAME = 'Jarvis Open Source Platform';

// Status mapping
const STATUS_MAP = {
  '[x]': 'COMPLETED',
  '[ ]': 'PENDING',
  '[/]': 'IN_PROGRESS',
  '[-]': 'FAILED'
};

async function parseTaskFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Task file not found at ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const tasks = [];
  let currentPhase = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect Phase (Parent Task)
    if (trimmed.startsWith('## Phase')) {
      const title = trimmed.replace(/^##\s*/, '').trim();
      currentPhase = {
        title,
        status: 'PENDING', // Will update based on children later if needed, but for now default
        isPhase: true,
        children: []
      };
      tasks.push(currentPhase);
      continue;
    }

    // Detect Task Item
    const taskMatch = trimmed.match(/^- \[(.| )] (.*)/);
    if (taskMatch) {
      const marker = `[${taskMatch[1]}]`;
      const title = taskMatch[2].trim();
      const status = STATUS_MAP[marker] || 'PENDING';

      const task = {
        title,
        status,
        isPhase: false
      };

      if (currentPhase) {
        currentPhase.children.push(task);
      } else {
        // Top level task if no phase defined yet
        tasks.push(task);
      }
    }
  }

  return tasks;
}

async function syncTasks() {
  console.log('Starting task sync...');

  // 1. Ensure Project Exists
  // Use upsert to ensure it exists. We need a dummy user ID if we create it.
  // For now, let's try to find a user or create a system user.
  
  let systemUser = await prisma.user.findFirst({ where: { email: 'system@jarvis.local' } });
  if (!systemUser) {
    console.log('Creating system user...');
    systemUser = await prisma.user.create({
      data: {
        email: 'system@jarvis.local',
        name: 'System',
        password: 'system_placeholder' // Should be hashed in real app
      }
    });
  }

  const project = await prisma.project.upsert({
    where: {
      userId_slug: {
        userId: systemUser.id,
        slug: PROJECT_SLUG
      }
    },
    update: {},
    create: {
      name: PROJECT_NAME,
      slug: PROJECT_SLUG,
      userId: systemUser.id,
      description: 'Auto-generated project for Jarvis',
      localPath: path.resolve(__dirname, '..')
    }
  });

  console.log(`Synced Project: ${project.name} (${project.id})`);

  // 2. Parse File
  const parsedTasks = await parseTaskFile(TASK_FILE_PATH);

  // 3. Sync Tasks
  for (const item of parsedTasks) {
    // Sync Phase (Parent)
    const phaseTask = await upsertTask(project.id, item, null);

    // Sync Children
    if (item.children && item.children.length > 0) {
      for (const child of item.children) {
        await upsertTask(project.id, child, phaseTask.id);
      }
    }
  }

  console.log('Task sync completed.');
}

async function upsertTask(projectId, taskData, parentId) {
  // Find existing task by title and project (and parent to be more specific, but title+project is decent for now)
  // We'll prioritize matching by title within the project.
  
  const existingTask = await prisma.task.findFirst({
    where: {
      projectId: projectId,
      title: taskData.title,
      parentId: parentId
    }
  });

  if (existingTask) {
    // Check for updates
    if (existingTask.status !== taskData.status) {
      console.log(`Updating status for "${taskData.title}": ${existingTask.status} -> ${taskData.status}`);
      
      const updatedTask = await prisma.task.update({
        where: { id: existingTask.id },
        data: {
          status: taskData.status,
          history: {
            create: {
              oldStatus: existingTask.status,
              newStatus: taskData.status,
              changedBy: 'system-sync',
              diff: `Status changed from ${existingTask.status} to ${taskData.status}`
            }
          }
        }
      });
      return updatedTask;
    }
    return existingTask;
  } else {
    // Create new task
    console.log(`Creating new task: "${taskData.title}"`);
    const newTask = await prisma.task.create({
      data: {
        title: taskData.title,
        status: taskData.status,
        projectId: projectId,
        parentId: parentId,
        history: {
          create: {
            newStatus: taskData.status,
            changedBy: 'system-sync',
            diff: 'Task created via sync'
          }
        }
      }
    });
    return newTask;
  }
}

syncTasks()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
