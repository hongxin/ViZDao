// src/viz/datasets/types.ts — 可插拔数据集抽象。工作台三通道(GUI/AI/积木)+积木 Phase1/2 全部据此运行。
import type { Row } from '../analysis/expr';
import type { ViewSpec } from '../../store/workbenchStore';

export type FieldKind = 'num' | 'cat';

export interface Dataset {
  id: string;
  name: string;                 // 显示名（数据集切换器）
  rows: Row[];                  // 数值化的行（类别值用数字编码、日期字段用时间戳）
  fields: Record<string, { label: string; kind: FieldKind }>;
  catLabels: Record<string, Record<number, string>>; // 类别字段：编码 → 中文标签
  baseFields: string[];         // 增广用的字段名（派生在其上计算）
  dateField?: string;           // 时间轴字段（时间戳），如 'dteday'
  initialViews: ViewSpec[];
  mission: string;              // 任务栏的探究目标
}
