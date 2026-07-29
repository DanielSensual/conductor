# Conductor AI

> **Visual IDE for Multi-Agent AI Workflows** — Design, run, and debug AI agent workflows with cyclic graph support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![LangGraph](https://img.shields.io/badge/LangGraph-powered-purple)

## 🎯 Why Conductor?

Most "no-code" AI tools are **linear**: `Trigger → Action → Action`. But true agentic workflows need **loops**:

```
Planner → Executor → Verifier → (Fail?) → Executor (retry)
```

Conductor is a **Visual IDE for State Machines** that:
- 🎨 **Drag-and-drop canvas** for designing agent workflows
- 🔄 **Cyclic graph support** — build retry loops, verification chains
- ⚡ **Real-time visualization** — watch agents "think" with streaming tokens
- 🛑 **Human-in-the-loop breakpoints** — pause, inspect, edit, resume
- 📦 **Export to LangGraph** — your designs compile to production code

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (for PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/DanielSensual/conductor.git
cd conductor

# Start infrastructure
docker-compose up -d

# Install dependencies
npm install

# Set up Python environment
cd apps/engine
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -e ".[dev]"

# Start development
npm run dev
```

### Environment Variables

Create `.env.local` in `apps/web`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Create `.env` in `apps/engine`:
```env
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://conductor:conductor_dev@localhost:5432/conductor
```

## 📦 Project Structure

```
conductor/
├── apps/
│   ├── web/          # Next.js 14 + React Flow (Canvas UI)
│   └── engine/       # FastAPI + LangGraph (Runtime)
├── packages/
│   └── schema/       # Shared TypeScript/Pydantic types
└── docker-compose.yml
```

## 🎨 Features

### Node Types
| Type | Description |
|------|-------------|
| 🤖 Agent | LLM-powered node with system prompt |
| 🔧 Tool | Execute Python functions |
| 🔀 Router | Conditional branching logic |
| 📥 Input | Graph entry point |
| 📤 Output | Graph exit point |

### Real-Time Visualization
- **Node glow states**: Idle → Running → Success/Error
- **Streaming thoughts**: Watch the agent's internal reasoning
- **Edge animations**: See state flow through the graph

### Human-in-the-Loop
- Right-click any edge to add a breakpoint
- Pause execution and inspect intermediate state
- Edit values and resume

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React Flow, Tailwind CSS, Shadcn/UI |
| Backend | FastAPI, LangGraph, Pydantic |
| Database | PostgreSQL (checkpoints) |
| Streaming | Server-Sent Events (SSE) |

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

---

**Built with ❤️ and LangGraph**
