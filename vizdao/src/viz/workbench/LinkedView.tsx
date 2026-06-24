// src/viz/workbench/LinkedView.tsx — 一个刷选-联动视图。
// 每视图先算"增广行"(基础列+派生列+dteday时间戳)→按 filter 筛选→画；记录到 BIKE 的下标映射供联动。
// 框选 → workbenchStore.setSelection(BIKE下标)；据全局 selection 把选中 accent、其余淡灰。
import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart, LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, BrushComponent, ToolboxComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { BIKE, type BikeDay } from '../datasets/bikeSharing';
import { useWorkbenchStore, type ViewSpec } from '../../store/workbenchStore';
import { evalNum, evalBool, type Row } from '../analysis/expr';

echarts.use([ScatterChart, LineChart, BarChart, GridComponent, TooltipComponent, BrushComponent, ToolboxComponent, TitleComponent, LegendComponent, CanvasRenderer]);

const ACCENT = '#ef7d22';
const DIM = 'rgba(120,125,135,0.18)';
const NEUTRAL = '#6b7280';
const CAT_PALETTE = ['#e8743b', '#2e7ebb', '#3b9c5a', '#a855f7', '#eab308', '#06b6d4', '#ec4899'];

const CAT_LABELS: Record<string, Record<number, string>> = {
  workingday: { 0: '非工作日', 1: '工作日' }, holiday: { 0: '平日', 1: '节假日' },
  weathersit: { 1: '晴/少云', 2: '雾/阴', 3: '小雨雪', 4: '暴雨雪' },
  season: { 1: '春', 2: '夏', 3: '秋', 4: '冬' }, yr: { 0: '2011', 1: '2012' },
  weekday: { 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' },
};
const catLabel = (f: string, v: number) => CAT_LABELS[f]?.[v] ?? String(v);

const BASE_FIELDS = ['season', 'yr', 'mnth', 'holiday', 'weekday', 'workingday', 'weathersit', 'temp', 'atemp', 'hum', 'windspeed', 'casual', 'registered', 'cnt'] as const;
function baseRow(d: BikeDay): Row {
  const r: Row = { dteday: Date.parse(d.dteday) };
  for (const f of BASE_FIELDS) r[f] = (d as unknown as Record<string, number>)[f];
  return r;
}
/** 增广(派生列) + 筛选 → 行 + 到 BIKE 的下标映射。 */
function viewData(spec: ViewSpec): { rows: Row[]; idx: number[] } {
  const rows: Row[] = [], idx: number[] = [];
  for (let i = 0; i < BIKE.length; i++) {
    const r = baseRow(BIKE[i]);
    if (spec.derive) for (const d of spec.derive) r[d.name] = evalNum(d.expr, r);
    if (spec.filter && !evalBool(spec.filter, r)) continue;
    rows.push(r); idx.push(i);
  }
  return { rows, idx };
}

const AXIS = {
  axisLabel: { fontSize: 10, color: 'hsl(0 0% 58%)' }, axisTick: { length: 3, lineStyle: { color: 'hsl(0 0% 80%)' } },
  splitLine: { lineStyle: { color: 'hsl(0 0% 94%)' } }, axisLine: { lineStyle: { color: 'hsl(0 0% 80%)' } },
};
const titleCfg = (t?: string) => ({ text: t ?? '', left: 8, top: 4, textStyle: { fontSize: 12, fontWeight: 400 as const, color: 'hsl(0 0% 42%)' } });
const grid = { left: 48, right: 16, top: 34, bottom: 28 };

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildOption(spec: ViewSpec, rows: Row[], idx: number[], sel: Set<number> | null): any {
  const xf = spec.x ?? 'temp', yf = spec.y ?? 'cnt';
  const inSel = (j: number) => (sel ? sel.has(idx[j]) : false);

  if (spec.chart === 'bar') {
    const by = spec.by ?? 'weathersit';
    const cats = [...new Set(rows.map((r) => r[by]))].sort((a, b) => a - b);
    const agg = (rs: Row[]) => (rs.length ? rs.reduce((s, r) => s + (r[yf] ?? 0), 0) / rs.length : 0);
    const allBy = cats.map((c) => agg(rows.filter((r) => r[by] === c)));
    const series: any[] = [{ name: '全体', type: 'bar', data: allBy.map((v) => Math.round(v)), itemStyle: { color: sel ? DIM : '#93c5fd' } }];
    if (sel) {
      const selRows = rows.filter((_, j) => inSel(j));
      const selBy = cats.map((c) => agg(selRows.filter((r) => r[by] === c)));
      series.push({ name: '选中', type: 'bar', data: selBy.map((v) => Math.round(v)), itemStyle: { color: ACCENT } });
    }
    return {
      animation: true, animationDuration: 300, title: titleCfg(spec.title), legend: sel ? { right: 12, top: 6, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } } : undefined,
      grid, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: cats.map((c) => catLabel(by, c)), ...AXIS }, yAxis: { type: 'value', ...AXIS }, series,
    };
  }

  const cf = spec.color;
  const colorCats = cf ? [...new Set(rows.map((r) => r[cf]))].sort((a, b) => a - b) : [];
  const pColor = (j: number) => {
    const base = cf ? CAT_PALETTE[colorCats.indexOf(rows[j][cf]) % CAT_PALETTE.length] : NEUTRAL;
    if (sel) return inSel(j) ? (cf ? base : ACCENT) : DIM;
    return base;
  };
  const isTime = xf === 'dteday';
  const base: any = {
    animation: true, animationDuration: 300, title: titleCfg(spec.title), grid, tooltip: { trigger: 'item' },
    toolbox: { show: false, feature: { brush: { type: ['rect', 'clear'] } } },
    brush: { brushType: 'rect', brushMode: 'single', throttleType: 'debounce', throttleDelay: 100, brushStyle: { borderColor: ACCENT, borderWidth: 1, color: 'rgba(239,125,34,0.10)' } },
    xAxis: { type: isTime ? 'time' : 'value', scale: !isTime, ...AXIS }, yAxis: { type: 'value', scale: true, ...AXIS },
  };
  if (spec.chart === 'line') {
    base.series = [{ type: 'line', showSymbol: false, lineStyle: { color: sel ? DIM : NEUTRAL, width: 1.4 }, data: rows.map((r) => [r[xf], r[yf]]), z: 1 }];
    if (sel) base.series.push({ type: 'scatter', symbolSize: 5, itemStyle: { color: ACCENT }, data: rows.filter((_, j) => inSel(j)).map((r) => [r[xf], r[yf]]), z: 3 });
  } else {
    base.series = [{ type: 'scatter', symbolSize: 7, data: rows.map((r, j) => ({ value: [r[xf], r[yf]], itemStyle: { color: pColor(j), opacity: sel && !inSel(j) ? 0.5 : 0.82 } })) }];
  }
  return base;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function LinkedView({ spec }: { spec: ViewSpec }) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const idxRef = useRef<number[]>([]);
  const selection = useWorkbenchStore((s) => s.selection);
  const setSelection = useWorkbenchStore((s) => s.setSelection);

  const { rows, idx } = useMemo(() => viewData(spec), [spec]);
  idxRef.current = idx;

  useEffect(() => {
    if (!elRef.current || !boxRef.current) return;
    const chart = echarts.init(elRef.current);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(boxRef.current);
    const onBrush = (params: { batch?: { selected: { seriesIndex: number; dataIndex: number[] }[] }[] }) => {
      const picked = new Set<number>();
      const map = idxRef.current;
      params.batch?.[0]?.selected?.filter((s) => s.seriesIndex === 0).forEach((s) => s.dataIndex?.forEach((j) => { const bi = map[j]; if (bi !== undefined) picked.add(bi); }));
      if (picked.size > 0) setSelection([...picked]); // 忽略空事件（重绘清 brush）
    };
    chart.on('brushselected', onBrush as never);
    chart.on('brushSelected', onBrush as never);
    return () => { ro.disconnect(); chart.dispose(); chartRef.current = null; };
  }, [setSelection]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const sel = selection ? new Set(selection) : null;
    chart.setOption(buildOption(spec, rows, idx, sel), true);
    if (spec.chart === 'scatter' || spec.chart === 'line') {
      chart.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: spec.chart === 'line' ? 'lineX' : 'rect', brushMode: 'single' } });
    }
  }, [spec, rows, idx, selection]);

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid hsl(var(--border))', borderRadius: 8, overflow: 'hidden', background: 'hsl(var(--background))' }}>
      <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
