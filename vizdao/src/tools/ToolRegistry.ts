import type { Tool, PermissionLevel } from '../types/tool';
import type { ToolDefinition } from '../types/llm';
import type { Capability } from '../env/types';
import { VirtualFS } from './VirtualFS';
import { registerBuiltins } from './builtins';
import { logger } from '../lib/logger';

const log = logger.module('tools');

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private capabilities: Set<Capability> = new Set();
  readonly fs: VirtualFS;

  constructor(capabilities?: Set<Capability>) {
    this.fs = new VirtualFS();
    if (capabilities) {
      this.capabilities = capabilities;
    }
    registerBuiltins(this);
  }

  /**
   * Register a tool. If the tool declares `requires`, it is only loaded
   * when ALL required capabilities are present in the runtime.
   */
  register(tool: Tool): void {
    const name = tool.definition.function.name;
    if (tool.requires && tool.requires.length > 0) {
      const missing = tool.requires.filter(c => !this.capabilities.has(c));
      if (missing.length > 0) {
        log.debug('tool skipped (missing capabilities)', { name, missing });
        return;
      }
    }
    this.tools.set(name, tool);
    log.debug('tool registered', { name, permission: tool.permission });
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  schemas(): ToolDefinition[] {
    return [...this.tools.values()].map(t => t.definition);
  }

  async execute(name: string, params: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return tool.execute(params);
  }

  getPermissionLevel(name: string): PermissionLevel {
    return this.tools.get(name)?.permission ?? 'dangerous';
  }

  list(): Array<{ name: string; description: string; permission: PermissionLevel }> {
    return [...this.tools.values()].map(t => ({
      name: t.definition.function.name,
      description: t.definition.function.description,
      permission: t.permission,
    }));
  }
}
