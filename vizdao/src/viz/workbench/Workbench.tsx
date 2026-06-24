// src/viz/workbench/Workbench.tsx — 「训·知道」工作台：左意图(训-1 GUI) + 右刷选-联动多视图 + 任务栏。
import { useState } from 'react';
import { LinkedView } from './LinkedView';
import { WorkbenchTheory } from './WorkbenchTheory';
import { ClosingTheory } from '../units/closing/ClosingTheory';
import { useWorkbenchStore, nextViewId, type ViewSpec, type ChartKind } from '../../store/workbenchStore';
import { BIKE_FIELDS } from '../datasets/bikeSharing';

const ACCENT = 'hsl(var(--vz-accent))';
const FIELD_KEYS = Object.keys(BIKE_FIELDS);
const CHARTS: ChartKind[] = ['scatter', 'line', 'bar'];
const CHART_LABEL: Record<ChartKind, string> = { scatter: '散点', line: '折线', bar: '柱状', hist: '直方' };

function Sel({ value, onChange, options, allowNone }: { value: string | undefined; onChange: (v: string | undefined) => void; options: string[]; allowNone?: boolean }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}
      style={{ fontSize: 'var(--vz-text-sm)', padding: '0.15rem 0.3rem', borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--foreground))', maxWidth: '6.2rem' }}>
      {allowNone && <option value="">（无）</option>}
      {options.map((k) => <option key={k} value={k}>{BIKE_FIELDS[k]?.label ?? k}</option>)}
    </select>
  );
}

function ViewEditor({ spec }: { spec: ViewSpec }) {
  const { updateView, removeView } = useWorkbenchStore();
  return (
    <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 8, padding: '0.5rem 0.6rem', marginBottom: 'var(--vz-s2)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
        <input value={spec.title ?? ''} onChange={(e) => updateView(spec.id, { title: e.target.value })}
          style={{ fontSize: 'var(--vz-text-sm)', fontWeight: 600, border: 'none', background: 'transparent', color: 'hsl(var(--foreground))', width: '11rem' }} />
        <button onClick={() => removeView(spec.id)} style={{ border: 'none', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: 'pointer', fontSize: 'var(--vz-text-sm)' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center', fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>
        <select value={spec.chart} onChange={(e) => updateView(spec.id, { chart: e.target.value as ChartKind })} style={{ fontSize: 'var(--vz-text-sm)', padding: '0.15rem 0.3rem', borderRadius: 5, border: '1px solid hsl(var(--border))', background: 'transparent' }}>
          {CHARTS.map((c) => <option key={c} value={c}>{CHART_LABEL[c]}</option>)}
        </select>
        {spec.chart === 'bar' ? (
          <>组<Sel value={spec.by} onChange={(v) => updateView(spec.id, { by: v })} options={FIELD_KEYS} />量<Sel value={spec.y} onChange={(v) => updateView(spec.id, { y: v })} options={FIELD_KEYS} /></>
        ) : (
          <>x<Sel value={spec.x} onChange={(v) => updateView(spec.id, { x: v })} options={FIELD_KEYS} />y<Sel value={spec.y} onChange={(v) => updateView(spec.id, { y: v })} options={FIELD_KEYS} />色<Sel value={spec.color} onChange={(v) => updateView(spec.id, { color: v })} options={FIELD_KEYS} allowNone /></>
        )}
      </div>
    </div>
  );
}

export function Workbench() {
  const views = useWorkbenchStore((s) => s.views);
  const selection = useWorkbenchStore((s) => s.selection);
  const setSelection = useWorkbenchStore((s) => s.setSelection);
  const addView = useWorkbenchStore((s) => s.addView);
  const mission = useWorkbenchStore((s) => s.mission);
  const [theory, setTheory] = useState<null | 'analysis' | 'method'>(null);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      {/* 任务栏 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--vz-s3)', padding: '0.5rem var(--vz-s4)', borderBottom: '1px solid hsl(var(--border))' }}>
        <span style={{ fontSize: 'var(--vz-text-sm)', color: selection ? ACCENT : 'hsl(var(--vz-ink-soft))' }}>
          {selection ? `已选 ${selection.length} 天 · 看它们在各视图里的位置` : `任务 · ${mission}`}
        </span>
        <span style={{ display: 'inline-flex', gap: 'var(--vz-s3)', alignItems: 'center' }}>
          {selection && <button onClick={() => setSelection(null)} style={{ border: 'none', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: 'pointer', fontSize: 'var(--vz-text-sm)' }}>清除选区</button>}
          <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>理论深探</span>
          <button onClick={() => setTheory('analysis')} style={{ border: 'none', background: 'transparent', color: ACCENT, cursor: 'pointer', fontSize: 'var(--vz-text-sm)', fontWeight: 500 }}>① 视觉分析</button>
          <button onClick={() => setTheory('method')} style={{ border: 'none', background: 'transparent', color: ACCENT, cursor: 'pointer', fontSize: 'var(--vz-text-sm)', fontWeight: 500 }}>② 本课方法论</button>
        </span>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* 左·意图（训-1 GUI；训-2 接 AI、训-3 接积木） */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid hsl(var(--border))', padding: 'var(--vz-s3)', overflowY: 'auto' }}>
          <div style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', marginBottom: 'var(--vz-s2)' }}>视图（拖框选任一视图即可联动）</div>
          {views.map((v) => <ViewEditor key={v.id} spec={v} />)}
          <button onClick={() => addView({ id: nextViewId(), chart: 'scatter', x: 'temp', y: 'cnt', title: '新视图' })}
            style={{ width: '100%', padding: '0.4rem', borderRadius: 6, border: '1px dashed hsl(var(--border))', background: 'transparent', color: 'hsl(var(--vz-ink-soft))', cursor: 'pointer', fontSize: 'var(--vz-text-sm)' }}>+ 添加视图</button>
        </div>

        {/* 右·联动多视图 */}
        <div style={{ flex: 1, minHeight: 0, padding: 'var(--vz-s3)', display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', gap: 'var(--vz-s3)', overflowY: 'auto' }}>
          {views.map((v) => <div key={v.id} style={{ minHeight: 240 }}><LinkedView spec={v} /></div>)}
        </div>
      </div>

      {theory === 'analysis' && <WorkbenchTheory title="理论 ① · 视觉分析" onClose={() => setTheory(null)} />}
      {theory === 'method' && <ClosingTheory title="理论 ② · 本课方法论" onClose={() => setTheory(null)} />}
    </div>
  );
}
