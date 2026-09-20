# 泥球的黄金回旋 MVP Implementation Plan

> **For agentic workers:** Inline execution in this session. User already said 开工.

**Goal:** 做出可在 Cocos Creator 3.8.8 打开、竖屏可玩的微信小游戏第一期。

**Architecture:** 从官方 empty-2d 模板复制工程。单场景 + `GameApp` 运行时搭建加载/首页/局内。图4、图5做背景热区。核心数值与碰撞抽成纯逻辑，便于用 Node 跑测试。

**Tech Stack:** Cocos Creator 3.8.8, TypeScript, 微信小游戏构建, 竖屏 750×1334

## Global Constraints

- 工程目录：`golden-roll/`
- 不做签到/商店/排行/多地图
- 风格必须对照 `docs/design-refs/04-style-loading.jpg` 与 `05-style-home.jpg`

### Task 1: 工程骨架与资源

- Create: `golden-roll/` 全部工程文件、切片资源、脚本、场景

### Task 2: 核心玩法与界面

- Loading → Home → Game → Result
- 摇杆、障碍、收集、结算

### Task 3: 验证

- 核心逻辑 Node 测试
- 尝试 Creator 命令行构建或说明用编辑器打开预览
