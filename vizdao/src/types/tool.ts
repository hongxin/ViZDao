import type { ToolDefinition } from './llm';
import type { Capability } from '../env/types';

export type PermissionLevel = 'safe' | 'risky' | 'dangerous';

export interface Tool {
  definition: ToolDefinition;
  permission: PermissionLevel;
  /** Runtime capabilities this tool requires. Empty = always available. */
  requires?: Capability[];
  execute: (params: Record<string, unknown>) => Promise<string>;
}
