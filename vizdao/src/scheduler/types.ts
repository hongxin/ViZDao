export type TaskTrigger =
  | { type: 'cron'; expression: string }
  | { type: 'interval'; ms: number }
  | { type: 'once'; at: number };

export type TaskStatus = 'active' | 'paused' | 'completed' | 'failed';

export interface ScheduledTask {
  id: string;
  name: string;
  prompt: string;
  trigger: TaskTrigger;
  status: TaskStatus;
  createdAt: number;
  lastRunAt: number | null;
  nextRunAt: number | null;
  runCount: number;
  maxRuns?: number;
  errorCount: number;
}

export interface HeartbeatConfig {
  enabled: boolean;
  intervalMs: number;
  prompt: string;
}
