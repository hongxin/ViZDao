export type PlanPhase = 'explore' | 'plan' | 'execute' | 'verify';

const PHASE_ORDER: PlanPhase[] = ['explore', 'plan', 'execute', 'verify'];

export class PlanMode {
  private active = false;
  private phase: PlanPhase = 'explore';
  private goal = '';

  activate(goal: string): void {
    this.active = true;
    this.goal = goal;
    this.phase = 'explore';
  }

  deactivate(): void {
    this.active = false;
    this.goal = '';
    this.phase = 'explore';
  }

  isActive(): boolean { return this.active; }
  currentPhase(): PlanPhase { return this.phase; }
  currentGoal(): string { return this.goal; }

  nextPhase(): PlanPhase {
    const idx = PHASE_ORDER.indexOf(this.phase);
    if (idx < PHASE_ORDER.length - 1) {
      this.phase = PHASE_ORDER[idx + 1];
    } else {
      this.deactivate();
    }
    return this.phase;
  }

  getPromptSection(): string {
    if (!this.active) return '';
    const phaseInstructions: Record<PlanPhase, string> = {
      explore: `# Plan Mode — Explore Phase
Goal: ${this.goal}

You are in the EXPLORE phase. Your job is to:
- Read and search files to understand the current state
- Ask clarifying questions about the goal
- Only use read-only tools (read_file, list_dir, search_text)
- Do NOT make any changes yet
- When you have enough context, tell the user to run /next to move to the planning phase.`,

      plan: `# Plan Mode — Plan Phase
Goal: ${this.goal}

You are in the PLAN phase. Your job is to:
- Create a structured, step-by-step implementation plan
- Identify risks and dependencies
- Present the plan to the user for approval
- Do NOT execute any changes yet
- When the plan is approved, tell the user to run /next to begin execution.`,

      execute: `# Plan Mode — Execute Phase
Goal: ${this.goal}

You are in the EXECUTE phase. Your job is to:
- Follow the plan step by step
- Use tools to implement changes
- Report progress after each step
- If you encounter issues, explain them and suggest adjustments
- When all steps are done, tell the user to run /next to verify.`,

      verify: `# Plan Mode — Verify Phase
Goal: ${this.goal}

You are in the VERIFY phase. Your job is to:
- Review all changes made during execution
- Verify correctness by reading files and running tests
- Summarize what was accomplished
- Note any remaining issues or follow-ups
- Plan mode will end after this phase.`,
    };
    return phaseInstructions[this.phase];
  }
}
