// src/viz/workbench/blocks/viewBlocks.ts — 自定义积木 vz_view ↔ ViewSpec 互译。
// 积木 = AI 行为的透明可编辑层：三通道（语言/积木/GUI）共用同一 ViewSpec IR。
import * as Blockly from 'blockly';
import { BIKE_FIELDS } from '../../datasets/bikeSharing';
import { nextViewId, type ViewSpec, type ChartKind, type Agg } from '../../../store/workbenchStore';

const FIELD_OPTS: [string, string][] = Object.entries(BIKE_FIELDS).map(([k, f]) => [f.label, k]);
const FIELD_OPTS_OPT: [string, string][] = [['（无）', '·none'], ...FIELD_OPTS];
const CHART_OPTS: [string, string][] = [['散点', 'scatter'], ['折线', 'line'], ['柱状', 'bar']];
const AGG_OPTS: [string, string][] = [['均值', 'mean'], ['求和', 'sum'], ['计数', 'count']];
const label = (k?: string) => (k ? BIKE_FIELDS[k]?.label ?? k : '');

/** 定义 vz_view 块（幂等）。 */
export function defineViewBlock(): void {
  if (Blockly.Blocks['vz_view']) return;
  Blockly.Blocks['vz_view'] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField('视图').appendField(new Blockly.FieldDropdown(CHART_OPTS), 'chart');
      this.appendDummyInput().appendField('x').appendField(new Blockly.FieldDropdown(FIELD_OPTS), 'x')
        .appendField('y').appendField(new Blockly.FieldDropdown(FIELD_OPTS), 'y');
      this.appendDummyInput().appendField('色').appendField(new Blockly.FieldDropdown(FIELD_OPTS_OPT), 'color')
        .appendField('组').appendField(new Blockly.FieldDropdown(FIELD_OPTS_OPT), 'by')
        .appendField('聚合').appendField(new Blockly.FieldDropdown(AGG_OPTS), 'agg');
      this.setColour('#ef7d22');
      this.setTooltip('一个联动视图（改字段即更新右侧图表）');
    },
  };
}

/** 工具箱：一个可拖出的 vz_view 块。 */
export const TOOLBOX = { kind: 'flyoutToolbox', contents: [{ kind: 'block', type: 'vz_view' }] };

const NONE = '·none';
/* eslint-disable @typescript-eslint/no-explicit-any */
/** ViewSpec[] → Blockly 序列化状态（竖排）。 */
export function specsToState(views: ViewSpec[]): any {
  return {
    blocks: {
      languageVersion: 0,
      blocks: views.map((v, i) => ({
        type: 'vz_view', x: 16, y: 16 + i * 96, data: v.id,
        fields: { chart: v.chart, x: v.x ?? 'temp', y: v.y ?? 'cnt', color: v.color ?? NONE, by: v.by ?? NONE, agg: v.agg ?? 'mean' },
      })),
    },
  };
}

/** Blockly 工作区 → ViewSpec[]（标题按编码自动生成）。 */
export function workspaceToSpecs(ws: Blockly.WorkspaceSvg): ViewSpec[] {
  const saved = Blockly.serialization.workspaces.save(ws) as any;
  const blocks: any[] = saved?.blocks?.blocks ?? [];
  return blocks.filter((b) => b.type === 'vz_view').map((b) => {
    const f = b.fields ?? {};
    const opt = (v: string) => (v && v !== NONE ? v : undefined);
    const chart = (f.chart ?? 'scatter') as ChartKind;
    const id = (b.data as string) || nextViewId();
    const x = opt(f.x), y = opt(f.y), color = opt(f.color), by = opt(f.by);
    const title = chart === 'bar'
      ? `${f.agg ?? 'mean'}(${label(y)}) · 按${label(by)}`
      : `${label(x)} × ${label(y)}${color ? `（按${label(color)}）` : ''}`;
    if (chart === 'bar') return { id, chart, by, y, agg: (f.agg as Agg) ?? 'mean', title };
    return { id, chart, x, y, color, title };
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** 仅比较编码（忽略标题），用于双向同步去环。 */
export function canon(views: ViewSpec[]): string {
  return JSON.stringify(views.map((v) => ({ id: v.id, chart: v.chart, x: v.x, y: v.y, color: v.color, by: v.by, agg: v.agg })));
}
