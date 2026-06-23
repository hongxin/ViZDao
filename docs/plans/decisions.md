# ViZDao 决策记录

> 随项目走的决策备份。Claude 项目记忆见 `~/.claude/projects/.../ViZDao/memory/`，
> 此文档保证无论在哪层目录打开都能找到上下文。

## 项目定位（2026-06-23）

ViZDao（微知道）是**在线零安装的数据可视化教学实验小平台**。打开网页即用 —— 无后端、无部署、无安装。以 JetBot 为基线 fork 改造。

- 位置：`/Users/hongxin/Workspace/claude-ai-playground/ViZDao`（与 JetBot 同级），应用在 `vizdao/` 子目录，git 根为 `ViZDao/`。
- 命名：「微」见小入微 +「知道」(to know / 知·道)，谦逊有味，不卑不亢。

## 三项基线决策（2026-06-23）

1. **AI 内核 = 可插拔助教，默认开启。** 保留 JetBot 的 Agent loop + 多 provider LLM + 工具调用，重定位为「可视化助教」(讲解配置 / 生成示例 / 点评作品)，设计成可关闭(纯实验模式)。
2. **基线策略 = 克隆后裁剪。** 整体复制 JetBot，复用基础设施(IndexedDB 持久层、UI shell、i18n 双语、zustand store、scheduler、CORS proxy worker、CI)，裁剪/替换业务层语义。
3. **可视化核心 = 占位骨架** 位于 `src/viz/`(charts / editor / datasets / sandbox / lessons / types.ts)，暂无业务逻辑，留给设计阶段。

## 设计阶段待办（刻意推迟，非遗漏）

- 重命名 `src/agent/jetbot.md` → `vizdao.md` 并重写人格(被 `SystemPromptBuilder` 引用)。
- 主视图从 JetBot 聊天/Cosmos 改造为以图表实验为中心；Cosmos 可演化为「学习路径/知识图谱」视图。
- 替换 i18n / WelcomeScreen / MessageBubble 等处残留的 "JetBot" 品牌字串(设计定调后一次性处理)。
- 确定图表方案后添加 ECharts 依赖。

**刻意未迁移**：根 `.env`(JetBot 遗留模板，含真实密钥；浏览器应用密钥在 UI 客户端存储)。

## 下一步

进入 `brainstorming`：厘清目标用户、核心教学闭环(示例→改配置→看结果→检查点)、AI 助教边界(只讲解 vs 生成/批改)、主视图方向。
