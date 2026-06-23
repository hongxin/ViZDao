// src/viz/lessons/AnscombeLesson.tsx — 安斯库姆四重奏：为什么"看见"胜过"计算"。
// 本组件使用 local useState，不依赖任何 store。
import { useState, useMemo } from 'react';
import type { Knob } from '../types';
import { ANSCOMBE } from '../datasets/anscombe';
import { ChartCanvas } from '../charts/ChartCanvas';
import { KnobPanel } from './KnobPanel';
import { LessonShell } from './LessonShell';

type Group = 'I' | 'II' | 'III' | 'IV';

/** 最小二乘线性回归：返回截距 a、斜率 b、Pearson 相关系数 r、均值 meanX/meanY。 */
function computeStats(pts: { x: number; y: number }[]) {
  const n = pts.length;
  let sumX = 0, sumY = 0, sumXX = 0, sumXY = 0, sumYY = 0;
  for (const p of pts) {
    sumX += p.x;
    sumY += p.y;
    sumXX += p.x * p.x;
    sumXY += p.x * p.y;
    sumYY += p.y * p.y;
  }
  const meanX = sumX / n;
  const meanY = sumY / n;
  const b = (sumXY - n * meanX * meanY) / (sumXX - n * meanX * meanX);
  const a = meanY - b * meanX;
  const r = (sumXY - n * meanX * meanY) /
    Math.sqrt((sumXX - n * meanX * meanX) * (sumYY - n * meanY * meanY));
  return { a, b, r, meanX, meanY };
}

/** 构造散点 + 回归线 ECharts option。 */
function buildOption(pts: { x: number; y: number }[], a: number, b: number): object {
  const scatter: [number, number][] = pts.map((p) => [p.x, p.y]);
  const line: [number, number][] = [
    [3, a + b * 3],
    [20, a + b * 20],
  ];
  return {
    animation: false,
    grid: { left: 44, right: 16, top: 32, bottom: 32 },
    xAxis: { type: 'value', min: 2, max: 21 },
    yAxis: { type: 'value' },
    legend: { data: ['散点', '回归线'], top: 4 },
    series: [
      {
        name: '散点',
        type: 'scatter',
        symbolSize: 9,
        itemStyle: { color: '#63b3ed' },
        data: scatter,
      },
      {
        name: '回归线',
        type: 'line',
        showSymbol: false,
        lineStyle: { color: '#ffb454', width: 2.5 },
        data: line,
      },
    ],
  };
}

const KNOBS: Knob[] = [
  {
    id: 'group',
    label: '切换数据组',
    kind: 'select',
    bindParam: 'group',
    default: 'I',
    options: [
      { value: 'I',   label: '组 I' },
      { value: 'II',  label: '组 II' },
      { value: 'III', label: '组 III' },
      { value: 'IV',  label: '组 IV' },
    ],
    hint: '四组的均值/方差/相关系数几乎一样，但散点形状完全不同',
  },
];

export function AnscombeLesson() {
  const [group, setGroup] = useState<Group>('I');

  const { a, b, r, meanX, meanY } = useMemo(
    () => computeStats(ANSCOMBE[group]),
    [group],
  );

  const option = useMemo(
    () => buildOption(ANSCOMBE[group], a, b),
    [group, a, b],
  );

  const metrics = (
    <>
      <span>均值 x = {meanX.toFixed(3)}</span>
      <span>均值 y = {meanY.toFixed(3)}</span>
      <span>相关系数 r = {r.toFixed(3)}</span>
      <span>回归线 y = {a.toFixed(3)} + {b.toFixed(3)}x</span>
    </>
  );

  const note = (
    <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
      切到组 IV：一个离群点撑起整条回归线——统计量骗了你。
    </p>
  );

  return (
    <LessonShell
      title="为什么「看见」胜过「计算」"
      hook="四组数字，统计量完全相同——画出来却天差地别。眼睛能看见公式看不见的东西。"
      takeaway="先画图，再算数。可视化是建模的眼睛。"
      controls={
        <KnobPanel
          knobs={KNOBS}
          values={{ group }}
          onChange={(_param, v) => setGroup(v as Group)}
        />
      }
      chart={<ChartCanvas option={option} />}
      metrics={metrics}
      note={note}
    />
  );
}
