// src/viz/lessons/KnobPanel.tsx — 可复用旋钮面板：由 lesson.knobs 自动渲染控件。
// 支持 slider / select / toggle / button 四种。各教学单元共用此组件。
import type { Knob } from '../types';

export type KnobValues = Record<string, number | boolean | string>;

function Row({ knob, value, onChange }: { knob: Knob; value: number | boolean | string; onChange: (v: number | boolean | string) => void }) {
  if (knob.kind === 'slider') {
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          {knob.label}<span style={{ opacity: 0.8 }}>{String(value)}{knob.unit ?? ''}</span>
        </span>
        <input
          type="range" aria-label={knob.label}
          min={knob.min} max={knob.max} step={knob.step}
          value={Number(value)}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
        {knob.hint && <span style={{ fontSize: 11, opacity: 0.6 }}>{knob.hint}</span>}
      </label>
    );
  }
  if (knob.kind === 'select') {
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>{knob.label}</span>
        <select
          aria-label={knob.label}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', padding: '4px 6px' }}
        >
          {(knob.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {knob.hint && <span style={{ fontSize: 11, opacity: 0.6 }}>{knob.hint}</span>}
      </label>
    );
  }
  if (knob.kind === 'toggle') {
    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 13, cursor: 'pointer' }}>
        <input type="checkbox" aria-label={knob.label} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span>{knob.label}</span>
        {knob.hint && <span style={{ fontSize: 11, opacity: 0.6 }}>· {knob.hint}</span>}
      </label>
    );
  }
  if (knob.kind === 'button') {
    return (
      <button onClick={() => onChange('go')} style={{ width: '100%', marginBottom: 14 }}>
        {knob.label}
      </button>
    );
  }
  return null;
}

export function KnobPanel({ knobs, values, onChange }: { knobs: Knob[]; values: KnobValues; onChange: (bindParam: string, value: number | boolean | string) => void }) {
  return (
    <div>
      {knobs.map((k) => (
        <Row key={k.id} knob={k} value={values[k.bindParam]} onChange={(v) => onChange(k.bindParam, v)} />
      ))}
    </div>
  );
}
