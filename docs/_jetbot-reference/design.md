# Design Document

[中文版](design.zh-CN.md)

> 2026-03-16 | Author: Hongxin Zhang

## 1. Project Vision

Zero barrier. Zero deployment. Zero configuration. Open a browser and start using an AI coding assistant. Works even inside WeChat's in-app browser. Share a link to spread it.

### Target Users

| User Type | Scenario | Value |
|-----------|----------|-------|
| **Individuals** | Daily AI assistant | No install, open and use |
| **Developers** | Rapid prototyping | Leverage TrueConsole's proven patterns |
| **Enterprise** | Internal tool sharing | Share a link, done |
| **WeChat Users** | In-app browser | Seamless integration with WeChat ecosystem |

---

## 2. Feasibility Analysis

### Browser Capabilities

| Capability | API | Support |
|-----------|-----|---------|
| **Storage** | IndexedDB / OPFS | All modern browsers |
| **File Operations** | File System Access API | Chrome / Edge |
| **HTTP Requests** | fetch + CORS | Requires proxy |
| **Background** | Service Worker | Chrome / Edge |
| **Local Inference** | WebLLM / Transformers.js | Chrome / Edge |
| **Crypto** | Web Crypto API | All browsers |

### WeChat Browser

Supported: ES6+, IndexedDB, Service Worker (limited), Web Crypto, fetch API.
Not supported: File System Access API, WebGPU, WebRTC P2P.

**Conclusion**: Core features are viable across all platforms; advanced features degrade gracefully.

### Validated by Open Source

| Project | Stars | Demonstrates |
|---------|-------|-------------|
| WebLLM | 17.6k | Browser-based LLM inference is viable |
| Transformers.js | 13k+ | ML models run in the browser |
| Cherry Studio | 41.6k | Browser-based AI agents are viable |

---

## 3. Key Challenges & Solutions

### CORS Restrictions

LLM APIs do not allow direct browser calls due to cross-origin restrictions.

- **Development**: Public CORS proxy (e.g., allorigins)
- **Production**: Cloudflare Workers reverse proxy
- **Enterprise**: Self-hosted proxy endpoint
- **User-facing**: Custom proxy URL configurable in settings

### File System

Browsers cannot access the local file system directly.

- **Primary**: IndexedDB-backed virtual file system
- **Enhanced**: File System Access API (Chrome/Edge)
- **Fallback**: File upload via `<input type="file">`
- **Export**: Programmatic `<a download>` trigger

### Shell Commands

Browsers cannot execute real shell commands.

- Built-in interpreter maps `ls`, `cat`, `grep`, etc. to VirtualFS operations
- General computation runs in a sandboxed JavaScript environment

---

## 4. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    JetBot (Browser)                       │
├─────────────────────────────────────────────────────────┤
│  UI Layer          React + Tailwind CSS                  │
│  ├─ Chat Interface / Cosmos View / Preview Panel         │
│  └─ Settings / Permission / Task Management              │
├─────────────────────────────────────────────────────────┤
│  Agent Layer       (inspired by TrueConsole)             │
│  ├─ Agentic Loop   (circuit breaker + repeat detection)  │
│  ├─ Context Manager (sliding window)                     │
│  ├─ Skill Registry  (18 built-in skills)                 │
│  └─ Plan Mode       (observe → plan → code → verify)     │
├─────────────────────────────────────────────────────────┤
│  Tool Layer        10 built-in tools                     │
│  ├─ VirtualFS      (IndexedDB)                           │
│  ├─ HTTP / Search  (CORS proxy fallback)                 │
│  └─ JS Eval / HTML Render / Shell                        │
├─────────────────────────────────────────────────────────┤
│  LLM Layer         OpenAI-compatible protocol            │
│  ├─ Remote: OpenAI / DeepSeek / Custom                   │
│  └─ Local:  Ollama                                       │
├─────────────────────────────────────────────────────────┤
│  Storage Layer                                           │
│  ├─ IndexedDB      (files + scheduled tasks)             │
│  └─ localStorage   (config + preferences)                │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

| Component | Choice |
|-----------|--------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| State | Zustand 5 |
| Storage | IndexedDB (idb) + localStorage |
| LLM | OpenAI-compatible REST API via fetch |
| Build | Vite 8 |
| Deploy | Static files — GitHub Pages / Cloudflare / Vercel |

Total dependencies: ~15 packages (compared to 70+ in similar projects).

---

## 6. Comparison with Related Projects

| Dimension | JetBot | ZeroClaw | NanoClaw | TrueConsole |
|-----------|--------|----------|----------|-------------|
| Language | TypeScript | Rust | TypeScript | Rust |
| Runtime | Browser | Native | Node.js | Native |
| Deployment | Zero | Requires install | Requires install | Requires install |
| File system | Virtual (IndexedDB) | Native | Native | Native |
| WeChat compatible | Yes | No | No | No |
| Shareable via link | Yes | No | No | No |
| Offline capable | Partial (Ollama) | Yes | Yes | Yes |

---

## 7. Implementation Phases

### Phase 1: MVP

- Project scaffold (Vite + React + TypeScript + Tailwind)
- Agent core (Agentic Loop, Context Manager, circuit breaker)
- Virtual file system (IndexedDB)
- LLM client (OpenAI-compatible)
- Built-in tools (read / write / search / eval)
- Basic UI (chat, input, settings)

### Phase 2: Feature Complete

- Plan mode (observe → plan → code → verify)
- Skill system (18 built-in skills)
- Multi-provider support (OpenAI, DeepSeek, Ollama)
- Permission system (three-tier)
- Scheduler (interval / cron / once)
- File Bridge (drag import + download export)

### Phase 3: Cosmos & Beyond

- Cosmos View (force-directed conversation visualization)
- Cross-turn linking + break-chain control
- Runtime detection (19 browser capabilities)
- WeChat browser optimization
- Ecosystem expansion

---

*"The simplest path is the truest — the browser is the Agent."*
