// src/viz/workbench/LinkedView.tsx — 一个刷选-联动视图。
// 据 ViewSpec + BIKE 构图；框选 → workbenchStore.setSelection；据全局 selection 把选中 accent、其余淡灰（联动核心）。
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { ScatterChart, LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, BrushComponent, ToolboxComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { BIKE, BIKE_FIELDS, type BikeDay } from '../datasets/bikeSharing';
import { useWorkbenchStore, type ViewSpec } from '../../store/workbenchStore';

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
const fieldVal = (d: BikeDay, f: string): number => (f === 'dteday' ? Date.parse(d.dteday) : (d as unknown as Record<string, number>)[f]);
const distinct = (f: string) => [...new Set(BIKE.map((d) => (d as unknown as Record<string, number>)[f]))].sort((a, b) => a - b);

const AXIS = {
  axisLabel: { fontSize: 10, color: 'hsl(0 0% 58%)' }, axisTick: { length: 3, lineStyle: { color: 'hsl(0 0% 80%)' } },
  splitLine: { lineStyle: { color: 'hsl(0 0% 94%)' } }, axisLine: { lineStyle: { color: 'hsl(0 0% 80%)' } },
};
const titleCfg = (t?: string) => ({ text: t ?? '', left: 8, top: 4, textStyle: { fontSize: 12, fontWeight: 400 as const, color: 'hsl(0 0% 42%)' } });
const grid = { left: 48, right: 16, top: 34, bottom: 28 };

/* eslint-disable @typescript-eslint/no-explicit-any */
function buildOption(spec: ViewSpec, sel: Set<number> | null): any {
  const xf = spec.x ?? 'temp', yf = spec.y ?? 'cnt';
  if (spec.chart === 'bar') {
    const by = spec.by ?? 'weathersit';
    const cats = distinct(by);
    const agg = (idxs: number[]) => idxs.length ? idxs.reduce((s, i) => s + fieldVal(BIKE[i], yf), 0) / idxs.length : 0;
    const allBy = cats.map((c) => agg(BIKE.map((_, i) => i).filter((i) => fieldVal(BIKE[i], by) === c)));
    const series: any[] = [{ name: '全体', type: 'bar', data: allBy.map((v) => Math.round(v)), itemStyle: { color: sel ? DIM : '#93c5fd' } }];
    if (sel) {
      const selBy = cats.map((c) => agg([...sel].filter((i) => fieldVal(BIKE[i], by) === c)));
      series.push({ name: '选中', type: 'bar', data: selBy.map((v) => Math.round(v)), itemStyle: { color: ACCENT } });
    }
    return {
      animation: true, animationDuration: 300, title: titleCfg(spec.title), legend: sel ? { right: 12, top: 6, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 10 } } : undefined,
      grid, tooltip: { trigger: 'axis' }, xAxis: { type: 'category', data: cats.map((c) => catLabel(by, c)), ...AXIS },
      yAxis: { type: 'value', name: `${spec.agg ?? 'mean'}(${BIKE_FIELDS[yf]?.label ?? yf})`, nameTextStyle: { fontSize: 10, color: 'hsl(0 0% 55%)' }, ...AXIS },
      series,
    };
  }
  // scatter / line
  const colorField = spec.color;
  const pointColor = (i: number): string => {
    if (sel) return sel.has(i) ? (colorField ? CAT_PALETTE[distinct(colorField).indexOf(fieldVal(BIKE[i], colorField)) % CAT_PALETTE.length] : ACCENT) : DIM;
    if (colorField) return CAT_PALETTE[distinct(colorField).indexOf(fieldVal(BIKE[i], colorField)) % CAT_PALETTE.length];
    return NEUTRAL;
  };
  const isTime = xf === 'dteday';
  const data = BIKE.map((d, i) => ({ value: [fieldVal(d, xf), fieldVal(d, yf)], itemStyle: { color: pointColor(i), opacity: sel && !sel.has(i) ? 0.5 : 0.82 } }));
  const base: any = {
    animation: true, animationDuration: 300, title: titleCfg(spec.title), grid,
    tooltip: { trigger: 'item' },
    toolbox: { show: false, feature: { brush: { type: ['rect', 'clear'] } } },
    brush: { brushType: 'rect', brushMode: 'single', throttleType: 'debounce', throttleDelay: 100, brushStyle: { borderColor: ACCENT, borderWidth: 1, color: 'rgba(239,125,34,0.10)' } },
    xAxis: { type: isTime ? 'time' : 'value', scale: !isTime, name: BIKE_FIELDS[xf]?.label ?? xf, nameLocation: 'middle', nameGap: 22, nameTextStyle: { fontSize: 10, color: 'hsl(0 0% 55%)' }, ...AXIS },
    yAxis: { type: 'value', scale: true, name: BIKE_FIELDS[yf]?.label ?? yf, nameTextStyle: { fontSize: 10, color: 'hsl(0 0% 55%)' }, ...AXIS },
  };
  if (spec.chart === 'line') {
    base.series = [
      { type: 'line', showSymbol: false, lineStyle: { color: sel ? DIM : NEUTRAL, width: 1.4 }, data: BIKE.map((d) => [fieldVal(d, xf), fieldVal(d, yf)]), z: 1 },
    ];
    if (sel) base.series.push({ type: 'scatter', symbolSize: 5, itemStyle: { color: ACCENT }, data: [...sel].map((i) => [fieldVal(BIKE[i], xf), fieldVal(BIKE[i], yf)]), z: 3 });
  } else {
    base.series = [{ type: 'scatter', symbolSize: 7, data }];
  }
  return base;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function LinkedView({ spec }: { spec: ViewSpec }) {
  const elRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const selection = useWorkbenchStore((s) => s.selection);
  const setSelection = useWorkbenchStore((s) => s.setSelection);

  useEffect(() => {
    if (!elRef.current || !boxRef.current) return;
    const chart = echarts.init(elRef.current);
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(boxRef.current);
    const onBrush = (params: { batch?: { selected: { dataIndex: number[] }[] }[] }) => {
      const picked = new Set<number>();
      params.batch?.[0]?.selected?.forEach((s) => s.dataIndex?.forEach((i) => picked.add(i)));
      // 只在真有选中时更新——忽略"重绘清 brush"触发的空事件（否则联动会自我抹除）。清空走任务栏「清除选区」。
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
    chart.setOption(buildOption(spec, sel), true);
    if (spec.chart === 'scatter' || spec.chart === 'line') {
      chart.dispatchAction({ type: 'takeGlobalCursor', key: 'brush', brushOption: { brushType: spec.chart === 'line' ? 'lineX' : 'rect', brushMode: 'single' } });
    }
  }, [spec, selection]);

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%', height: '100%', border: '1px solid hsl(var(--border))', borderRadius: 8, overflow: 'hidden', background: 'hsl(var(--background))' }}>
      <div ref={elRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
