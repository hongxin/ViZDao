// src/viz/engine/progress.ts — 放映进度的纯逻辑（可单测）。
// 核心铁律：Predict 拍未承诺，则"门"不开——这是"学员是主角"的支点。
import type { Beat, Ledger } from './types';

export interface ConceptState {
  index: number;
  ledger: Ledger;
  committed: Record<number, boolean>; // 第 index 拍是否已承诺
}

export const initialConcept: ConceptState = { index: 0, ledger: {}, committed: {} };

/** 当前拍是否挡住推进（Predict 且未承诺）。 */
export function isBlocked(beat: Beat, state: ConceptState): boolean {
  return beat.kind === 'predict' && !state.committed[state.index];
}

/** 记录一次承诺（写入 Ledger，并解锁当前 Predict 拍）。 */
export function commit(state: ConceptState, commitId: string, value: string): ConceptState {
  return {
    ...state,
    ledger: { ...state.ledger, [commitId]: value },
    committed: { ...state.committed, [state.index]: true },
  };
}

/** 推进一拍（被挡则原地不动；到末拍则停在末拍）。 */
export function advance(state: ConceptState, beats: Beat[]): ConceptState {
  if (isBlocked(beats[state.index], state)) return state;
  return { ...state, index: Math.min(beats.length - 1, state.index + 1) };
}

/** 是否已在末拍。 */
export function atLast(state: ConceptState, beats: Beat[]): boolean {
  return state.index >= beats.length - 1;
}

/** 解析 say：函数则以 Ledger 回指。 */
export function resolveSay(say: string | ((l: Ledger) => string), ledger: Ledger): string {
  return typeof say === 'function' ? say(ledger) : say;
}
