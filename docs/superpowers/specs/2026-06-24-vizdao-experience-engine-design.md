# ViZDao 重构纲领（v2）：道·器·魂 与 两个乐章

> 状态：设计提案（待用户复核）· 日期：2026-06-24 · 方法论：道器合一「观→谋」
>
> 项目的**灵魂文件**。一切单元、视觉、交互、Agent，皆以此为尺。
> 立意：**「我建了一个模型，它好不好？—— 看一眼就知道。」**
> 铁律：**深逻辑先于美学；美学是逻辑的诚实结果（Weniger, aber besser）。**

---

## 0. 初心：三层，缺一不可

为行业继续教育学员（税务/电网/移动；离开大学、不擅编程、有强专业背景）做一台**零安装的实操训练台**。但"实操训练"的真意藏在三层里，前一版纲领只挖到第一层：

```
道（教学法）  把概念演成一次有包袱的经历——讲做悟、设赌揭悟、抖包袱。
器（工作台）  左=意图(语言/GUI, 代码缩进)、右=开放的多视图联动——真正的视觉分析空间。
魂（能动性）  助教是会操作工具的 AI 协同分析者(co-analyst)，不是聊天框。底座必是会用器的 AI。
```

**为什么是 JetBot（魂）**：不是为复用持久层，而是因为 JetBot 是**活在浏览器里的 AI Agent**——会调用工具、写并运行代码、渲染、记忆、自我蒸馏。重启炉灶 = 押注「**数据分析的未来是人驾驭 AI 智能体去操作工具**」，要教的正是这种新素养。只有 agentic 的底座，才能成为"和学员共用工作台、亲手操作工具"的 AI 同伴；图表库永远做不到。（其记忆+技能蒸馏+Cosmos 还意味着平台**随使用生长、认识学员**，Cosmos 演化为学习路径/知识图谱。）

**最早的界面（器）**：左=意图非语法（学员表达意图、指挥 AI，不与分号搏斗；Blockly 同理）；右=**多视图联动**——visual analytics 的本体：多个协调视图、刷选联动，让现象从多角度现形。左退右进的两态，是界面在说"让位给思考与发现"。

**微知道 / 道器合一**：见**微**（小小的、被设计过的火花）→ **知道**（真懂了——因为你接着做了真实的、指挥 AI 的分析）。「知道」＝to know，也是「知·道」。教的就是：让行业人**以分析之道，驾驭 AI 与可视化之器**。平台本身必须是道器合一的活体。

---

## 1. 单元 = 两个乐章（课·微 → 训·知道）

一个单元不是一个乐章，是两个；**前者挣得后者**：

```
课（微）：设·赌·揭·悟  —— 脚本化的戏剧弧线，把概念演成一次抖包袱。
          先被点醒"为什么"。               （Concept Player：Stage + Beat + Ledger）
   ↓ 交棒：「现在，轮到你和 AI 一起，对真数据下手。」
训（知道）：行 —— 开放的 AI 协同工作台。你**真的去分析一份真数据**：
          表达意图→Agent 操作工具→右侧多视图联动→AI 生成与点评。带一个有赌注的任务。
                                          （Practice Workbench：Agent + 分析工具 + 多视图 + 任务）
```

「行」不再是一个旋钮，而是**那张开放工作台**。这才是"实操训练"：真思考、真操作、真体验，AI 做同伴。

---

## 2. 引擎架构（两个子系统 + 清晰边界）

### 2.1 课 · Concept Player（脚本化，把时间与"门"变一等公民）

```
Stage   舞台：贯穿全乐章、不重建只变形的可视化 surface；对外只收"指令(Directive)"，
        自负全部渲染与平滑过渡（showScatter('IV') / dropRegLine() / enableDrag('p8') / morph(...)）。
Beat    一拍：{kind, 旁白, 进入时的 Stage 指令, 推进条件}；永不碰像素，只发意图。
Ledger  账本：记住学员每次承诺(预测)，供 Reveal 个性化回指（"你刚赌了 X"）。
Player  放映机(通用)：一次只现一拍，渲染旁白+恰当交互件，进入发指令、监听推进。
```
五拍语法：设 Frame / 赌 Predict(必承诺才解锁) / 揭 Reveal(抖包袱) / 悟 Reflect。

