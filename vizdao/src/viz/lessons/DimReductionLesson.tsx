// src/viz/lessons/DimReductionLesson.tsx — 降维·PCA：把 4 维 Iris 压成 2 维散点。
import { useState, useMemo } from 'react';
import type { Knob } from '../types';
import { KnobPanel } from './KnobPanel';
import { LessonShell } from './LessonShell';
import { ChartCanvas } from '../charts/ChartCanvas';
import { IRIS, IRIS_SPECIES, IRIS_SPECIES_LABEL } from '../datasets/iris';
import { pca, project } from '../analysis/pca';

const SPECIES_COLORS: Record<string, string> = {
  setosa: '#63b3ed',
  versicolor: '#68d391',
  virginica: '#fc8181',
};

const PC_OPTIONS = [
  { value: '0', label: 'PC1' },
  { value: '1', label: 'PC2' },
  { value: '2', label: 'PC3' },
  { value: '3', label: 'PC4' },
];

const KNOBS: Knob[] = [
  {
    id: 'xc',
    label: 'X 主成分',
    kind: 'select',
    bindParam: 'xComp',
    default: '0',
    options: PC_OPTIONS,
    hint: '主成分 = 方差最大的方向',
  },
  {
    id: 'yc',
    label: 'Y 主成分',
    kind: 'select',
    bindParam: 'yComp',
    default: '1',
    options: PC_OPTIONS,
    hint: 'PC1×PC2 信息最多',
  },
];

export function DimReductionLesson() {
  const [values, setValues] = useState<Record<string, string>>({
    xComp: '0',
    yComp: '1',
  });

  function handleChange(bindParam: string, value: number | boolean | string) {
    setValues((prev) => ({ ...prev, [bindParam]: String(value) }));
  }

  const features = useMemo(() => IRIS.map((s) => s.features as number[]), []);
  const model = useMemo(() => pca(features), [features]);

  const xComp = Number(values.xComp);
  const yComp = Number(values.yComp);

  const option = useMemo(() => {
    const projected = project(features, model, xComp, yComp);

    const series = IRIS_SPECIES.map((sp) => {
      const spData = IRIS.reduce<[number, number][]>((acc, sample, i) => {
        if (sample.species === sp) acc.push(projected[i]);
        return acc;
      }, []);
      return {
        name: IRIS_SPECIES_LABEL[sp],
        type: 'scatter',
        symbolSize: 8,
        itemStyle: { color: SPECIES_COLORS[sp] },
        data: spData,
      };
    });

    return {
      animation: false,
      grid: { left: 52, right: 24, top: 40, bottom: 40 },
      legend: {
        data: IRIS_SPECIES.map((sp) => IRIS_SPECIES_LABEL[sp]),
        top: 0,
      },
      xAxis: { type: 'value', name: `PC${xComp + 1}` },
      yAxis: { type: 'value', name: `PC${yComp + 1}` },
      series,
    };
  }, [features, model, xComp, yComp]);

  const metrics = (
    <>
      <span>
        PC{xComp + 1} 解释方差 {(model.explained[xComp] * 100).toFixed(1)}%
      </span>
      <span>
        PC{yComp + 1} 解释方差 {(model.explained[yComp] * 100).toFixed(1)}%
      </span>
      <span>
        前2主成分累计 {((model.explained[0] + model.explained[1]) * 100).toFixed(1)}%
      </span>
    </>
  );

  return (
    <LessonShell
      title="降维：把高维世界压扁着看"
      hook={'Iris 每朵花 4 个特征。PCA 自动找“方差最大的方向”，把 4 维压成 2 维——相同的花还能聚成团吗？'}
      takeaway="PCA 找方差最大的线性方向。PC1×PC2 自动把三种花分开——比手挑原始两维更聪明。"
      controls={<KnobPanel knobs={KNOBS} values={values} onChange={handleChange} />}
      chart={<ChartCanvas option={option} />}
      metrics={metrics}
      note={
        <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
          PC1×PC2（方差最大的两维）把三种花分得很开；换成 PC3×PC4 就糊成一团——信息主要集中在前几个主成分。
        </p>
      }
    />
  );
}
