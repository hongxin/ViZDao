// src/viz/datasets/taxBurden.ts — 合成「企业税负」数据（确定性生成，含辛普森悖论）。
// 暗线：信息技术行业【总体】实际税率最高，但在【每个规模档】里都最低——聚合被规模结构混杂了，可视化拨开。
// 每行 = 一家企业某年的申报：行业/规模/地区/年份 + 营业收入/应纳税所得额/减免额/实纳税额/实际税率(%)。
import type { Dataset } from './types';
import type { Row } from '../analysis/expr';
import type { ViewSpec } from '../../store/workbenchStore';

const TAX_FIELDS: Dataset['fields'] = {
  industry: { label: '行业', kind: 'cat' }, size: { label: '企业规模', kind: 'cat' },
  region: { label: '地区', kind: 'cat' }, year: { label: '年份', kind: 'cat' },
  revenue: { label: '营业收入(万元)', kind: 'num' }, taxable: { label: '应纳税所得额(万元)', kind: 'num' },
  deduction: { label: '减免额(万元)', kind: 'num' }, taxPaid: { label: '实纳税额(万元)', kind: 'num' },
  effRate: { label: '实际税率(%)', kind: 'num' },
};
const TAX_CAT_LABELS: Dataset['catLabels'] = {
  industry: { 0: '信息技术', 1: '制造业', 2: '批发零售' },
  size: { 0: '小微', 1: '中型', 2: '大型' },
  region: { 0: '东部', 1: '中部', 2: '西部' },
  year: { 0: '2021', 1: '2022', 2: '2023' },
};

// 每(行业,规模)的实际税率基准：每一档里 制造业>批发零售>信息技术。
const BASE_EFF = [
  [0.060, 0.100, 0.150], // 信息技术（最低）
  [0.085, 0.125, 0.175], // 制造业（最高）
  [0.070, 0.110, 0.160], // 批发零售
];
// 各行业的规模构成：信息技术偏大型、制造业偏小微 —— 这正是制造悖论的混杂因子。
const SIZE_DIST = [
  [0.12, 0.28, 0.60], // 信息技术 → 多大型（拉高总体税率）
  [0.62, 0.28, 0.10], // 制造业   → 多小微（拉低总体税率）
  [0.38, 0.36, 0.26], // 批发零售
];
const REV_BASE = [180, 2200, 32000]; // 小微/中型/大型 营业收入(万元)中枢

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function buildRows(): Row[] {
  const rnd = mulberry32(20260624);
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 1.633; // 近似标准正态
  const pick = (probs: number[]) => { let r = rnd(), c = 0; for (let i = 0; i < probs.length; i++) { c += probs[i]; if (r < c) return i; } return probs.length - 1; };
  const rows: Row[] = [];
  for (let ind = 0; ind < 3; ind++) {
    for (let n = 0; n < 230; n++) {
      const size = pick(SIZE_DIST[ind]);
      const region = pick([0.45, 0.32, 0.23]);
      const year = pick([0.33, 0.34, 0.33]);
      const revenue = Math.max(20, REV_BASE[size] * (1 + gauss() * 0.45));
      const margin = Math.min(0.22, Math.max(0.03, 0.09 + gauss() * 0.03));
      const taxable = revenue * margin;
      const eff = Math.min(0.4, Math.max(0.02, BASE_EFF[ind][size] + gauss() * 0.012));
      const taxPaid = taxable * eff;
      const deduction = Math.max(0, taxable * 0.25 - taxPaid); // 名义25% 与实际之差
      rows.push({
        industry: ind, size, region, year,
        revenue: Math.round(revenue), taxable: Math.round(taxable),
        deduction: Math.round(deduction), taxPaid: Math.round(taxPaid),
        effRate: Math.round(eff * 1000) / 10, // 实际税率(%)，1位小数
      });
    }
  }
  return rows;
}

export const TAX_ROWS: Row[] = buildRows();

const INITIAL_VIEWS: ViewSpec[] = [
  { id: 't1', chart: 'bar', by: 'industry', y: 'effRate', agg: 'mean', title: '平均实际税率 · 按行业（信息技术最高？）' },
  { id: 't2', chart: 'bar', by: 'size', y: 'effRate', agg: 'mean', title: '平均实际税率 · 按规模（越大越高）' },
  { id: 't3', chart: 'scatter', x: 'revenue', y: 'effRate', color: 'industry', title: '营业收入 × 实际税率（按行业着色）' },
  { id: 't4', chart: 'bar', by: 'size', y: 'taxPaid', agg: 'count', title: '企业数 · 按规模' },
];

export const taxDataset: Dataset = {
  id: 'tax',
  name: '企业税负',
  rows: TAX_ROWS,
  fields: TAX_FIELDS,
  catLabels: TAX_CAT_LABELS,
  baseFields: ['industry', 'size', 'region', 'year', 'revenue', 'taxable', 'deduction', 'taxPaid', 'effRate'],
  initialViews: INITIAL_VIEWS,
  mission: '为什么「信息技术」总体实际税率最高，却在每个规模档里都最低？用多视图揭开这个税负悖论。',
};
