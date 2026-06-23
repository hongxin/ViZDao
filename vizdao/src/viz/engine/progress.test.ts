import { describe, it, expect } from 'vitest';
import type { Beat } from './types';
import { initialConcept, isBlocked, commit, advance, atLast, resolveSay } from './progress';

const BEATS: Beat[] = [
  { kind: 'frame', say: '设' },
  { kind: 'predict', say: '赌', commit: { kind: 'choice', id: 'p', options: [{ value: 'same', label: '会一样' }, { value: 'diff', label: '会不同' }] } },
  { kind: 'reveal', say: (l) => `你刚赌了「${l.p}」`, enter: [{ op: 'morph' }] },
  { kind: 'reflect', say: '悟' },
];

describe('engine/progress', () => {
  it('Predict 拍未承诺 → 门不开', () => {
    let s = initialConcept;
    s = advance(s, BEATS); // 0→1 (frame→predict)
    expect(s.index).toBe(1);
    expect(isBlocked(BEATS[1], s)).toBe(true);
    s = advance(s, BEATS); // 被挡
    expect(s.index).toBe(1);
  });

  it('承诺后写入 Ledger 并解锁推进', () => {
    let s = advance(initialConcept, BEATS); // →1
    s = commit(s, 'p', 'same');
    expect(s.ledger.p).toBe('same');
    expect(isBlocked(BEATS[1], s)).toBe(false);
    s = advance(s, BEATS); // →2
    expect(s.index).toBe(2);
  });

  it('Reveal 的 say 回指 Ledger', () => {
    let s = commit(advance(initialConcept, BEATS), 'p', 'same');
    s = advance(s, BEATS); // →2 reveal
    const beat = BEATS[2];
    expect(resolveSay((beat as { say: (l: Record<string,string>) => string }).say, s.ledger)).toBe('你刚赌了「same」');
  });

  it('推进在末拍夹住，atLast 正确', () => {
    let s = commit(advance(initialConcept, BEATS), 'p', 'diff');
    for (let i = 0; i < 10; i++) s = advance(s, BEATS);
    expect(s.index).toBe(BEATS.length - 1);
    expect(atLast(s, BEATS)).toBe(true);
  });
});
