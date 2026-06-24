// src/viz/units/distribution/DistributionStage.tsx — 分布的"舞台"：rug → 直方图(桶数) → KDE(带宽)，不重建只变形。
// 指令：showRug / showHist{bins} / showKDE{bw}。双峰数据：少桶看似单峰，多桶露两峰。
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { CustomChart, LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { makeRng, gaussian } from '../../datasets/sinNoise';
import { histogram, gaussianKDE } from '../../analysis/kde';
import type { StageHandle, Directive } from '../../engine/types';
import { TheoryToggle } from '../../engine/theory';
import { DistributionTheory } from './DistributionTheory';

echarts.use([CustomChart, LineChart, ScatterChart, GridComponent, CanvasRenderer]);

const ACCENT = '#ef7d22';
const HIST = '#93c5fd';
const RUG = '#9ca3af';

// 双峰混合：100 个 N(-0.6, 0.62) + 100 个 N(0.85, 0.62)，固定种子。
// 适度重叠：6 桶看似单峰、12 桶露两峰、再细则碎成假峰（直方图脆弱性）。
export const VALUES: number[] = (() => {
  const rng = makeRng(7);
  const a = Array.from({ length: 100 }, () => -0.6 + 0.62 * gaussian(rng));
  const b = Array.from({ length: 100 }, () => 0.85 + 0.62 * gaussian(rng));
  return [...a, ...b];
})();
const N = VALUES.length;
const VMIN = Math.min(...VALUES), VMAX = Math.max(...VALUES);
// 干净的轴边界（避免 -2.4615… 这种长小数标签）。
const XMIN = Math.floor((VMIN - 0.4) * 2) / 2, XMAX = Math.ceil((VMAX + 0.4) * 2) / 2;
const niceMax = (m: number) => Math.ceil(m * 1.18 * 10) / 10;

const AXIS = {
  axisLabel: { show: true, fontSize: 10, color: 'hsl(0 0% 58%)', margin: 6 },
  axisTick: { show: true, length: 3, lineStyle: { color: 'hsl(0 0% 78%)' } },
  splitLine: { show: true, lineStyle: { color: 'hsl(0 0% 93%)' } },
  axisLine: { show: true, lineStyle: { color: 'hsl(0 0% 78%)' } },
};

type Mode = 'blank' | 'rug' | 'hist' | 'kde';

/** 数密度直方图（计数→密度，便于与 KDE 同轴）。 */
function histDensity(bins: number) {
  return histogram(VALUES, bins).map((b) => [b.x0, b.x1, b.count / (N * (b.x1 - b.x0))]);
}
/** 局部极大值计数（峰数）。 */
function peaksOf(ys: number[]): number {
  let p = 0;
  const thr = Math.max(...ys) * 0.12;
  for (let i = 1; i < ys.length - 1; i++) if (ys[i] > thr && ys[i] >= ys[i - 1] && ys[i] > ys[i + 1]) p++;
  return p;
}

// 把 y 轴顶住实际密度范围（自定义系列会误用 bin 边界值定 y 轴域，导致密度条被压扁到底部）；
// 底部留足空间，让 x 轴/rug/条形基座避开底部叙述文字。
function baseAxes(yMax?: number) {
  return {
    grid: [{ left: '7%', right: '5%', top: '8%', bottom: '30%' }],
    xAxis: [{ type: 'value' as const, min: XMIN, max: XMAX, name: 'y 值', nameLocation: 'end' as const, nameGap: 6, nameTextStyle: { color: 'hsl(0 0% 55%)', fontSize: 10 }, ...AXIS }],
    yAxis: [{ type: 'value' as const, min: 0, max: yMax, name: '密度', nameTextStyle: { color: 'hsl(0 0% 55%)', fontSize: 10 }, ...AXIS }],
  };
}
const densMax = (rows: number[][]) => Math.max(0.001, ...rows.map((d) => d[2]));

const RUG_SERIES = { type: 'scatter' as const, symbol: 'rect', symbolSize: [1.5, 14], data: VALUES.map((v) => [v, 0]), itemStyle: { color: RUG, opacity: 0.5 }, z: 5 };

/* eslint-disable @typescript-eslint/no-explicit-any */
function histOption(bins: number, withRug: boolean) {
  const data = histDensity(bins);
  const series: any[] = [{
    type: 'custom', z: 2, encode: { x: [0, 1], y: 2 },
    renderItem: (_p: any, api: any) => {
      const x0 = api.value(0), x1 = api.value(1), h = api.value(2);
      const p0 = api.coord([x0, 0]); const p1 = api.coord([x1, h]);
      return { type: 'rect', shape: { x: p0[0] + 0.5, y: p1[1], width: Math.max(p1[0] - p0[0] - 1, 0.5), height: p0[1] - p1[1] }, style: { fill: HIST } };
    },
    data,
  }];
  if (withRug) series.push(RUG_SERIES);
  return { animation: true, animationDuration: 300, ...baseAxes(niceMax(densMax(data))), series };
}

function kdeOption(bw: number) {
  const pts = gaussianKDE(VALUES, bw, 160);
  const hd = histDensity(24);
  const yMax = niceMax(Math.max(densMax(hd), Math.max(...pts.map((p) => p.density))));
  return {
    animation: true, animationDuration: 300, ...baseAxes(yMax),
    series: [
      { type: 'custom', z: 1, encode: { x: [0, 1], y: 2 }, renderItem: (_p: any, api: any) => { const x0 = api.value(0), x1 = api.value(1), h = api.value(2); const p0 = api.coord([x0, 0]); const p1 = api.coord([x1, h]); return { type: 'rect', shape: { x: p0[0] + 0.5, y: p1[1], width: Math.max(p1[0] - p0[0] - 1, 0.5), height: p0[1] - p1[1] }, style: { fill: HIST, opacity: 0.35 } }; }, data: hd },
      { type: 'line', z: 3, showSymbol: false, lineStyle: { color: ACCENT, width: 2.5 }, data: pts.map((p) => [p.x, p.density]) },
      RUG_SERIES,
    ],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export const DistributionStage = forwardRef<StageHandle>(function DistributionStage(_props, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mode, setMode] = useState<Mode>('blank');
  const [bins, setBins] = useState(5);
  const [bw, setBw] = useState(0.3);
  const [theoryOpen, setTheoryOpen] = useState(false);

  const peaks = mode === 'kde'
    ? peaksOf(gaussianKDE(VALUES, bw, 160).map((p) => p.density))
    : peaksOf(histDensity(bins).map((d) => d[2]));

  useImperativeHandle(ref, () => ({
    apply(directives: Directive[]) {
      for (const d of directives) {
        if (d.op === 'showRug') setMode('rug');
        else if (d.op === 'showHist') { if (typeof d.bins === 'number') setBins(d.bins); setMode('hist'); }
        else if (d.op === 'showKDE') { if (typeof d.bw === 'number') setBw(d.bw); setMode('kde'); }
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
    if (mode === 'rug') chart.setOption({ ...baseAxes(), series: [RUG_SERIES] }, true);
    else if (mode === 'hist') chart.setOption(histOption(bins, true), true);
    else if (mode === 'kde') chart.setOption(kdeOption(bw), true);
    else chart.clear();
  }, [mode, bins, bw]);

  const showBins = mode === 'hist';
  const showBw = mode === 'kde';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      {(showBins || showBw) && (
        <div className="vz-beat-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--vz-s4)', padding: 'var(--vz-s3) var(--vz-s5) 0' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--vz-s2)' }}>
            <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))', whiteSpace: 'nowrap' }}>{showBins ? '直方图桶数' : 'KDE 带宽 h'}</span>
            {showBins
              ? <input type="range" min={3} max={50} step={1} value={bins} onChange={(e) => setBins(Number(e.target.value))} style={{ width: 200, accentColor: ACCENT }} />
              : <input type="range" min={5} max={120} step={1} value={Math.round(bw * 100)} onChange={(e) => setBw(Number(e.target.value) / 100)} style={{ width: 200, accentColor: ACCENT }} />}
            <span style={{ fontSize: 'var(--vz-text-base)', fontWeight: 600, width: '2.6rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{showBins ? bins : bw.toFixed(2)}</span>
          </label>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>可见峰数</span>
            <span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{peaks}</span>
          </span>
        </div>
      )}
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
      {!theoryOpen && <TheoryToggle onOpen={() => setTheoryOpen(true)} />}
      {theoryOpen && <DistributionTheory values={VALUES} onClose={() => setTheoryOpen(false)} />}
    </div>
  );
});
