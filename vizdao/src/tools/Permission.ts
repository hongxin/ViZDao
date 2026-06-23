import type { PermissionLevel } from '../types/tool';
import type { PermissionResponse } from '../store/chatStore';
import { logger } from '../lib/logger';

const log = logger.module('permission');

export class PermissionManager {
  private levels = new Map<string, PermissionLevel>();
  private sessionApproved = new Set<string>();
  private _autoMode = false;

  private confirmFn: (toolName: string, params: Record<string, unknown>, isDangerous: boolean) => Promise<PermissionResponse>;

  constructor(confirmFn: (toolName: string, params: Record<string, unknown>, isDangerous: boolean) => Promise<PermissionResponse>) {
    this.confirmFn = confirmFn;
  }

  setLevel(toolName: string, level: PermissionLevel): void {
    this.levels.set(toolName, level);
  }

  getLevel(toolName: string): PermissionLevel {
    return this.levels.get(toolName) ?? 'dangerous';
  }

  /**
   * Auto mode permission policy:
   *
   *              | /auto off (default) | /auto on              |
   * ------------|--------------------|-----------------------|
   * safe        | auto-allow          | auto-allow            |
   * risky       | prompt once → remember | auto-allow         |
   * dangerous   | prompt every time   | prompt once → remember |
   *
   * This reduces permission fatigue while keeping dangerous tools gated.
   */
  set autoMode(on: boolean) {
    this._autoMode = on;
    log.info('auto mode', { enabled: on });
  }

  get autoMode(): boolean {
    return this._autoMode;
  }

  async check(toolName: string, params: Record<string, unknown> = {}): Promise<boolean> {
    const level = this.levels.get(toolName) ?? 'dangerous';

    // Safe tools: always auto-allow
    if (level === 'safe') return true;

    // Already approved this session
    if (this.sessionApproved.has(toolName)) return true;

    // Auto mode: risky tools auto-approved without prompt
    if (this._autoMode && level === 'risky') {
      log.debug('auto-approved risky tool', { tool: toolName });
      this.sessionApproved.add(toolName);
      return true;
    }

    // Prompt user
    const isDangerous = level === 'dangerous';
    const response = await this.confirmFn(toolName, params, isDangerous);

    if (response === 'always') {
      this.sessionApproved.add(toolName);
      return true;
    }
    if (response === 'allow') {
      // In auto mode OR for risky tools: single allow → session approved
      if (this._autoMode || level === 'risky') {
        this.sessionApproved.add(toolName);
      }
      return true;
    }
    return false;
  }

  resetSession(): void {
    this.sessionApproved.clear();
  }
}
