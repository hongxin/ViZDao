// src/viz/engine/tokens.ts — 引擎令牌的 JS 侧常量（主要给 JS 驱动的时序/ECharts 用）。
// 视觉令牌的真相在 index.css 的 --vz-* 变量；这里只暴露动效数值与强调色。
export const MOTION = {
  ease: 'cubic-bezier(0.22, 1, 0.36, 1)',
  quick: 200,
  reveal: 720,
} as const;

export const ACCENT = 'hsl(var(--vz-accent))';
export const INK = 'hsl(var(--foreground))';
export const INK_SOFT = 'hsl(var(--vz-ink-soft))';
export const STAGE_BG = 'hsl(var(--background))';
