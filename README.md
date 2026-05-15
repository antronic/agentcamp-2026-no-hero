# No Hero Needed: Give AI Agents Hands with Microsoft Foundry, MongoDB, and MCP

> **AgentCon 2026 Workshop** — Build MCP servers using TypeScript and connect them with Azure AI Foundry.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/antronic/agentcamp-2026-no-hero)

## What You'll Learn

In this hands-on workshop, you'll progressively build up from simple tool calling to a full e-commerce chatbot — learning **Model Context Protocol (MCP)** along the way.

## Demos

| # | Demo | Description |
|---|---|---|
| **01** | [Simple MCP](demo/01-simple-mcp/) | Tool calling with and without MCP — Azure OpenAI & Ollama |
| **02** | [Simple RAG](demo/02-simple-rag/) | Retrieval Augmented Generation with MongoDB Atlas Vector Search |
| **03** | [E-Commerce Chatbot](demo/03-simple-ecommerence-chat/) | Full-stack chatbot with MCP tools, Foundry Agent, React UI |

### Recommended Order

```
01-simple-mcp  →  02-simple-rag  →  03-simple-ecommerence-chat
```

Start with **01** to understand tool calling fundamentals, then **02** to learn RAG, and finally **03** to see everything come together in a real application.

## Tech Stack

| Tool | Purpose |
|---|---|
| **TypeScript** | Language |
| **Bun** | Runtime & package manager |
| **Elysia** | API server framework |
| **MCP SDK** | Model Context Protocol server & client |
| **OpenAI SDK** | Azure OpenAI / OpenAI client |
| **MongoDB Atlas** | Database & Vector Search |
| **Azure AI Foundry** | Agent orchestration (demo 03) |
| **React + Vite + shadcn/ui** | Frontend UI (demo 03) |

## Prerequisites

### Required

- [Bun](https://bun.sh) — JavaScript/TypeScript runtime
- An **Azure OpenAI** resource with a chat deployment (e.g. `gpt-4o-mini`)

### Optional (depending on demo)

- [Ollama](https://ollama.com) — for local LLM in demo 01
- **MongoDB Atlas** cluster — for demos 02 and 03
- **Azure AI Foundry** project — for demo 03
- Azure CLI (`az login`) — for demo 03

### Using Dev Container

This repo includes a dev container that pre-installs Bun, Azure CLI, and all VS Code extensions:

1. Open the project in VS Code
2. Reopen in Container (Ctrl/Cmd+Shift+P → "Reopen in Container")
3. All dependencies will be installed automatically

## Project Structure

```
agentcon-2026/
├── README.md                           # ← You are here
├── .devcontainer/                      # Dev container setup
│   ├── Dockerfile
│   └── devcontainer.json
└── demo/
    ├── 01-simple-mcp/                  # Tool calling with/without MCP
    │   ├── README.md
    │   ├── index.html                   # Chat UI (served by each API sample at /)
    │   └── api/                        # 4 sample servers (aoai × ollama × mcp)
    ├── 02-simple-rag/                  # RAG pipeline with Vector Search
    │   ├── README.md
    │   └── rag.ts                      # Single-file CLI demo
    └── 03-simple-ecommerence-chat/     # Full e-commerce chatbot
        ├── README.md
        ├── api/                        # Elysia API + MCP server
        └── ui/                         # React + shadcn/ui dashboard
```

## Quick Start

```bash
# Clone and open in VS Code
cd demo/01-simple-mcp/api
bun install

# Run a sample (Azure OpenAI + MCP)
cd sample-mcp/aoai
cp .env.example .env
# Edit .env with your credentials
bun run --env-file .env api-with-mcp-aoai.ts

# Test it
curl -X POST http://localhost:9000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many units of GAD-001 are left at BKK-SILOM?"}'
```

Open http://localhost:9000 for the chat UI (served by the API).

See each demo's README for detailed instructions.

