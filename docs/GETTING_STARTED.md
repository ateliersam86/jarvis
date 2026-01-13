# Getting Started with Jarvis

Welcome to Jarvis, your centralized AI orchestration nexus. This guide will help you set up and start using Jarvis efficiently.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher (LTS recommended)
- **npm**: v9 or higher
- **Git**: Latest version
- **Docker**: (Optional) For containerized deployments
- **Server Server**: (Optional) For sync features, though local mode is supported.

## Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/jarvis-nexus.git
    cd jarvis-nexus
    ```

2.  **Install Dependencies**
    Root dependencies:
    ```bash
    npm install
    ```
    Web Dashboard dependencies:
    ```bash
    cd web
    npm install
    cd ..
    ```

3.  **Environment Setup**
    Copy the example environment file (if available) or create `.env`:
    ```bash
    cp .env.example .env
    ```
    *Configure your API keys (Gemini, OpenAI, Anthropic) in the `.env` file.*

4.  **Database Setup**
    Initialize the local SQLite database and Prisma client:
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```

## Running Jarvis

### Web Dashboard
To start the visual interface:
```bash
npm run dev
# Access at http://localhost:3000
```

### Command Line Interface (CLI)
Jarvis provides a powerful CLI for direct interaction:
```bash
node scripts/masterscript.mjs --help
```

### Auto-Healer
To run the background code repair agent:
```bash
npm run healer:watch
```

## Next Steps

- Explore the [CLI Reference](./CLI_REFERENCE.md) to master the command line.
- Learn about [Self Hosting](./SELF_HOSTING.md) if you plan to deploy on Server or a VPS.
