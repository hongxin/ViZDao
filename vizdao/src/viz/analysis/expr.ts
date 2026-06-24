// src/viz/analysis/expr.ts — 积木表达式的 AST + 纯 TS 求值器（无 eval）。
// 让高级用户派生新列、写复合筛选条件——挖掘数据内在规律的计算内核。

export type Expr =
  | { k: 'field'; name: string }
  | { k: 'num'; v: number }
  | { k: 'arith'; op: '+' | '-' | '*' | '/'; a: Expr; b: Expr }
  | { k: 'cmp'; op: '>' | '<' | '>=' | '<=' | '==' | '!='; a: Expr; b: Expr }
  | { k: 'logic'; op: 'and' | 'or'; a: Expr; b: Expr };

export type Row = Record<string, number>;

/** 求值为数（cmp/logic 返回 1/0）。未知字段或除零 → 0/NaN 安全处理。 */
export function evalNum(e: Expr | undefined, row: Row): number {
  if (!e) return 0;
  switch (e.k) {
    case 'field': { const v = row[e.name]; return typeof v === 'number' && isFinite(v) ? v : 0; }
    case 'num': return e.v;
    case 'arith': {
      const a = evalNum(e.a, row), b = evalNum(e.b, row);
      if (e.op === '+') return a + b;
      if (e.op === '-') return a - b;
      if (e.op === '*') return a * b;
      return b === 0 ? 0 : a / b; // 除零保护
    }
    case 'cmp': {
      const a = evalNum(e.a, row), b = evalNum(e.b, row);
      switch (e.op) {
        case '>': return a > b ? 1 : 0;
        case '<': return a < b ? 1 : 0;
        case '>=': return a >= b ? 1 : 0;
        case '<=': return a <= b ? 1 : 0;
        case '==': return a === b ? 1 : 0;
        case '!=': return a !== b ? 1 : 0;
      }
      return 0;
    }
    case 'logic': {
      const a = evalBool(e.a, row), b = evalBool(e.b, row);
      return (e.op === 'and' ? a && b : a || b) ? 1 : 0;
    }
  }
}

export function evalBool(e: Expr | undefined, row: Row): boolean {
  if (!e) return true; // 无筛选 = 全通过
  return evalNum(e, row) !== 0;
}

/** 表达式里引用到的字段名（用于校验/提示）。 */
export function exprFields(e: Expr | undefined, out: Set<string> = new Set()): Set<string> {
  if (!e) return out;
  if (e.k === 'field') out.add(e.name);
  else if (e.k !== 'num') { exprFields(e.a, out); exprFields(e.b, out); }
  return out;
}

/** 人类可读字符串（用于标题/调试）。 */
export function exprToText(e: Expr | undefined, labelOf: (f: string) => string = (f) => f): string {
  if (!e) return '';
  switch (e.k) {
    case 'field': return labelOf(e.name);
    case 'num': return String(e.v);
    case 'arith': return `${exprToText(e.a, labelOf)} ${e.op} ${exprToText(e.b, labelOf)}`;
    case 'cmp': return `${exprToText(e.a, labelOf)} ${e.op} ${exprToText(e.b, labelOf)}`;
    case 'logic': return `${exprToText(e.a, labelOf)} ${e.op === 'and' ? '且' : '或'} ${exprToText(e.b, labelOf)}`;
  }
}
