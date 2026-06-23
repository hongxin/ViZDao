// src/viz/units/overfitting/OverfittingStage.tsx — 过拟合的"舞台"：贯穿全课、不重建只变形。
// 指令：showPoints / raiseDegree(拉阶数, 训练误差实时→0) / revealTruth(亮真曲线+真值误差暴涨) / regularize(拉λ救回)。
// 布局遵留白避让：顶部工具条（左控件·右读数，中间留白），图表独享下方，互不遮挡。
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart, LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { genSinNoise, type Point } from '../../datasets/sinNoise';
import { normalize, ridgeFit, predict, metrics, XMIN, XMAX } from '../../analysis/ridge';
import type { StageHandle, Directive } from '../../engine/types';

echarts.use([ScatterChart, LineChart, GridComponent, CanvasRenderer]);

const ACCENT = '#ef7d22';
const POINT = '#6b7280';
const TRUE = '#9ca3af';
const DANGER = '#dc2626';
const DATA: Point[] = genSinNoise(10, 0.35, 20240624); // 10 个带噪点（少点才好过拟合）
const XN = DATA.map((d) => normalize(d.x));
const YS = DATA.map((d) => d.y);

const AXIS = {
  axisLabel: { show: true, fontSize: 10, color: 'hsl(0 0% 58%)', margin: 6 },
  axisTick: { show: true, length: 3, lineStyle: { color: 'hsl(0 0% 78%)' } },
  splitLine: { show: true, lineStyle: { color: 'hsl(0 0% 92%)' } },
  axisLine: { show: true, lineStyle: { color: 'hsl(0 0% 78%)' } },
};

type Mode = 'blank' | 'points' | 'fit' | 'truth' | 'rescue';

function sampleCurve(w: number[]) {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 160; i++) { const x = XMIN + (i / 160) * (XMAX - XMIN); pts.push([x, predict(w, normalize(x))]); }
  return pts;
}
const TRUE_CURVE: [number, number][] = (() => {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 160; i++) { const x = XMIN + (i / 160) * (XMAX - XMIN); pts.push([x, Math.sin(x)]); }
  return pts;
})();

function baseAxes() {
  return {
    grid: [{ left: '7%', right: '5%', top: '7%', bottom: '11%' }],
    xAxis: [{ type: 'value' as const, min: XMIN, max: XMAX, ...AXIS }],
    yAxis: [{ type: 'value' as const, min: -2.4, max: 2.4, ...AXIS }],
  };
}
const SCATTER = { type: 'scatter' as const, symbolSize: 10, itemStyle: { color: POINT }, data: DATA.map((d) => [d.x, d.y]), z: 4 };

function pointsOption() {
  return { animation: true, animationDuration: 500, ...baseAxes(), series: [SCATTER] };
}
function curveOption(w: number[], showTruth: boolean) {
  const series: Record<string, unknown>[] = [];
  if (showTruth) series.push({ type: 'line', showSymbol: false, lineStyle: { color: TRUE, width: 2, type: 'dashed' }, data: TRUE_CURVE, z: 1 });
  series.push({ type: 'line', showSymbol: false, clip: true, lineStyle: { color: ACCENT, width: 2.5 }, data: sampleCurve(w), z: 3 });
  series.push(SCATTER);
  return { animation: true, animationDuration: 260, ...baseAxes(), series };
}

/** 顶部工具条的一格读数。 */
function Reading({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem', fontFamily: 'ui-monospace, monospace' }}>
      <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>{label}</span>
      <span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </span>
  );
}

export const OverfittingStage = forwardRef<StageHandle>(function OverfittingStage(_props, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mode, setMode] = useState<Mode>('blank');
  const [degree, setDegree] = useState(1);
  const [lamRaw, setLamRaw] = useState(0); // 滑杆 0..100 → λ
  const lambda = (lamRaw / 100) ** 2 * 3;

  const curveMode = mode === 'fit' || mode === 'truth' || mode === 'rescue';
  const w = curveMode ? ridgeFit(XN, YS, degree, lambda) : null;
  const m = w ? metrics(w, DATA) : null;
  const showTruth = mode === 'truth' || mode === 'rescue';

  useImperativeHandle(ref, () => ({
    apply(directives: Directive[]) {
      for (const d of directives) {
        if (d.op === 'showPoints') setMode('points');
        else if (d.op === 'raiseDegree') { setDegree(1); setLamRaw(0); setMode('fit'); }
        else if (d.op === 'revealTruth') setMode('truth');
        else if (d.op === 'regularize') { setDegree((v) => Math.max(v, 11)); setLamRaw(0); setMode('rescue'); }
      }
    },
  }), []);

  useEffect(() => {
    if (!elRef.current || !boxRef.current) return;
    const chart = echarts.init(elRef.current);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(boxRef.current);
    return () => { ro.disconnect(); chart.dispose(); chartRef.current = null; };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (mode === 'points') chart.setOption(pointsOption(), true);
    else if (w) chart.setOption(curveOption(w, showTruth), true);
    else chart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, degree, lambda]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      {/* 留白避让：控件与读数各占一方，中间留空，绝不压图。 */}
      {curveMode && (
        <div className="vz-beat-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--vz-s4)', padding: 'var(--vz-s3) var(--vz-s5) 0' }}>
          <div style={{ minWidth: 0 }}>
            {mode === 'fit' && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vz-s2)' }}>
                <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', whiteSpace: 'nowrap' }}>模型复杂度（多项式阶数）</span>
                <input type="range" min={1} max={14} step={1} value={degree} onChange={(e) => setDegree(Number(e.target.value))} style={{ width: 200, accentColor: ACCENT }} />
                <span style={{ fontSize: 'var(--vz-text-base)', fontWeight: 600, width: '1.5rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{degree}</span>
              </label>
            )}
            {mode === 'rescue' && (
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vz-s2)' }}>
                <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', whiteSpace: 'nowrap' }}>正则强度 λ（给模型纪律）</span>
                <input type="range" min={0} max={100} step={1} value={lamRaw} onChange={(e) => setLamRaw(Number(e.target.value))} style={{ width: 200, accentColor: ACCENT }} />
                <span style={{ fontSize: 'var(--vz-text-base)', fontWeight: 600, width: '2.6rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{lambda.toFixed(2)}</span>
              </label>
            )}
            {mode === 'truth' && (
              <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>多项式阶数 {degree}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--vz-s4)', whiteSpace: 'nowrap' }}>
            {m && <Reading label="训练误差" value={m.trainMSE.toFixed(3)} color={ACCENT} />}
            {m && showTruth && <Reading label="真值误差" value={m.trueMSE.toFixed(3)} color={DANGER} />}
          </div>
        </div>
      )}
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
});
