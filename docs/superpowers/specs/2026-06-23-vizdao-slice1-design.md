# ViZDao 切片 1 设计：「让模型现形」· 过拟合 Lesson（融合版）

> 状态：设计定稿（融合 Hermes 上游设计后）· 日期：2026-06-23 · 方法论：道器合一「观→谋」
>
> 本版融合了 Hermes Agent（北冥-120）在 `hermes-work/` 的上游教学设计与已验证原型。
> 背景记忆见 `~/.claude/projects/.../ViZDao/memory/`；本文档随仓库走。

## 0. 融合说明（本版相对初版的变更）

初版以 Bike-Sharing 为锚点、"AI对话+GUI"为交互。读入 Hermes 在 `hermes-work/` 的产出后，
吸收其更锋利的设计，做如下融合（用户已确认）：

- **交互灵魂改为 knob（旋钮）+ 讲做悟**：拖滑块 → 即时重绘 → 直觉沉淀（闭环≈1秒），初学者不碰语法。我原"轻量 GUI"具体化为 knob 面板。
- **内容 schema 采用 Hermes 的 `Lesson/Knob/Checkpoint`**（`hermes-work/code/lessons.ts`，零依赖），替换初版 Course→Case→Step（少一层，更简）。
- **切片 1 锚点改为 Overfitting（过拟合）lesson**：因 `hermes-work/code/prototypes/overfitting.html` 已实跑验证（Ridge 正规方程、零依赖、4 场景数学正确），是最快的最小闭环验证。
- **Bike-Sharing 降为后续 lesson**（EDA/多维关系支线），保留用户诉求，不丢。
- **算法库纪律**：切片 1 零依赖（过拟合本就零依赖）；后续聚类/降维 lesson 照搬 vizmodeling 已验证库（ml-kmeans/ml-pca/tsne-js/umap-js，勿擅自换库）。

不变项：一套布局两态、DeepSeek v4 单 provider(flash/pro)、课程运行时、IndexedDB 持久化、双检查点、TDD。

## 1. 目标与定位

ViZDao（微知道）是**在线零安装的数据可视化/建模教学实验平台**——打开网页即用，无后端、无部署、无安装。

**目标用户**：接受继续教育的行业学员（税务、移动通讯、国家电网等）。专业背景强、有一定计算机操作水平，但长期离开大学、编程能力一般；强烈希望掌握可视化、大数据、AI 方法解决业务实际问题。设计须**降低摩擦、鼓励试验、减少挫败感**。

**产品主线（来自 Hermes / vizmodeling）**：
> **「我建了一个模型，它好不好？—— 看一眼就知道。」**

每个技术点都回答这同一个问题。抽象的"建模"被翻译成可感知的"看见"。工程化身：
```
拖一下旋钮（行） → 眼睛立刻看见模型变化（知） → 直觉沉淀
└──────────────── 闭环 ≈ 1 秒 ────────────────┘
```

**切片目标**：交付一个能跑完**过拟合 lesson（讲→做→悟）**的最薄完整体验，验证"课程运行时 + knob 即时重绘 + ECharts + 浏览器端建模 + 双检查点 + AI 助教 + 一套布局两态 + 持久化"整条链路。把 Hermes 已验证的 `overfitting.html` 移植成 ViZDao 内的第一个真 lesson。

## 2. 范围边界

