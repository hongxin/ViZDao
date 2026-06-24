// src/viz/workbench/blocks/serialize.ts — 积木 ↔ ViewSpec 的纯互译（不依赖 Blockly，可单测往返）。
import { BIKE_FIELDS } from '../../datasets/bikeSharing';
import { nextViewId, type ViewSpec, type ChartKind, type Agg } from '../../../store/workbenchStore';
import type { Expr } from '../../analysis/expr';

export const NONE = '·none';
const label = (k?: string) => (k ? BIKE_FIELDS[k]?.label ?? k : '');

/* eslint-disable @typescript-eslint/no-explicit-any */
export function exprToBlock(e: Expr): any {
  switch (e.k) {
    case 'field': return { type: 'expr_field', fields: { name: e.name } };
    case 'num': return { type: 'expr_num', fields: { num: e.v } };
    case 'arith': return { type: 'expr_arith', fields: { op: e.op }, inputs: { A: { block: exprToBlock(e.a) }, B: { block: exprToBlock(e.b) } } };
    case 'cmp': return { type: 'expr_cmp', fields: { op: e.op }, inputs: { A: { block: exprToBlock(e.a) }, B: { block: exprToBlock(e.b) } } };
    case 'logic': return { type: 'expr_logic', fields: { op: e.op }, inputs: { A: { block: exprToBlock(e.a) }, B: { block: exprToBlock(e.b) } } };
    case 'func': return { type: 'expr_func', fields: { fn: e.fn }, inputs: { A: { block: exprToBlock(e.a) } } };
    case 'bin': return { type: 'expr_bin', fields: { width: e.width }, inputs: { A: { block: exprToBlock(e.a) } } };
  }
}
export function blockToExpr(b: any): Expr | undefined {
  if (!b) return undefined;
  const f = b.fields ?? {}, inp = b.inputs ?? {};
  const A = (): Expr => blockToExpr(inp.A?.block) ?? { k: 'num', v: 0 };
  const B = (): Expr => blockToExpr(inp.B?.block) ?? { k: 'num', v: 0 };
  switch (b.type) {
    case 'expr_field': return { k: 'field', name: f.name };
    case 'expr_num': return { k: 'num', v: Number(f.num) || 0 };
    case 'expr_arith': return { k: 'arith', op: f.op, a: A(), b: B() };
    case 'expr_cmp': return { k: 'cmp', op: f.op, a: A(), b: B() };
    case 'expr_logic': return { k: 'logic', op: f.op, a: A(), b: B() };
    case 'expr_func': return { k: 'func', fn: f.fn, a: A() };
    case 'expr_bin': return { k: 'bin', a: A(), width: Number(f.width) || 0 };
  }
  return undefined;
}
function deriveChain(derive: { name: string; expr: Expr }[]): any {
  let head: any;
  for (let i = derive.length - 1; i >= 0; i--) {
    const block: any = { type: 'vz_derive', fields: { name: derive[i].name }, inputs: { EXPR: { block: exprToBlock(derive[i].expr) } } };
    if (head) block.next = { block: head };
    head = block;
  }
  return head;
}

/** ViewSpec[] → Blockly 序列化状态。 */
export function specsToState(views: ViewSpec[]): any {
  return {
    blocks: {
      languageVersion: 0,
      blocks: views.map((v, i) => {
        const inputs: any = {};
        if (v.filter) inputs.FILTER = { block: exprToBlock(v.filter) };
        if (v.derive?.length) inputs.DERIVE = { block: deriveChain(v.derive) };
        return {
          type: 'vz_view', x: 16, y: 16 + i * 220, data: v.id,
          fields: {
            chart: v.chart, x: v.x ?? 'temp', y: v.y ?? 'cnt', color: v.color ?? NONE, by: v.by ?? NONE, agg: v.agg ?? 'mean',
            sortBy: v.sort?.by ?? NONE, sortDir: v.sort?.dir ?? 'asc', topN: v.sort?.topN ?? 0,
          },
          ...(Object.keys(inputs).length ? { inputs } : {}),
        };
      }),
    },
  };
}

/** 序列化状态 → ViewSpec[]（含 derive/filter；标题按编码自动生成）。 */
export function stateToSpecs(saved: any): ViewSpec[] {
  const blocks: any[] = saved?.blocks?.blocks ?? [];
  return blocks.filter((b) => b.type === 'vz_view').map((b) => {
    const f = b.fields ?? {}, inp = b.inputs ?? {};
    const opt = (v: string) => (v && v !== NONE ? v : undefined);
    const chart = (f.chart ?? 'scatter') as ChartKind;
    const id = (b.data as string) || nextViewId();
    const derive: { name: string; expr: Expr }[] = [];
    let d = inp.DERIVE?.block;
    while (d && d.type === 'vz_derive') {
      const name = (d.fields?.name ?? '').trim();
      const expr = blockToExpr(d.inputs?.EXPR?.block);
      if (name && expr) derive.push({ name, expr });
      d = d.next?.block;
    }
    const filter = blockToExpr(inp.FILTER?.block);
    const sortByF = opt(f.sortBy);
    const sort = sortByF ? { by: sortByF, dir: (f.sortDir === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc', topN: Number(f.topN) > 0 ? Number(f.topN) : undefined } : undefined;
    const x = opt(f.x), y = opt(f.y), color = opt(f.color), by = opt(f.by);
    const dsuffix = derive.length ? ` ·新列${derive.length}` : '';
    const fsuffix = filter ? ' ·已筛选' : '';
    const ssuffix = sort ? `${sort.topN ? ` ·前${sort.topN}` : ' ·已排序'}` : '';
    const title = (chart === 'bar'
      ? `${f.agg ?? 'mean'}(${label(y)}) · 按${label(by)}`
      : `${label(x)} × ${label(y)}${color ? `（按${label(color)}）` : ''}`) + dsuffix + fsuffix + ssuffix;
    const base: ViewSpec = chart === 'bar'
      ? { id, chart, by, y, agg: (f.agg as Agg) ?? 'mean', title }
      : { id, chart, x, y, color, title };
    if (chart !== 'bar' && by) { base.by = by; base.agg = (f.agg as Agg) ?? 'mean'; } // 折线/散点也可分组成任意图
    if (derive.length) base.derive = derive;
    if (filter) base.filter = filter;
    if (sort) base.sort = sort;
    return base;
  });
}

/** 仅比较编码（忽略标题），用于双向同步去环。 */
export function canon(views: ViewSpec[]): string {
  return JSON.stringify(views.map((v) => ({ id: v.id, chart: v.chart, x: v.x, y: v.y, color: v.color, by: v.by, agg: v.agg, derive: v.derive, filter: v.filter, sort: v.sort })));
}
/* eslint-enable @typescript-eslint/no-explicit-any */
