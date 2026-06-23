# ViZDao 切片 1 设计：Bike-Sharing 大数据建模实操课

> 状态：设计定稿（待用户复核）· 日期：2026-06-23 · 方法论：道器合一「观→谋」
>
> 背景记忆见 `~/.claude/projects/.../ViZDao/memory/`；本文档随仓库走，保证任何目录打开都有上下文。

## 1. 目标与定位

ViZDao（微知道）是**在线零安装的数据可视化/建模教学实验平台**——打开网页即用，无后端、无部署、无安装。本切片是其**第一个端到端垂直切片**。

**目标用户**：接受继续教育的行业学员（税务、移动通讯、国家电网等）。专业背景强、有一定计算机操作水平，但长期离开大学、编程能力一般；强烈希望掌握可视化、大数据、AI 方法来解决业务实际问题。设计须**降低摩擦、鼓励试验、减少挫败感**。

**切片目标**：交付一个能跑完**一场 3 小时 Bike-Sharing 大数据建模实操课**的最薄完整体验，验证"课程运行时 + 图表 + 浏览器端建模 + AI 助教 + 双检查点 + 一套布局两态"整条链路。

## 2. 范围边界

**包含（In）：**
1. **一套布局两态**：A 展开（左 AI对话+GUI / 右结果画布）↔ 折叠键 ↔ B 收起细轨（画布占满）。多视图联动做最简版（画布支持 1～2 视图）。
2. **课程运行时**：加载一门**硬编码课程**（Bike-Sharing），按 课程→案例→步骤→检查点 推进，实验状态跨步骤累积。课程以数据文件形式存在（不做课程编写器 UI）。
3. **图表层**：接入 ECharts 6，封装 `<ChartCanvas>` + 小注册表（柱/折线/散点/平行坐标）。
4. **浏览器端建模**：EDA 统计 + 关联/相关分析 + 一个进阶关 K-Means 聚类。纯 TS、零后端。
5. **AI 助教**：DeepSeek v4（flash/pro 开关），能讲解 / 生成图表配置 / 点评开放题，经工具调用读写实验状态。
6. **双检查点**：闭合型自动判定 + 开放型 AI 点评不卡关。
7. **持久化**：复用 IndexedDB（`lib/db.ts`）存课程进度与实验状态。

**不做（Out，留后续切片）：**
- ❌ Blockly 拖拽编程（切片 2 专项攻坚）
- ❌ 课程编写器 UI（先硬编码）
- ❌ 多课程管理 / 学习路径知识图谱视图
- ❌ 数据集上传（先用内置 Bike-Sharing）
- ❌ 重型建模（t-SNE/UMAP 降维、预测模型等）

## 3. 主线案例：Bike-Sharing

UCI 经典集（按小时/天的租车量 + 天气/季节/时段特征），难度适中、易切入。教学链路：

```
数据接入 → EDA(分布/时序) → 多维可视化(关联分析：温度↔租量、时段↔租量)
        → 钻取分类 →〔进阶关：K-Means 聚类〕
```

呼应作者教学方法论（"向量化方法/三板斧"、揭示算法原理）。内容养料：Colin Ware《Information Visualization》、Munzner《Visualization Analysis and Design》、《鲜活的数据》、作者课件（云南移动/杭州税务 2026）。

## 4. 架构与模块

复用 JetBot 基础设施（IndexedDB 持久层、UI shell、i18n 双语、zustand、scheduler、CORS proxy worker、CI）不动。新增/改造集中在 `src/viz/` 与精简后的 `agent/llm`。

```
src/viz/
├── course/        课程运行时
│   ├── model.ts       Course/Case/Step/Checkpoint 类型 + 校验
│   ├── runner.ts      推进逻辑、状态机、检查点判定
│   └── courses/       内置课程数据（bike-sharing.ts，硬编码 TS 模块）
├── charts/        ChartCanvas(ECharts 6 封装) + chartRegistry(柱/折线/散点/平行坐标)
├── datasets/      内置数据集加载 + 列 schema 推断（Bike-Sharing 打包）
├── analysis/      浏览器端建模：EDA 统计、相关/关联、K-Means（纯 TS，零依赖）
├── sandbox/       实验状态容器：当前数据/图表/模型结果，跨步骤累积；错误捕获
├── tutor/         AI 助教边界层：把 agent/llm 包成"可视化助教"，定义受限工具集
└── types.ts       跨模块共享类型（升级现有占位）
```

