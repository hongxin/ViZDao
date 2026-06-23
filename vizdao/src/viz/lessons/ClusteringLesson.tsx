// src/viz/lessons/ClusteringLesson.tsx — 聚类教学单元：K-Means on Iris 花瓣数据。
import { useState, useMemo } from 'react';
import { LessonShell } from './LessonShell';
import { KnobPanel } from './KnobPanel';
import { ChartCanvas } from '../charts/ChartCanvas';
import { IRIS } from '../datasets/iris';
import { kmeans } from '../analysis/kmeans';
import type { Knob } from '../types';

// 散点图用色板（最多 6 个簇）
const CLUSTER_COLORS = [
  '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272',
];

const K_KNOB: Knob = {
  id: 'k',
  label: '聚类数 K',
  kind: 'slider',
  bindParam: 'k',
  default: 3,
  min: 2,
  max: 6,
  step: 1,
  hint: 'K 给错了会怎样？调到 3 看是否对上三种花',
};

export function ClusteringLesson() {
  const [k, setK] = useState<number>(3);

  // 取 Iris 花瓣长(index 2)、花瓣宽(index 3) 作为 2-D 点集
  const points = useMemo(
    () => IRIS.map((s) => [s.features[2], s.features[3]]),
    [],
  );

  // 每次 k 变化时重跑 K-Means（固定 seed 保证可复现）
  const result = useMemo(() => kmeans(points, k, { seed: 42 }), [points, k]);

  // 构建 ECharts option：k 个散点系列 + 1 个质心系列
  const option = useMemo(() => {
    const clusterSeries = Array.from({ length: k }, (_, ci) => ({
      name: `簇 ${ci + 1}`,
      type: 'scatter',
      data: points
        .filter((_, i) => result.assignments[i] === ci)
        .map(([x, y]) => [x, y]),
      itemStyle: { color: CLUSTER_COLORS[ci % CLUSTER_COLORS.length], opacity: 0.7 },
      symbolSize: 7,
    }));

    const centroidSeries = {
      name: '质心',
      type: 'scatter',
      data: result.centroids.map(([x, y], ci) => ({
        value: [x, y],
        itemStyle: { color: CLUSTER_COLORS[ci % CLUSTER_COLORS.length] },
      })),
      symbol: 'diamond',
      symbolSize: 18,
      label: {
        show: true,
        formatter: ({ dataIndex }: { dataIndex: number }) => `C${dataIndex + 1}`,
        position: 'top' as const,
        fontSize: 11,
      },
    };

    return {
      animation: false,
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, data: [...Array.from({ length: k }, (_, i) => `簇 ${i + 1}`), '质心'] },
      xAxis: { type: 'value', name: '花瓣长', nameLocation: 'middle', nameGap: 28 },
      yAxis: { type: 'value', name: '花瓣宽', nameLocation: 'middle', nameGap: 36 },
      series: [...clusterSeries, centroidSeries],
    };
  }, [points, result, k]);

  const controls = (
    <KnobPanel
      knobs={[K_KNOB]}
      values={{ k }}
      onChange={(_, v) => setK(Number(v))}
    />
  );

  const metrics = (
    <>
      <span>当前 K：<strong>{k}</strong></span>
      <span>迭代次数：<strong>{result.iterations}</strong></span>
    </>
  );

  return (
    <LessonShell
      title="聚类：让数据自己分组"
      hook="不告诉机器有几类，它能自己把相似的点聚到一起吗？"
      takeaway={'聚类没有唯一正确答案。方法和参数，决定了你“看见”几个群。'}
      controls={controls}
      chart={<ChartCanvas option={option} />}
      metrics={metrics}
      note={
        <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
          调 K=3 试试，看算法分出的簇是否对上真实的三种花。
        </p>
      }
    />
  );
}
