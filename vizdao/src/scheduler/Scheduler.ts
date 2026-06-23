import { TaskStore } from './TaskStore';
import type { ScheduledTask, TaskTrigger, HeartbeatConfig } from './types';
import { logger } from '../lib/logger';

const log = logger.module('scheduler');

export class Scheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private store: TaskStore;
  private running = false;
  private onInject: (prompt: string, taskId: string) => Promise<void>;
  private _ready: Promise<void>;

  constructor(onInject: (prompt: string, taskId: string) => Promise<void>) {
    this.store = new TaskStore();
    this.onInject = onInject;
    // Placeholder — replaced by init()
    this._ready = Promise.resolve();
  }

  /** Returns a promise that resolves once init() has completed. */
  get ready(): Promise<void> {
    return this._ready;
  }

  async init(): Promise<void> {
    this._ready = this.store.init();
    await this._ready;
  }

  async start(): Promise<void> {
    await this._ready;
    if (this.running) return;
    this.running = true;
    log.info('scheduler started');

    // Catch up on stale tasks from before page close/reload
    this.catchUpStaleTasks();

    // Tick every 30 seconds
    this.timer = setInterval(() => this.tick(), 30_000);
    // Handle tab visibility change — catch up on missed tasks
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * On startup, recalculate nextRunAt for all active tasks.
   * Tasks whose nextRunAt is in the past get executed immediately on next tick.
   * This handles the "page was closed and reopened" scenario.
   */
  private async catchUpStaleTasks(): Promise<void> {
    const now = Date.now();
    const tasks = await this.store.getActiveTasks();
    let staleCount = 0;

    for (const task of tasks) {
      if (task.nextRunAt !== null && task.nextRunAt < now) {
        staleCount++;
        // For interval/cron tasks, recalculate nextRunAt from now
        // but mark them for immediate execution on next tick
        log.info('stale task found', {
          id: task.id.slice(0, 8),
          name: task.name,
          missedBy: Math.round((now - task.nextRunAt) / 1000) + 's',
        });
        // Keep the stale nextRunAt — tick() will fire it immediately
      }
    }

    if (staleCount > 0) {
      log.info('catch-up: will execute stale tasks on next tick', { count: staleCount });
      // Trigger an immediate tick to process stale tasks
      setTimeout(() => this.tick(), 1000);
    }
  }

  stop(): void {
    log.info('scheduler stopped');
    this.running = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.stopHeartbeat();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * Start heartbeat timer.
   * @param config - heartbeat configuration
   * @param dynamicPrompt - if provided, called at fire time to generate the prompt (replaces config.prompt)
   */
  startHeartbeat(config: HeartbeatConfig, dynamicPrompt?: () => string): void {
    this.stopHeartbeat();
    if (!config.enabled) return;
    log.info('heartbeat started', { intervalMs: config.intervalMs });
    this.heartbeatTimer = setInterval(() => {
      const prompt = dynamicPrompt ? dynamicPrompt() : config.prompt;
      log.debug('heartbeat firing', { promptLength: prompt.length });
      this.onInject(prompt, '__heartbeat__');
    }, config.intervalMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async addTask(
    name: string,
    prompt: string,
    triggerStr: string,
    maxRuns?: number,
  ): Promise<string> {
    await this._ready;
    const trigger = this.parseTrigger(triggerStr);
    const now = Date.now();
    const id = crypto.randomUUID();
    const task: ScheduledTask = {
      id,
      name,
      prompt,
      trigger,
      status: 'active',
      createdAt: now,
      lastRunAt: null,
      nextRunAt: this.computeNextRun(trigger, now),
      runCount: 0,
      maxRuns,
      errorCount: 0,
    };
    await this.store.addTask(task);
    log.info('task added', { id: id.slice(0, 8), name, trigger: triggerStr });
    return id;
  }

  async removeTask(id: string): Promise<boolean> {
    await this._ready;
    const task = await this.store.getTask(id);
    if (!task) return false;
    await this.store.removeTask(id);
    return true;
  }

  async pauseTask(id: string): Promise<boolean> {
    await this._ready;
    const task = await this.store.getTask(id);
    if (!task || task.status !== 'active') return false;
    await this.store.updateTask(id, { status: 'paused' });
    return true;
  }

  async resumeTask(id: string): Promise<boolean> {
    await this._ready;
    const task = await this.store.getTask(id);
    if (!task || task.status !== 'paused') return false;
    const now = Date.now();
    await this.store.updateTask(id, {
      status: 'active',
      nextRunAt: this.computeNextRun(task.trigger, now),
    });
    return true;
  }

  async listTasks(): Promise<ScheduledTask[]> {
    await this._ready;
    return this.store.getAllTasks();
  }

  // --- Private ---

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && this.running) {
      // Immediately check for missed tasks when tab becomes visible
      this.tick();
    }
  };

  private async tick(): Promise<void> {
    const now = Date.now();
    const tasks = await this.store.getActiveTasks();
    for (const task of tasks) {
      if (task.nextRunAt !== null && task.nextRunAt <= now) {
        await this.executeTask(task, now);
      }
    }
  }

  private async executeTask(task: ScheduledTask, now: number): Promise<void> {
    log.info('executing task', { id: task.id.slice(0, 8), name: task.name, runCount: task.runCount + 1 });
    try {
      await this.onInject(task.prompt, task.id);
      const runCount = task.runCount + 1;
      // Check if task should complete
      if (task.maxRuns && runCount >= task.maxRuns) {
        await this.store.updateTask(task.id, {
          status: 'completed',
          lastRunAt: now,
          nextRunAt: null,
          runCount,
        });
        return;
      }
      // For 'once' triggers, complete after execution
      if (task.trigger.type === 'once') {
        await this.store.updateTask(task.id, {
          status: 'completed',
          lastRunAt: now,
          nextRunAt: null,
          runCount,
        });
        return;
      }
      await this.store.updateTask(task.id, {
        lastRunAt: now,
        nextRunAt: this.computeNextRun(task.trigger, now),
        runCount,
      });
    } catch (err) {
      log.error('task execution failed', { id: task.id.slice(0, 8), name: task.name, errorCount: task.errorCount + 1 });
      await this.store.updateTask(task.id, {
        errorCount: task.errorCount + 1,
        lastRunAt: now,
        nextRunAt: this.computeNextRun(task.trigger, now),
      });
    }
  }

  private computeNextRun(trigger: TaskTrigger, now: number): number | null {
    switch (trigger.type) {
      case 'interval':
        return now + trigger.ms;
      case 'once':
        return trigger.at > now ? trigger.at : null;
      case 'cron':
        return now + this.cronToMs(trigger.expression);
    }
  }

  /**
   * Lightweight cron parser. Supports:
   *   "* /N * * * *" → every N minutes (written without space, e.g. *​/5)
   *   "N * * * *" → at minute N of each hour (approximated as 60min interval)
   * Falls back to 60 minutes for unsupported expressions.
   */
  private cronToMs(expression: string): number {
    const parts = expression.trim().split(/\s+/);
    if (parts.length >= 1) {
      const minute = parts[0];
      // */N pattern
      const stepMatch = minute.match(/^\*\/(\d+)$/);
      if (stepMatch) {
        return parseInt(stepMatch[1], 10) * 60_000;
      }
      // Fixed minute N — approximate as 60 min interval
      if (/^\d+$/.test(minute)) {
        return 60 * 60_000;
      }
    }
    // Unsupported — default 60 minutes
    return 60 * 60_000;
  }

  /**
   * Parse trigger string formats:
   *   "interval:30s" / "interval:5m" / "interval:1h"
   *   "once:2026-03-17T10:00"
   *   "* /5 * * * *" (cron expression)
   */
  private parseTrigger(input: string): TaskTrigger {
    // interval:Ns / interval:Nm / interval:Nh
    const intervalMatch = input.match(/^interval:(\d+)(s|m|h)$/i);
    if (intervalMatch) {
      const value = parseInt(intervalMatch[1], 10);
      const unit = intervalMatch[2].toLowerCase();
      const multiplier = unit === 'h' ? 3_600_000 : unit === 'm' ? 60_000 : 1_000;
      return { type: 'interval', ms: value * multiplier };
    }
    // once:ISO-date
    if (input.startsWith('once:')) {
      const dateStr = input.slice(5);
      const at = new Date(dateStr).getTime();
      if (isNaN(at)) throw new Error(`Invalid date: ${dateStr}`);
      return { type: 'once', at };
    }
    // Otherwise treat as cron expression
    return { type: 'cron', expression: input };
  }
}
