# Self-Hosting Jarvis

Jarvis is designed to be self-hosted, allowing you to maintain full control over your data, memory, and AI orchestration infrastructure.

## Deployment Architecture

Jarvis typically runs in a hybrid environment:
1.  **Local Development Machine:** Runs the CLI and Development Dashboard.
2.  **Central Server (Unraid/VPS):** Hosts the production Dashboard, Redis (Memory), and acts as the synchronization hub.

## Docker Deployment

We provide a `docker-compose.yml` for easy deployment.

### 1. Build and Run
```bash
docker-compose up -d --build
```

### 2. Configuration
Ensure your `docker-compose.yml` environment variables match your setup:

```yaml
version: '3.8'
services:
  jarvis-dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./dev.db
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./.memory:/app/.memory

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

## Unraid Setup

1.  **Redis:** Install the Redis docker container from the Community Apps store.
2.  **Jarvis:**
    *   Use the "Custom Docker" option.
    *   Point the repository to your build or local image.
    *   Map the `/app/.memory` volume to a share on your array (e.g., `/mnt/user/appdata/jarvis/memory`).
    *   Set the `REDIS_URL` to point to your Unraid Redis IP.

## Troubleshooting

-   **Sync Issues:** Check the `logs.sh` script output or Docker logs to verify connectivity to Redis.
-   **Database:** If using SQLite in Docker, ensure the volume mount is writable. For production, consider switching to PostgreSQL.