**包含（In）：**
1. **一套布局两态**：A 展开（左 讲/做/悟 + knob 面板 + AI 对话 / 右 ECharts 画布）↔ 折叠键 ↔ B 收起细轨（画布占满）。多视图联动最简版（先 1～2 视图）。
2. **Lesson 运行时**：加载**硬编码的 Lesson 数据**（采用 Hermes schema），渲染「讲(hook) / 做(knobs 面板) / 悟(ahaMoment+takeaway)」三段；knob 改变 → 触发重算 → ECharts 重绘。
3. **图表层**：接入 ECharts 6，封装 `<ChartCanvas>` + 小注册表（切片 1 需 `line+scatter`）。
4. **浏览器端建模（过拟合）**：纯 TS 实现 Ridge 多项式回归（正规方程 + 高斯消元 + x 归一化防病态），训练 MSE / 真值 MSE / 曲线粗糙度计算。逻辑照搬 `overfitting.html` 已验证算法。
5. **AI 助教**：DeepSeek v4（flash/pro 开关），在"悟"环节用 lesson 的 `aiHints` 切入，能讲解 / 读当前 knob 状态 / 点评开放题。复用 JetBot agent loop + 工具调用。
6. **双检查点**：闭合型自动判定（过拟合检查点：训练 MSE 极低且粗糙度高 → 提高 λ 后粗糙度显著下降）+ 开放型 AI 点评不卡关。
7. **持久化**：复用 IndexedDB（`lib/db.ts`，DB 名 `vizdao`）存 lesson 进度与 knob 状态快照。
8. **LLM 精简**：砍多 provider，留单一 DeepSeek v4 + flash/pro toggle；继承密钥 UI 但简化。
9. **品牌/灵魂**：`src/agent/jetbot.md` → `vizdao.md` 重写助教人格；清理 WelcomeScreen / i18n 的 "JetBot" 字串。
10. **测试基建**：引入 vitest（项目当前无测试框架）。

**不做（Out，留后续切片）：**
- ❌ Blockly 拖拽编程（切片 2 专项；knob 用于预设课，Blockly 用于开放搭建）
- ❌ 其余 6 个 lesson（开场 Anscombe / 分布 KDE / 高维 / 聚类 / 降维 / 收束）——schema 已就绪，逐 lesson 增量上
- ❌ Bike-Sharing EDA lesson（后续支线）
- ❌ 聚类/降维所需的 ml-kmeans/tsne-js/umap-js 依赖（对应 lesson 落地时再加）
- ❌ 课程编写器 UI（先硬编码 lesson 数据）
- ❌ 多课程管理 / 学习路径知识图谱视图（Cosmos 演化）
- ❌ 数据集上传

## 3. 切片 1 锚点：过拟合 Lesson（讲做悟）

数据已由 Hermes 写好（`hermes-work/code/lessons.ts` 的 `overfitting` 单元），整合时移入 `src/viz/lessons/`：
- **讲（hook）**：「给一堆带噪声的点拟合曲线。阶数越高越能穿过每个点——但那是学规律，还是背答案？」
- **做（knobs）**：`degree`(阶数 1–15)、`lambda`(正则 λ，**log 标度** 0–1)、`noise`(噪声 0–1)、`resample`(重采样按钮)。
- **悟（aha/takeaway）**：「阶数 12、λ=0 穿过每点却剧烈摆动；λ 一拉大立刻平滑——过拟合一眼看见、一键驯服。」→「过拟合 = 模型在背答案而非学规律。」
- **checkpoint(闭合)**：把曲线调到明显过拟合再用 λ 救回平滑。
- **aiHints**：为什么高阶过拟合 / λ 在惩罚什么 / 训练误差低为什么不一定好。
- **refSlides**：讲一 p55-70（可追溯 vizmodeling）。

**已验证数值基线**（来自 Hermes `overfitting.html` 实跑，作为单测断言依据）：

| 场景 | degree | λ | 训练MSE | 真值MSE | 判定 |
|------|--------|---|---------|---------|------|
| 欠拟合 | 1 | 0 | ~0.189 | ~0.217 | 两高·直线 |
| 过拟合 | 12 | 0 | ~0.026 | ~0.622 | 训练极低·真值暴涨 |
| 正则救回 | 12 | 0.1 | ~0.057 | ~0.060 | 真值MSE 降一个数量级 |
| 好模型 | 5 | 6e-4 | ~0.047 | ~0.030 | 学到规律 |

## 4. 架构与模块（在 `src/viz/` 落地）

复用 JetBot 基础设施不动（IndexedDB、UI shell、i18n 双语、zustand、scheduler、CORS proxy worker、CI）。新增/改造集中在 `src/viz/`、精简后的 `llm`、与主视图 `App.tsx`。

