# 双色球号码生成器

一个基于 Flask 的双色球号码生成器和开奖查询工具，支持随机生成和智能推荐两种模式。

## 功能特点

### 1. 号码生成
- 随机生成模式：完全随机生成双色球号码
- 智能推荐模式：基于历史开奖数据分析，智能推荐号码组合
- 批量生成：支持一次生成 1/3/5/10 注号码
- 生成历史：保存最近 50 条生成记录
- 动画效果：流畅的号码生成动画

### 2. 开奖信息
- 最新开奖：实时显示最新一期开奖结果
- 历史开奖：展示最近 10 期开奖记录
- 期号查询：支持指定期号查询历史开奖结果

### 3. 其他功能
- 号码复制：一键复制生成的号码
- 本地存储：自动保存生成历史
- 响应式设计：完美支持移动端访问

## 技术栈

### 后端
- Python 3.9
- Flask 2.0.1
- Gunicorn 20.1.0
- Requests 2.26.0

### 前端
- HTML5
- CSS3 (动画、响应式设计)
- JavaScript (原生，无框架依赖)

### 部署
- Docker
- Docker Compose

## 快速开始

### 方式一：Docker 部署（推荐） 

#### 首次部署

# 一键部署

```bash
curl -fsSL https://raw.githubusercontent.com/clover-eric/ssq/main/deploy.sh | bash
```

#### 一键升级

```bash
curl -fsSL https://raw.githubusercontent.com/clover-eric/ssq/main/upgrade.sh | bash
``` 

### 方式二：手动部署

1. 克隆仓库

```bash
git clone https://github.com/clover-eric/ssq.git

cd ssq
```

2. 安装依赖

```bash

pip install -r requirements.txt
```

3. 运行应用

```bash
python app.py

访问 http://localhost:51168 即可使用
```

## 项目结构

ssq/

├── app.py # Flask 应用主文件

├── static/ # 静态资源目录

│ ├── css/

│ │ └── style.css # 样式文件

│ └── js/

│ └── main.js # JavaScript 主文件

├── templates/ # 模板目录

│ └── index.html # 主页面模板

├── Dockerfile # Docker 构建文件

├── docker-compose.yml # Docker Compose 配置

├── requirements.txt # Python 依赖

├── deploy.sh # 部署脚本

└── README.md # 项目说明文档

## 环境变量

| 变量名 | 说明 | 默认值 |

|--------|------|--------|

| PORT | 应用运行端口 | 51168 |

| FLASK_ENV | Flask 运行环境 | production |

| FLASK_APP | Flask 应用入口 | app.py |

## API 接口

### 1. 获取最新开奖

- 路径：`/api/latest`

- 方法：GET

- 返回：最近 10 期开奖数据

### 2. 查询指定期号

- 路径：`/api/query/<draw_no>`

- 方法：GET

- 参数：draw_no (期号)

- 返回：指定期号的开奖数据

## 开发计划

- [ ] 添加用户系统

- [ ] 支持自定义号码筛选规则

- [ ] 添加历史号码统计分析

- [ ] 支持多种彩票玩法

- [ ] 添加中奖概率计算器

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

- 项目维护者：Eric

- GitHub：[clover-eric](https://github.com/clover-eric)

## 致谢

感谢所有为本项目做出贡献的开发者！

这个 README 文件包含了项目的所有重要信息，包括：

功能介绍

技术栈说明

部署方法

项目结构

API 文档

开发计划

贡献指南等