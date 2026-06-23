// src/viz/charts/registry.ts — chartType → ECharts option。切片1：line+scatter。
import type { Point } from '../datasets/sinNoise';
import { predict, normalize, XMIN, XMAX } from '../analysis/ridge';

const CURVE_SAMPLES = 200;

/** 构造"带噪样本(scatter) + 拟合曲线(line) + 真值 sin(line)"的 option。 */
export function buildLineScatterOption(data: Point[], w: number[]): object {
  const fit: [number, number][] = [];
  const truth: [number, number][] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const x = XMIN + (i / CURVE_SAMPLES) * (XMAX - XMIN);
    fit.push([x, predict(w, normalize(x))]);
    truth.push([x, Math.sin(x)]);
  }
  return {
    animation: false,
    grid: { left: 44, right: 16, top: 24, bottom: 32 },
    xAxis: { type: 'value', min: XMIN, max: XMAX },
    yAxis: { type: 'value', min: -2.2, max: 2.2 },
    legend: { data: ['带噪样本', '拟合曲线', '真值 sin(x)'], top: 0 },
    series: [
      { name: '真值 sin(x)', type: 'line', showSymbol: false, lineStyle: { type: 'dashed', color: '#5a6b8c' }, data: truth },
      { name: '拟合曲线', type: 'line', showSymbol: false, lineStyle: { color: '#ffb454', width: 2.5 }, data: fit },
      { name: '带噪样本', type: 'scatter', symbolSize: 8, itemStyle: { color: '#63b3ed' }, data: data.map((d) => [d.x, d.y]) },
    ],
  };
}
