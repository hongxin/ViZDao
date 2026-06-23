// src/viz/lessons/LessonView.tsx — 讲/做/悟三段 + 由 lesson.knobs 自动生成的 knob 面板。
import { useMemo } from 'react';
import type { Knob } from '../types';
import { useLessonStore } from '../../store/lessonStore';
import { ChartCanvas } from '../charts/ChartCanvas';
import { buildLineScatterOption } from '../charts/registry';

function KnobControl({ knob }: { knob: Knob }) {
  const value = useLessonStore((s) => s.knobValues[knob.bindParam]);
  const setKnob = useLessonStore((s) => s.setKnob);
  if (knob.kind === 'slider') {
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          {knob.label}<span>{String(value)}</span>
        </span>
        <input
          type="range" aria-label={knob.label}
          min={knob.min} max={knob.max} step={knob.step}
          value={Number(value)}
          onChange={(e) => setKnob(knob.bindParam, Number(e.target.value))}
          style={{ width: '100%' }}
        />
        {knob.hint && <span style={{ fontSize: 11, opacity: 0.6 }}>{knob.hint}</span>}
      </label>
    );
  }
  if (knob.kind === 'button') {
    return (
      <button onClick={() => setKnob(knob.bindParam, 'go')} style={{ width: '100%', marginBottom: 14 }}>
        {knob.label}
      </button>
    );
  }
  return null;
}

export function LessonView() {
  const lesson = useLessonStore((s) => s.lesson);
  const data = useLessonStore((s) => s.data);
  const fit = useLessonStore((s) => s.fit);
  const passed = useLessonStore((s) => s.checkpointPassed);
  const option = useMemo(() => (fit ? buildLineScatterOption(data, fit.w) : {}), [data, fit]);

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 320, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 16 }}>{lesson.title}</h2>
        <p style={{ fontSize: 13, opacity: 0.85 }}>{lesson.hook}</p>
        <div style={{ margin: '12px 0' }}>{lesson.knobs.map((k) => <KnobControl key={k.id} knob={k} />)}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>{lesson.takeaway}</div>
        {passed && <div style={{ marginTop: 10, color: '#2a8' }}>✓ 检查点达成：你既看见了过拟合，也把它救了回来。</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ChartCanvas option={option} />
        {fit && (
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
            <span>训练MSE {fit.trainMSE.toFixed(4)}</span>
            <span>真值MSE {fit.trueMSE.toFixed(4)}</span>
            <span>粗糙度 {fit.roughness.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
