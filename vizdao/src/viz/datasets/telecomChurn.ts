// src/viz/datasets/telecomChurn.ts — 合成「通讯用户流失」数据（确定性，含非单调暗线）。
// 暗线：整体流失率约一成、各套餐看着差不多，但流失率随【在网时长】是 U 型——新户高、稳定期低、老户又升。
// "在网越久越忠诚"是错觉：平均值把拐点抹平了。分箱 tenure → mean(churn) 一画即现。
import type { Dataset } from './types';
import type { Row } from '../analysis/expr';
import type { ViewSpec } from '../../store/workbenchStore';

const FIELDS: Dataset['fields'] = {
  plan: { label: '套餐', kind: 'cat' }, region: { label: '地区', kind: 'cat' }, ageGroup: { label: '年龄段', kind: 'cat' },
  tenure: { label: '在网月数', kind: 'num' }, monthlyFee: { label: '月费(元)', kind: 'num' },
  dataUsage: { label: '月流量(GB)', kind: 'num' }, callMin: { label: '月通话(分钟)', kind: 'num' },
  churn: { label: '流失率(%)', kind: 'num' }, // 单条 0 或 100；分组求均值 = 流失率%
};
const CAT_LABELS: Dataset['catLabels'] = {
  plan: { 0: '基础', 1: '畅享', 2: '尊享' }, region: { 0: '东部', 1: '中部', 2: '西部' },
  ageGroup: { 0: '青年', 1: '中年', 2: '老年' },
};
const PLAN_FEE = [39, 89, 139];

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// U 型流失概率：新户高、12~30 月低、>36 月回升（老套餐被新优惠吸走）。
const churnProb = (tenure: number) => 0.04 + 0.28 * Math.exp(-tenure / 5) + 0.12 * Math.max(0, tenure - 36) / 36;

function buildRows(): Row[] {
  const rnd = mulberry32(520013);
  const gauss = () => (rnd() + rnd() + rnd() + rnd() - 2) / 1.633;
  const pick = (probs: number[]) => { let r = rnd(), c = 0; for (let i = 0; i < probs.length; i++) { c += probs[i]; if (r < c) return i; } return probs.length - 1; };
  const rows: Row[] = [];
  for (let n = 0; n < 760; n++) {
    const tenure = 1 + Math.floor(rnd() * 60);
    const plan = pick([0.45, 0.38, 0.17]);
    const ageGroup = pick([0.4, 0.4, 0.2]);
    const region = pick([0.45, 0.32, 0.23]);
    const monthlyFee = Math.max(20, Math.round(PLAN_FEE[plan] * (1 + gauss() * 0.18)));
    const dataUsage = Math.max(0.5, Math.round((6 + plan * 14 + gauss() * 6) * 10) / 10);
    const callMin = Math.max(0, Math.round(120 + (2 - ageGroup) * 60 + gauss() * 80));
    const churn = rnd() < churnProb(tenure) ? 100 : 0;
    rows.push({ plan, region, ageGroup, tenure, monthlyFee, dataUsage, callMin, churn });
  }
  return rows;
}

export const TELECOM_ROWS: Row[] = buildRows();

const INITIAL_VIEWS: ViewSpec[] = [
  { id: 'm1', chart: 'bar', by: 'plan', y: 'churn', agg: 'mean', title: '流失率 · 按套餐（看着都差不多？）' },
  { id: 'm2', chart: 'bar', by: 'ageGroup', y: 'churn', agg: 'mean', title: '流失率 · 按年龄段' },
  { id: 'm3', chart: 'scatter', x: 'tenure', y: 'monthlyFee', color: 'plan', title: '在网月数 × 月费（按套餐着色）' },
  { id: 'm4', chart: 'scatter', x: 'dataUsage', y: 'callMin', color: 'ageGroup', title: '月流量 × 月通话（按年龄段）' },
];

export const telecomDataset: Dataset = {
  id: 'telecom', name: '通讯流失',
  rows: TELECOM_ROWS, fields: FIELDS, catLabels: CAT_LABELS,
  baseFields: ['plan', 'region', 'ageGroup', 'tenure', 'monthlyFee', 'dataUsage', 'callMin', 'churn'],
  initialViews: INITIAL_VIEWS,
  mission: '整体流失率约一成、各套餐看着差不多——但「在网越久越忠诚」是真的吗？用分箱揭开流失率随在网时长的拐点。',
};
