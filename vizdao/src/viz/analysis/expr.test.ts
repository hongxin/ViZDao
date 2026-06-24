import { describe, it, expect } from 'vitest';
import { evalNum, evalBool, exprFields, type Expr } from './expr';

const row = { temp: 30, casual: 200, registered: 800, cnt: 1000, yr: 1, workingday: 1 };

describe('expr 求值器', () => {
  it('字段 / 数值', () => {
    expect(evalNum({ k: 'field', name: 'temp' }, row)).toBe(30);
    expect(evalNum({ k: 'num', v: 7 }, row)).toBe(7);
    expect(evalNum({ k: 'field', name: '不存在' }, row)).toBe(0);
  });

  it('算术：派生 临时占比 = casual/cnt', () => {
    const e: Expr = { k: 'arith', op: '/', a: { k: 'field', name: 'casual' }, b: { k: 'field', name: 'cnt' } };
    expect(evalNum(e, row)).toBeCloseTo(0.2);
  });

  it('除零保护', () => {
    expect(evalNum({ k: 'arith', op: '/', a: { k: 'num', v: 5 }, b: { k: 'num', v: 0 } }, row)).toBe(0);
  });

  it('比较 → 1/0 与 evalBool', () => {
    const e: Expr = { k: 'cmp', op: '>', a: { k: 'field', name: 'temp' }, b: { k: 'num', v: 25 } };
    expect(evalNum(e, row)).toBe(1);
    expect(evalBool(e, row)).toBe(true);
    expect(evalBool({ k: 'cmp', op: '>', a: { k: 'field', name: 'temp' }, b: { k: 'num', v: 40 } }, row)).toBe(false);
  });

  it('逻辑 且：yr==1 且 workingday==1', () => {
    const e: Expr = {
      k: 'logic', op: 'and',
      a: { k: 'cmp', op: '==', a: { k: 'field', name: 'yr' }, b: { k: 'num', v: 1 } },
      b: { k: 'cmp', op: '==', a: { k: 'field', name: 'workingday' }, b: { k: 'num', v: 1 } },
    };
    expect(evalBool(e, row)).toBe(true);
    expect(evalBool({ ...e, b: { k: 'cmp', op: '==', a: { k: 'field', name: 'workingday' }, b: { k: 'num', v: 0 } } }, row)).toBe(false);
  });

  it('无表达式：filter 全通过', () => {
    expect(evalBool(undefined, row)).toBe(true);
  });

  it('exprFields 收集引用字段', () => {
    const e: Expr = { k: 'arith', op: '/', a: { k: 'field', name: 'casual' }, b: { k: 'field', name: 'cnt' } };
    expect([...exprFields(e)].sort()).toEqual(['casual', 'cnt']);
  });
});
