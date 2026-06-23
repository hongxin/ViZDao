# Unity of Dao and Craft: Vibe Coding Methodology

> *"All under heaven converge on the same end by different paths, arrive at unity through a hundred deliberations."* — *I Ching, Xi Ci II*

**Note**: This is an English translation of [CLAUDE.md](../CLAUDE.md) for reference only. The Chinese original is the authoritative version used by the AI assistant.

---

## Core Philosophy

**Unity of Dao and Craft**: Harness AI tools with the wisdom of the ancients — think and act in concert, human and machine as one.

### Three Principles of Change

- **Simplicity** (*Jian Yi*): If it can be simple, keep it simple. The greatest truths are the simplest.
- **Adaptability** (*Bian Yi*): Embrace change. Evolve continuously.
- **Constancy** (*Bu Yi*): Hold fast to the core. Quality above all.

### Four-Phase Workflow

```
Observe (Explore) → Plan → Code → Verify → Loop
```

---

## Technical Principles (The Constants)

### Quality Red Lines

- **Security**: No OWASP Top 10 vulnerabilities
- **Reliability**: Critical paths must have error handling
- **Maintainability**: Code should be self-explanatory; complex logic needs comments

### Design Guidelines

- **Single Responsibility**: One module does one thing
- **Open–Closed Principle**: Open for extension, closed for modification
- **Simplicity First**: If three lines suffice, don't write thirty

---

## Human–AI Collaboration Model

### Division of Labor

| Domain | Human Leads | AI Leads |
|--------|------------|----------|
| Direction & judgment | Decides | Provides options |
| Code generation | Reviews | Generates |
| Architecture decisions | Final call | Analyzes trade-offs |
| Quality assurance | Critical paths | Standards checks |

### Trust Boundaries

- Trust AI's code generation ability; verify through tests rather than line-by-line review
- Maintain human authority over value judgments and directional decisions
- When intuition signals something is off, trust that instinct and investigate

---

## Extended Thinking Guide

| Scenario | Trigger | Depth |
|----------|---------|-------|
| Simple fix | none / think | Quick intuition |
| Medium task | think hard | Weigh alternatives |
| Architecture decision | ultrathink | Deep analysis |

**Warning**: More ultrathink is not always better — overthinking breeds confusion.

---

## Workflow

### Observe (Explore Phase)

- Use the Explore Agent to quickly build a global understanding
- Define task boundaries — knowing where to stop brings clarity
- Stop when you can clearly describe the task scope

### Plan Phase

- Enter Plan Mode for deep planning
- Identify the principal contradiction; focus on the core problem
- Form an actionable plan — plan thoroughly before you move

### Code Phase

- Trust the plan and execute decisively
- Move in small increments, verify frequently
- Unite knowledge and action — deepen understanding through practice

### Verify Phase

- Test to verify — practice is the criterion of truth
- Code review with focus on business logic
- Summarize lessons and feed them into the next cycle

---

## Common Pitfalls (The Overthinking Trap)

### Warning Signals

- "Let me think if there's a better approach" → Set a time limit
- "Should I handle this edge case?" → Assess probability, then decide
- "Let me study this part of the code more" → Ask yourself: is it necessary?

### "Twice Is Enough" Checklist

- [ ] Task boundaries are clear
- [ ] Primary technical approach is decided
- [ ] Key risks are identified
- [ ] Rollback strategy exists

**When these conditions are met, act. Perfection is not required.**

---

### Decision Tree

```
Task arrives
  → Urgent? → Yes → Quick fix mode
           → No  → Complex? → Yes → Deep planning mode
                            → No  → Lightweight planning mode
```

---

> *"Twice is enough."* — Confucius
>
> *When you've thought it through, go do it.*
