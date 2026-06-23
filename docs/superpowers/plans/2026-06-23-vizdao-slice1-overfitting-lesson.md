# ViZDao 切片 1 实施计划 · 过拟合 Lesson「让模型现形」

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 ViZDao 内跑通第一个真 lesson——过拟合「讲→做→悟」：拖 knob（阶数/λ/噪声）→ ECharts 即时重绘 → 闭合检查点判定 → AI 助教点评，全程零安装、浏览器闭环。

**Architecture:** 复用 JetBot 基础设施（IndexedDB/zustand/agent loop/i18n）。新增 `src/viz/`：纯 TS 的 Ridge 建模（照搬 `hermes-work/code/prototypes/overfitting.html` 已验证算法）、确定性数据生成、lesson 运行时与 knob 面板、ECharts 封装；主视图 `App.tsx` 改造为「一套布局两态」（左讲做悟+knob / 右画布 + 折叠键）；LLM 精简为单一 DeepSeek v4(flash/pro)；助教加受限 viz 工具。

**Tech Stack:** React 19 · Vite 8 · TypeScript 5.9（strict, ES2023, 无路径别名）· Tailwind 4 · Zustand 5 · idb 8 · ECharts 6（新增）· vitest（新增，项目当前无测试框架）。

## Global Constraints

- TypeScript strict 模式；目标 ES2023；**无路径别名**（用相对 import，不要 `@/`）。
- 测试框架 = **vitest**（需在 Task 1 引入；jsdom 环境用于组件冒烟测试）。
- 建模算法切片 1 **零第三方数值库**（纯 TS），照搬已验证逻辑；x 必须归一化到 `[-1,1]` 防范德蒙德矩阵病态。
- LLM 只支持 **DeepSeek v4**，模型 id 在 `deepseek-chat`(flash) / `deepseek-reasoner`(pro) 间切换；密钥客户端存储（localStorage key 沿用 `jetbot-config`，不破坏向后兼容）。
- ECharts 按需引入（`echarts/core` + 具体图表/组件），避免全量包。
- 提交信息结尾附：`Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。
- 复用现有 `Tool` 工厂模式（`src/tools/builtins/*.ts` 的 `create*(): Tool` + 在 `registerBuiltins` 注册）。
- 复用现有 IndexedDB API（`src/lib/db.ts`：`initDB/put/get/getAll/del`，DB 名 `vizdao`）。

## 文件结构（本计划新增/修改）

```
新增  src/viz/analysis/ridge.ts            纯 TS：normalize/solve/ridgeFit/predict/metrics/roughness
新增  src/viz/analysis/ridge.test.ts
新增  src/viz/datasets/sinNoise.ts         确定性 sin+noise 生成（mulberry32 + Box-Muller）
新增  src/viz/datasets/sinNoise.test.ts
修改  src/viz/types.ts                      merge Hermes 的 Knob/Checkpoint/Lesson
新增  src/viz/lessons/data.ts               LESSONS（切片1只含 overfitting）
新增  src/viz/lessons/runner.ts             knob 状态 + 检查点判定
新增  src/viz/lessons/runner.test.ts
新增  src/viz/charts/registry.ts            chartType → ECharts option（line+scatter）
新增  src/viz/charts/registry.test.ts
新增  src/viz/charts/ChartCanvas.tsx        ECharts 6 封装组件
新增  src/viz/lessons/LessonView.tsx        渲染 讲/做/悟 + 自动 knob 面板
新增  src/viz/lessons/LessonView.test.tsx
修改  src/App.tsx                            一套布局两态（左/右 + 折叠）
新增  src/store/lessonStore.ts              当前 lesson / knob 值 / 折叠态（zustand）
新增  src/store/lessonStore.test.ts
修改  src/store/configStore.ts              精简为单一 DeepSeek + flash/pro
修改  src/components/WelcomeScreen.tsx       简化密钥 UI + 去 JetBot 字串
修改  src/components/SettingsDialog.tsx      flash/pro 切换
修改  src/lib/i18n.ts                        去 JetBot 字串 + 新增 lesson/viz 文案
新增  src/viz/tutor/vizTools.ts             read_viz_state / grade_open 工具
修改  src/tools/builtins/index.ts           注册 viz 工具
重命名 src/agent/jetbot.md → src/agent/vizdao.md  助教人格
修改  src/agent/SystemPromptBuilder.ts        soul 文件路径 + 去 JetBot
修改  vite.config.ts / package.json          echarts + vitest 依赖与脚本
```

---

# 阶段 A · 纯逻辑核心（最高确定性，先建地基）

## Task 1: 引入 vitest + 合并 Lesson schema

**Files:**
- Modify: `package.json`（devDeps + scripts）
- Create: `vitest.config.ts`
- Modify: `src/viz/types.ts`（合并 Hermes 的 `Knob`/`Checkpoint`/`Lesson`）
- Create: `src/viz/types.test.ts`

**Interfaces:**
- Produces: `Knob`, `Checkpoint`, `Lesson`（见 Step 3，后续 Task 全部依赖）。

- [ ] **Step 1: 安装 vitest 依赖**

Run:
```bash
cd /Users/hongxin/Workspace/claude-ai-playground/ViZDao/vizdao
npm i -D vitest@^3 jsdom@^25 @testing-library/react@^16 @testing-library/jest-dom@^6
```
Expected: 安装成功，`package.json` devDependencies 出现这些包。

- [ ] **Step 2: 加测试脚本与 vitest 配置**

在 `package.json` 的 `scripts` 增加：
```json
"test": "vitest run",
"test:watch": "vitest"
```

创建 `vitest.config.ts`：
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

创建 `src/test-setup.ts`：
```ts
import '@testing-library/jest-dom';
```

- [ ] **Step 3: 合并 Lesson schema 到 types.ts（先写测试）**

把现有 `src/viz/types.ts` 中的占位 `Lesson` 替换为下面结构，**保留 `VizExperiment` / `Dataset` 不动**（正交）。逐字采用 `hermes-work/code/lessons.ts` 的类型：

```ts
// src/viz/types.ts — 在文件中替换占位 Lesson，并新增 Knob/Checkpoint

/** 旋钮：行的入口。把"看见模型"变成"亲手让模型动"。 */
export interface Knob {
  id: string;
  label: string;
  kind: 'slider' | 'toggle' | 'select' | 'button';
  /** 绑定到模型参数名，驱动重算。 */
  bindParam: string;
  default: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  /** slider 标度；λ 这类跨数量级参数必须 'log'。 */
  scale?: 'linear' | 'log';
  options?: { value: string; label: string }[];
  unit?: string;
  hint?: string;
}