```
src/viz/
├── types.ts        merge Hermes 的 Knob/Checkpoint/Lesson（保留 VizExperiment/Dataset，正交不动）
├── lessons/
│   ├── data.ts        LESSONS 数组（切片 1 只含 overfitting；其余 lesson 后续增量）
│   ├── runner.ts      lesson 状态机：当前 knob 值、checkpoint 判定、进度
│   └── LessonView.tsx 渲染「讲/做/悟」三段 + knob 面板
├── charts/
│   ├── ChartCanvas.tsx  ECharts 6 封装（option 进、图出、随 knob 重绘）
│   └── registry.ts      chartType → option 构造（切片 1: line+scatter）
├── analysis/
│   └── ridge.ts       纯 TS：ridgeFit / predict / 高斯消元 solve / 归一化 / MSE / 粗糙度
├── datasets/
│   └── sinNoise.ts    内置 sin+noise 数据生成（对应 polynomial_fit.py gen_data）
├── sandbox/
│   └── state.ts       实验状态容器：当前 knob 值 + 模型结果，跨 lesson 累积；错误捕获
└── tutor/
    └── vizTools.ts    AI 助教受限工具（readState / setChart / gradeOpen）
```

**决策**：
- 切片 1 建模**纯 TS 零依赖**（Ridge 正规方程），照搬 `overfitting.html` 已验证逻辑，契合"揭示原理"教学风格。
- 模块边界清晰：`sandbox/state` 是实验状态唯一真相源；`lessons/runner` 推进与判定；`tutor` 是 AI 与沙盒间受控边界。
- knob 面板由 `LessonView` 读 `Lesson.knobs` **自动生成**，无需为每课写 UI。

## 5. 内容模型（采用 Hermes schema）

merge 进 `src/viz/types.ts`（逐字采用 `hermes-work/code/lessons.ts` 的类型）：

```ts
interface Knob {
  id: string; label: string;
  kind: 'slider' | 'toggle' | 'select' | 'button';
  bindParam: string;                 // 绑定模型参数名，驱动重算
  default: number | boolean | string;
  min?: number; max?: number; step?: number;
  scale?: 'linear' | 'log';          // λ 这类跨数量级必须 'log'
  options?: { value: string; label: string }[];
  unit?: string; hint?: string;
}
interface Checkpoint { id: string; prompt: string; verify: string }
interface Lesson {
  id: string; act: 0 | 1 | 2 | 3; title: string;
  hook: string;                      // 讲
  chartType: string; datasetId: string;
  knobs: Knob[];                     // 做
  ahaMoment: string; takeaway: string; // 悟
  checkpoint?: Checkpoint;
  aiHints: string[];                 // AI 助教在"悟"环节切入点
  refSlides: string[];               // 回指 vizmodeling PDF（可追溯）
  estMinutes: number;
}
```

**进度/快照**：`VizExperiment.config` 承接 knob 当前值快照（学员作品保存），落 IndexedDB。
**检查点判定**：`Checkpoint.verify` 的文字描述在 `runner.ts` 落成代码（如过拟合：`trainMSE < τ1 && roughness > τ2`，调 λ 后 `roughness` 显著下降）。

## 6. AI 助教集成（工具调用边界）

复用 JetBot agent loop。**LLM provider 精简为单一 DeepSeek v4**（砍多 provider 抽象），继承密钥 UI 简化为「一个 DeepSeek API Key + flash/pro 切换」。flash 省钱日常、pro 攻坚；走 OpenAI 兼容端点（现有 `OpenAICompatibleClient` 已支持 DeepSeek thinking/reasoning），key 与开关存 localStorage + zustand。

助教受限工具（`tutor/vizTools.ts`，按现有 `Tool` 工厂模式 + 注册到 `ToolRegistry`）：
- `read_viz_state()` 读当前 lesson / knob 值 / 模型结果（trainMSE、真值MSE、粗糙度）
- `grade_open(answer)` 对开放题给启发式点评（不判对错）

