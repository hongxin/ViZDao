// src/viz/analysis/analysisTools.ts — AI 协同分析者的"工具带"（permission:safe，直改 workbenchStore）。
// 让 JetBot 的 Agent 按同一 ViewSpec IR 真去搭图、刷选、读数——魂的落地。
import type { Tool } from '../../types/tool';
import type { ToolRegistry } from '../../tools/ToolRegistry';
import { useWorkbenchStore, nextViewId, type ChartKind, type Agg } from '../../store/workbenchStore';

// 数据集无关：所有工具读 active dataset（共享单车 / 企业税负 …）。列名用 list_fields 查。
const ds = () => useWorkbenchStore.getState().dataset;
const rows = () => ds().rows;
const labelOf = (f: string) => ds().fields[f]?.label ?? f;
const numFields = () => Object.keys(ds().fields).filter((k) => ds().fields[k].kind === 'num');
const fieldEnum = { type: 'string' as const };

function addView(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'add_view',
        description: '在右侧多视图画布新增一个联动视图。x/y/color/by 必须用数据集列名（见系统提示的字段表）。返回新视图 id。',
        parameters: {
          type: 'object',
          properties: {
            chart: { type: 'string', enum: ['scatter', 'line', 'bar'], description: '图类型' },
            x: { ...fieldEnum, description: 'x 轴列（scatter/line）' },
            y: { ...fieldEnum, description: 'y 轴列' },
            color: { ...fieldEnum, description: '分类着色列（可选）' },
            by: { ...fieldEnum, description: '分组列（bar 必填）' },
            agg: { type: 'string', enum: ['mean', 'sum', 'count'], description: 'bar 的聚合方式' },
            title: { type: 'string', description: '视图标题' },
          },
          required: ['chart'],
        },
      },
    },
    permission: 'safe',
    async execute(p) {
      const id = nextViewId();
      useWorkbenchStore.getState().addView({
        id, chart: p.chart as ChartKind,
        x: p.x as string | undefined, y: p.y as string | undefined, color: p.color as string | undefined,
        by: p.by as string | undefined, agg: p.agg as Agg | undefined,
        title: (p.title as string) ?? `${p.chart}`,
      });
      return `已添加视图 ${id}（${p.chart}）。`;
    },
  };
}

function updateView(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'update_view',
        description: '修改某个已存在视图的编码（图类型/x/y/color/by/agg/title）。只传要改的字段。',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '视图 id' },
            chart: { type: 'string', enum: ['scatter', 'line', 'bar'] },
            x: fieldEnum, y: fieldEnum, color: fieldEnum, by: fieldEnum,
            agg: { type: 'string', enum: ['mean', 'sum', 'count'] }, title: { type: 'string' },
          },
          required: ['id'],
        },
      },
    },
    permission: 'safe',
    async execute(p) {
      const { id, ...patch } = p as Record<string, unknown>;
      useWorkbenchStore.getState().updateView(id as string, patch);
      return `已更新视图 ${id}。`;
    },
  };
}

function removeView(): Tool {
  return {
    definition: { type: 'function', function: { name: 'remove_view', description: '删除一个视图。', parameters: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } } },
    permission: 'safe',
    async execute(p) { useWorkbenchStore.getState().removeView(p.id as string); return `已删除视图 ${p.id}。`; },
  };
}

function listViews(): Tool {
  return {
    definition: { type: 'function', function: { name: 'list_views', description: '列出当前画布上的所有视图及其编码（用于了解现状）。', parameters: { type: 'object', properties: {}, required: [] } } },
    permission: 'safe',
    async execute() { return JSON.stringify(useWorkbenchStore.getState().views); },
  };
}

function selectWhere(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'select_where',
        description: '按条件框选记录（如 temp > 30）。被选中的天会在所有视图里高亮联动。',
        parameters: {
          type: 'object',
          properties: {
            field: { ...fieldEnum, description: '列' },
            cmp: { type: 'string', enum: ['>', '<', '>=', '<=', '=='], description: '比较符' },
            value: { type: 'number', description: '阈值' },
          },
          required: ['field', 'cmp', 'value'],
        },
      },
    },
    permission: 'safe',
    async execute(p) {
      const f = p.field as string, cmp = p.cmp as string, v = Number(p.value);
      const idx: number[] = [];
      rows().forEach((r, i) => {
        const x = r[f];
        if ((cmp === '>' && x > v) || (cmp === '<' && x < v) || (cmp === '>=' && x >= v) || (cmp === '<=' && x <= v) || (cmp === '==' && x === v)) idx.push(i);
      });
      useWorkbenchStore.getState().setSelection(idx);
      return `选中 ${idx.length} 条（${labelOf(f)} ${cmp} ${v}）。`;
    },
  };
}

