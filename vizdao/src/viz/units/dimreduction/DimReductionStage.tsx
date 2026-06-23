// src/viz/units/dimreduction/DimReductionStage.tsx — 降维的"舞台"：PCA 散点 → t-SNE 动画解团。
// 指令：showPCA（线性,有结构但相叠）/ runTSNE（非线性,逐步 step 解团成 10 座孤岛）。
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { DIGITS, DIGIT_COLORS } from '../../datasets/digits';
import { pca, project } from '../../analysis/pca';
import { TSNE } from '../../analysis/tsne';
import type { StageHandle, Directive } from '../../engine/types';
import { TheoryToggle } from '../../engine/theory';
import { DimReductionTheory } from './DimReductionTheory';

echarts.use([ScatterChart, GridComponent, CanvasRenderer]);

const ACCENT = '#ef7d22';

// 平衡子集：每个数字取 20 张 = 200 点（保 t-SNE 动画流畅）。
const SUB = (() => {
  const out: typeof DIGITS = [];
  for (let d = 0; d <= 9; d++) out.push(...DIGITS.filter((s) => s.label === d).slice(0, 20));
  return out;
})();
const X = SUB.map((s) => s.pixels);
const LAB = SUB.map((s) => s.label);
export const PCA_RES = pca(X);
const PCA_PROJ = project(X, PCA_RES, 0, 1);
export const PCA_VAR2 = PCA_RES.explained[0] + PCA_RES.explained[1];
const MAX_ITER = 400;

const AXIS = {
  axisLabel: { show: true, fontSize: 10, color: 'hsl(0 0% 58%)', margin: 6 },
  axisTick: { show: true, length: 3, lineStyle: { color: 'hsl(0 0% 78%)' } },
  splitLine: { show: true, lineStyle: { color: 'hsl(0 0% 94%)' } },
  axisLine: { show: true, lineStyle: { color: 'hsl(0 0% 80%)' } },
};

function coloredData(coords: number[][]) {
  return coords.map((c, i) => ({ value: c, itemStyle: { color: DIGIT_COLORS[LAB[i]], opacity: 0.82 } }));
}
function scatterOption(coords: number[][], xName: string, yName: string) {
  return {
    animation: false,
    grid: [{ left: '6%', right: '5%', top: '6%', bottom: '9%' }],
    xAxis: [{ type: 'value' as const, scale: true, name: xName, nameLocation: 'end' as const, nameGap: 4, nameTextStyle: { color: 'hsl(0 0% 55%)', fontSize: 10 }, ...AXIS }],
    yAxis: [{ type: 'value' as const, scale: true, name: yName, nameTextStyle: { color: 'hsl(0 0% 55%)', fontSize: 10 }, ...AXIS }],
    series: [{ type: 'scatter' as const, symbolSize: 7, data: coloredData(coords) }],
  };
}

export const DimReductionStage = forwardRef<StageHandle>(function DimReductionStage(_props, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const rafRef = useRef(0);
  const [mode, setMode] = useState<'blank' | 'pca' | 'tsne'>('blank');
  const [iter, setIter] = useState(0);
  const [theoryOpen, setTheoryOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    apply(directives: Directive[]) {
      for (const d of directives) {
        if (d.op === 'showPCA') setMode('pca');
        else if (d.op === 'runTSNE') { setIter(0); setMode('tsne'); }
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

  // PCA：静态散点。
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (mode === 'pca') chart.setOption(scatterOption(PCA_PROJ, '主成分 1', '主成分 2'), true);
    else if (mode === 'blank') chart.clear();
  }, [mode]);

  // t-SNE：逐步 step()，动画解团。
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || mode !== 'tsne') return;
    const tsne = new TSNE({ perplexity: 30, dim: 2, seed: 7 });
    tsne.initData(X);
    chart.setOption(scatterOption(tsne.getSolution(), 't-SNE 1', 't-SNE 2'), true);
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      for (let s = 0; s < 3; s++) tsne.step();
      const it = tsne.getIter();
      setIter(it);
      chart.setOption({ series: [{ data: coloredData(tsne.getSolution()) }] });
      if (it < MAX_ITER) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { stopped = true; cancelAnimationFrame(rafRef.current); };
  }, [mode]);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      {mode !== 'blank' && (
        <div className="vz-beat-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--vz-s4)', padding: 'var(--vz-s3) var(--vz-s5) 0' }}>
          <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>{mode === 'pca' ? 'PCA · 线性投影' : 't-SNE · 非线性（动画解团）'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            {mode === 'pca' ? (
              <><span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>前 2 主成分·解释方差</span><span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{(PCA_VAR2 * 100).toFixed(0)}%</span></>
            ) : (
              <><span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>迭代</span><span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600, color: ACCENT, fontVariantNumeric: 'tabular-nums' }}>{iter}</span></>
            )}
          </span>
        </div>
      )}
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
      {!theoryOpen && <TheoryToggle onOpen={() => setTheoryOpen(true)} />}
      {theoryOpen && <DimReductionTheory onClose={() => setTheoryOpen(false)} />}
    </div>
  );
});
