# `src/viz/` — 可视化教学核心（占位骨架）

> ViZDao / 微知道 的业务核心。当前为**占位结构**，仅标注职责意图，实质设计待头脑风暴与深入规划阶段填充。

将原「编程助手」语义替换为「可视化实验」语义。AI Agent（`src/agent`、`src/llm`、`src/tools`）保留为**可插拔助教模块**，在此层之上提供解释 / 生成 / 点评能力。

## 子模块职责（待定，欢迎在 brainstorm 中重塑）

| 目录 | 职责 | 复用/新建 |
|------|------|-----------|
| `charts/` | 图表渲染引擎封装（ECharts 6）、图表类型注册表 | 新建 |
| `editor/` | 配置 / 代码编辑器（option JSON / JS），双向绑定预览 | 新建 |
| `datasets/` | 数据集管理：内置样例、上传、清洗与变换 | 新建（可复用 VirtualFS / IndexedDB） |
| `sandbox/` | 实验沙盒：实时预览、错误捕获、版本对比 | 新建（可复用 RenderPreview / js_eval） |
| `lessons/` | 教学单元：分步教程、目标、检查点、闯关 | 新建 |
| `types.ts` | 跨模块共享类型 | 新建 |

## 与原始资产的关系

- **保留**：IndexedDB 持久层（`lib/db.ts`）、UI shell、i18n 双语、zustand store、scheduler、CORS proxy worker、CI/部署
- **可插拔**：agent / llm / tools / skills —— 作为「可视化助教」
- **裁剪/改造**：聊天为中心的主视图 → 以图表实验为中心；Cosmos 视图可演化为「知识图谱 / 学习路径」视图
