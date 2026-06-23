// src/viz/units/clustering/ClusteringStage.tsx — 聚类的"舞台"：无标签花瓣点 → K-Means(拖 K) → 揭错分。
// 指令：showPoints / runKMeans{k} / revealErrors。右上读"簇内平方和 J"（揭晓时加"错分"）。
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { IRIS } from '../../datasets/iris';
import { kmeans } from '../../analysis/kmeans';
import type { StageHandle, Directive } from '../../engine/types';
import { TheoryToggle } from '../../engine/theory';
import { ClusteringTheory } from './ClusteringTheory';

echarts.use([ScatterChart, GridComponent, CanvasRenderer]);

const ACCENT = '#ef7d22';
const DANGER = '#dc2626';
const CLUSTER = ['#e8743b', '#2e7ebb', '#3b9c5a', '#a855f7', '#eab308', '#06b6d4'];
const STAR = 'path://M0,-11 L3.2,-3.4 L10.5,-3.4 L4.7,1.3 L6.5,8.9 L0,4.4 L-6.5,8.9 L-4.7,1.3 L-10.5,-3.4 L-3.2,-3.4 Z';

export const PTS: number[][] = IRIS.map((s) => [s.features[2], s.features[3]]); // 花瓣长×宽
const TRUE = IRIS.map((s) => s.species);

const AXIS = {
  axisLabel: { show: true, fontSize: 10, color: 'hsl(0 0% 58%)', margin: 6 },
  axisTick: { show: true, length: 3, lineStyle: { color: 'hsl(0 0% 78%)' } },
  splitLine: { show: true, lineStyle: { color: 'hsl(0 0% 93%)' } },
  axisLine: { show: true, lineStyle: { color: 'hsl(0 0% 78%)' } },
};

function distSq(a: number[], b: number[]) { return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2; }

/** 簇内平方和 J + 错分点（与簇内主导真品种不符者）。 */
export function evalK(k: number) {
  const { assignments, centroids } = kmeans(PTS, k, { seed: 42 });
  const J = PTS.reduce((s, p, i) => s + distSq(p, centroids[assignments[i]]), 0);
  // 每簇主导真品种
  const dom: string[] = [];
  for (let c = 0; c < k; c++) {
    const tally: Record<string, number> = {};
    assignments.forEach((a, i) => { if (a === c) tally[TRUE[i]] = (tally[TRUE[i]] || 0) + 1; });
    dom[c] = Object.entries(tally).sort((x, y) => y[1] - x[1])[0]?.[0] ?? '';
  }
  const errorIdx = assignments.map((a, i) => (TRUE[i] !== dom[a] ? i : -1)).filter((i) => i >= 0);
  return { assignments, centroids, J, errorIdx };
}

function baseAxes() {
  return {
    grid: [{ left: '7%', right: '5%', top: '6%', bottom: '11%' }],
    xAxis: [{ type: 'value' as const, scale: true, name: '花瓣长', nameLocation: 'middle' as const, nameGap: 24, nameTextStyle: { color: 'hsl(0 0% 50%)', fontSize: 11 }, ...AXIS }],
    yAxis: [{ type: 'value' as const, scale: true, name: '花瓣宽', nameLocation: 'middle' as const, nameGap: 28, nameTextStyle: { color: 'hsl(0 0% 50%)', fontSize: 11 }, ...AXIS }],
  };
}

function pointsOption() {
  return { animation: true, animationDuration: 400, ...baseAxes(), series: [{ type: 'scatter' as const, symbolSize: 8, itemStyle: { color: '#9ca3af', opacity: 0.7 }, data: PTS }] };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function kmeansOption(k: number, showErrors: boolean) {
  const { assignments, centroids, errorIdx } = evalK(k);
  const series: any[] = [
    { type: 'scatter', symbolSize: 8, z: 2, data: PTS.map((p, i) => ({ value: p, itemStyle: { color: CLUSTER[assignments[i]], opacity: 0.8 } })) },
    { type: 'scatter', symbol: STAR, symbolSize: 22, z: 4, data: centroids.map((c, ci) => ({ value: c, itemStyle: { color: CLUSTER[ci], borderColor: '#fff', borderWidth: 1.5 } })) },
  ];
  if (showErrors) series.push({ type: 'scatter', symbol: 'circle', symbolSize: 15, z: 3, data: errorIdx.map((i) => PTS[i]), itemStyle: { color: 'transparent', borderColor: DANGER, borderWidth: 1.6 } });
  return { animation: true, animationDuration: 350, ...baseAxes(), series };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const ClusteringStage = forwardRef<StageHandle>(function ClusteringStage(_props, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mode, setMode] = useState<'blank' | 'points' | 'kmeans'>('blank');
  const [k, setK] = useState(3);
  const [showErrors, setShowErrors] = useState(false);
  const [theoryOpen, setTheoryOpen] = useState(false);

  const stat = mode === 'kmeans' ? evalK(k) : null;

  useImperativeHandle(ref, () => ({
    apply(directives: Directive[]) {
      for (const d of directives) {
        if (d.op === 'showPoints') { setShowErrors(false); setMode('points'); }
        else if (d.op === 'runKMeans') { if (typeof d.k === 'number') setK(d.k); setShowErrors(false); setMode('kmeans'); }
        else if (d.op === 'revealErrors') { setK(3); setShowErrors(true); } // 揭晓固定讲 K=3 的交界错分
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
    else if (mode === 'kmeans') chart.setOption(kmeansOption(k, showErrors), true);
    else chart.clear();
  }, [mode, k, showErrors]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      {mode === 'kmeans' && (
        <div className="vz-beat-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--vz-s4)', padding: 'var(--vz-s3) var(--vz-s5) 0' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vz-s2)' }}>
            <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>聚类数 K</span>
            <input type="range" min={2} max={6} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} style={{ width: 160, accentColor: ACCENT }} />
            <span style={{ fontSize: 'var(--vz-text-base)', fontWeight: 600, width: '1.2rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{k}</span>
          </label>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--vz-s4)', whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}><span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>簇内平方和 J</span><span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{stat!.J.toFixed(1)}</span></span>
            {showErrors && <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem' }}><span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>错分</span><span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600, color: DANGER, fontVariantNumeric: 'tabular-nums' }}>{stat!.errorIdx.length}</span></span>}
          </span>
        </div>
      )}
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
      {!theoryOpen && <TheoryToggle onOpen={() => setTheoryOpen(true)} />}
      {theoryOpen && <ClusteringTheory onClose={() => setTheoryOpen(false)} />}
    </div>
  );
});