### 2.2 训 · Practice Workbench（开放、agentic，道器合一的本体）

```
Intent      左栏：学员用语言/GUI 表达分析意图（代码缩进、不写语法）。
Tutor-Agent 复用 JetBot Agent loop；配一套**分析工具带(analysis toolbelt)**——这是新核心：
            add_view(spec) / set_encoding / filter / link_selection / summarize / critique …
            学员说"画租车量随气温、按工作日分组"，Agent 调工具把视图搭出来；并能生成示例、点评学员作品。
ViewBus     多视图容器：≥2 个协调视图共享数据与**选择(brushing-linking)**；刷一个视图，其余联动高亮。
Mission     任务：给开放探索一个赌注，破"走马观花"——
            如「找出 Bike-Sharing 里最反直觉的一条规律，并为它辩护」。
Ledger++    继续记录学员的发现/假设，供点评与（未来）Cosmos 知识图谱沉淀。
```

**优雅降级**：未填 DeepSeek key 时，工作台仍可用 GUI 手动搭视图与刷选；AI 协同为增强项（填 key 解锁）。

**为什么这套逻辑自动满足美学**：一屏一事 ← Player 一次一拍；可视化是主角、chrome 退场 ← Stage/ViewBus 是持续 surface，旁白与控件至简；动效只为揭示 ← 变形是 Reveal 的显式指令；学员是主角 ← Predict 设门、Mission 设赌、Agent 让"行"真有产出；电影感 ← Stage 不重建只变形。

接口骨架（实现落为 TS）：
```ts
interface Unit { id; title; concept: { stage: StageComponent; beats: Beat[] }; practice: PracticeSpec }
type Beat =
  | { kind:'frame';   say:string;                       enter?:Directive[] }
  | { kind:'predict'; say:string; commit:Commitment;    enter?:Directive[] }
  | { kind:'reveal';  say:(l:Ledger)=>string;           enter:Directive[] }
  | { kind:'reflect'; say:string; aiPrompt?:string };
interface PracticeSpec { datasetId:string; mission:string; views:ViewSpec[]; tools:ToolName[]; aiHints:string[] }
// 通用：Player/Ledger/推进/ViewBus/分析工具带；每单元自带：Stage+beats（课）与 PracticeSpec（训）。
```

---

## 3. 美学即令牌（从原则推导，不外贴）

Dieter Rams「尽可能少的设计」落成**极少且固定**的令牌，全站统一，如一件博朗电器：
- **字**：一套字阶(模数比~1.25)，旁白大而安静、行宽~60–72 字符；排版承担叙事。
- **空**：基线网格；Stage/ViewBus 全幅出血；留白是默认态。
- **色**：近单色基底 + **唯一强调色**(此刻该看的东西)；分类色板仅数据要求时登场且克制。数据墨水压过装饰墨水。
- **动**：一条缓动曲线 + 三档时长 `即时 / 快(200ms) / 揭示(600–900ms)`；揭示用长档，其余快或即时。
- **诚实**：真数据、真数学。令牌少到能一眼记住——克制本身的证明。

---

## 4. 内容主线（一条河：Bike-Sharing 为脊）

- **冷开场·安斯库姆（纯课）**：立论点「看见>计算」。交棒：「现在用这双眼睛查一份真数据——城市单车。」
- **Bike-Sharing 成为后续单元的共同舞台**，技术因问题登场；每单元 = 一段课(概念) + 一段训(在 bike 数据上的真分析)：

