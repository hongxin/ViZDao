// src/viz/lessons/DimReductionLesson.tsx — 降维：数据集(Iris/手写数字) × 方法(PCA/t-SNE/UMAP)。
// t-SNE 逐步动画"解团"：MNIST 风格手写数字 64 维 → 2 维，10 个数字自动聚成 10 团。
import { useState, useMemo, useEffect } from 'react';
import type { Knob } from '../types';
import { KnobPanel } from './KnobPanel';
import { LessonShell } from './LessonShell';
import { ChartCanvas } from '../charts/ChartCanvas';
import { IRIS, IRIS_SPECIES, IRIS_SPECIES_LABEL } from '../datasets/iris';
import { DIGITS, DIGIT_COLORS } from '../datasets/digits';
import { pca, project } from '../analysis/pca';
import { umapEmbed } from '../analysis/embed';
import { TSNE } from '../analysis/tsne';

const SPECIES_COLORS = ['#63b3ed', '#68d391', '#fc8181'];
const PC_OPTIONS = [
  { value: '0', label: 'PC1' }, { value: '1', label: 'PC2' },
  { value: '2', label: 'PC3' }, { value: '3', label: 'PC4' },
];

interface DatasetDef { features: number[][]; labels: number[]; names: string[]; colors: string[] }

function useDataset(name: string): DatasetDef {
  return useMemo(() => {
    if (name === 'digits') {
      return {
        features: DIGITS.map((d) => d.pixels.map((p) => p / 16)), // 归一化 0-16 → 0-1
        labels: DIGITS.map((d) => d.label),
        names: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
        colors: DIGIT_COLORS,
      };
    }
    return {
      features: IRIS.map((s) => s.features as number[]),
      labels: IRIS.map((s) => IRIS_SPECIES.indexOf(s.species)),
      names: IRIS_SPECIES.map((sp) => IRIS_SPECIES_LABEL[sp]),
      colors: SPECIES_COLORS,
    };
  }, [name]);
}

