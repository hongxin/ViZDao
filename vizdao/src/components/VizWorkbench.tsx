// src/components/VizWorkbench.tsx — 一套布局两态：A 展开(左讲做悟+knob/右画布) ↔ B 收起细轨。
import { LessonView } from '../viz/lessons/LessonView';
import { useLessonStore } from '../store/lessonStore';

export function VizWorkbench() {
  const collapsed = useLessonStore((s) => s.leftCollapsed);
  const toggle = useLessonStore((s) => s.toggleCollapse);

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {collapsed ? (
        <div
          role="button" aria-label="展开"
          onClick={toggle}
          style={{ width: 28, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 10, opacity: 0.6 }}
        >‹</div>
      ) : (
        <div style={{ width: 360, borderRight: '1px solid hsl(var(--border))', position: 'relative', padding: 12, overflow: 'hidden' }}>
          <button
            aria-label="折叠"
            onClick={toggle}
            style={{ position: 'absolute', right: 6, top: 6, width: 22, height: 22, borderRadius: '50%' }}
          >›</button>
          <LessonView />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, padding: 12 }}>
        {/* 折叠态下画布占满；展开态下 LessonView 已含画布，这里留作多视图扩展位 */}
        {collapsed && <LessonView />}
      </div>
    </div>
  );
}