function selectExtreme(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'select_extreme',
        description: '框选某列最高/最低的一部分（如最热的 10%）。被选中的天在所有视图高亮联动。',
        parameters: {
          type: 'object',
          properties: {
            field: { ...fieldEnum, description: '列' },
            end: { type: 'string', enum: ['top', 'bottom'], description: '最高 top / 最低 bottom' },
            fraction: { type: 'number', description: '比例 0~1，如 0.1=最极端的 10%' },
          },
          required: ['field', 'end', 'fraction'],
        },
      },
    },
    permission: 'safe',
    async execute(p) {
      const f = p.field as string, end = p.end as string, frac = Math.max(0.01, Math.min(1, Number(p.fraction)));
      const order = rows().map((r, i) => ({ i, x: r[f] })).sort((a, b) => a.x - b.x);
      const k = Math.max(1, Math.round(order.length * frac));
      const picked = (end === 'top' ? order.slice(-k) : order.slice(0, k)).map((o) => o.i);
      useWorkbenchStore.getState().setSelection(picked);
      return `选中 ${picked.length} 条（${labelOf(f)} ${end === 'top' ? '最高' : '最低'} ${Math.round(frac * 100)}%）。`;
    },
  };
}

function clearSelection(): Tool {
  return {
    definition: { type: 'function', function: { name: 'clear_selection', description: '清除当前选区。', parameters: { type: 'object', properties: {}, required: [] } } },
    permission: 'safe',
    async execute() { useWorkbenchStore.getState().setSelection(null); return '已清除选区。'; },
  };
}

function summarize(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'summarize',
        description: '统计当前选区（没选区则全体）：条数 + 各数值列均值。给定 by 则按该分类列分组对比（揭示分组间的相反规律，如辛普森悖论）。',
        parameters: { type: 'object', properties: { by: { ...fieldEnum, description: '分组列（可选）' } }, required: [] },
      },
    },
    permission: 'safe',
    async execute(p) {
      const sel = useWorkbenchStore.getState().selection;
      const rs = rows();
      const idxs = sel ?? rs.map((_, i) => i);
      const nums = numFields();
      const stat = (ii: number[]) => {
        const n = ii.length || 1;
        const o: Record<string, number> = { 条数: ii.length };
        for (const f of nums) o[labelOf(f)] = Math.round(ii.reduce((s, i) => s + (rs[i][f] ?? 0), 0) / n * 100) / 100;
        return o;
      };
      const scope = sel ? `选区(${idxs.length}条)` : `全体${rs.length}条`;
      if (p.by) {
        const by = p.by as string;
        const cats = [...new Set(idxs.map((i) => rs[i][by]))].sort((a, b) => a - b);
        const grouped = cats.map((c) => ({ [labelOf(by)]: ds().catLabels[by]?.[c] ?? c, ...stat(idxs.filter((i) => rs[i][by] === c)) }));
        return `${scope} 按「${labelOf(by)}」分组：\n${JSON.stringify(grouped)}`;
      }
      return `${scope}：${JSON.stringify(stat(idxs))}`;
    },
  };
}

function listFields(): Tool {
  return {
    definition: { type: 'function', function: { name: 'list_fields', description: '查看当前数据集的名称、探究任务、所有列(列名/标签/类型)与类别取值。开始分析前先调它，了解能用哪些列。', parameters: { type: 'object', properties: {}, required: [] } } },
    permission: 'safe',
    async execute() {
      const d = ds();
      return JSON.stringify({ 数据集: d.name, 任务: d.mission, 列: Object.entries(d.fields).map(([k, f]) => ({ 列名: k, 标签: f.label, 类型: f.kind })), 类别取值: d.catLabels });
    },
  };
}

export function registerAnalysisTools(registry: ToolRegistry): void {
  [listFields, addView, updateView, removeView, listViews, selectWhere, selectExtreme, clearSelection, summarize].forEach((f) => registry.register(f()));
}
