# ComfyUI微信小程序

基于RunningHub API的ComfyUI微信小程序，支持图片生成和处理功能。

## 项目结构

```
├── backend/             # 后端服务
│   ├── src/            # 源代码
│   │   ├── controllers/  # 控制器
│   │   ├── routes/      # 路由
│   │   └── services/    # 服务
│   └── test.js         # 测试脚本
├── pages/              # 小程序页面
└── utils/              # 工具函数
```

## 功能特点

- 支持图片上传和处理
- 集成RunningHub API
- 实时任务状态查询
- 自动化工作流程

## 环境要求

- Node.js >= 14
- 微信开发者工具
- RunningHub API密钥

## 快速开始

1. 克隆仓库
```bash
git clone [repository-url]
```

2. 安装依赖
```bash
cd backend
npm install
```

3. 配置环境变量
创建 `.env` 文件并添加以下配置：
```
RUNNINGHUB_URL=www.runninghub.cn
RUNNINGHUB_API_KEY=your-api-key
RUNNINGHUB_WORKFLOW_ID=your-workflow-id
```

4. 启动后端服务
```bash
npm start
```

5. 使用微信开发者工具打开项目目录

## API文档

### 后端API

- `POST /api/process-image`: 处理图片
- `GET /api/task-status/:taskId`: 查询任务状态
- `GET /api/account-status`: 查询账号状态

## 开发团队

- [Your Name] - 项目开发者

## 许可证

MIT License 