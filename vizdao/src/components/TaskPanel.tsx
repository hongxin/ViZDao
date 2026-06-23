import { useEffect, useState } from 'react';
import type { ScheduledTask } from '../scheduler/types';
import { useAgentStore } from '../store/agentStore';
import { useT } from '../lib/i18n';
import { Modal } from './shared/Modal';

function formatTrigger(task: ScheduledTask): string {
  const { trigger } = task;
  switch (trigger.type) {
    case 'interval': {
      const sec = trigger.ms / 1000;
      if (sec >= 3600) return `every ${sec / 3600}h`;
      if (sec >= 60) return `every ${sec / 60}m`;
      return `every ${sec}s`;
    }
    case 'once':
      return `once @ ${new Date(trigger.at).toLocaleString()}`;
    case 'cron':
      return trigger.expression;
  }
}

function formatTime(ts: number | null): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString();
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  completed: 'bg-gray-500/20 text-gray-400',
  failed: 'bg-red-500/20 text-red-400',
};

export function TaskPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const scheduler = useAgentStore(s => s.scheduler);
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const t = useT();

  useEffect(() => {
    if (open && scheduler) {
      scheduler.listTasks().then(setTasks);
    }
  }, [open, scheduler]);

  const refresh = () => scheduler?.listTasks().then(setTasks);

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg" panelClassName="!p-0 !rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))]">
          <h2 className="text-sm font-semibold">{t('schedule.title')}</h2>
          <button onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            ✕
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
              {t('schedule.empty')}
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]">
                  <th className="px-4 py-2 text-left">{t('schedule.name')}</th>
                  <th className="px-2 py-2 text-left">{t('schedule.trigger')}</th>
                  <th className="px-2 py-2 text-left">{t('schedule.status')}</th>
                  <th className="px-2 py-2 text-left">{t('schedule.lastRun')}</th>
                  <th className="px-2 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id} className="border-b border-[hsl(var(--border))]">
                    <td className="px-4 py-2 font-medium">{task.name}</td>
                    <td className="px-2 py-2 font-mono text-[hsl(var(--muted-foreground))]">
                      {formatTrigger(task)}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_BADGE[task.status]}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-[hsl(var(--muted-foreground))]">
                      {formatTime(task.lastRunAt)}
                    </td>
                    <td className="px-2 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {task.status === 'active' && (
                          <button
                            onClick={async () => { await scheduler?.pauseTask(task.id); refresh(); }}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                          >
                            {t('schedule.pause')}
                          </button>
                        )}
                        {task.status === 'paused' && (
                          <button
                            onClick={async () => { await scheduler?.resumeTask(task.id); refresh(); }}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          >
                            {t('schedule.resume')}
                          </button>
                        )}
                        <button
                          onClick={async () => { await scheduler?.removeTask(task.id); refresh(); }}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </Modal>
  );
}