/** 闯关：要求学员把模型调到某个可判定的状态。 */
export interface Checkpoint {
  id: string;
  prompt: string;
  verify: string;
}

/** 一个教学单元 = 讲(hook) + 做(knobs) + 悟(ahaMoment/takeaway)。 */
export interface Lesson {
  id: string;
  act: 0 | 1 | 2 | 3;
  title: string;
  hook: string;
  chartType: string;
  datasetId: string;
  knobs: Knob[];
  ahaMoment: string;
  takeaway: string;
  checkpoint?: Checkpoint;
  aiHints: string[];
  refSlides: string[];
  estMinutes: number;
}
```

创建 `src/viz/types.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import type { Knob, Lesson } from './types';

describe('viz types', () => {
  it('Knob 可构造一个 slider', () => {
    const k: Knob = { id: 'degree', label: '阶数', kind: 'slider', bindParam: 'degree', default: 3, min: 1, max: 15, step: 1, scale: 'linear' };
    expect(k.bindParam).toBe('degree');
  });
  it('Lesson 必含 hook/knobs/takeaway 三段要素', () => {
    const l: Lesson = { id: 'x', act: 1, title: 't', hook: 'h', chartType: 'line+scatter', datasetId: 'sin-noise', knobs: [], ahaMoment: 'a', takeaway: 'tk', aiHints: [], refSlides: [], estMinutes: 25 };
    expect(l.hook && l.takeaway).toBeTruthy();
  });
});
```

- [ ] **Step 4: 运行测试，确认通过 + 类型编译**

Run: `npm test -- src/viz/types.test.ts`
Expected: PASS（2 passed）。
Run: `npx tsc -b`
Expected: 无类型错误（注意现有占位模块 import 了旧 `Lesson`，若编译报错，对应占位文件的 import 不受影响——`Lesson` 字段是超集，`{id,title}` 仍合法；`steps?` 字段已移除，如有引用需删除）。

- [ ] **Step 5: 提交**

```bash
git add vizdao/package.json vizdao/package-lock.json vizdao/vitest.config.ts vizdao/src/test-setup.ts vizdao/src/viz/types.ts vizdao/src/viz/types.test.ts
git commit -m "test: 引入 vitest 并合并 Hermes Lesson/Knob/Checkpoint schema

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Ridge 多项式回归（纯 TS，照搬已验证算法）

**Files:**
- Create: `src/viz/analysis/ridge.ts`
- Test: `src/viz/analysis/ridge.test.ts`

**Interfaces:**
- Produces:
  - `XMIN: number`, `XMAX: number`
  - `normalize(x: number): number` — x∈[XMIN,XMAX] → [-1,1]
  - `solve(A: number[][], b: number[]): number[]`
  - `ridgeFit(xn: number[], y: number[], degree: number, lambda: number): number[]`
  - `predict(w: number[], xn: number): number`
  - `metrics(w: number[], data: {x:number;y:number}[]): { trainMSE: number; trueMSE: number }`
  - `roughness(w: number[]): number` — 拟合曲线在归一化域上的弧长（粗糙度代理）

- [ ] **Step 1: 写失败测试（solve 的已知小系统 + Ridge 的过拟合/正则关系）**

创建 `src/viz/analysis/ridge.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { normalize, solve, ridgeFit, predict, metrics, roughness, XMIN, XMAX } from './ridge';
import { genSinNoise } from '../datasets/sinNoise';

describe('solve（高斯消元）', () => {
  it('解 2x2 已知系统', () => {
    // [2 1; 1 3] w = [3; 5] → w = [4/5, 7/5]
    const w = solve([[2, 1], [1, 3]], [3, 5]);
    expect(w[0]).toBeCloseTo(0.8, 6);
    expect(w[1]).toBeCloseTo(1.4, 6);
  });
});

describe('normalize', () => {
  it('端点映射到 [-1,1]', () => {
    expect(normalize(XMIN)).toBeCloseTo(-1, 9);
    expect(normalize(XMAX)).toBeCloseTo(1, 9);
  });
});

describe('ridgeFit 数值行为（对齐 overfitting.html 已验证基线）', () => {
  // 固定种子，确定性数据，断言"关系"而非随机run的绝对值
  const data = genSinNoise(20, 0.3, 12345);
  const xn = data.map((d) => normalize(d.x));
  const y = data.map((d) => d.y);

  it('过拟合：高阶 λ=0 → 训练MSE 远低于 真值MSE', () => {
    const w = ridgeFit(xn, y, 12, 0);
    const m = metrics(w, data);
    expect(m.trainMSE).toBeLessThan(m.trueMSE);
    expect(m.trainMSE).toBeLessThan(0.1);
    expect(m.trueMSE).toBeGreaterThan(m.trainMSE * 2);
  });

  it('正则救回：同阶加 λ → 真值MSE 显著下降、曲线更平滑', () => {
    const wOver = ridgeFit(xn, y, 12, 0);
    const wReg = ridgeFit(xn, y, 12, 0.1);
    const mOver = metrics(wOver, data);
    const mReg = metrics(wReg, data);
    expect(mReg.trueMSE).toBeLessThan(mOver.trueMSE);
    expect(roughness(wReg)).toBeLessThan(roughness(wOver));
  });

  it('低阶欠拟合：直线 λ=0 → 训练与真值MSE 都不算低且接近', () => {
    const w = ridgeFit(xn, y, 1, 0);
    const m = metrics(w, data);
    expect(m.trainMSE).toBeGreaterThan(0.05);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- src/viz/analysis/ridge.test.ts`
Expected: FAIL（`ridge.ts` 不存在 / 函数未定义）。

- [ ] **Step 3: 实现 ridge.ts（移植自 overfitting.html）**

