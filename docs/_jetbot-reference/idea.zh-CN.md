# 项目缘起

[English](idea.md)

> 2026-03-16

## 想法

基于 TrueConsole（Rust 实现的 AI Agent）的成功经验，JetBot 项目应运而生：

- **核心思路**：将 TrueConsole 的 Agent 执行逻辑用 TypeScript 重新实现，编译为 JavaScript，直接在浏览器中运行
- **关键突破**：无需安装、无需部署——打开网页即用，微信浏览器中亦可运行
- **战略价值**：零门槛使用，便于快速扩展影响力

## 设计参考

| 项目 | 借鉴之处 |
|------|---------|
| **TrueConsole** | Agent 核心逻辑：工具循环、熔断器、上下文管理、技能系统 |
| **ZeroClaw** | 分层架构思想 |
| **NanoClaw** | TypeScript 实现参考 |

## 核心赌注

> 浏览器的能力已足以承载一个完整的 AI Agent——
> IndexedDB 做文件系统，fetch 调 LLM API，Canvas 做可视化。
> 唯一需要的外部依赖，是一个 LLM API 端点。

详见 [设计文档](design.zh-CN.md) 的完整可行性分析与架构设计。
