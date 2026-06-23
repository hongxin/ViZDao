import { useEffect, useRef, useState } from 'react';
import { logger, type LogEntry, type LogLevel } from '../lib/logger';
import { useT } from '../lib/i18n';

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: 'text-gray-500',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400 font-semibold',
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 } as Intl.DateTimeFormatOptions);
}

function formatData(data?: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0) return '';
  try {
    const s = JSON.stringify(data);
    return s.length > 200 ? s.slice(0, 200) + '...' : s;
  } catch {
    return '[unserializable]';
  }
}

export function LogPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [levelFilter, setLevelFilter] = useState<LogLevel>('debug');
  const [moduleFilter, setModuleFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = useT();

  // Load entries & subscribe
  useEffect(() => {
    if (!open) return;
    setEntries(logger.getEntries());
    const unsub = logger.subscribe(() => {
      setEntries(logger.getEntries());
    });
    return unsub;
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  if (!open) return null;

  const modules = logger.getModules();
  const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  const minPriority = LEVEL_PRIORITY[levelFilter];
  const filtered = entries.filter(e => {
    if (LEVEL_PRIORITY[e.level] < minPriority) return false;
    if (moduleFilter && e.module !== moduleFilter) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60" onClick={onClose}>
      <div
        className="flex flex-col mx-auto mt-8 mb-8 w-full max-w-4xl h-[80vh] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(var(--border))] shrink-0">
          <h2 className="text-sm font-semibold">{t('log.title')}</h2>
          <div className="flex items-center gap-3 text-xs">
            {/* Level filter */}
            <select
              value={levelFilter}
              onChange={e => setLevelFilter(e.target.value as LogLevel)}
              className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-none text-xs"
            >
              <option value="debug">DEBUG+</option>
              <option value="info">INFO+</option>
              <option value="warn">WARN+</option>
              <option value="error">ERROR</option>
            </select>
            {/* Module filter */}
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="px-1.5 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-none text-xs"
            >
              <option value="">{t('log.allModules')}</option>
              {modules.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {/* Auto-scroll toggle */}
            <label className="flex items-center gap-1 cursor-pointer text-[hsl(var(--muted-foreground))]">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={e => setAutoScroll(e.target.checked)}
                className="w-3 h-3"
              />
              {t('log.autoScroll')}
            </label>
            {/* Clear */}
            <button
              onClick={() => { logger.clear(); setEntries([]); }}
              className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              {t('log.clear')}
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Log entries */}
        <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-5 px-2 py-1">
          {filtered.length === 0 ? (
            <p className="text-center text-[hsl(var(--muted-foreground))] py-8">{t('log.empty')}</p>
          ) : (
            filtered.map(entry => (
              <div key={entry.id} className="flex gap-2 hover:bg-[hsl(var(--muted))/0.3] px-1 rounded">
                <span className="text-gray-600 shrink-0 select-none">{formatTime(entry.timestamp)}</span>
                <span className="text-purple-400 shrink-0 w-20 truncate">[{entry.module}]</span>
                <span className={`shrink-0 w-12 ${LEVEL_COLOR[entry.level]}`}>{entry.level.toUpperCase()}</span>
                <span className="text-[hsl(var(--foreground))]">{entry.message}</span>
                {entry.data && Object.keys(entry.data).length > 0 && (
                  <span className="text-gray-600 truncate">{formatData(entry.data)}</span>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-[hsl(var(--border))] text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">
          <span>{filtered.length} / {entries.length} {t('log.entries')}</span>
          <span>{modules.length} {t('log.modules')}</span>
        </div>
      </div>
    </div>
  );
}
