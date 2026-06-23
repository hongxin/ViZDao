// src/viz/lessons/LessonShell.tsx — 单元统一布局：左讲做悟+控件，右图表+指标。
import type { ReactNode } from 'react';

export function LessonShell({
  title, hook, takeaway, controls, chart, metrics, note,
}: {
  title: string;
  hook: string;
  takeaway: string;
  controls: ReactNode;       // 做：KnobPanel
  chart: ReactNode;          // 右侧图表
  metrics?: ReactNode;       // 图下指标读数
  note?: ReactNode;          // 检查点/提示
}) {
  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 320, overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ fontSize: 16, margin: '0 0 6px' }}>{title}</h2>
        <p style={{ fontSize: 13, opacity: 0.85, margin: '0 0 12px' }}>{hook}</p>
        <div style={{ margin: '12px 0' }}>{controls}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>{takeaway}</div>
        {note}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>{chart}</div>
        {metrics && <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, opacity: 0.85 }}>{metrics}</div>}
      </div>
    </div>
  );
}
