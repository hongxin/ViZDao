// src/viz/lessons/runner.ts — knob 值 → 重算 → 检查点判定。
import type { Lesson } from '../types';
import type { Point } from '../datasets/sinNoise';
import { normalize, ridgeFit, metrics, roughness } from '../analysis/ridge';

export { OVERFITTING_LESSON, LESSONS } from './data';

export type KnobValues = Record<string, number | boolean | string>;

export interface FitResult {
  w: number[];
  trainMSE: number;
  trueMSE: number;
  roughness: number;
}

/** 取每个 knob 的 default 组成初始值表。 */
export function initialKnobValues(lesson: Lesson): KnobValues {
  const out: KnobValues = {};
  for (const k of lesson.knobs) out[k.bindParam] = k.default;
  return out;
}

/** 用当前 knob 值在给定数据上拟合并算指标。 */
export function computeOverfitting(values: KnobValues, data: Point[]): FitResult {
  const degree = Number(values.degree ?? 3);
  const lambda = Number(values.lambda ?? 0);
  const xn = data.map((d) => normalize(d.x));
  const y = data.map((d) => d.y);
  const w = ridgeFit(xn, y, degree, lambda);
  const m = metrics(w, data);
  return { w, trainMSE: m.trainMSE, trueMSE: m.trueMSE, roughness: roughness(w) };
}

// 判定阈值（与 overfitting.html 判词同源）。
const TRAIN_LOW = 0.05;     // 训练 MSE 视为"极低"
const TRUE_HIGH = 0.15;     // 真值 MSE 视为"远离真值"
const ROUGH_DROP = 0.85;    // 救回后粗糙度需降到过拟合态的 85% 以下

/**
 * 检查点：先看见过拟合（训练低+真值高+曲线粗糙），再看见加 λ 救回（粗糙度显著下降）。
 * prev = 上一次（通常是过拟合态）的结果；cur = 当前结果。
 */
export function judgeOverfitCheckpoint(
  prev: FitResult | null,
  cur: FitResult,
): { overfitSeen: boolean; rescuedSeen: boolean; passed: boolean } {
  const overfitSeen = cur.trainMSE < TRAIN_LOW && cur.trueMSE > TRUE_HIGH;
  const rescuedSeen =
    prev !== null &&
    prev.trainMSE < TRAIN_LOW &&
    prev.trueMSE > TRUE_HIGH &&
    cur.roughness < prev.roughness * ROUGH_DROP &&
    cur.trueMSE < prev.trueMSE;
  return { overfitSeen, rescuedSeen, passed: rescuedSeen };
}
