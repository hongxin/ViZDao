# Project Origin

[中文版](idea.zh-CN.md)

> 2026-03-16

## The Idea

Building on the success of TrueConsole (an AI Agent implemented in Rust), the JetBot project was born:

- **Core approach**: Reimplement TrueConsole's agent execution logic in TypeScript, compile to JavaScript, and run entirely in the browser.
- **Key breakthrough**: No installation, no deployment — open a webpage and start using it. Works even inside WeChat's in-app browser.
- **Strategic value**: Zero barrier to entry enables rapid adoption and distribution.

## Design References

| Project | Lessons Drawn |
|---------|---------------|
| **TrueConsole** | Agent core logic: Agentic Loop, circuit breaker, Context Manager, Skill system |
| **ZeroClaw** | Layered architecture principles |
| **NanoClaw** | TypeScript implementation patterns |

## Core Bet

> The browser is capable enough to host a full AI Agent —
> IndexedDB for the file system, fetch for LLM API calls, Canvas for visualization.
> The only external dependency is an LLM API endpoint.

See [design.md](design.md) for the full feasibility analysis and architecture design.
