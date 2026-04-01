# 产品功能命名生成器

一款使用 React、Vite 和 Tailwind CSS 构建的现代化 Web 应用，用于生成高质量的产品功能名称。

## 功能特性

- **现代化界面**：使用 React 18 和 Tailwind CSS 构建，响应式设计，美观易用
- **智能生成**：从四个维度（直白型、隐喻型、情感型、动词型）生成 10 个命名候选
- **详细分析**：每个候选包含命名理由、可行性评估和多维评分
- **对比工具**：支持最多 4 个候选并排对比
- **历史记录**：查看和加载之前的命名任务
- **导出功能**：支持 CSV 格式导出
- **实时反馈**：加载状态、错误处理、Toast 通知

## 技术栈

- **前端**：React 18, Vite, Tailwind CSS
- **状态管理**：TanStack Query (React Query)
- **后端**：Node.js HTTP Server
- **构建工具**：Vite

## 快速开始

### 环境要求

- Node.js 18+

### 安装

```bash
# 克隆仓库
git clone https://github.com/TBigDippers/productName.git
cd productName

# 安装依赖
npm install
```

### 开发

```bash
# 同时启动 API 服务和 React 开发服务器
npm start
```

这将启动：
- API 服务：`http://localhost:3000`
- React 开发服务器：`http://localhost:5173`

在浏览器中打开 `http://localhost:5173`。

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 项目结构

```text
productName/
├── index.html           # Vite 入口文件
├── package.json         # 依赖和脚本
├── vite.config.js       # Vite 配置
├── tailwind.config.js   # Tailwind CSS 配置
├── server.js            # 后端 API 服务
├── src/
│   ├── main.jsx         # React 入口
│   ├── App.jsx          # 主应用组件
│   ├── api.js           # API 客户端函数
│   ├── index.css        # Tailwind CSS 导入
│   └── components/
│       ├── Header.jsx          # 应用头部导航
│       ├── NamingForm.jsx      # 命名生成表单
│       ├── ResultsPanel.jsx    # 结果展示面板
│       ├── CandidateCard.jsx   # 候选名称卡片
│       ├── CompareDrawer.jsx   # 对比抽屉
│       ├── HistoryDialog.jsx   # 历史记录对话框
│       └── Toast.jsx           # 通知组件
├── data/                # 运行时数据存储
└── exports/             # 生成的 CSV 文件
```

## API 接口

### 生成命名

```http
POST /api/naming/generate
Content-Type: application/json
```

```json
{
  "featureDescription": "帮助用户监测商品价格变化并在降价时提醒",
  "targetUsers": ["电商消费者"],
  "brandTone": ["reliable", "warm"],
  "namingPreference": ["concise"],
  "industry": "ecommerce",
  "language": "en-US",
  "dimensionWeight": {
    "direct": 0.3,
    "metaphor": 0.2,
    "emotional": 0.2,
    "action": 0.3
  }
}
```

### 获取配置

```http
GET /api/naming/config
```

### 查看历史

```http
GET /api/naming/tasks
```

### 对比候选

```http
POST /api/naming/compare
Content-Type: application/json
```

```json
{
  "taskId": "task_xxx",
  "candidateIds": ["cand_1", "cand_2", "cand_3"]
}
```

### 导出结果

```http
POST /api/naming/export
Content-Type: application/json
```

```json
{
  "taskId": "task_xxx",
  "format": "csv"
}
```

## 评分模型

| 维度 | 权重 | 说明 |
| --- | --- | --- |
| 清晰度 | 25% | 用户能否快速理解名称含义 |
| 品牌契合度 | 20% | 是否符合所选品牌调性 |
| 记忆度 | 20% | 是否容易记住 |
| 传播性 | 15% | 是否适合口头传播与分享 |
| 独特性 | 10% | 是否具有辨识度 |
| 可注册性 | 10% | 商标注册风险初评 |

## 主要功能亮点

### 表单验证
- 实时字符计数
- 必填字段验证
- 维度权重必须等于 100%

### 用户体验
- 数据加载时的骨架屏
- Toast 通知反馈
- 可展开的候选详情
- 全屏幕尺寸响应式设计

### 数据管理
- React Query 缓存和状态管理
- 持久化任务历史
- CSV 导出功能

## 注意事项

- 商标风险评估为启发式初评，不构成法律意见
- 当前 MVP 版本输出英文命名候选
- 导出格式目前仅支持 CSV
