import { describe, it, expect } from 'vitest';
import { specsToState, stateToSpecs, canon } from './serialize';
import type { ViewSpec } from '../../../store/workbenchStore';
import type { Expr } from '../../analysis/expr';

const ratio: Expr = { k: 'arith', op: '/', a: { k: 'field', name: 'casual' }, b: { k: 'field', name: 'cnt' } };
const yr2012: Expr = { k: 'cmp', op: '==', a: { k: 'field', name: 'yr' }, b: { k: 'num', v: 1 } };

describe('积木 ↔ ViewSpec 序列化往返', () => {
  it('简单视图往返不变', () => {
    const views: ViewSpec[] = [{ id: 'v1', chart: 'scatter', x: 'temp', y: 'cnt', color: 'workingday' }];
    expect(canon(stateToSpecs(specsToState(views)))).toBe(canon(views));
  });

  it('派生列 + 筛选 往返无损', () => {
    const views: ViewSpec[] = [{
      id: 'v9', chart: 'scatter', x: 'temp', y: '占比',
      derive: [{ name: '占比', expr: ratio }],
      filter: yr2012,
    }];
    const back = stateToSpecs(specsToState(views));
    expect(canon(back)).toBe(canon(views));
    expect(back[0].derive?.[0]).toEqual({ name: '占比', expr: ratio });
    expect(back[0].filter).toEqual(yr2012);
  });

  it('复合筛选（且）+ 多派生列 往返', () => {
    const compound: Expr = { k: 'logic', op: 'and', a: yr2012, b: { k: 'cmp', op: '>', a: { k: 'field', name: 'temp' }, b: { k: 'num', v: 20 } } };
    const views: ViewSpec[] = [{
      id: 'v3', chart: 'bar', by: 'weekday', y: '占比', agg: 'mean',
      derive: [{ name: '占比', expr: ratio }, { name: '温差', expr: { k: 'arith', op: '-', a: { k: 'field', name: 'atemp' }, b: { k: 'field', name: 'temp' } } }],
      filter: compound,
    }];
    const back = stateToSpecs(specsToState(views));
    expect(canon(back)).toBe(canon(views));
    expect(back[0].derive).toHaveLength(2);
  });

  it('分箱 + 函数 表达式往返', () => {
    const views: ViewSpec[] = [{
      id: 'v7', chart: 'bar', by: '温度档', y: 'cnt', agg: 'mean',
      derive: [{ name: '温度档', expr: { k: 'bin', a: { k: 'field', name: 'temp' }, width: 5 } }],
      filter: { k: 'func', fn: 'abs', a: { k: 'field', name: 'windspeed' } },
    }];
    const back = stateToSpecs(specsToState(views));
    expect(canon(back)).toBe(canon(views));
    expect(back[0].derive?.[0].expr).toEqual({ k: 'bin', a: { k: 'field', name: 'temp' }, width: 5 });
  });

  it('分组折线 + 排序取前N 往返', () => {
    const views: ViewSpec[] = [{
      id: 'v8', chart: 'line', x: '温度档', y: 'cnt', by: '温度档', agg: 'mean',
      derive: [{ name: '温度档', expr: { k: 'bin', a: { k: 'field', name: 'temp' }, width: 5 } }],
      sort: { by: '温度档', dir: 'asc', topN: 8 },
    }];
    const back = stateToSpecs(specsToState(views));
    expect(canon(back)).toBe(canon(views));
    expect(back[0].by).toBe('温度档');
    expect(back[0].sort).toEqual({ by: '温度档', dir: 'asc', topN: 8 });
  });

  it('降序取前N（max 聚合）往返', () => {
    const views: ViewSpec[] = [{ id: 'v9', chart: 'bar', by: 'weekday', y: 'cnt', agg: 'max', sort: { by: 'cnt', dir: 'desc' } }];
    const back = stateToSpecs(specsToState(views));
    expect(canon(back)).toBe(canon(views));
    expect(back[0].agg).toBe('max');
    expect(back[0].sort?.dir).toBe('desc');
  });

  it('保留视图 id（data）', () => {
    const views: ViewSpec[] = [{ id: 'keepme', chart: 'line', x: 'dteday', y: 'cnt' }];
    expect(stateToSpecs(specsToState(views))[0].id).toBe('keepme');
  });
});
