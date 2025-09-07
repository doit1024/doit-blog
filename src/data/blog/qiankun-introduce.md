---
author: Doit
pubDatetime: 2022-09-23T15:22:00Z
modDatetime: 2025-06-13T16:52:45.934Z
title: Qiankun Introduce
slug: qiankun-introduce
featured: true
draft: false
tags:
  - docs
description:
  Some rules & recommendations for creating or adding new posts using AstroPaperr
  theme.
---

# 什么是 qiankun？

qiankun 是一个基于 [single-spa](https://github.com/single-spa/single-spa) 的微前端实现库，旨在帮助大家能更简单、无痛地构建一个生产可用的微前端架构系统。

qiankun 孵化自蚂蚁金融科技基于微前端架构的云产品统一接入平台，在经过大量的线上应用运行验证及打磨后，我们将其微前端内核抽取出来并开源，希望能同时帮助社区有类似需求的系统更方便的构建自己的微前端系统，同时也希望通过社区的帮助将 qiankun 打磨的更加成熟完善。

目前 qiankun 已在蚂蚁内部服务了超过 2000 个线上应用，在易用性和完整性上，绝对是值得信赖的。

## Table of contents

footnote效果测试(powered by remark-gfm)[^1]

## 💡 什么是微前端？

> 微前端是一种通过独立发布功能来让多个团队共同构建现代 Web 应用的方式。 -- 微前端

微前端架构具有以下核心价值：

- **技术栈无关** - 主框架不限制接入应用的技术栈，微应用具备完全自主权
- **独立开发、独立部署** - 微应用仓库独立，前后端可独立开发，部署完成后主框架自动完成同步更新
- **增量升级** - 面对各种复杂场景，我们通常很难对一个已经存在的系统做全量的技术栈升级或重构，而微前端是一种非常好的实施渐进式重构的手段和策略
- **独立运行时** - 每个微应用之间状态隔离，运行时状态不共享

微前端架构旨在解决单体应用在一个相对长的时间跨度下，由于参与的人员、团队的增多、变迁，从一个普通应用演变成一个巨石应用(Frontend Monolith)后，随之而来的应用不可维护的问题。这类问题在企业级 Web 应用中尤其常见。

### 传统单体应用的问题

```bash
┌─────────────────────────────────────┐
│           单体前端应用               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │模块A│ │模块B│ │模块C│ │模块D│    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│       紧密耦合，难以维护             │
└─────────────────────────────────────┘
```

### 微前端架构

```bash
┌─────────────────────────────────────┐
│              主应用                 │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│  │应用A│ │应用B│ │应用C│ │应用D│    │
│  └─────┘ └─────┘ └─────┘ └─────┘    │
│   独立开发、部署，技术栈无关         │
└─────────────────────────────────────┘
```

## 🎯 核心理念

qiankun 的核心设计理念是**去中心化运行时**，这意味着：

- **🥄 简单** - 由于主应用微应用都能做到技术栈无关，qiankun 对于用户而言只是一个类似 jQuery 的库。你需要调用几个 qiankun 的 API 即可完成应用的微前端改造。同时由于 qiankun 的 HTML Entry 及沙箱的设计，使得微应用的接入像使用 iframe 一样简单。

- **🍡 解耦/技术栈无关** - 微前端的核心目标是将巨石应用拆解成若干可以自治的松耦合微应用，而 qiankun 的诸多设计均是秉持这一原则，如 HTML Entry、沙箱、应用间通信等。这样才能确保微应用真正具备独立开发、独立运行的能力。

## 🏗️ 架构图

```javascript
/**
 * @import {Handle} from 'micromark-extension-directive'
 * @import {CompileContext} from 'micromark-util-types'
 */

import fs from 'node:fs/promises'
import {micromark} from 'micromark'
import {directive, directiveHtml} from 'micromark-extension-directive'

const output = micromark(await fs.readFile('example.md'), {
  extensions: [directive()],
  htmlExtensions: [directiveHtml({abbr})]
})

console.log(output)

/**
 * @this {CompileContext}
 * @type {Handle}
 * @returns {false | undefined}
 */
function abbr(d) {
  if (d.type !== 'textDirective') return false

  this.tag('<abbr')

  if (d.attributes && 'title' in d.attributes) {
    this.tag(' title="' + this.encode(d.attributes.title) + '"')
  }

  this.tag('>')
  this.raw(d.label || '')
  this.tag('</abbr>')
}
```

qiankun 基于以下核心能力：

### 🔄 生命周期管理
每个微应用都有完整的生命周期：
- **bootstrap** - 应用初始化
- **mount** - 应用挂载
- **unmount** - 应用卸载
- **update** - 应用更新（可选）

### 🛡️ 沙箱隔离
- **JS 隔离** - 提供多种沙箱方案，确保应用间 JS 互不影响
- **CSS 隔离** - 通过样式作用域或 Shadow DOM 实现样式隔离

### 📡 资源加载
- **HTML Entry** - 通过 HTML 作为入口加载微应用
- **预加载** - 支持应用资源预加载，提升用户体验
- **缓存** - 智能资源缓存策略

## 🤔 为什么不是 iframe？

虽然 iframe 是实现微前端最自然的方案，但它也有一些严重的限制：

- **URL 同步问题** - iframe 的 URL 和主应用的 URL 无法同步
- **UI 不一致** - iframe 处于完全隔离的上下文中，很难保持一致的 UI 样式
- **性能问题** - 每个 iframe 都会创建新的上下文，消耗更多内存和 CPU 资源
- **SEO 不友好** - 搜索引擎无法正确索引 iframe 内容
- **安全限制** - 跨域 iframe 通信存在安全限制
- **用户体验问题** - 浏览器历史记录、刷新、书签等功能存在问题

qiankun 通过提供完整的微前端解决方案来解决这些问题，既保持了 iframe 的隔离优势，又避免了其局限性。

## ✨ 功能特性

qiankun 提供以下关键特性：

- **📦 基于 single-spa** - 基于 single-spa 提供更加开箱即用的 API
- **📱 技术栈无关** - 任意 JavaScript 框架都可以使用/接入，无论是 React/Vue/Angular/jQuery 还是其他框架
- **💪 HTML Entry 接入方式** - 让你接入微应用像使用 iframe 一样简单
- **🛡️ 样式隔离** - 确保应用间样式不会相互影响
- **🧳 JS 沙箱** - 确保微应用间全局变量/事件不冲突
- **⚡ 资源预加载** - 在浏览器空闲时间预加载未打开的微应用资源，加速微应用打开速度
- **🔌 Umi 插件** - 提供了 @umijs/plugin-qiankun 供 umi 应用一键切换成微前端架构系统

## 🎯 适用场景

qiankun 特别适合以下场景：

- **大型企业应用** - 多团队协作开发
- **技术栈迁移** - 渐进式升级遗留系统
- **功能模块化** - 功能模块独立开发部署
- **第三方集成** - 集成外部应用或服务

## 🚀 开始使用

准备开始使用 qiankun？查看我们的[快速开始](/zh-CN/guide/quick-start)指南，几分钟内构建你的第一个微前端应用！

## 📚 深入学习

- [教程](/zh-CN/guide/tutorial) - 从零开始的详细教程
- [核心概念](/zh-CN/guide/concepts) - 理解 qiankun 的设计原理
- [主应用](/zh-CN/guide/main-app) - 如何配置主应用
- [微应用](/zh-CN/guide/micro-app) - 如何改造现有应用 

[^1]: remark-gfmgithub地址：[https://github.com/remarkjs/remark-gfm](https://github.com/remarkjs/remark-gfm).