创建 `src/viz/analysis/ridge.ts`：
```ts
// src/viz/analysis/ridge.ts
// 移植自 hermes-work/code/prototypes/overfitting.html（已实跑验证）。
// 算法参照：_vizmodeling-reference/code/python/polynomial_fit.py (sklearn Ridge)。
// 关键：x 归一化到 [-1,1] 再做多项式特征，避免高阶范德蒙德矩阵病态。

export const XMIN = 0;
export const XMAX = 2 * Math.PI;

/** 归一化 x∈[XMIN,XMAX] → [-1,1]。 */
export function normalize(x: number): number {
  return ((x - XMIN) / (XMAX - XMIN)) * 2 - 1;
}

/** 高斯消元解 A w = b（partial pivoting）。 */
export function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const piv = M[c][c] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / piv;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / (M[i][i] || 1e-12));
}

/** Ridge 多项式拟合：xn 为归一化坐标。A=XᵀX+λI（不正则截距列），b=Xᵀy。 */
export function ridgeFit(xn: number[], y: number[], degree: number, lambda: number): number[] {
  const n = xn.length;
  const p = degree + 1;
  const X = xn.map((x) => {
    const row: number[] = [];
    let v = 1;
    for (let j = 0; j < p; j++) { row.push(v); v *= x; }
    return row;
  });
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const b = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      b[a] += X[i][a] * y[i];
      for (let c = 0; c < p; c++) A[a][c] += X[i][a] * X[i][c];
    }
  }
  for (let j = 1; j < p; j++) A[j][j] += lambda; // 截距不正则
  return solve(A, b);
}

/** 用系数 w 在归一化坐标 xn 上预测。 */
export function predict(w: number[], xn: number): number {
  let v = 1;
  let s = 0;
  for (let j = 0; j < w.length; j++) { s += w[j] * v; v *= xn; }
  return s;
}

/** 训练 MSE（对样本点）+ 真值 MSE（对 sin(x)）。 */
export function metrics(w: number[], data: { x: number; y: number }[]): { trainMSE: number; trueMSE: number } {
  const trainMSE = data.reduce((s, d) => s + (predict(w, normalize(d.x)) - d.y) ** 2, 0) / data.length;
  let trueMSE = 0;
  for (let i = 0; i <= 200; i++) {
    const x = XMIN + (i / 200) * (XMAX - XMIN);
    trueMSE += (predict(w, normalize(x)) - Math.sin(x)) ** 2;
  }
  trueMSE /= 201;
  return { trainMSE, trueMSE };
}

/** 曲线粗糙度：归一化域上采样 300 段的弧长（越大越摆动）。 */
export function roughness(w: number[]): number {
  let arc = 0;
  let prev: number | null = null;
  const steps = 300;
  for (let i = 0; i <= steps; i++) {
    const xn = -1 + (i / steps) * 2;
    const yv = predict(w, xn);
    if (prev !== null) arc += Math.hypot(2 / steps, yv - prev);
    prev = yv;
  }
  return arc;
}
```

> 注：`metrics` 与测试依赖 `genSinNoise`（Task 3）。本计划允许 Task 2、3 先后任一顺序实现；若先做 Task 2，Step 2 的失败包含 `sinNoise` 未定义——这正常，完成 Task 3 后整体转绿。建议执行顺序：**先 Task 3 再回到 Task 2 的 Step 4**，或同批实现。

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- src/viz/analysis/ridge.test.ts`（需 Task 3 的 `sinNoise.ts` 已存在）
Expected: PASS（全部 ridge 断言通过）。

- [ ] **Step 5: 提交**

```bash
git add vizdao/src/viz/analysis/ridge.ts vizdao/src/viz/analysis/ridge.test.ts
git commit -m "feat(viz): Ridge 多项式回归核心（移植自已验证原型）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: sin+noise 确定性数据生成

**Files:**
- Create: `src/viz/datasets/sinNoise.ts`
- Test: `src/viz/datasets/sinNoise.test.ts`

**Interfaces:**
- Consumes: `XMIN`, `XMAX` from `../analysis/ridge`
- Produces:
  - `makeRng(seed: number): () => number` — mulberry32 确定性 PRNG
  - `gaussian(rng: () => number): number` — Box-Muller 标准正态
  - `Point` = `{ x: number; y: number }`
  - `genSinNoise(n: number, sigma: number, seed: number): Point[]`

- [ ] **Step 1: 写失败测试**

创建 `src/viz/datasets/sinNoise.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { makeRng, gaussian, genSinNoise } from './sinNoise';
import { XMIN, XMAX } from '../analysis/ridge';

describe('makeRng（mulberry32）', () => {
  it('同种子 → 同序列（确定性）', () => {
    const a = makeRng(42); const b = makeRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('输出落在 [0,1)', () => {
    const r = makeRng(7);
    for (let i = 0; i < 100; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });
});

describe('genSinNoise', () => {
  it('生成 n 个点，x 落在 [XMIN,XMAX]', () => {
    const pts = genSinNoise(30, 0.3, 1);
    expect(pts).toHaveLength(30);
    for (const p of pts) { expect(p.x).toBeGreaterThanOrEqual(XMIN); expect(p.x).toBeLessThanOrEqual(XMAX); }
  });
  it('同种子完全可复现', () => {
    expect(genSinNoise(10, 0.3, 99)).toEqual(genSinNoise(10, 0.3, 99));
  });
  it('sigma=0 时 y 严格等于 sin(x)', () => {
    const pts = genSinNoise(15, 0, 5);
    for (const p of pts) expect(p.y).toBeCloseTo(Math.sin(p.x), 9);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- src/viz/datasets/sinNoise.test.ts`
Expected: FAIL（`sinNoise.ts` 不存在）。

- [ ] **Step 3: 实现 sinNoise.ts**

创建 `src/viz/datasets/sinNoise.ts`：
```ts
// src/viz/datasets/sinNoise.ts
// 参照 _vizmodeling-reference polynomial_fit.py 的 gen_data：x∈[0,2π], y=sin(x)+N(0,σ)。
// 用确定性 PRNG（mulberry32）+ Box-Muller，保证测试可复现与"重采样"可控。
import { XMIN, XMAX } from '../analysis/ridge';

export interface Point { x: number; y: number; }

/** mulberry32：32 位确定性 PRNG，返回 [0,1)。 */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller：由两个 (0,1) 均匀数生成标准正态。 */
export function gaussian(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (!u) u = rng();
  while (!v) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** y = sin(x) + N(0,σ)，x 均匀采样于 [XMIN,XMAX]。 */
export function genSinNoise(n: number, sigma: number, seed: number): Point[] {
  const rng = makeRng(seed);
  return Array.from({ length: n }, () => {
    const x = XMIN + rng() * (XMAX - XMIN);
    return { x, y: Math.sin(x) + gaussian(rng) * sigma };
  });
}
```

- [ ] **Step 4: 运行测试，确认通过（并回跑 ridge 测试）**

Run: `npm test -- src/viz/datasets/sinNoise.test.ts src/viz/analysis/ridge.test.ts`
Expected: PASS（两文件全绿）。

- [ ] **Step 5: 提交**

