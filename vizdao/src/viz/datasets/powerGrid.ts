// src/viz/datasets/powerGrid.ts — 合成「电网负荷」数据（确定性，含"同均值不同形状"暗线=安斯库姆搬进电网）。
// 暗线：城东(居民)与城西(工业)【日均负荷几乎相同】，但【日负荷曲线形状天差地别】——
// 城东傍晚双峰、城西全天平。只看均值以为两区一样，按小时画线才见真章。形状决定电网规划/调度。
import type { Dataset } from './types';
import type { Row } from '../analysis/expr';
import type { ViewSpec } from '../../store/workbenchStore';

const FIELDS: Dataset['fields'] = {
  region: { label: '区域', kind: 'cat' }, weekday: { label: '工作日', kind: 'cat' },
  hour: { label: '小时', kind: 'num' }, day: { label: '第几天', kind: 'cat' },
  load: { label: '负荷(MW)', kind: 'num' }, temp: { label: '气温(°C)', kind: 'num' },
};
const CAT_LABELS: Dataset['catLabels'] = {
  region: { 0: '城东·居民', 1: '城西·工业', 2: '城南·商业' },
  weekday: { 0: '周末', 1: '工作日' },
};

// 各区 24 小时负荷形状（相对值，代码内归一到均值 1）。城东双峰、城西平、城南午高峰。
const SHAPE = [
  [0.50, 0.45, 0.40, 0.40, 0.45, 0.60, 0.90, 1.30, 1.40, 1.10, 0.95, 0.95, 1.00, 0.95, 0.90, 0.95, 1.10, 1.40, 1.70, 1.75, 1.60, 1.30, 0.90, 0.65], // 城东·居民（双峰）
  [0.90, 0.90, 0.90, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.15, 1.15, 1.10, 1.05, 1.10, 1.15, 1.15, 1.10, 1.05, 1.00, 0.95, 0.95, 0.90, 0.90, 0.90], // 城西·工业（平）
  [0.40, 0.40, 0.40, 0.40, 0.45, 0.55, 0.80, 1.10, 1.40, 1.60, 1.70, 1.70, 1.65, 1.70, 1.70, 1.60, 1.45, 1.20, 0.95, 0.80, 0.70, 0.60, 0.50, 0.45], // 城南·商业（午峰）
];
const MEAN_MW = [500, 500, 600]; // 城东≈城西（同均值！）

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function buildRows(): Row[] {
  const rnd = mulberry32(330121);
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 1.633;
  // 归一化每区形状到均值 1
  const norm = SHAPE.map((s) => { const m = s.reduce((a, b) => a + b, 0) / 24; return s.map((v) => v / m); });
  const rows: Row[] = [];
  for (let day = 0; day < 14; day++) {
    const weekday = day % 7 < 5 ? 1 : 0;
    for (let r = 0; r < 3; r++) {
      for (let h = 0; h < 24; h++) {
        const temp = Math.round((6 + 9 * Math.sin(((h - 9) / 24) * 2 * Math.PI) + gauss() * 1.5) * 10) / 10;
        const wkAdj = weekday ? 1 : 0.9; // 周末整体略降（各区一致，保证城东≈城西均值相等）
        const load = Math.max(50, MEAN_MW[r] * norm[r][h] * wkAdj * (1 + gauss() * 0.06));
        rows.push({ region: r, weekday, hour: h, day, load: Math.round(load), temp });
      }
    }
  }
  return rows;
}

export const GRID_ROWS: Row[] = buildRows();

const INITIAL_VIEWS: ViewSpec[] = [
  { id: 'g1', chart: 'bar', by: 'region', y: 'load', agg: 'mean', title: '日均负荷 · 按区域（城东≈城西？）' },
  { id: 'g2', chart: 'scatter', x: 'hour', y: 'load', color: 'region', title: '小时 × 负荷（按区域着色）' },
  { id: 'g3', chart: 'bar', by: 'hour', y: 'load', agg: 'mean', title: '平均负荷 · 按小时（全网叠加后被抹平）' },
  { id: 'g4', chart: 'scatter', x: 'temp', y: 'load', color: 'region', title: '气温 × 负荷（按区域）' },
];

export const gridDataset: Dataset = {
  id: 'grid', name: '电网负荷',
  rows: GRID_ROWS, fields: FIELDS, catLabels: CAT_LABELS,
  baseFields: ['region', 'weekday', 'hour', 'day', 'load', 'temp'],
  initialViews: INITIAL_VIEWS,
  mission: '城东与城西日均负荷几乎相同——但它们的日负荷曲线一样吗？按小时画出每个区域的负荷形状，看均值掩盖了什么。',
};
