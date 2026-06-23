# ViZDao · 微知道

**在线零安装的数据可视化教学实验小平台。**

🌐 **在线体验 → https://hongxin.github.io/ViZDao/**　（打开网页即用，无需安装）

> 「微」见小而入微，「知道」既是 *to know*，又暗合「知·道」。谦逊但有味道，不卑不亢。

ViZDao 以 [JetBot](../JetBot) 为基线起点改造而来：一个完全运行在浏览器中的可视化教学实验平台。打开网页即用 —— 无后端、无部署、无安装。学生在沙盒里写图表、调数据、闯关学习；内置的 **AI 助教**（可插拔，默认开启）在一旁解释配置、生成示例、点评作品。

## 项目状态

🚀 **首个教学切片已上线** —— 「过拟合 Lesson · 让模型现形」：拖动旋钮（多项式阶数 / 正则 λ / 噪声），ECharts 即时重绘，一眼看见过拟合、用正则一键驯服；内置 **AI 助教**（DeepSeek，可插拔）在「悟」环节点评。

- ✅ 从 JetBot 克隆并重命名（`vizdao` 包、独立 IndexedDB、可插拔 AI 助教内核、复用持久层/UI/i18n/CI）
- ✅ 头脑风暴 + 深入规划：产品形态、教学闭环（旋钮 → 即时重绘 → 直觉，「讲做悟」）、内容模型
- ✅ 切片 1：过拟合 Lesson 端到端（建模 / 数据 / 图表 / 运行时 / 双检查点 / AI 助教 / 一套布局两态），TDD、34 测试通过
- ✅ GitHub Pages 自动部署（push `main` 即发布）
- ⬜ 后续 lesson：Anscombe 四重奏 / 分布 KDE / 高维困境 / 聚类 / 降维 / 收束×AI
- ⬜ Blockly 拖拽编程、课程编写器、Bike-Sharing EDA 支线

## 快速开始

```bash
cd ViZDao/vizdao
npm install
npm run dev
```

> 主视图为「一套布局两态」的实验工作台：左侧讲做悟 + 旋钮面板，右侧图表画布，可一键折叠。首个 lesson 为过拟合。

## 技术栈

React 19 · Vite 8 · TypeScript 5.9 · Tailwind 4 · Zustand 5 · idb (IndexedDB) · ECharts 6 · Vitest

## 目录结构

```
ViZDao/
├── vizdao/                  # 应用主体（基于 JetBot）
│   └── src/
│       ├── viz/             # ★ 可视化教学核心
│       │   ├── charts/      #   ECharts 封装 + 图表注册表
│       │   ├── analysis/    #   浏览器端建模（Ridge 回归…）
│       │   ├── datasets/    #   数据集（sin+noise…）
│       │   ├── lessons/     #   教学单元 + 运行时（讲做悟）
│       │   └── tutor/       #   AI 助教受限工具
│       ├── agent/ llm/ tools/ skills/   # 可插拔 AI 助教（来自 JetBot）
│       ├── store/ lib/ components/       # UI shell + 持久层（复用）
│       └── ...
├── docs/
│   ├── _jetbot-reference/   # JetBot 原始文档（基线参考）
│   └── superpowers/         # 设计 spec 与实施计划（specs/ + plans/）
├── .github/workflows/       # CI + GitHub Pages 自动部署
└── CLAUDE.md                # 道器合一方法论
```

## 设计哲学

> **道器合一** —— 以百家智慧驾驭 AI 工具，思行并进，人机协同。

详见 [CLAUDE.md](CLAUDE.md)。

## 作者

**Hongxin Zhang** · 基于 [JetBot](../JetBot) 改造

## License

MIT
