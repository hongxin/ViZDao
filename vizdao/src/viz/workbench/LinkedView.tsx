// src/viz/workbench/LinkedView.tsx — 一个刷选-联动视图（数据集无关：据当前 dataset 运行）。
// 执行：基础+派生列 → 筛选 → 分组(by+agg,对所有图型) → 排序/取前N → 画。
// 每个渲染行记录其行下标(idxGroups,索引 dataset.rows)：分组视图刷选选中整组成员，联动照常。
import { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart, LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, BrushComponent, ToolboxComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useWorkbenchStore, type ViewSpec, type Agg } from '../../store/workbenchStore';
import type { Dataset } from '../datasets';
import { evalNum, evalBool, type Row } from '../analysis/expr';

echarts.use([ScatterChart, LineChart, BarChart, GridComponent, TooltipComponent, BrushComponent, ToolboxComponent, TitleComponent, LegendComponent, CanvasRenderer]);

const ACCENT = '#ef7d22';
const DIM = 'rgba(120,125,135,0.18)';
const NEUTRAL = '#6b7280';
const CAT_PALETTE = ['#e8743b', '#2e7ebb', '#3b9c5a', '#a855f7', '#eab308', '#06b6d4', '#ec4899'];

const catLabel = (ds: Dataset, f: string, v: number) => ds.catLabels[f]?.[v] ?? (Number.isInteger(v) ? String(v) : v.toFixed(1));
const firstNum = (ds: Dataset) => ds.baseFields.find((f) => ds.fields[f]?.kind === 'num') ?? ds.baseFields[0];

function aggOf(vals: number[], agg: Agg): number {
  if (!vals.length) return 0;
  if (agg === 'count') return vals.length;
  if (agg === 'sum') return vals.reduce((s, v) => s + v, 0);
  if (agg === 'min') return Math.min(...vals);
  if (agg === 'max') return Math.max(...vals);
  return vals.reduce((s, v) => s + v, 0) / vals.length; // mean
}

interface VData { rows: Row[]; idxGroups: number[][]; memberY: number[][]; grouped: boolean; byF?: string; }
function viewData(spec: ViewSpec, ds: Dataset): VData {
  const yf = spec.y ?? firstNum(ds);
  const raw: Row[] = [], rawIdx: number[] = [];
  for (let i = 0; i < ds.rows.length; i++) {
    const r: Row = { ...ds.rows[i] };
    if (spec.derive) for (const d of spec.derive) r[d.name] = evalNum(d.expr, r);
    if (spec.filter && !evalBool(spec.filter, r)) continue;
    raw.push(r); rawIdx.push(i);
  }

  const byF = spec.by ?? (spec.chart === 'bar' ? ds.baseFields.find((f) => ds.fields[f]?.kind === 'cat') : undefined);
  const aggF: Agg = spec.agg ?? 'mean';
  const grouped = !!(byF && (spec.agg || spec.chart === 'bar'));

  let rows: Row[], idxGroups: number[][], memberY: number[][];
  if (grouped && byF) {
    const groups = new Map<number, number[]>();
    raw.forEach((r, p) => { const k = r[byF]; const arr = groups.get(k); if (arr) arr.push(p); else groups.set(k, [p]); });
    const keys = [...groups.keys()].sort((a, b) => a - b);
    rows = []; idxGroups = []; memberY = [];
    for (const k of keys) {
      const ps = groups.get(k)!;
      const vals = ps.map((p) => raw[p][yf] ?? 0);
      rows.push({ [byF]: k, [yf]: aggOf(vals, aggF), _n: ps.length });
      idxGroups.push(ps.map((p) => rawIdx[p]));
      memberY.push(vals);
    }
  } else {
    rows = raw; idxGroups = rawIdx.map((i) => [i]); memberY = raw.map((r) => [r[yf] ?? 0]);
  }

  if (spec.sort?.by) {
    const sb = spec.sort.by, dir = spec.sort.dir === 'desc' ? -1 : 1;
    let order = rows.map((_, j) => j).sort((a, b) => ((rows[a][sb] ?? 0) - (rows[b][sb] ?? 0)) * dir);
    if (spec.sort.topN && spec.sort.topN > 0) order = order.slice(0, spec.sort.topN);
    rows = order.map((j) => rows[j]); idxGroups = order.map((j) => idxGroups[j]); memberY = order.map((j) => memberY[j]);
  }
  return { rows, idxGroups, memberY, grouped, byF };
}

