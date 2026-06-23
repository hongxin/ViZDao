// src/viz/units/anscombe/AnscombeStage.tsx — 安斯库姆的"舞台"：贯穿全课、不重建只变形。
// 指令：showStats / morphQuartet / dropRegLines / focusIV(可拖离群点→回归线实时崩塌)。
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart, LineChart } from 'echarts/charts';
import { GridComponent, TitleComponent, GraphicComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ANSCOMBE } from '../../datasets/anscombe';
import type { StageHandle, Directive } from '../../engine/types';
import { MOTION } from '../../engine/tokens';

echarts.use([ScatterChart, LineChart, GridComponent, TitleComponent, GraphicComponent, CanvasRenderer]);

const GROUPS = ['I', 'II', 'III', 'IV'] as const;
const ACCENT = '#ef7d22';
const POINT = '#6b7280';

/** 最小二乘 y=a+bx 与相关系数 r。 */
function stats(pts: { x: number; y: number }[]) {
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of pts) { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); syy += (p.y - my) ** 2; }
  const b = sxy / sxx, a = my - b * mx, r = sxy / Math.sqrt(sxx * syy);
  return { a, b, r, mx, my };
}

type Mode = 'blank' | 'stats' | 'quartet' | 'focus';

const GRID_POS = [
  { left: '6%', top: '9%', width: '40%', height: '37%' },
  { left: '54%', top: '9%', width: '40%', height: '37%' },
  { left: '6%', top: '56%', width: '40%', height: '37%' },
  { left: '54%', top: '56%', width: '40%', height: '37%' },
];

function quartetOption(showReg: boolean) {
  const grid = GRID_POS.map((g) => ({ ...g }));
  const xAxis = GROUPS.map((_, i) => ({ gridIndex: i, type: 'value' as const, min: 2, max: 20, axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLine: { lineStyle: { color: 'hsl(0 0% 80%)' } } }));
  const yAxis = GROUPS.map((_, i) => ({ gridIndex: i, type: 'value' as const, min: 2, max: 14, axisLabel: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLine: { lineStyle: { color: 'hsl(0 0% 80%)' } } }));
  const title = GROUPS.map((g, i) => ({
    text: `组 ${g}`, left: GRID_POS[i].left, top: i < 2 ? '3.5%' : '50.5%',
    textStyle: { fontSize: 13, fontWeight: 400 as const, color: 'hsl(0 0% 42%)' },
  }));
  const scatter = GROUPS.map((g, i) => ({
    type: 'scatter' as const, xAxisIndex: i, yAxisIndex: i, symbolSize: 7,
    itemStyle: { color: POINT }, data: ANSCOMBE[g].map((p) => [p.x, p.y]),
  }));
  const lines = showReg ? GROUPS.map((g, i) => {
    const { a, b } = stats(ANSCOMBE[g]);
    return { type: 'line' as const, xAxisIndex: i, yAxisIndex: i, showSymbol: false, lineStyle: { color: ACCENT, width: 2 }, data: [[2, a + b * 2], [20, a + b * 20]] };
  }) : [];
  return {
    animation: true, animationDuration: MOTION.reveal, animationEasing: 'cubicOut' as const,
    title, grid, xAxis, yAxis, series: [...scatter, ...lines],
  };
}

function focusOption(outlierY: number) {
  const base = ANSCOMBE.IV.map((p, idx) => (idx === 7 ? { x: p.x, y: outlierY } : p)); // 第 8 点(x=19) 是离群点
  const { a, b } = stats(base);
  return {
    animation: true, animationDuration: MOTION.quick,
    title: [{ text: '组 IV', left: '8%', top: '4%', textStyle: { fontSize: 14, fontWeight: 400 as const, color: 'hsl(0 0% 42%)' } }],
    grid: [{ left: '10%', right: '8%', top: '12%', bottom: '12%' }],
    xAxis: [{ type: 'value' as const, min: 2, max: 20, splitLine: { show: false } }],
    yAxis: [{ type: 'value' as const, min: 2, max: 14, splitLine: { show: false } }],
    series: [
      { type: 'line' as const, showSymbol: false, lineStyle: { color: ACCENT, width: 2.5 }, data: [[2, a + b * 2], [20, a + b * 20]] },
      { type: 'scatter' as const, symbolSize: 9, itemStyle: { color: POINT }, data: base.map((p) => [p.x, p.y]) },
    ],
  };
}

