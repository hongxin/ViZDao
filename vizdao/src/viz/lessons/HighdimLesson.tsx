// src/viz/lessons/HighdimLesson.tsx — 高维困境：Iris 散点图，任选2维着色。
import { useState, useMemo } from 'react';
import type { Knob } from '../types';
import { KnobPanel } from './KnobPanel';
import { LessonShell } from './LessonShell';
import { ChartCanvas } from '../charts/ChartCanvas';
import { IRIS, IRIS_FEATURE_LABELS, IRIS_SPECIES, IRIS_SPECIES_LABEL } from '../datasets/iris';

const SPECIES_COLORS: Record<string, string> = {
  setosa: '#63b3ed',
  versicolor: '#68d391',
  virginica: '#fc8181',
};

const FEATURE_OPTIONS = IRIS_FEATURE_LABELS.map((label, i) => ({
  value: String(i),
  label,
}));

const KNOBS: Knob[] = [
  {
    id: 'xdim',
    label: 'X 轴特征',
    kind: 'select',
    bindParam: 'xDim',
    default: '0',
    options: FEATURE_OPTIONS,
    hint: '只能挑两维画——其余两维的信息丢了',
  },
  {
    id: 'ydim',
    label: 'Y 轴特征',
    kind: 'select',
    bindParam: 'yDim',
    default: '2',
    options: FEATURE_OPTIONS,
    hint: '换一对，分得清/分不清的差别很大',
  },
];

export function HighdimLesson() {
  const [values, setValues] = useState<Record<string, string>>({
    xDim: '0',
    yDim: '2',
  });

  function handleChange(bindParam: string, value: number | boolean | string) {
    setValues((prev) => ({ ...prev, [bindParam]: String(value) }));
  }

  const option = useMemo(() => {
    const xIdx = Number(values.xDim);
    const yIdx = Number(values.yDim);
    const xLabel = IRIS_FEATURE_LABELS[xIdx];
    const yLabel = IRIS_FEATURE_LABELS[yIdx];

    const series = IRIS_SPECIES.map((sp) => ({
      name: IRIS_SPECIES_LABEL[sp],
      type: 'scatter',
      symbolSize: 8,
      itemStyle: { color: SPECIES_COLORS[sp] },
      data: IRIS.filter((s) => s.species === sp).map((s) => [
        s.features[xIdx],
        s.features[yIdx],
      ]),
    }));

    return {
      animation: false,
      grid: { left: 52, right: 24, top: 40, bottom: 40 },
      legend: {
        data: IRIS_SPECIES.map((sp) => IRIS_SPECIES_LABEL[sp]),
        top: 0,
      },
      xAxis: { type: 'value', name: xLabel },
      yAxis: { type: 'value', name: yLabel },
      series,
    };
  }, [values.xDim, values.yDim]);

  return (
    <LessonShell
      title="高维困境：4 维的花怎么画？"
      hook={'Iris 每朵花有 4 个特征。纸面只有 2 维。我们怎么“看见”高维世界？'}
      takeaway="高维数据看不全。于是有了两条路：降维（压扁着看）和聚类（让数据自己分组）。"
      controls={
        <KnobPanel
          knobs={KNOBS}
          values={values}
          onChange={handleChange}
        />
      }
      chart={<ChartCanvas option={option} />}
      note={
        <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
          挑花萼两维分不清三种花，挑花瓣两维却泾渭分明——"挑哪两维"本身就是一种建模。
        </p>
      }
    />
  );
}
