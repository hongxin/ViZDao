// src/viz/lessons/data.ts — 切片1只含 overfitting；schema 见 ../types。
import type { Lesson } from '../types';

export const OVERFITTING_LESSON: Lesson = {
  id: 'overfitting',
  act: 1,
  title: '拟合 → 过拟合 → 正则',
  hook: '给一堆带噪声的点拟合曲线。阶数越高，越能穿过每个点——但那是学规律，还是背答案？',
  chartType: 'line+scatter',
  datasetId: 'sin-noise',
  knobs: [
    { id: 'degree', label: '多项式阶数', kind: 'slider', bindParam: 'degree', default: 3, min: 1, max: 15, step: 1, scale: 'linear', hint: '拉高看曲线怎么开始疯狂摆动' },
    { id: 'lambda', label: '正则强度 λ', kind: 'slider', bindParam: 'lambda', default: 0, min: 0, max: 1, step: 0.0001, scale: 'log', hint: '从 0 拉大，看疯狂的曲线被驯服回平滑' },
    { id: 'noise', label: '噪声大小', kind: 'slider', bindParam: 'noiseStd', default: 0.3, min: 0, max: 1, step: 0.05, hint: '噪声越大，过拟合越容易发生' },
    { id: 'resample', label: '重新采样', kind: 'button', bindParam: 'resample', default: 'go', hint: '换一批点，看高阶模型是否还稳定' },
  ],
  ahaMoment: '阶数 12、λ=0：曲线穿过每个点却剧烈摆动；λ 一拉大，立刻平滑——过拟合被一眼看见、一键驯服。',
  takeaway: '过拟合 = 模型在背答案而非学规律。正则是给模型"少记一点"的纪律。',
  checkpoint: {
    id: 'cp-overfit',
    prompt: '把曲线调到明显过拟合（穿过每个点、剧烈摆动），再用 λ 把它救回平滑。',
    verify: '训练 MSE 极低但曲线粗糙度高 → 提高 λ 后粗糙度显著下降。',
  },
  aiHints: ['为什么高阶多项式会过拟合？', 'λ（正则）到底在惩罚什么？', '训练误差低为什么不一定是好模型？'],
  refSlides: ['讲一 p55-70'],
  estMinutes: 25,
};

export const LESSONS: Lesson[] = [OVERFITTING_LESSON];