export function DimReductionLesson() {
  const [values, setValues] = useState<Record<string, number | string>>({
    dataset: 'iris', method: 'pca', xComp: '0', yComp: '1', perplexity: 30, nNeighbors: 15,
  });
  const handleChange = (bindParam: string, value: number | boolean | string) =>
    setValues((prev) => ({ ...prev, [bindParam]: value as number | string }));

  const datasetName = String(values.dataset);
  const method = String(values.method);
  const xComp = Number(values.xComp);
  const yComp = Number(values.yComp);
  const perplexity = Number(values.perplexity);
  const nNeighbors = Number(values.nNeighbors);

  const ds = useDataset(datasetName);
  const model = useMemo(() => pca(ds.features), [ds]);

  const [points, setPoints] = useState<[number, number][]>([]);
  const [computing, setComputing] = useState(false);
  const [tsneIter, setTsneIter] = useState(0);

  // PCA：即时投影。
  useEffect(() => {
    if (method !== 'pca') return;
    setPoints(project(ds.features, model, xComp, yComp));
    setComputing(false);
  }, [method, ds, model, xComp, yComp]);

  // UMAP：延后计算，避免硬卡顿。
  useEffect(() => {
    if (method !== 'umap') return;
    let cancelled = false;
    setComputing(true);
    const id = setTimeout(() => {
      const pts = umapEmbed(ds.features, nNeighbors);
      if (!cancelled) { setPoints(pts); setComputing(false); }
    }, 30);
    return () => { cancelled = true; clearTimeout(id); };
  }, [method, ds, nNeighbors]);

  // t-SNE：逐步迭代做动画"解团"。
  useEffect(() => {
    if (method !== 'tsne') return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    setComputing(true);
    setTsneIter(0);
    const t = new TSNE({ perplexity, seed: 42 });
    t.initData(ds.features);
    const MAX = datasetName === 'digits' ? 200 : 300;
    const BATCH = datasetName === 'digits' ? 1 : 3;
    const loop = () => {
      if (stopped) return;
      for (let k = 0; k < BATCH; k++) t.step();
      setPoints(t.getSolution().map((p) => [p[0], p[1]] as [number, number]));
      setTsneIter(t.getIter());
      if (t.getIter() < MAX) timer = setTimeout(loop, 0);
      else setComputing(false);
    };
    timer = setTimeout(loop, 30);
    return () => { stopped = true; clearTimeout(timer); };
  }, [method, ds, datasetName, perplexity]);

  const knobs: Knob[] = useMemo(() => {
    const base: Knob[] = [
      { id: 'ds', label: '数据集', kind: 'select', bindParam: 'dataset', default: 'iris',
        options: [{ value: 'iris', label: 'Iris 鸢尾花（4 维）' }, { value: 'digits', label: '手写数字（8×8=64 维）' }], hint: '高维一点，降维更有看头' },
      { id: 'method', label: '降维方法', kind: 'select', bindParam: 'method', default: 'pca',
        options: [
          { value: 'pca', label: 'PCA（线性·快）' },
          { value: 'tsne', label: 't-SNE（非线性·动画解团）' },
          { value: 'umap', label: 'UMAP（非线性·快）' },
        ], hint: '线性 vs 非线性，世界观不同' },
    ];
    if (method === 'pca') {
      base.push(
        { id: 'xc', label: 'X 主成分', kind: 'select', bindParam: 'xComp', default: '0', options: PC_OPTIONS, hint: '方差最大的方向' },
        { id: 'yc', label: 'Y 主成分', kind: 'select', bindParam: 'yComp', default: '1', options: PC_OPTIONS, hint: 'PC1×PC2 信息最多' },
      );
    } else if (method === 'tsne') {
      base.push({ id: 'perp', label: 't-SNE perplexity', kind: 'slider', bindParam: 'perplexity', default: 30, min: 5, max: 50, step: 1, hint: '邻居视野；改它会重新解团' });
    } else {
      base.push({ id: 'nn', label: 'UMAP n_neighbors', kind: 'slider', bindParam: 'nNeighbors', default: 15, min: 5, max: 50, step: 1, hint: '局部 vs 全局的权衡' });
    }
    return base;
  }, [method]);

  const option = useMemo(() => {
    const series = ds.names.map((nm, k) => ({
      name: nm,
      type: 'scatter',
      symbolSize: datasetName === 'digits' ? 6 : 8,
      itemStyle: { color: ds.colors[k] },
      data: ds.labels.reduce<[number, number][]>((acc, lab, i) => {
        if (lab === k && points[i]) acc.push(points[i]);
        return acc;
      }, []),
    }));
    const axisName = method === 'pca' ? [`PC${xComp + 1}`, `PC${yComp + 1}`] : ['维度 1', '维度 2'];
    return {
      animation: false,
      grid: { left: 48, right: 20, top: 44, bottom: 36 },
      legend: { data: ds.names, top: 0, type: datasetName === 'digits' ? 'scroll' : 'plain' },
      xAxis: { type: 'value', name: axisName[0], scale: true },
      yAxis: { type: 'value', name: axisName[1], scale: true },
      series,
    };
  }, [points, ds, datasetName, method, xComp, yComp]);

  const metrics = method === 'pca' ? (
    <>
      <span>PC{xComp + 1} 解释方差 {(model.explained[xComp] * 100).toFixed(1)}%</span>
      <span>PC{yComp + 1} 解释方差 {(model.explained[yComp] * 100).toFixed(1)}%</span>
    </>
  ) : method === 'tsne' ? (
    <>
      <span>t-SNE 第 {tsneIter} 步</span>
      <span style={{ opacity: 0.7 }}>看 {ds.names.length} 个团慢慢解开</span>
      {computing && <span style={{ color: 'hsl(var(--primary))' }}>解团中…</span>}
    </>
  ) : (
    <>
      <span>UMAP 非线性嵌入</span>
      {computing && <span style={{ color: 'hsl(var(--primary))' }}>计算中…</span>}
    </>
  );

  return (
    <LessonShell
      title="降维：把高维世界压扁着看"
      hook={'手写数字是 64 维。能不能压成 2 维，还让相同的数字自己聚成团？'}
      takeaway="PCA 是线性的糨糊；t-SNE/UMAP 非线性，牺牲全局换局部，让聚团一眼可见。降维是有损的压扁。"
      controls={<KnobPanel knobs={knobs} values={values} onChange={handleChange} />}
      chart={<ChartCanvas option={option} />}
      metrics={metrics}
      note={
        <p style={{ fontSize: 12, opacity: 0.65, marginTop: 12 }}>
          试试：数据集选「手写数字」、方法选「t-SNE」——看 10 个数字从一团糨糊慢慢解成 10 个清晰的团。
          再切回「PCA」对比：线性投影分不开。这就是非线性降维的威力。
        </p>
      }
    />
  );
}
