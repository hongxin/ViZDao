// src/viz/lessons/DimReductionLesson.tsx — 降维：PCA（线性）/ UMAP（非线性）把 4 维 Iris 压成 2 维。
// 注：t-SNE 因 tsne-js 打包不兼容，暂作课堂 PPT 演示，不在交互版。
import { useState, useMemo, useEffect } from 'react';
import type { Knob } from '../types';
import { KnobPanel } from './KnobPanel';
import { LessonShell } from './LessonShell';
import { ChartCanvas } from '../charts/ChartCanvas';
import { IRIS, IRIS_SPECIES, IRIS_SPECIES_LABEL } from '../datasets/iris';
import { pca, project } from '../analysis/pca';
import { umapEmbed } from '../analysis/embed';

const SPECIES_COLORS: Record<string, string> = {
  setosa: '#63b3ed',
  versicolor: '#68d391',
  virginica: '#fc8181',
};

const PC_OPTIONS = [
  { value: '0', label: 'PC1' }, { value: '1', label: 'PC2' },
  { value: '2', label: 'PC3' }, { value: '3', label: 'PC4' },
];

const METHOD_KNOB: Knob = {
  id: 'method', label: '降维方法', kind: 'select', bindParam: 'method', default: 'pca',
  options: [
    { value: 'pca', label: 'PCA（线性·快·保全局）' },
    { value: 'umap', label: 'UMAP（非线性·保局部）' },
  ],
  hint: '线性 vs 非线性，世界观不同',
};

export function DimReductionLesson() {
  const [values, setValues] = useState<Record<string, number | string>>({
    method: 'pca', xComp: '0', yComp: '1', nNeighbors: 15,
  });
  const handleChange = (bindParam: string, value: number | boolean | string) =>
    setValues((prev) => ({ ...prev, [bindParam]: value as number | string }));

  const method = String(values.method);
  const xComp = Number(values.xComp);
  const yComp = Number(values.yComp);
  const nNeighbors = Number(values.nNeighbors);

  const features = useMemo(() => IRIS.map((s) => s.features as number[]), []);
  const model = useMemo(() => pca(features), [features]);

  // 按方法计算 2D 坐标。UMAP 较重，延后到"计算中"渲染之后跑，避免硬卡顿。
  const [points, setPoints] = useState<[number, number][]>([]);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (method === 'pca') {
      setPoints(project(features, model, xComp, yComp));
      setComputing(false);
      return;
    }
    setComputing(true);
    const id = setTimeout(() => {
      const pts = umapEmbed(features, nNeighbors);
      if (!cancelled) { setPoints(pts); setComputing(false); }
    }, 30);
    return () => { cancelled = true; clearTimeout(id); };
  }, [method, xComp, yComp, nNeighbors, features, model]);

  const knobs: Knob[] = useMemo(() => {
    if (method === 'pca') {
      return [
        METHOD_KNOB,
        { id: 'xc', label: 'X 主成分', kind: 'select', bindParam: 'xComp', default: '0', options: PC_OPTIONS, hint: '主成分 = 方差最大的方向' },
        { id: 'yc', label: 'Y 主成分', kind: 'select', bindParam: 'yComp', default: '1', options: PC_OPTIONS, hint: 'PC1×PC2 信息最多' },
      ];
    }
    return [METHOD_KNOB, { id: 'nn', label: 'UMAP n_neighbors', kind: 'slider', bindParam: 'nNeighbors', default: 15, min: 5, max: 50, step: 1, hint: '局部 vs 全局结构的权衡' }];
  }, [method]);

  const option = useMemo(() => {
    const series = IRIS_SPECIES.map((sp) => ({
      name: IRIS_SPECIES_LABEL[sp],
      type: 'scatter',
      symbolSize: 8,
      itemStyle: { color: SPECIES_COLORS[sp] },
      data: IRIS.reduce<[number, number][]>((acc, s, i) => {
        if (s.species === sp && points[i]) acc.push(points[i]);
        return acc;
      }, []),
    }));
    const axisName = method === 'pca' ? [`PC${xComp + 1}`, `PC${yComp + 1}`] : ['维度 1', '维度 2'];
    return {
      animation: false,
      grid: { left: 52, right: 24, top: 40, bottom: 40 },
      legend: { data: IRIS_SPECIES.map((sp) => IRIS_SPECIES_LABEL[sp]), top: 0 },
      xAxis: { type: 'value', name: axisName[0], scale: true },
      yAxis: { type: 'value', name: axisName[1], scale: true },
      series,
    };
  }, [points, method, xComp, yComp]);

  const metrics = method === 'pca' ? (
    <>
      <span>PC{xComp + 1} 解释方差 {(model.explained[xComp] * 100).toFixed(1)}%</span>
      <span>PC{yComp + 1} 解释方差 {(model.explained[yComp] * 100).toFixed(1)}%</span>
      <span>前2主成分累计 {((model.explained[0] + model.explained[1]) * 100).toFixed(1)}%</span>
    </>
  ) : (
    <>
      <span>UMAP 非线性嵌入</span>
      <span style={{ opacity: 0.7 }}>坐标无定量含义，看"聚团"</span>
      {computing && <span style={{ color: 'hsl(var(--primary))' }}>计算中…</span>}
    </>
  );

  return (
    <LessonShell
      title="降维：把高维世界压扁着看"
      hook={'Iris 每朵花 4 个特征。换不同降维方法，把 4 维压成 2 维——相同的花还能聚成团吗？'}
      takeaway="PCA 找方差最大的线性方向；UMAP 牺牲全局换局部，让聚团更紧。降维是有损的压扁。"
      controls={<KnobPanel knobs={knobs} values={values} onChange={handleChange} />}
      chart={<ChartCanvas option={option} />}
      metrics={metrics}
      note={
        <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
          PCA 看全局方差（PC1≈90%）；切到 UMAP，三种花被压成更紧的团——非线性方法保的是"局部邻居关系"。
          t-SNE 与之同理（保局部），课堂用 MNIST 录屏对比演示。
        </p>
      }
    />
  );
}
