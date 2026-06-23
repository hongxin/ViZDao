// src/viz/units/highdim/IrisStage.tsx — 高维困境的"舞台"：4 维 Iris 投到 2 维散点，换特征对即换"视角"。
// 指令：showPair{x,y}（脚本指定特征对）/ freeExplore（开放下拉自选）。右上读"可分性"。
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { IRIS, IRIS_FEATURE_LABELS, IRIS_SPECIES, IRIS_SPECIES_LABEL } from '../../datasets/iris';
import type { StageHandle, Directive } from '../../engine/types';
import { TheoryToggle } from '../../engine/theory';
import { IrisTheory } from './IrisTheory';

echarts.use([ScatterChart, GridComponent, LegendComponent, CanvasRenderer]);

const SP_COLOR: Record<string, string> = { setosa: '#e8743b', versicolor: '#2e7ebb', virginica: '#3b9c5a' };

const AXIS = {
  axisLabel: { show: true, fontSize: 10, color: 'hsl(0 0% 58%)', margin: 6 },
  axisTick: { show: true, length: 3, lineStyle: { color: 'hsl(0 0% 78%)' } },
  splitLine: { show: true, lineStyle: { color: 'hsl(0 0% 93%)' } },
  axisLine: { show: true, lineStyle: { color: 'hsl(0 0% 78%)' } },
};

/** 类间/类内散度比（LDA 迹比）：越大越可分。 */
export function separability(dx: number, dy: number): number {
  const dims = [dx, dy];
  const grand = dims.map((d) => IRIS.reduce((s, p) => s + p.features[d], 0) / IRIS.length);
  let Sb = 0, Sw = 0;
  for (const sp of IRIS_SPECIES) {
    const members = IRIS.filter((p) => p.species === sp);
    const cmean = dims.map((d) => members.reduce((s, p) => s + p.features[d], 0) / members.length);
    dims.forEach((_, k) => { Sb += members.length * (cmean[k] - grand[k]) ** 2; });
    for (const m of members) dims.forEach((d, k) => { Sw += (m.features[d] - cmean[k]) ** 2; });
  }
  return Sb / Sw;
}

function scatterOption(xDim: number, yDim: number) {
  return {
    animation: true, animationDuration: 400,
    legend: { top: 6, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: 'hsl(0 0% 42%)' } },
    grid: [{ left: '7%', right: '5%', top: '13%', bottom: '11%' }],
    xAxis: [{ type: 'value' as const, scale: true, name: IRIS_FEATURE_LABELS[xDim], nameLocation: 'middle' as const, nameGap: 24, nameTextStyle: { color: 'hsl(0 0% 50%)', fontSize: 11 }, ...AXIS }],
    yAxis: [{ type: 'value' as const, scale: true, name: IRIS_FEATURE_LABELS[yDim], nameLocation: 'middle' as const, nameGap: 30, nameTextStyle: { color: 'hsl(0 0% 50%)', fontSize: 11 }, ...AXIS }],
    series: IRIS_SPECIES.map((sp) => ({
      type: 'scatter' as const, name: IRIS_SPECIES_LABEL[sp], symbolSize: 8,
      itemStyle: { color: SP_COLOR[sp], opacity: 0.78 },
      data: IRIS.filter((p) => p.species === sp).map((p) => [p.features[xDim], p.features[yDim]]),
    })),
  };
}

export const IrisStage = forwardRef<StageHandle>(function IrisStage(_props, ref) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mode, setMode] = useState<'blank' | 'scatter'>('blank');
  const [xDim, setXDim] = useState(0);
  const [yDim, setYDim] = useState(1);
  const [controls, setControls] = useState(false);
  const [theoryOpen, setTheoryOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    apply(directives: Directive[]) {
      for (const d of directives) {
        if (d.op === 'showPair') {
          if (typeof d.x === 'number') setXDim(d.x);
          if (typeof d.y === 'number') setYDim(d.y);
          setControls(false); setMode('scatter');
        } else if (d.op === 'freeExplore') { setControls(true); setMode('scatter'); }
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
    if (mode === 'scatter') chart.setOption(scatterOption(xDim, yDim), true);
    else chart.clear();
  }, [mode, xDim, yDim]);

  const sel = (val: number, set: (n: number) => void) => (
    <select value={val} onChange={(e) => set(Number(e.target.value))} style={{ fontSize: 'var(--vz-text-sm)', padding: '0.25rem 0.4rem', borderRadius: 6, border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--foreground))' }}>
      {IRIS_FEATURE_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
    </select>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'hsl(var(--background))' }}>
      {mode === 'scatter' && (
        <div className="vz-beat-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--vz-s4)', padding: 'var(--vz-s3) var(--vz-s5) 0' }}>
          <div style={{ minWidth: 0, display: 'inline-flex', alignItems: 'center', gap: 'var(--vz-s2)' }}>
            {controls ? (
              <>
                <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>X</span>{sel(xDim, setXDim)}
                <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>Y</span>{sel(yDim, setYDim)}
              </>
            ) : (
              <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>{IRIS_FEATURE_LABELS[xDim]} × {IRIS_FEATURE_LABELS[yDim]}</span>
            )}
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 'var(--vz-text-sm)', color: 'hsl(var(--vz-ink-soft))' }}>可分性 J</span>
            <span style={{ fontSize: 'var(--vz-text-lg)', fontWeight: 600, color: '#ef7d22', fontVariantNumeric: 'tabular-nums' }}>{separability(xDim, yDim).toFixed(1)}</span>
          </span>
        </div>
      )}
      <div ref={boxRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
      </div>
      {!theoryOpen && <TheoryToggle onOpen={() => setTheoryOpen(true)} />}
      {theoryOpen && <IrisTheory onClose={() => setTheoryOpen(false)} />}
    </div>
  );
});
