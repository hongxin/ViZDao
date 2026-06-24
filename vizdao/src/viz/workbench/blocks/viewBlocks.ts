// src/viz/workbench/blocks/viewBlocks.ts — 积木 = 可视化数据分析（Phase 1：派生列 + 表达式筛选）。
// 块：vz_view(视图,带筛选槽+新列槽) · vz_derive(新列=表达式) · expr_field/num/arith/cmp/logic(表达式)。
// 与 ViewSpec(含 derive/filter:Expr) 嵌套互译。三通道共用同一 IR。
import * as Blockly from 'blockly';
import { BIKE_FIELDS } from '../../datasets/bikeSharing';
import type { ViewSpec } from '../../../store/workbenchStore';
import { stateToSpecs, NONE } from './serialize';

export { specsToState, stateToSpecs, canon } from './serialize';

const FIELD_OPTS: [string, string][] = Object.entries(BIKE_FIELDS).map(([k, f]) => [f.label, k]);
const CHART_OPTS: [string, string][] = [['散点', 'scatter'], ['折线', 'line'], ['柱状', 'bar']];
const AGG_OPTS: [string, string][] = [['均值', 'mean'], ['求和', 'sum'], ['计数', 'count']];

/* eslint-disable @typescript-eslint/no-explicit-any */
function deriveNamesOf(block: any): string[] {
  const out: string[] = [];
  let d = block?.getInputTargetBlock?.('DERIVE');
  while (d) { const n = d.getFieldValue?.('name'); if (n) out.push(n); d = d.getNextBlock?.(); }
  return out;
}
function fieldOptsGen(withNone: boolean) {
  return function (this: any): [string, string][] {
    const blk = this?.getSourceBlock?.();
    const names = blk ? deriveNamesOf(blk) : [];
    const opts: [string, string][] = [...FIELD_OPTS, ...names.map((n) => [n, n] as [string, string])];
    // 保留当前值：派生名作 x/y 时，加载顺序可能早于 DERIVE 子块——确保它始终是合法选项，不被 Blockly 丢弃。
    const cur = this?.getValue?.();
    if (cur && cur !== NONE && !opts.some((o) => o[1] === cur)) opts.push([cur, cur]);
    return withNone ? [['（无）', NONE], ...opts] : (opts.length ? opts : [['—', NONE]]);
  };
}

/** 定义所有块（幂等）。 */
export function defineViewBlock(): void {
  if (Blockly.Blocks['vz_view']) return;
  const D = Blockly.Blocks as any;

  D['expr_field'] = { init(this: any) { this.appendDummyInput().appendField(new Blockly.FieldDropdown(FIELD_OPTS), 'name'); this.setOutput(true, 'Number'); this.setColour('#2e7ebb'); this.setTooltip('数据列'); } };
  D['expr_num'] = { init(this: any) { this.appendDummyInput().appendField(new Blockly.FieldNumber(0), 'num'); this.setOutput(true, 'Number'); this.setColour('#2e7ebb'); } };
  D['expr_arith'] = { init(this: any) {
    this.appendValueInput('A').setCheck('Number');
    this.appendDummyInput().appendField(new Blockly.FieldDropdown([['+', '+'], ['−', '-'], ['×', '*'], ['÷', '/']]), 'op');
    this.appendValueInput('B').setCheck('Number');
    this.setInputsInline(true); this.setOutput(true, 'Number'); this.setColour('#2e7ebb'); this.setTooltip('算术：派生新指标');
  } };
  D['expr_cmp'] = { init(this: any) {
    this.appendValueInput('A').setCheck('Number');
    this.appendDummyInput().appendField(new Blockly.FieldDropdown([['>', '>'], ['<', '<'], ['≥', '>='], ['≤', '<='], ['=', '=='], ['≠', '!=']]), 'op');
    this.appendValueInput('B').setCheck('Number');
    this.setInputsInline(true); this.setOutput(true, 'Boolean'); this.setColour('#3b9c5a'); this.setTooltip('比较 → 条件');
  } };
  D['expr_logic'] = { init(this: any) {
    this.appendValueInput('A').setCheck('Boolean');
    this.appendDummyInput().appendField(new Blockly.FieldDropdown([['且', 'and'], ['或', 'or']]), 'op');
    this.appendValueInput('B').setCheck('Boolean');
    this.setInputsInline(true); this.setOutput(true, 'Boolean'); this.setColour('#3b9c5a');
  } };
  D['expr_func'] = { init(this: any) {
    this.appendDummyInput().appendField(new Blockly.FieldDropdown([['绝对值', 'abs'], ['对数', 'log'], ['平方根', 'sqrt'], ['四舍五入', 'round']]), 'fn');
    this.appendValueInput('A').setCheck('Number');
    this.setInputsInline(true); this.setOutput(true, 'Number'); this.setColour('#2e7ebb'); this.setTooltip('一元函数');
  } };
  D['expr_bin'] = { init(this: any) {
    this.appendValueInput('A').setCheck('Number').appendField('分箱');
    this.appendDummyInput().appendField('宽').appendField(new Blockly.FieldNumber(5, 0.0001), 'width');
    this.setInputsInline(true); this.setOutput(true, 'Number'); this.setColour('#2e7ebb'); this.setTooltip('把连续量切成等宽档（如气温每 5°C 一档）');
  } };
  D['vz_derive'] = { init(this: any) {
    this.appendValueInput('EXPR').setCheck('Number').appendField('新列').appendField(new Blockly.FieldTextInput('占比'), 'name').appendField('=');
    this.setPreviousStatement(true, 'derive'); this.setNextStatement(true, 'derive'); this.setColour('#a855f7'); this.setTooltip('派生一个新列：name = 表达式');
  } };
  D['vz_view'] = { init(this: any) {
    this.appendDummyInput().appendField('视图').appendField(new Blockly.FieldDropdown(CHART_OPTS), 'chart');
    this.appendDummyInput().appendField('x').appendField(new Blockly.FieldDropdown(fieldOptsGen(false)), 'x')
      .appendField('y').appendField(new Blockly.FieldDropdown(fieldOptsGen(false)), 'y');
    this.appendDummyInput().appendField('色').appendField(new Blockly.FieldDropdown(fieldOptsGen(true)), 'color')
      .appendField('组').appendField(new Blockly.FieldDropdown(fieldOptsGen(true)), 'by')
      .appendField('聚合').appendField(new Blockly.FieldDropdown(AGG_OPTS), 'agg');
    this.appendValueInput('FILTER').setCheck('Boolean').appendField('筛选');
    this.appendStatementInput('DERIVE').setCheck('derive').appendField('新列');
    this.setColour('#ef7d22'); this.setTooltip('一个联动视图（可加筛选与派生列）');
  } };
}

export const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    { kind: 'category', name: '视图', colour: '#ef7d22', contents: [{ kind: 'block', type: 'vz_view' }] },
    { kind: 'category', name: '新列', colour: '#a855f7', contents: [{ kind: 'block', type: 'vz_derive' }] },
    { kind: 'category', name: '表达式', colour: '#2e7ebb', contents: [
      { kind: 'block', type: 'expr_field' }, { kind: 'block', type: 'expr_num' },
      { kind: 'block', type: 'expr_arith' }, { kind: 'block', type: 'expr_cmp' }, { kind: 'block', type: 'expr_logic' },
    ] },
  ],
};

/** Blockly 工作区 → ViewSpec[]。 */
export function workspaceToSpecs(ws: Blockly.WorkspaceSvg): ViewSpec[] {
  return stateToSpecs(Blockly.serialization.workspaces.save(ws));
}
/* eslint-enable @typescript-eslint/no-explicit-any */
