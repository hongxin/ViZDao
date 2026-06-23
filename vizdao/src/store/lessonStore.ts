// src/store/lessonStore.ts — 当前 lesson 的 knob 值、数据、拟合结果、检查点、折叠态。
import { create } from 'zustand';
import type { Point } from '../viz/datasets/sinNoise';
import { genSinNoise } from '../viz/datasets/sinNoise';
import {
  OVERFITTING_LESSON, initialKnobValues, computeOverfitting, judgeOverfitCheckpoint,
  type KnobValues, type FitResult,
} from '../viz/lessons/runner';

const DATA_SEED = 20240623;

interface LessonState {
  lesson: typeof OVERFITTING_LESSON;
  knobValues: KnobValues;
  data: Point[];
  fit: FitResult | null;
  lastOverfit: FitResult | null;   // 最近一次"过拟合态"，供救回判定
  checkpointPassed: boolean;
  leftCollapsed: boolean;
  setKnob: (bindParam: string, value: number | boolean | string) => void;
  resample: () => void;
  toggleCollapse: () => void;
  resetForTest: (seed: number) => void;
}

function recompute(values: KnobValues, data: Point[], lastOverfit: FitResult | null, passed: boolean) {
  const fit = computeOverfitting(values, data);
  const j = judgeOverfitCheckpoint(lastOverfit, fit);
  const nextOverfit = j.overfitSeen ? fit : lastOverfit;
  return { fit, lastOverfit: nextOverfit, checkpointPassed: passed || j.passed };
}

function build(seed: number, leftCollapsed = false): LessonState {
  const values = initialKnobValues(OVERFITTING_LESSON);
  const noise = Number(values.noiseStd ?? 0.3);
  const data = genSinNoise(20, noise, seed);
  const r = recompute(values, data, null, false);
  return {
    lesson: OVERFITTING_LESSON,
    knobValues: values,
    data,
    leftCollapsed,
    ...r,
  } as LessonState;
}

export const useLessonStore = create<LessonState>((set, get) => ({
  ...build(DATA_SEED),
  setKnob: (bindParam, value) => {
    const s = get();
    if (bindParam === 'resample') { s.resample(); return; }
    const knobValues = { ...s.knobValues, [bindParam]: value };
    // 改噪声需重采样数据；其余只重算
    let data = s.data;
    // 数据集换新时清除旧的过拟合基准，防止跨数据集误判检查点
    const priorOverfit = bindParam === 'noiseStd'
      ? null
      : s.lastOverfit;
    if (bindParam === 'noiseStd') data = genSinNoise(20, Number(value), DATA_SEED);
    const r = recompute(knobValues, data, priorOverfit, s.checkpointPassed);
    set({ knobValues, data, ...r });
  },
  resample: () => {
    const s = get();
    const noise = Number(s.knobValues.noiseStd ?? 0.3);
    const data = genSinNoise(20, noise, (Date.now ? Date.now() : Math.floor(Math.random() * 1e9)) >>> 0);
    const r = recompute(s.knobValues, data, s.lastOverfit, s.checkpointPassed);
    set({ data, ...r });
  },
  toggleCollapse: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  resetForTest: (seed) => set(build(seed)),
}));