```bash
git add vizdao/src/viz/datasets/sinNoise.ts vizdao/src/viz/datasets/sinNoise.test.ts
git commit -m "feat(viz): 确定性 sin+noise 数据生成

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Lesson 数据 + 运行时（knob 状态 + 检查点判定）

**Files:**
- Create: `src/viz/lessons/data.ts`
- Create: `src/viz/lessons/runner.ts`
- Test: `src/viz/lessons/runner.test.ts`

**Interfaces:**
- Consumes: `Lesson`/`Knob` from `../types`；`ridgeFit/predict/metrics/roughness/normalize` from `../analysis/ridge`；`genSinNoise/Point` from `../datasets/sinNoise`。
- Produces:
  - `OVERFITTING_LESSON: Lesson`，`LESSONS: Lesson[]`
  - `KnobValues` = `Record<string, number | boolean | string>`
  - `initialKnobValues(lesson: Lesson): KnobValues`
  - `FitResult` = `{ w: number[]; trainMSE: number; trueMSE: number; roughness: number }`
  - `computeOverfitting(values: KnobValues, data: Point[]): FitResult`
  - `judgeOverfitCheckpoint(prev: FitResult | null, cur: FitResult): { overfitSeen: boolean; rescuedSeen: boolean; passed: boolean }`

- [ ] **Step 1: 写失败测试**

创建 `src/viz/lessons/runner.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { OVERFITTING_LESSON, initialKnobValues, computeOverfitting, judgeOverfitCheckpoint } from './runner';
import { genSinNoise } from '../datasets/sinNoise';

describe('OVERFITTING_LESSON 数据完整', () => {
  it('含 degree/lambda/noise 三个 knob 与一个 checkpoint', () => {
    const ids = OVERFITTING_LESSON.knobs.map((k) => k.bindParam);
    expect(ids).toContain('degree');
    expect(ids).toContain('lambda');
    expect(OVERFITTING_LESSON.checkpoint).toBeTruthy();
  });
  it('initialKnobValues 取每个 knob 的 default', () => {
    const v = initialKnobValues(OVERFITTING_LESSON);
    expect(v.degree).toBe(3);
    expect(v.lambda).toBe(0);
  });
});