| 单元 | 课(概念·抖包袱) | 训(在 Bike-Sharing 上指挥 AI 真分析) |
|------|----------------|--------------------------------------|
| 过拟合 | 阶数一高曲线荒腔走板 | 用真数据拟合租车量~气温/时段，自己调阶/正则，AI 点评 |
| 分布 | 直方图随分桶变脸 | 看租车量分布、按时段切片，多视图联动 |
| 高维困境 | 4 维看不全 | 一天十几个特征：搭多视图找"哪些维度在说话" |
| 聚类 | K 给错切碎真实群 | 把 731 天聚成"通勤/休闲/恶劣天气"型，为命名辩护 |
| 降维 | 线性投影是糨糊 | 把多特征的日子压成 2D 找相似日（t-SNE 手写数字解团降为彩蛋/对照） |
| 收束 | —— | 把整趟调查丢给 AI 助教解读，沉淀进 Cosmos |

- **后续**：同一引擎接入**税务数据集**——换数据即得新课，引擎不动。

---

## 5. 第一个子项目（样板先行，证明整个灵魂）

样板必须证明**三层都在、两个乐章都通**，否则只是漂亮的互动教科书。

**子项目 1 = 引擎(两乐章, 最小) + 开篇样板单元：**
- **课**：安斯库姆全套设赌揭悟（含 morph/落线/可拖拽），抖包袱复活。
- **交棒** → **训**：在 **Bike-Sharing**（先内置一个小子集）上的最小开放工作台——
  - 左：学员输入意图；**Tutor-Agent 复用 JetBot agent**，配 ≥3 个分析工具（`add_view`/`set_encoding`/`link_selection`）把视图搭出来；
  - 右：**≥2 个协调视图 + 刷选联动**；
  - 一个**任务**给它赌注；未填 key 时 GUI 手动可用、AI 为增强。
- **令牌**：落地字·空·色·动。
- 把开篇样板登记进导航替换旧版；**旧七单元保持在线不动**，逐个替换。

**不做（后续子项目）**：Bike-Sharing 全量与其余单元重铸；税务数据集；Cosmos 知识图谱沉淀；Blockly 式 GUI 意图编辑。

---

## 6. 与现有代码的关系

- **并行新建，逐个替换**：新引擎落 `src/viz/engine/`(Player/Beat/Ledger/ViewBus/tokens) 与 `src/viz/units/`(每单元=Stage+beats+PracticeSpec)；`registry` 在某单元重生后切其入口，其余仍指旧 `lessons/*`，**线上始终可用**。
- **正位复用**：JetBot 的 **Agent loop + ToolRegistry**（`src/agent`、`src/tools`）是"魂"，给它加**分析工具带**即成 co-analyst；纯算法（ridge/pca/kmeans/kde/tsne）是诚实的道具，原样复用；`ChartCanvas` 思路供 Stage/视图内部沿用。
- **退役**：旧 `lessons/*` 随替换逐个退役；此前"字形/补间"实验已作废、工作树已清。

---

## 7. 测试策略

- **纯逻辑优先**：Player 推进(未承诺不解锁)、Ledger 记忆与回指、推进条件、ViewBus 选择联动、分析工具执行——纯函数单测。
- **Agent 边界**：分析工具的 execute（add_view/link 等）对 ViewBus 的作用可测；Agent 链路 mock。
- **冒烟 + 浏览器实测**：Stage 指令→视觉态切换；样板"一拍拍走通 + 交棒进工作台 + 刷选联动"端到端**浏览器实测**（吸取教训：单测 mock 渲染层，覆盖不到真库/真画布）。

---

## 8. 后续子项目（仅记录方向）

1. Bike-Sharing 全量接入（UCI day/hour）+ 过拟合单元重铸为河的第一支流。
2. 其余单元逐个重铸于同一引擎（课+训）。
3. 税务数据集换皮成课。
4. Cosmos 演化为学习路径/知识图谱：沉淀学员的发现与假设。
5. Blockly 式无语法意图编辑，作为"左栏意图"的第二形态。
6. 设计令牌固化为可校验主题层；动效曲线统一。

See [[vizdao-positioning]] [[vizdao-architecture-decisions]] [[vizdao-collaboration-style]] [[vizdao-3h-course]]。
