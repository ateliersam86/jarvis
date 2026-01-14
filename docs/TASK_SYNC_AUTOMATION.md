# Task Sync Automation

Automate the task synchronization between `task.md` and the Prisma database.

## Manual Sync
```bash
npm run task:sync
```

## Automatic Sync (macOS)

### Install Launch Agent
```bash
# Copy plist to LaunchAgents
cp infrastructure/launchd/com.jarvis.task-sync.plist ~/Library/LaunchAgents/

# Load the agent
launchctl load ~/Library/LaunchAgents/com.jarvis.task-sync.plist
```

### Check Status
```bash
launchctl list | grep jarvis
```

### View Logs
```bash
tail -f /tmp/jarvis-task-sync.log
```

### Uninstall
```bash
launchctl unload ~/Library/LaunchAgents/com.jarvis.task-sync.plist
rm ~/Library/LaunchAgents/com.jarvis.task-sync.plist
```

## How It Works

1. Runs every **30 minutes**
2. Parses `.memory/tasks/current.md`
3. Syncs task status to Prisma database
4. Creates history entries for status changes