export const AnscombeStage = forwardRef<StageHandle>(function AnscombeStage(_props, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mode, setMode] = useState<Mode>('blank');
  const [showReg, setShowReg] = useState(false);
  const outlierRef = useRef(12.5); // 组 IV 离群点初始 y
  const [, force] = useState(0);

  useImperativeHandle(ref, () => ({
    apply(directives: Directive[]) {
      for (const d of directives) {
        if (d.op === 'showStats') { setMode('stats'); }
        else if (d.op === 'morphQuartet') { setShowReg(false); setMode('quartet'); }
        else if (d.op === 'dropRegLines') { setShowReg(true); }
        else if (d.op === 'focusIV') { outlierRef.current = 12.5; setMode('focus'); }
      }
    },
  }), []);

  useEffect(() => {
    if (!elRef.current) return;
    chartRef.current = echarts.init(elRef.current);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chartRef.current?.dispose(); chartRef.current = null; };
  }, []);

  // 渲染当前模式。
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (mode === 'quartet') chart.setOption(quartetOption(showReg), true);
    else if (mode === 'focus') chart.setOption(focusOption(outlierRef.current), true);
    else chart.clear();
  }, [mode, showReg]);

  // focus 模式：给离群点装一个可拖的 graphic，拖动 → 改 y → 回归线实时崩塌。
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || mode !== 'focus') return;
    let raf = 0;
    const place = () => {
      const [px, py] = chart.convertToPixel({ gridIndex: 0 }, [19, outlierRef.current]);
      chart.setOption({
        graphic: [{
          type: 'circle', shape: { r: 11 }, position: [px, py], z: 100,
          style: { fill: ACCENT, stroke: '#fff', lineWidth: 2 },
          draggable: 'vertical',
          ondrag(this: { y: number }) {
            const dataY = chart.convertFromPixel({ gridIndex: 0 }, [px, this.y])[1];
            outlierRef.current = Math.max(2, Math.min(14, dataY));
            chart.setOption(focusOption(outlierRef.current), true, true);
            cancelAnimationFrame(raf); raf = requestAnimationFrame(place);
          },
          cursor: 'ns-resize',
        }],
      });
    };
    const id = setTimeout(place, 60);
    return () => { clearTimeout(id); cancelAnimationFrame(raf); };
  }, [mode]);

  // 强制重渲钩子（聚焦后 outlier 变化由 graphic 自行 setOption，不需 React 重渲）。
  void force;

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'hsl(var(--background))' }}>
      <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
      {mode === 'stats' && <StatsOverlay />}
    </div>
  );
});

/** 设：只显四组统计量——强调"完全相同"。 */
function StatsOverlay() {
  const rows = GROUPS.map((g) => {
    const s = stats(ANSCOMBE[g]);
    return { g, mx: s.mx.toFixed(1), my: s.my.toFixed(2), r: s.r.toFixed(3) };
  });
  return (
    <div className="vz-beat-in" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(4, 1fr)`, gap: '0.6rem 2.4rem', alignItems: 'baseline' }}>
        <div />
        {rows.map((r) => <div key={r.g} style={{ fontSize: 'var(--vz-text-lg)', color: 'hsl(var(--vz-ink-soft))', textAlign: 'center' }}>组 {r.g}</div>)}
        <Stat label="均值 x" cells={rows.map((r) => r.mx)} />
        <Stat label="均值 y" cells={rows.map((r) => r.my)} />
        <Stat label="相关系数 r" cells={rows.map((r) => r.r)} />
      </div>
    </div>
  );
}

function Stat({ label, cells }: { label: string; cells: string[] }) {
  return (
    <>
      <div key={`${label}-l`} style={{ fontSize: 'var(--vz-text-base)', color: 'hsl(var(--vz-ink-soft))', whiteSpace: 'nowrap' }}>{label}</div>
      {cells.map((c, i) => (
        <div key={`${label}-${i}`} style={{ fontSize: 'var(--vz-text-2xl)', fontVariantNumeric: 'tabular-nums', textAlign: 'center', color: 'hsl(var(--foreground))' }}>{c}</div>
      ))}
    </>
  );
}