const AXIS = {
  axisLabel: { fontSize: 10, color: 'hsl(0 0% 58%)' }, axisTick: { length: 3, lineStyle: { color: 'hsl(0 0% 80%)' } },
  splitLine: { lineStyle: { color: 'hsl(0 0% 94%)' } }, axisLine: { lineStyle: { color: 'hsl(0 0% 80%)' } },
};
const titleCfg = (t?: string) => ({ text: t ?? '', left: 8, top: 4, textStyle: { fontSize: 12, fontWeight: 400 as const, color: 'hsl(0 0% 42%)' } });
const grid = { left: 48, right: 16, top: 34, bottom: 28 };

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildOption(spec: ViewSpec, vd: VData, sel: Set<number> | null, ds: Dataset): any {
  const { rows, idxGroups, memberY, grouped, byF } = vd;
  const xf = spec.x ?? firstNum(ds), yf = spec.y ?? firstNum(ds);
  const anySel = (j: number) => !!sel && idxGroups[j].some((i) => sel.has(i));
  const selAgg = (j: number) => aggOf(memberY[j].filter((_, k) => sel!.has(idxGroups[j][k])), spec.agg ?? 'mean');

  if (grouped) {
    const main = rows.map((r) => Math.round((r[yf] ?? 0) * 100) / 100);
    if (spec.chart === 'bar') {
      const series: any[] = [{ name: '全体', type: 'bar', data: main, itemStyle: { color: sel ? DIM : '#93c5fd' } }];
      if (sel) series.push({ name: '选中', type: 'bar', data: rows.map((_, j) => Math.round(selAgg(j) * 100) / 100), itemStyle: { color: ACCENT } });
      return {
        animation: true, animationDuration: 300, title: titleCfg(spec.title), legend: sel ? { right: 12, top: 6, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } } : undefined,
        grid, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: rows.map((r) => catLabel(ds, byF!, r[byF!])), ...AXIS }, yAxis: { type: 'value', ...AXIS }, series,
      };
    }
    const pts = rows.map((r) => [r[byF!], r[yf] ?? 0]);
    const series: any[] = spec.chart === 'line'
      ? [{ type: 'line', symbol: 'circle', symbolSize: 5, lineStyle: { color: sel ? DIM : NEUTRAL, width: 1.6 }, itemStyle: { color: sel ? DIM : NEUTRAL }, data: pts, z: 1 }]
      : [{ type: 'scatter', symbolSize: 9, itemStyle: { color: sel ? DIM : NEUTRAL }, data: pts, z: 1 }];
    if (sel) series.push({ type: spec.chart === 'line' ? 'line' : 'scatter', symbol: 'circle', symbolSize: 7, lineStyle: { color: ACCENT, width: 1.8 }, itemStyle: { color: ACCENT }, data: rows.map((r, j) => [r[byF!], selAgg(j)]), z: 3 });
    return {
      animation: true, animationDuration: 300, title: titleCfg(spec.title), grid, tooltip: { trigger: 'item' },
      toolbox: { show: false, feature: { brush: { type: ['rect', 'clear'] } } },
      brush: { brushType: 'rect', brushMode: 'single', throttleType: 'debounce', throttleDelay: 100, brushStyle: { borderColor: ACCENT, borderWidth: 1, color: 'rgba(239,125,34,0.10)' } },
      xAxis: { type: 'value', scale: true, ...AXIS }, yAxis: { type: 'value', scale: true, ...AXIS }, series,
    };
  }

  // 未分组：逐点散点/折线
  const cf = spec.color;
  const colorCats = cf ? [...new Set(rows.map((r) => r[cf]))].sort((a, b) => a - b) : [];
  const pColor = (j: number) => {
    const base = cf ? CAT_PALETTE[colorCats.indexOf(rows[j][cf]) % CAT_PALETTE.length] : NEUTRAL;
    if (sel) return anySel(j) ? (cf ? base : ACCENT) : DIM;
    return base;
  };
  const isTime = xf === ds.dateField;
  const base: any = {
    animation: true, animationDuration: 300, title: titleCfg(spec.title), grid, tooltip: { trigger: 'item' },
    toolbox: { show: false, feature: { brush: { type: ['rect', 'clear'] } } },
    brush: { brushType: 'rect', brushMode: 'single', throttleType: 'debounce', throttleDelay: 100, brushStyle: { borderColor: ACCENT, borderWidth: 1, color: 'rgba(239,125,34,0.10)' } },
    xAxis: { type: isTime ? 'time' : 'value', scale: !isTime, ...AXIS }, yAxis: { type: 'value', scale: true, ...AXIS },
  };
  if (spec.chart === 'line') {
    base.series = [{ type: 'line', showSymbol: false, lineStyle: { color: sel ? DIM : NEUTRAL, width: 1.4 }, data: rows.map((r) => [r[xf], r[yf]]), z: 1 }];
    if (sel) base.series.push({ type: 'scatter', symbolSize: 5, itemStyle: { color: ACCENT }, data: rows.filter((_, j) => anySel(j)).map((r) => [r[xf], r[yf]]), z: 3 });
  } else {
    base.series = [{ type: 'scatter', symbolSize: 7, data: rows.map((r, j) => ({ value: [r[xf], r[yf]], itemStyle: { color: pColor(j), opacity: sel && !anySel(j) ? 0.5 : 0.82 } })) }];
  }
  return base;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function LinkedView({ spec }: { spec: ViewSpec }) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const idxRef = useRef<number[][]>([]);
  const dataset = useWorkbenchStore((s) => s.dataset);
  const selection = useWorkbenchStore((s) => s.selection);
  const setSelection = useWorkbenchStore((s) => s.setSelection);

  const vd = useMemo(() => viewData(spec, dataset), [spec, dataset]);
  idxRef.current = vd.idxGroups;

  useEffect(() => {
    if (!elRef.current || !boxRef.current) return;
    const chart = echarts.init(elRef.current);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(boxRef.current);
    const onBrush = (params: { batch?: { selected: { seriesIndex: number; dataIndex: number[] }[] }[] }) => {
      const picked = new Set<number>();
      const map = idxRef.current;
      params.batch?.[0]?.selected?.filter((s) => s.seriesIndex === 0).forEach((s) => s.dataIndex?.forEach((j) => map[j]?.forEach((bi) => picked.add(bi))));
      if (picked.size > 0) setSelection([...picked]);
    };
    chart.on('brushselected', onBrush as never);
    chart.on('brushSelected', onBrush as never);
    return () => { ro.disconnect(); chart.dispose(); chartRef.current = null; };
  }, [setSelection]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const sel = selection ? new Set(selection) : null;
    chart.setOption(buildOption(spec, vd, sel, dataset), true);
    const brushable = spec.chart === 'scatter' || spec.chart === 'line';
    if (brushable) {
      chart.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: (spec.chart === 'line' && !vd.grouped) ? 'lineX' : 'rect', brushMode: 'single' } });
    }
  }, [spec, vd, selection, dataset]);

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid hsl(var(--border))', borderRadius: 8, overflow: 'hidden', background: 'hsl(var(--background))' }}>
      <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