describe('computeOverfitting + checkpoint 判定', () => {
  const data = genSinNoise(20, 0.3, 2024);
  it('高阶 λ=0 → 检测到过拟合', () => {
    const over = computeOverfitting({ degree: 12, lambda: 0, noiseStd: 0.3 }, data);
    const j = judgeOverfitCheckpoint(null, over);
    expect(j.overfitSeen).toBe(true);
  });
  it('过拟合后加 λ 救回 → checkpoint 通过', () => {
    const over = computeOverfitting({ degree: 12, lambda: 0, noiseStd: 0.3 }, data);
    const rescued = computeOverfitting({ degree: 12, lambda: 0.1, noiseStd: 0.3 }, data);
    const j = judgeOverfitCheckpoint(over, rescued);
    expect(j.rescuedSeen).toBe(true);
    expect(j.passed).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- src/viz/lessons/runner.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 实现 data.ts**

创建 `src/viz/lessons/data.ts`（移自 `hermes-work/code/lessons.ts` 的 overfitting 单元；其余 6 lesson 后续切片再启用）：
```ts
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
```

- [ ] **Step 4: 实现 runner.ts**

创建 `src/viz/lessons/runner.ts`：
```ts
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
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npm test -- src/viz/lessons/runner.test.ts`
Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add vizdao/src/viz/lessons/data.ts vizdao/src/viz/lessons/runner.ts vizdao/src/viz/lessons/runner.test.ts
git commit -m "feat(viz): 过拟合 lesson 数据 + 运行时与检查点判定

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

# 阶段 B · 可视化 UI（ECharts + 渲染）

## Task 5: ECharts 封装 + line+scatter option 注册表

**Files:**
- Modify: `package.json`（加 `echarts`）
- Create: `src/viz/charts/registry.ts`
- Test: `src/viz/charts/registry.test.ts`
- Create: `src/viz/charts/ChartCanvas.tsx`

**Interfaces:**
- Consumes: `Point` from `../datasets/sinNoise`；`predict/normalize/XMIN/XMAX` from `../analysis/ridge`。
- Produces:
  - `buildLineScatterOption(data: Point[], w: number[]): EChartsOption-like object`（返回 ECharts option 对象）
  - `ChartCanvas({ option }: { option: object }): JSX.Element`

- [ ] **Step 1: 安装 echarts**

Run: `cd /Users/hongxin/Workspace/claude-ai-playground/ViZDao/vizdao && npm i echarts@^6`
Expected: `echarts` 进入 dependencies。

- [ ] **Step 2: 写失败测试（option 构造为纯函数，可单测）**

创建 `src/viz/charts/registry.test.ts`：
```ts
import { describe, it, expect } from 'vitest';
import { buildLineScatterOption } from './registry';
import { genSinNoise } from '../datasets/sinNoise';
import { ridgeFit, normalize } from '../analysis/ridge';

describe('buildLineScatterOption', () => {
  const data = genSinNoise(20, 0.3, 1);
  const w = ridgeFit(data.map((d) => normalize(d.x)), data.map((d) => d.y), 5, 0.001);
  const opt = buildLineScatterOption(data, w) as any;

  it('含三个 series：样本散点 + 拟合线 + 真值线', () => {
    expect(Array.isArray(opt.series)).toBe(true);
    expect(opt.series).toHaveLength(3);
    const types = opt.series.map((s: any) => s.type).sort();
    expect(types).toEqual(['line', 'line', 'scatter']);
  });
  it('散点 series 的数据点数 = 样本数', () => {
    const scatter = opt.series.find((s: any) => s.type === 'scatter');
    expect(scatter.data).toHaveLength(20);
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

Run: `npm test -- src/viz/charts/registry.test.ts`
Expected: FAIL（`registry.ts` 不存在）。

- [ ] **Step 4: 实现 registry.ts**

创建 `src/viz/charts/registry.ts`：
```ts
// src/viz/charts/registry.ts — chartType → ECharts option。切片1：line+scatter。
import type { Point } from '../datasets/sinNoise';
import { predict, normalize, XMIN, XMAX } from '../analysis/ridge';

const CURVE_SAMPLES = 200;

/** 构造"带噪样本(scatter) + 拟合曲线(line) + 真值 sin(line)"的 option。 */
export function buildLineScatterOption(data: Point[], w: number[]): object {
  const fit: [number, number][] = [];
  const truth: [number, number][] = [];
  for (let i = 0; i <= CURVE_SAMPLES; i++) {
    const x = XMIN + (i / CURVE_SAMPLES) * (XMAX - XMIN);
    fit.push([x, predict(w, normalize(x))]);
    truth.push([x, Math.sin(x)]);
  }
  return {
    animation: false,
    grid: { left: 44, right: 16, top: 24, bottom: 32 },
    xAxis: { type: 'value', min: XMIN, max: XMAX },
    yAxis: { type: 'value', min: -2.2, max: 2.2 },
    legend: { data: ['带噪样本', '拟合曲线', '真值 sin(x)'], top: 0 },
    series: [
      { name: '真值 sin(x)', type: 'line', showSymbol: false, lineStyle: { type: 'dashed', color: '#5a6b8c' }, data: truth },
      { name: '拟合曲线', type: 'line', showSymbol: false, lineStyle: { color: '#ffb454', width: 2.5 }, data: fit },
      { name: '带噪样本', type: 'scatter', symbolSize: 8, itemStyle: { color: '#63b3ed' }, data: data.map((d) => [d.x, d.y]) },
    ],
  };
}
```

- [ ] **Step 5: 运行测试，确认通过**

Run: `npm test -- src/viz/charts/registry.test.ts`
Expected: PASS。

- [ ] **Step 6: 实现 ChartCanvas.tsx（按需引入 echarts/core）**

创建 `src/viz/charts/ChartCanvas.tsx`：
```tsx
// src/viz/charts/ChartCanvas.tsx — ECharts 6 封装：option 变 → 重绘。
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, ScatterChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([LineChart, ScatterChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

export function ChartCanvas({ option }: { option: object }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current);
    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={ref} style={{ width: '100%', height: '100%', minHeight: 360 }} />;
}
```

- [ ] **Step 7: 提交**

```bash
git add vizdao/package.json vizdao/package-lock.json vizdao/src/viz/charts/registry.ts vizdao/src/viz/charts/registry.test.ts vizdao/src/viz/charts/ChartCanvas.tsx
git commit -m "feat(viz): ECharts 封装 + line+scatter option 注册表

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: lessonStore（zustand）+ LessonView（讲/做/悟 + 自动 knob 面板）

**Files:**
- Create: `src/store/lessonStore.ts`
- Test: `src/store/lessonStore.test.ts`
- Create: `src/viz/lessons/LessonView.tsx`
- Test: `src/viz/lessons/LessonView.test.tsx`

**Interfaces:**
- Consumes: `OVERFITTING_LESSON/initialKnobValues/computeOverfitting/judgeOverfitCheckpoint/FitResult/KnobValues` from `../../viz/lessons/runner`；`genSinNoise/Point` from `../../viz/datasets/sinNoise`；`buildLineScatterOption` from `../../viz/charts/registry`；`ChartCanvas` from `../../viz/charts/ChartCanvas`。
- Produces:
  - `useLessonStore` with state `{ lesson, knobValues, data, fit, lastOverfit, checkpointPassed, leftCollapsed }` and actions `{ setKnob(bindParam, value), resample(), toggleCollapse() }`
  - `LessonView(): JSX.Element`

- [ ] **Step 1: 写失败测试（store 纯逻辑）**

创建 `src/store/lessonStore.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useLessonStore } from './lessonStore';

describe('lessonStore', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(99));

  it('初始 knob = lesson 默认值，且已算出 fit', () => {
    const s = useLessonStore.getState();
    expect(s.knobValues.degree).toBe(3);
    expect(s.fit).not.toBeNull();
  });

  it('setKnob 改 degree → 重算 fit', () => {
    useLessonStore.getState().setKnob('degree', 12);
    const s = useLessonStore.getState();
    expect(s.knobValues.degree).toBe(12);
    expect(s.fit!.trainMSE).toBeGreaterThan(0);
  });

  it('过拟合→加λ救回 → checkpointPassed 置真', () => {
    const api = useLessonStore.getState();
    api.setKnob('degree', 12);
    api.setKnob('lambda', 0);   // 过拟合态被记录到 lastOverfit
    api.setKnob('lambda', 0.1); // 救回
    expect(useLessonStore.getState().checkpointPassed).toBe(true);
  });

  it('toggleCollapse 翻转 leftCollapsed', () => {
    const before = useLessonStore.getState().leftCollapsed;
    useLessonStore.getState().toggleCollapse();
    expect(useLessonStore.getState().leftCollapsed).toBe(!before);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- src/store/lessonStore.test.ts`
Expected: FAIL（`lessonStore.ts` 不存在）。

- [ ] **Step 3: 实现 lessonStore.ts**

创建 `src/store/lessonStore.ts`：
```ts
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
    if (bindParam === 'noiseStd') data = genSinNoise(20, Number(value), DATA_SEED);
    const r = recompute(knobValues, data, s.lastOverfit, s.checkpointPassed);
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
```
> 注：`resample` 用 `Date.now()` 仅在真实浏览器；测试不调用 `resample`（用 `resetForTest(seed)` 保证确定性）。

- [ ] **Step 4: 运行 store 测试，确认通过**

Run: `npm test -- src/store/lessonStore.test.ts`
Expected: PASS。

- [ ] **Step 5: 写 LessonView 冒烟测试**

创建 `src/viz/lessons/LessonView.test.tsx`：
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonView } from './LessonView';
import { useLessonStore } from '../../store/lessonStore';

// ECharts 在 jsdom 无法测渲染，mock 掉 ChartCanvas
vi.mock('../charts/ChartCanvas', () => ({ ChartCanvas: () => <div data-testid="chart" /> }));

describe('LessonView', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(7));

  it('渲染 hook（讲）与 takeaway（悟）与一个图', () => {
    render(<LessonView />);
    expect(screen.getByText(/学规律，还是背答案/)).toBeInTheDocument();
    expect(screen.getByText(/背答案而非学规律/)).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('为每个 slider knob 渲染一个 range 输入', () => {
    render(<LessonView />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThanOrEqual(3); // degree/lambda/noise
  });

  it('拖动 degree 滑块更新 store', () => {
    render(<LessonView />);
    const deg = screen.getByLabelText(/多项式阶数/);
    fireEvent.change(deg, { target: { value: '12' } });
    expect(useLessonStore.getState().knobValues.degree).toBe(12);
  });
});
```

- [ ] **Step 6: 运行测试，确认失败**

Run: `npm test -- src/viz/lessons/LessonView.test.tsx`
Expected: FAIL（`LessonView.tsx` 不存在）。

- [ ] **Step 7: 实现 LessonView.tsx**

创建 `src/viz/lessons/LessonView.tsx`：
```tsx
// src/viz/lessons/LessonView.tsx — 讲/做/悟三段 + 由 lesson.knobs 自动生成的 knob 面板。
import { useMemo } from 'react';
import type { Knob } from '../types';
import { useLessonStore } from '../../store/lessonStore';
import { ChartCanvas } from '../charts/ChartCanvas';
import { buildLineScatterOption } from '../charts/registry';

function KnobControl({ knob }: { knob: Knob }) {
  const value = useLessonStore((s) => s.knobValues[knob.bindParam]);
  const setKnob = useLessonStore((s) => s.setKnob);
  if (knob.kind === 'slider') {
    return (
      <label style={{ display: 'block', marginBottom: 14 }}>
        <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
          {knob.label}<span>{String(value)}</span>
        </span>
        <input
          type="range" aria-label={knob.label}
          min={knob.min} max={knob.max} step={knob.step}
          value={Number(value)}
          onChange={(e) => setKnob(knob.bindParam, Number(e.target.value))}
          style={{ width: '100%' }}
        />
        {knob.hint && <span style={{ fontSize: 11, opacity: 0.6 }}>{knob.hint}</span>}
      </label>
    );
  }
  if (knob.kind === 'button') {
    return (
      <button onClick={() => setKnob(knob.bindParam, 'go')} style={{ width: '100%', marginBottom: 14 }}>
        {knob.label}
      </button>
    );
  }
  return null;
}

export function LessonView() {
  const lesson = useLessonStore((s) => s.lesson);
  const data = useLessonStore((s) => s.data);
  const fit = useLessonStore((s) => s.fit);
  const passed = useLessonStore((s) => s.checkpointPassed);
  const option = useMemo(() => (fit ? buildLineScatterOption(data, fit.w) : {}), [data, fit]);

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      <div style={{ width: 320, overflowY: 'auto' }}>
        <h2 style={{ fontSize: 16 }}>{lesson.title}</h2>
        <p style={{ fontSize: 13, opacity: 0.85 }}>{lesson.hook}</p>
        <div style={{ margin: '12px 0' }}>{lesson.knobs.map((k) => <KnobControl key={k.id} knob={k} />)}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>{lesson.takeaway}</div>
        {passed && <div style={{ marginTop: 10, color: '#2a8' }}>✓ 检查点达成：你既看见了过拟合，也把它救了回来。</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <ChartCanvas option={option} />
        {fit && (
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
            <span>训练MSE {fit.trainMSE.toFixed(4)}</span>
            <span>真值MSE {fit.trueMSE.toFixed(4)}</span>
            <span>粗糙度 {fit.roughness.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: 运行测试，确认通过**

Run: `npm test -- src/viz/lessons/LessonView.test.tsx src/store/lessonStore.test.ts`
Expected: PASS。

- [ ] **Step 9: 提交**

```bash
git add vizdao/src/store/lessonStore.ts vizdao/src/store/lessonStore.test.ts vizdao/src/viz/lessons/LessonView.tsx vizdao/src/viz/lessons/LessonView.test.tsx
git commit -m "feat(viz): lessonStore + LessonView（讲做悟 + 自动 knob 面板）

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

# 阶段 C · 集成、布局、AI 助教、品牌

## Task 7: 主视图改造为「一套布局两态」并挂载 LessonView

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/VizWorkbench.tsx`（左 LessonView+对话 / 右画布的两态容器）
- Test: `src/components/VizWorkbench.test.tsx`

**Interfaces:**
- Consumes: `LessonView` from `../viz/lessons/LessonView`；`useLessonStore` from `../store/lessonStore`。
- Produces: `VizWorkbench(): JSX.Element`。

- [ ] **Step 1: 写折叠态冒烟测试**

创建 `src/components/VizWorkbench.test.tsx`：
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VizWorkbench } from './VizWorkbench';
import { useLessonStore } from '../store/lessonStore';

vi.mock('../viz/charts/ChartCanvas', () => ({ ChartCanvas: () => <div data-testid="chart" /> }));

describe('VizWorkbench 两态', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(3));
  it('默认展开：可见 lesson 标题', () => {
    render(<VizWorkbench />);
    expect(screen.getByText(/拟合 → 过拟合 → 正则/)).toBeInTheDocument();
  });
  it('点折叠键 → leftCollapsed 置真', () => {
    render(<VizWorkbench />);
    fireEvent.click(screen.getByRole('button', { name: /折叠|collapse/i }));
    expect(useLessonStore.getState().leftCollapsed).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- src/components/VizWorkbench.test.tsx`
Expected: FAIL（`VizWorkbench.tsx` 不存在）。

- [ ] **Step 3: 实现 VizWorkbench.tsx**

创建 `src/components/VizWorkbench.tsx`：
```tsx
// src/components/VizWorkbench.tsx — 一套布局两态：A 展开(左讲做悟+knob/右画布) ↔ B 收起细轨。
import { LessonView } from '../viz/lessons/LessonView';
import { useLessonStore } from '../store/lessonStore';

export function VizWorkbench() {
  const collapsed = useLessonStore((s) => s.leftCollapsed);
  const toggle = useLessonStore((s) => s.toggleCollapse);

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {collapsed ? (
        <div
          role="button" aria-label="展开"
          onClick={toggle}
          style={{ width: 28, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 10, opacity: 0.6 }}
        >‹</div>
      ) : (
        <div style={{ width: 360, borderRight: '1px solid hsl(var(--border))', position: 'relative', padding: 12, overflow: 'hidden' }}>
          <button
            aria-label="折叠"
            onClick={toggle}
            style={{ position: 'absolute', right: 6, top: 6, width: 22, height: 22, borderRadius: '50%' }}
          >›</button>
          <LessonView />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, padding: 12 }}>
        {/* 折叠态下画布占满；展开态下 LessonView 已含画布，这里留作多视图扩展位 */}
        {collapsed && <LessonView />}
      </div>
    </div>
  );
}
```
> 说明：展开态 LessonView 自带"左信息+右图"；折叠态把 LessonView 整体移到主区占满。切片1够用；后续多视图联动在右区扩展。

- [ ] **Step 4: 在 App.tsx 挂载 VizWorkbench 为主体验**

修改 `src/App.tsx`：在"已配置"分支，把原 Chat/Cosmos 主区替换为 `<VizWorkbench />`（保留 `StatusBar`、`PermissionDialog`、`RenderPreviewListener`、`ExportListener` 等监听器）。最小改动：
```tsx
// src/App.tsx —— 在 activeView 渲染处，主内容区替换为：
import { VizWorkbench } from './components/VizWorkbench';
// ...
// 原 <ChatPanel/> / <CosmosView/> 主区 → 改为：
<div style={{ flex: 1, minHeight: 0 }}>
  <VizWorkbench />
</div>
```
（StatusBar 的 chat/cosmos 切换在切片1可隐藏或保留；不删除其代码，仅默认显示 VizWorkbench。）

- [ ] **Step 5: 运行测试 + 起 dev 冒烟**

Run: `npm test -- src/components/VizWorkbench.test.tsx`
Expected: PASS。
Run: `npm run build`
Expected: 构建成功（tsc + vite 无错）。

- [ ] **Step 6: 提交**

```bash
git add vizdao/src/components/VizWorkbench.tsx vizdao/src/components/VizWorkbench.test.tsx vizdao/src/App.tsx
git commit -m "feat(ui): 主视图改造为一套布局两态，挂载过拟合 lesson

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: LLM 精简为单一 DeepSeek v4 + flash/pro 切换

**Files:**
- Modify: `src/store/configStore.ts`
- Test: `src/store/configStore.test.ts`
- Modify: `src/components/SettingsDialog.tsx`
- Modify: `src/components/WelcomeScreen.tsx`

**Interfaces:**
- Produces: configStore 新增 `tier: 'flash' | 'pro'` 与 `setTier`，`model` 由 tier 派生（flash→`deepseek-chat`，pro→`deepseek-reasoner`）。`baseUrl` 固定 `https://api.deepseek.com/v1`。

- [ ] **Step 1: 写失败测试**

创建 `src/store/configStore.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useConfigStore } from './configStore';

describe('configStore（DeepSeek 单 provider）', () => {
  beforeEach(() => useConfigStore.setState({ apiKey: '', tier: 'flash' } as any));
  it('tier=flash → model=deepseek-chat', () => {
    useConfigStore.getState().setTier('flash');
    expect(useConfigStore.getState().model).toBe('deepseek-chat');
  });
  it('tier=pro → model=deepseek-reasoner', () => {
    useConfigStore.getState().setTier('pro');
    expect(useConfigStore.getState().model).toBe('deepseek-reasoner');
  });
  it('baseUrl 固定为 deepseek', () => {
    expect(useConfigStore.getState().baseUrl).toBe('https://api.deepseek.com/v1');
  });
  it('无 key 时 validate 失败', () => {
    useConfigStore.setState({ apiKey: '' } as any);
    expect(useConfigStore.getState().validate().valid).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- src/store/configStore.test.ts`
Expected: FAIL（`setTier`/`tier` 不存在）。

- [ ] **Step 3: 改 configStore.ts**

在 `src/store/configStore.ts`：
- 删除 `PRESETS` 中 openai/zhipu/ollama/custom，仅留 deepseek；移除 `provider` 选择逻辑（固定 `'deepseek'`）。
- 固定 `baseUrl: 'https://api.deepseek.com/v1'`。
- 新增状态 `tier: 'flash' | 'pro'`（默认 `'flash'`）与 action：
```ts
setTier: (tier: 'flash' | 'pro') =>
  set({ tier, model: tier === 'flash' ? 'deepseek-chat' : 'deepseek-reasoner' }),
```
- 初始 `model: 'deepseek-chat'`。
- `validate()` 仅检查 `apiKey` 非空（baseUrl 固定、provider 固定）。
- 保留 localStorage key `jetbot-config`（向后兼容；不改 key 名）。

- [ ] **Step 4: 运行测试，确认通过**

Run: `npm test -- src/store/configStore.test.ts`
Expected: PASS。

- [ ] **Step 5: 简化 SettingsDialog + WelcomeScreen**

- `SettingsDialog.tsx`：移除 provider 下拉与多余 baseUrl 输入；保留 API Key 输入 + 一个 **flash/pro 二选一**（绑定 `setTier`）+ 语言切换。
- `WelcomeScreen.tsx`：标题 "JetBot" → "ViZDao · 微知道"；副文案改为"填入 DeepSeek API Key 即可开始"；只留 key 输入 + flash/pro。

- [ ] **Step 6: 构建冒烟**

Run: `npm run build`
Expected: 成功。

- [ ] **Step 7: 提交**

```bash
git add vizdao/src/store/configStore.ts vizdao/src/store/configStore.test.ts vizdao/src/components/SettingsDialog.tsx vizdao/src/components/WelcomeScreen.tsx
git commit -m "feat(llm): 精简为单一 DeepSeek v4 + flash/pro 切换

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: AI 助教 viz 工具 + 灵魂文件

**Files:**
- Create: `src/viz/tutor/vizTools.ts`
- Test: `src/viz/tutor/vizTools.test.ts`
- Modify: `src/tools/builtins/index.ts`（注册）
- Rename: `src/agent/jetbot.md` → `src/agent/vizdao.md`（重写人格）
- Modify: `src/agent/SystemPromptBuilder.ts`（soul 路径 + 去 JetBot）

**Interfaces:**
- Consumes: 现有 `Tool` 接口（`src/types/tool.ts`）；`useLessonStore` from `../../store/lessonStore`。
- Produces:
  - `createReadVizState(): Tool`（name `read_viz_state`，读当前 lesson/knob/指标）
  - `createGradeOpen(): Tool`（name `grade_open`，回显学员答案 + 当前状态，供模型点评）
  - `registerVizTools(registry: ToolRegistry): void`

- [ ] **Step 1: 写失败测试**

创建 `src/viz/tutor/vizTools.test.ts`：
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createReadVizState } from './vizTools';
import { useLessonStore } from '../../store/lessonStore';

describe('read_viz_state 工具', () => {
  beforeEach(() => useLessonStore.getState().resetForTest(11));
  it('返回当前 lesson id 与 knob 值与指标', async () => {
    useLessonStore.getState().setKnob('degree', 9);
    const tool = createReadVizState();
    const out = await tool.execute({});
    const parsed = JSON.parse(out);
    expect(parsed.lessonId).toBe('overfitting');
    expect(parsed.knobValues.degree).toBe(9);
    expect(typeof parsed.metrics.trainMSE).toBe('number');
  });
  it('permission 为 safe', () => {
    expect(createReadVizState().permission).toBe('safe');
  });
});
```

- [ ] **Step 2: 运行测试，确认失败**

Run: `npm test -- src/viz/tutor/vizTools.test.ts`
Expected: FAIL（`vizTools.ts` 不存在）。

- [ ] **Step 3: 实现 vizTools.ts**

创建 `src/viz/tutor/vizTools.ts`：
```ts
// src/viz/tutor/vizTools.ts — 助教受限工具：只读实验状态 + 转交开放题，不改 lesson、不跳检查点。
import type { Tool } from '../../types/tool';
import type { ToolRegistry } from '../../tools/ToolRegistry';
import { useLessonStore } from '../../store/lessonStore';

export function createReadVizState(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'read_viz_state',
        description: '读取学员当前实验状态：lesson、各 knob 值、拟合指标(训练MSE/真值MSE/粗糙度)、检查点是否达成。用于针对性讲解。',
        parameters: { type: 'object', properties: {}, required: [] },
      },
    },
    permission: 'safe',
    async execute() {
      const s = useLessonStore.getState();
      return JSON.stringify({
        lessonId: s.lesson.id,
        title: s.lesson.title,
        knobValues: s.knobValues,
        metrics: s.fit ? { trainMSE: s.fit.trainMSE, trueMSE: s.fit.trueMSE, roughness: s.fit.roughness } : null,
        checkpointPassed: s.checkpointPassed,
      });
    },
  };
}

export function createGradeOpen(): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'grade_open',
        description: '对开放题给启发式点评（不判对错、不阻塞）。传入学员答案，返回学员答案 + 当前实验状态以便你点评。',
        parameters: {
          type: 'object',
          properties: { answer: { type: 'string', description: '学员的开放题作答' } },
          required: ['answer'],
        },
      },
    },
    permission: 'safe',
    async execute(params) {
      const s = useLessonStore.getState();
      return JSON.stringify({
        answer: String(params.answer ?? ''),
        context: { lessonId: s.lesson.id, knobValues: s.knobValues, checkpointPassed: s.checkpointPassed },
        note: '请以启发、鼓励探索的语气点评，不要判对错。',
      });
    },
  };
}

export function registerVizTools(registry: ToolRegistry): void {
  registry.register(createReadVizState());
  registry.register(createGradeOpen());
}
```

- [ ] **Step 4: 注册到 builtins**

修改 `src/tools/builtins/index.ts`，在 `registerBuiltins(registry)` 末尾加：
```ts
import { registerVizTools } from '../../viz/tutor/vizTools';
// ... 在 registerBuiltins 内：
registerVizTools(registry);
```

- [ ] **Step 5: 重写灵魂文件**

```bash
git mv vizdao/src/agent/jetbot.md vizdao/src/agent/vizdao.md
```
把 `vizdao.md` 内容重写为「可视化助教」人格（要点：陪伴行业初学者、用"看见"解释建模、在"悟"环节用 aiHints 切入、鼓励试验不打击、不替学员跳检查点）。
在 `src/agent/SystemPromptBuilder.ts`：把 soul 文件路径 `/jetbot.md` → `/vizdao.md`，并替换其中残留 "JetBot" 字样为 "ViZDao"。

- [ ] **Step 6: 运行测试 + 构建**

Run: `npm test -- src/viz/tutor/vizTools.test.ts`
Expected: PASS。
Run: `npm run build`
Expected: 成功。

- [ ] **Step 7: 提交**

```bash
git add vizdao/src/viz/tutor/ vizdao/src/tools/builtins/index.ts vizdao/src/agent/vizdao.md vizdao/src/agent/SystemPromptBuilder.ts
git rm --cached vizdao/src/agent/jetbot.md 2>/dev/null || true
git commit -m "feat(tutor): 助教 viz 工具(read_viz_state/grade_open) + vizdao 灵魂文件

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: 品牌字串清理 + 全量回归

**Files:**
- Modify: `src/lib/i18n.ts`（去 "JetBot"，加 lesson/viz 文案）
- Modify: 其它含 "JetBot" 的展示位（grep 定位）

- [ ] **Step 1: 定位所有 JetBot 展示字串**

Run:
```bash
cd /Users/hongxin/Workspace/claude-ai-playground/ViZDao/vizdao
grep -rn "JetBot" src --include=*.ts --include=*.tsx --include=*.md
```
Expected: 列出 WelcomeScreen（如 Task 8 已改则不在）、`i18n.ts`（如 `cmd.help_title`）、`SystemPromptBuilder.ts`（Task 9 已改）、`logger.ts` 注释等。

- [ ] **Step 2: 替换展示字串**

把面向用户展示的 "JetBot" → "ViZDao"（如 `i18n.ts` 的 `cmd.help_title`: `'# JetBot Commands'` → `'# ViZDao Commands'` / `'# ViZDao 命令'`）。
**保留** localStorage key `jetbot-config` 与内部事件名 `jetbot:*`（向后兼容，非展示字串），仅改用户可见文案。

- [ ] **Step 3: 全量测试 + 构建**

Run: `npm test`
Expected: 全部 PASS（types/ridge/sinNoise/runner/registry/lessonStore/LessonView/VizWorkbench/configStore/vizTools）。
Run: `npm run build`
Expected: 成功。
Run: `npm run lint`
Expected: 无 error（warning 可接受）。

- [ ] **Step 4: 手动冒烟（dev）**

Run: `npm run dev`，浏览器打开：
- 填 DeepSeek key（或跳过 AI），进入工作台。
- 拖「阶数」到 12、λ=0：曲线穿过每点剧烈摆动，训练MSE↓、真值MSE↑。
- 拖 λ 增大：曲线平滑，检查点出现 ✓。
- 点折叠键：左栏收起、画布占满；再点展开恢复。
Expected: 上述行为可见，无 console 报错。

- [ ] **Step 5: 提交**

```bash
git add vizdao/src/lib/i18n.ts vizdao/src
git commit -m "chore: 清理 JetBot 展示字串，切片1 全量回归通过

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

# 完成定义（切片 1）

- [ ] `npm test` 全绿；`npm run build`、`npm run lint` 通过。
- [ ] 浏览器打开即用：过拟合 lesson 可拖 knob 即时重绘，检查点可达成。
- [ ] 一套布局两态（展开/折叠）工作。
- [ ] LLM 仅 DeepSeek v4(flash/pro)；填 key 后助教能 `read_viz_state` 并讲解。
- [ ] 用户可见处无 "JetBot" 字串；灵魂文件为 `vizdao.md`。

# 自检对照（plan ⇆ spec）

- spec §2 In 1（布局两态）→ Task 7 ✓；§2 In 2（lesson 运行时）→ Task 4/6 ✓；In 3（ECharts）→ Task 5 ✓；In 4（Ridge 建模）→ Task 2/3 ✓；In 5（AI 助教）→ Task 9 ✓；In 6（双检查点：闭合）→ Task 4/6 ✓，（开放 AI 点评）→ Task 9 `grade_open` ✓；In 7（持久化）→ 见下"已知缺口"；In 8（DeepSeek 精简）→ Task 8 ✓；In 9（品牌/灵魂）→ Task 9/10 ✓；In 10（vitest）→ Task 1 ✓。
- **已知缺口（须在执行时补一小任务）**：spec §2 In 7「knob 快照/进度落 IndexedDB」当前计划未单列任务——执行 Task 6 后增量加一个 `lessonStore` 订阅，用 `src/lib/db.ts` 的 `put('experiments', snapshot)` 持久化 knob 值（store `experiments` 需在 `db.ts` 的 `STORES` 注册并 bump `DB_VERSION`）。若本切片不要求跨刷新恢复，可降级为后续切片；建议作为 Task 6.5 补上最小持久化（写入即可，恢复后续做）。
