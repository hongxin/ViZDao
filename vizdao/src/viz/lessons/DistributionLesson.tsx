// src/viz/lessons/DistributionLesson.tsx — 分布 · 直方图 → KDE 教学单元。
import { useMemo, useState } from 'react';
import type { Knob } from '../types';
import type { KnobValues } from './KnobPanel';
import { KnobPanel } from './KnobPanel';
import { LessonShell } from './LessonShell';
import { ChartCanvas } from '../charts/ChartCanvas';
import { genSinNoise } from '../datasets/sinNoise';
import { histogram, gaussianKDE } from '../analysis/kde';

const KNOBS: Knob[] = [
  {
    id: 'bins',
    label: '直方图桶数',
    kind: 'slider',
    bindParam: 'binCount',
    default: 20,
    min: 3,
    max: 80,
    step: 1,
    hint: '桶数一变，故事就变——直方图的脆弱性',
  },
  {
    id: 'bandwidth',
    label: 'KDE 带宽',
    kind: 'slider',
    bindParam: 'bandwidth',
    default: 0.3,
    min: 0.05,
    max: 1.5,
    step: 0.05,
    hint: '带宽=密度估计的"模糊程度"',
  },
  {
    id: 'showKde',
    label: '叠加密度曲线',
    kind: 'toggle',
    bindParam: 'showKDE',
    default: true,
    hint: '对照直方图看密度图更稳',
  },
];

const DEFAULT_VALUES: KnobValues = {
  binCount: 20,
  bandwidth: 0.3,
  showKDE: true,
};

export function DistributionLesson() {
  const sample = useMemo(() => genSinNoise(150, 0.5, 7).map((d) => d.y), []);
  const [values, setValues] = useState<KnobValues>(DEFAULT_VALUES);

  const handleChange = (bindParam: string, value: number | boolean | string) => {
    setValues((prev) => ({ ...prev, [bindParam]: value }));
  };

  const binCount = Number(values.binCount);
  const bandwidth = Number(values.bandwidth);
  const showKDE = Boolean(values.showKDE);
  const n = sample.length;

  const option = useMemo(() => {
    const bins = histogram(sample, binCount);
    const binWidth = bins.length > 0 ? bins[0].x1 - bins[0].x0 : 1;
    const barData = bins.map((b) => ({
      value: [(b.x0 + b.x1) / 2, b.count / (n * binWidth)],
    }));

    const series: object[] = [
      {
        name: '直方图',
        type: 'bar',
        barWidth: '99%',
        itemStyle: { color: '#63b3ed', opacity: 0.7 },
        data: barData.map((d) => d.value),
      },
    ];

    if (showKDE) {
      const kdePoints = gaussianKDE(sample, bandwidth);
      series.push({
        name: 'KDE 密度曲线',
        type: 'line',
        showSymbol: false,
        lineStyle: { color: '#f6ad55', width: 2.5 },
        data: kdePoints.map((p) => [p.x, p.density]),
      });
    }

    return {
      animation: false,
      grid: { left: 50, right: 16, top: 36, bottom: 32 },
      xAxis: { type: 'value', name: 'y 值' },
      yAxis: { type: 'value', name: '密度' },
      legend: { data: showKDE ? ['直方图', 'KDE 密度曲线'] : ['直方图'], top: 0 },
      series,
    };
  }, [sample, binCount, bandwidth, showKDE, n]);

  return (
    <LessonShell
      title="看数据的形状：直方图 → 密度图"
      hook={'同一组数，分桶宽一变，直方图的"形状"就变了。密度图想摆脱这种武断。'}
      takeaway="直方图的形状依赖分桶；密度图用带宽换来更稳的形状感知。"
      controls={
        <KnobPanel knobs={KNOBS} values={values} onChange={handleChange} />
      }
      chart={<ChartCanvas option={option} />}
      note={
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
          同一组数，桶数从 10 调到 60，直方图从单峰变多峰——而 KDE 曲线平稳得多。
        </p>
      }
    />
  );
}