**决策**：
- 建模算法**手写轻量纯 TS 实现**（K-Means、相关系数），不引第三方数值库——切片 1 数据量小，零依赖且契合"揭示原理"的教学风格（学员能看到算法本身）。
- 模块边界清晰、各司其职：`sandbox` 是实验状态唯一真相源；`course/runner` 是推进与判定；`tutor` 是 AI 与沙盒之间的受控边界。

## 5. 课程内容模型

```ts
interface Course { id: string; title: string; objective: string; datasetIds: string[]; cases: Case[] }
interface Case   { id: string; title: string; brief: string /* md */; steps: Step[] }
interface Step {
  id: string;
  title: string;
  narrative: string;            // md，AI 助教可展开/追问
  datasetId?: string;
  starter?: ExperimentState;    // 该步初始状态（可继承上一步产出）
  checkpoint: Checkpoint;
}
type Checkpoint =
  | { kind: 'closed'; verify: VerifySpec; hint?: string }   // 程序化判定，过关即正反馈
  | { kind: 'open';   prompt: string }                      // AI 启发式点评，永不阻塞前进
interface ExperimentState {
  datasetId?: string;
  transforms?: Transform[];     // 清洗/变换链
  chartOption?: unknown;        // 当前 ECharts option
  modelResult?: ModelResult;    // 当前建模产出（如 K-Means 簇标签）
}
```

**决策**：
- **课程数据用 TS 模块**（`bike-sharing.ts`）起步——有类型检查、可写函数式断言；定稿后若做编写器再抽 JSON + DSL。
- **闭合型检查点用声明式断言**（`VerifySpec`，如 `{ requires:['chart:scatter','model:kmeans'], assert:{ 'option.series[0].type':'scatter' } }`），让检查点是数据而非代码，便于将来编写器化。

## 6. AI 助教集成（工具调用边界）

复用 JetBot agent loop。**LLM provider 精简为单一 DeepSeek v4**（砍掉多 provider 抽象），继承密钥填写 UI 但简化为「一个 DeepSeek API Key + flash/pro 切换」。flash 省钱日常用、pro 攻坚用；走 OpenAI 兼容端点，密钥与开关存浏览器端（zustand + IndexedDB）。

助教获得一组**受限工具**操作沙盒：
- `readState()` 读当前数据/图表/模型
- `describeDataset()` 读列 schema
- `setChart(option)` 生成/修改 ECharts 配置
- `runModel(kind, params)` 跑 K-Means / 相关分析
- `gradeOpen(answer)` 对开放题给启发式点评（不判对错）

**约束（教学可控红线）**：助教**不能**跳过检查点、不能改课程脚本——只在沙盒内动手。

## 7. 数据流

```
课程数据(TS) → runner(当前步) → sandbox(实验状态：唯一真相源)
                                   ├→ ChartCanvas 渲染
                                   ├→ tutor 读取/写入(经受限工具)
                                   └→ 学员 GUI/对话操作写回
过检查点 → runner 判定(闭合型程序化 / 开放型 AI 点评) → 进度落 IndexedDB
```

## 8. 错误处理（质量红线）

- 建模/渲染异常在 `sandbox` 捕获并友好提示，**不白屏**。
- DeepSeek 调用失败：重试 + 降级提示，区分网络/鉴权/额度错误。
- 课程数据加载用 schema 校验，坏数据**早失败**（fail fast）于开发期。
- 开放型检查点永不阻塞——即使 AI 点评失败，学员也能继续。

## 9. 测试策略

遵循 TDD：先写判定逻辑测试再实现。
- **优先单测**（纯函数）：`analysis`（K-Means、相关系数正确性）、`course/runner`（推进、闭合型检查点判定、状态累积）。
- **轻量冒烟**：`ChartCanvas` 能渲染、布局 A↔B 折叠切换、AI 工具调用 mock 链路。
- 关键路径必须有测试覆盖；UI 细节不追求全覆盖。

## 10. 后续切片（非本次范围，仅记录方向）

1. **切片 2**：Blockly 拖拽编程（积木 ⇄ option 双向映射），实验性低门槛编辑器。
2. 课程编写器 UI + JSON 课程格式。
3. 多课程 / 学习路径知识图谱视图（Cosmos 视图演化）。
4. 数据集上传与清洗（复用 FileBridge/VirtualFS）。
5. 重型建模（降维、预测）。

## 11. 收尾待办（设计定稿后）

- 重命名 `src/agent/jetbot.md` → `vizdao.md` 并重写助教人格。
- 清理残留 "JetBot" 品牌字串（i18n / WelcomeScreen / MessageBubble）。
- 添加 ECharts 6 依赖。
- 建 GitHub 私有仓库。
