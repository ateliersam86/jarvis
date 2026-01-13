# Jarvis AI Nexus - Docker Environment
FROM node:20-slim

# Install system dependencies (git, curl, python3, build-essential for node-pty)
RUN apt-get update && apt-get install -y git curl python3 make g++ build-essential && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install

# Install CLIs globally to be safe
RUN npm install -g @google/gemini-cli @openai/codex

# Copy source code
COPY . .

# Expose potential ports (if we add a web server later)
EXPOSE 3000

# Keep container alive
CMD ["tail", "-f", "/dev/null"]
