# ViZDao · 微知道

**在线零安装的数据可视化教学实验小平台。**

> 「微」见小而入微，「知道」既是 *to know*，又暗合「知·道」。谦逊但有味道，不卑不亢。

ViZDao 以 [JetBot](../JetBot) 为基线起点改造而来：一个完全运行在浏览器中的可视化教学实验平台。打开网页即用 —— 无后端、无部署、无安装。学生在沙盒里写图表、调数据、闯关学习；内置的 **AI 助教**（可插拔，默认开启）在一旁解释配置、生成示例、点评作品。

## 项目状态

🚧 **框架搭建阶段** —— 当前为可运行的空骨架 + 占位的可视化模块目录。实质设计待头脑风暴与深入规划阶段填充。

- ✅ 从 JetBot 克隆并重命名（`vizdao` 包、`ViZDao · 微知道` 标题、独立 IndexedDB）
- ✅ 保留可复用基础设施：IndexedDB 持久层、UI shell、i18n 双语、zustand store、scheduler、CORS proxy worker
- ✅ AI Agent 内核保留为**可插拔助教模块**
- ✅ 新增可视化核心占位目录 `src/viz/`（charts / editor / datasets / sandbox / lessons）
- ⬜ 头脑风暴：产品形态与教学路径
- ⬜ 深入规划：模块设计与实现计划

## 快速开始

```bash
cd ViZDao/vizdao
npm install
npm run dev
```

> 注：当前主视图仍是 JetBot 的聊天/Cosmos 界面（基线遗留），将在后续阶段改造为以图表实验为中心。

## 技术栈

React 19 · Vite 8 · TypeScript 5.9 · Tailwind 4 · Zustand 5 · idb (IndexedDB) · ECharts 6（规划中）

## 目录结构

```
ViZDao/
├── vizdao/                  # 应用主体（基于 JetBot）
│   └── src/
│       ├── viz/             # ★ 可视化教学核心（占位骨架）
│       │   ├── charts/      #   图表引擎封装 + 类型注册表
│       │   ├── editor/      #   配置/代码编辑器
│       │   ├── datasets/    #   数据集管理
│       │   ├── sandbox/     #   实验沙盒
│       │   └── lessons/     #   教学单元
│       ├── agent/ llm/ tools/ skills/   # 可插拔 AI 助教（来自 JetBot）
│       ├── store/ lib/ components/       # UI shell + 持久层（复用）
│       └── ...
├── docs/
│   ├── _jetbot-reference/   # JetBot 原始文档（基线参考）
│   └── plans/               # ViZDao 规划文档（待填充）
└── CLAUDE.md                # 道器合一方法论
```

## 设计哲学

> **道器合一** —— 以百家智慧驾驭 AI 工具，思行并进，人机协同。

详见 [CLAUDE.md](CLAUDE.md)。

## 作者

**Hongxin Zhang** · 基于 [JetBot](../JetBot) 改造

## License

MIT
