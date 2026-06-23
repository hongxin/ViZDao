import { useEffect, useState, useCallback } from 'react';

export interface Preview {
  id: string;
  html: string;
  title: string;
  height: number;
}

/** Global preview state — shared between RenderPreview and App layout */
let _listeners: Array<(previews: Preview[]) => void> = [];
let _previews: Preview[] = [];

function notify() {
  for (const fn of _listeners) fn(_previews);
}

export function addPreview(p: Preview) {
  _previews = [..._previews, p];
  notify();
}

export function removePreview(id: string) {
  _previews = _previews.filter(x => x.id !== id);
  notify();
}

export function clearPreviews() {
  _previews = [];
  notify();
}

/** Hook to subscribe to preview state */
export function usePreviews(): Preview[] {
  const [state, setState] = useState<Preview[]>(_previews);
  useEffect(() => {
    _listeners.push(setState);
    return () => { _listeners = _listeners.filter(fn => fn !== setState); };
  }, []);
  return state;
}

/**
 * Listens for `jetbot:render` custom events from the render_html tool.
 * This component only handles event capture — rendering is done by PreviewPanel.
 */
export function RenderPreviewListener() {
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Preview;
      addPreview(detail);
    };
    document.addEventListener('jetbot:render', handler);
    return () => document.removeEventListener('jetbot:render', handler);
  }, []);
  return null;
}

/**
 * Right-side preview panel — Claude.ai Artifact style.
 * Shows when there are active previews.
 */
export function PreviewPanel() {
  const previews = usePreviews();
  const [activeIdx, setActiveIdx] = useState(0);

  // Keep activeIdx in bounds
  useEffect(() => {
    if (activeIdx >= previews.length) setActiveIdx(Math.max(0, previews.length - 1));
  }, [previews.length, activeIdx]);

  const handleClose = useCallback((id: string) => {
    removePreview(id);
  }, []);

  if (previews.length === 0) return null;

  const active = previews[activeIdx];
  if (!active) return null;

  return (
    <div className="flex flex-col h-full border-l border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      {/* Tab bar */}
      <div className="flex items-center gap-0 px-1 py-1 bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] overflow-x-auto shrink-0">
        {previews.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setActiveIdx(i)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
              i === activeIdx
                ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            <span className="truncate max-w-[120px]">{p.title || 'Preview'}</span>
            <span
              onClick={(e) => { e.stopPropagation(); handleClose(p.id); }}
              className="hover:text-red-400 text-[10px] ml-0.5"
            >
              ✕
            </span>
          </button>
        ))}

        {/* Close all */}
        {previews.length > 1 && (
          <button
            onClick={() => clearPreviews()}
            className="ml-auto px-2 py-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-red-400"
          >
            Close all
          </button>
        )}
      </div>

      {/* Preview iframe — fills remaining space */}
      <div className="flex-1 overflow-hidden">
        <iframe
          key={active.id}
          srcDoc={active.html}
          sandbox="allow-scripts"
          className="w-full h-full border-none"
          style={{ background: '#fff' }}
          title={active.title}
        />
      </div>
    </div>
  );
}