助教在"悟"环节由 `aiHints` 驱动切入。**约束（教学可控红线）**：助教不能跳过 checkpoint、不能改 lesson 数据——只读状态 + 点评。

## 7. 数据流

```
LESSONS 数据 → runner(当前 lesson + knob 值: 唯一真相源 in sandbox/state)
  knob 改变 → analysis/ridge 重算(fit/predict/MSE/roughness) → registry 造 option → ChartCanvas 重绘
            → runner 判定 checkpoint(闭合型程序化 / 开放型 AI 点评)
  tutor 经受限工具读 state → 在"悟"环节点评
过 checkpoint / knob 快照 → 落 IndexedDB(进度持久化)
```

## 8. 错误处理（质量红线）

- 建模/渲染异常在 `sandbox/state` 捕获并友好提示，**不白屏**。Ridge 高阶时范德蒙德矩阵病态——**x 必须归一化到 [-1,1]**（原型已处理），并对奇异矩阵兜底。
- DeepSeek 调用失败：复用现有 `OpenAICompatibleClient` 重试 + 错误分类（AUTH/RATE_LIMIT/NETWORK/SERVER/TIMEOUT），UI 降级提示。
- Lesson 数据加载 schema 校验，坏数据**早失败**于开发期。
- 开放型 checkpoint 永不阻塞——即使 AI 点评失败学员也能继续。

## 9. 测试策略（TDD + vitest）

引入 vitest。遵循 TDD：先写判定测试再实现。
- **优先单测（纯函数）**：
  - `analysis/ridge`：用 §3 已验证数值基线作断言（4 场景的 trainMSE/真值MSE 落在容差内；归一化防病态）。
  - `lessons/runner`：knob 改变推进、过拟合 checkpoint 判定、knob 快照累积。
  - `datasets/sinNoise`：确定性生成（固定种子）。
- **轻量冒烟**：`ChartCanvas` 能渲染、布局 A↔B 折叠、AI 工具调用 mock 链路。
- 关键路径必须有测试；UI 细节不追求全覆盖。

## 10. 后续切片（非本次范围，记录方向）

1. **逐 lesson 增量**（schema 已就绪）：开场 Anscombe → 分布 KDE → 高维困境 → **聚类**(ml-kmeans + 自实现 MeanShift/MOG) → **降维**(ml-pca/tsne-js/umap-js) → 收束×AI。聚类/降维落地时按 `hermes-work/design/vizmodeling-mapping.md` 照搬已验证库。
2. **Bike-Sharing EDA lesson**（散点图矩阵/平行坐标支线，承接用户诉求）。
3. **切片 2：Blockly** 拖拽编程（积木 ⇄ option），开放搭建。
4. 课程编写器 UI；多课程 / 学习路径知识图谱视图（Cosmos 演化）。
5. 数据集上传（复用 FileBridge/VirtualFS）。

## 11. 收尾待办 + Hermes 交接物整合

- 把 `hermes-work/code/lessons.ts` 的类型 merge 进 `src/viz/types.ts`，`LESSONS` 移入 `src/viz/lessons/data.ts`（切片 1 先只启用 overfitting 单元，其余保留为数据待后续 lesson 实现）。
- 把 `hermes-work/code/prototypes/overfitting.html` 的 Ridge 算法重写为 `src/viz/analysis/ridge.ts`（React+ECharts 适配），数值与原型对齐。
- `../_vizmodeling-reference/` 为只读参照系，后续聚类/降维 lesson 移植时逐行对照、任何换库/改参在 mapping 表登记。
- 重命名 `src/agent/jetbot.md` → `vizdao.md` 重写人格；清理残留 "JetBot" 品牌字串。
- 添加 ECharts 6 + vitest 依赖。
- 建 GitHub 私有仓库。
- `hermes-work/` 目前未纳入 git（且已被 `.superpowers/` 之外的工作区忽略策略影响）——整合完成后可删除或归档。
