# 双色球开奖信息查询系统

## 项目简介
本项目是一个基于Flask的双色球开奖信息查询系统，能够实时获取并展示最新开奖信息、历史开奖数据，并支持按期号查询。

## 功能特性
- 最新开奖信息展示
- 历史开奖数据查询（最近10期）
- 按期号精确查询
- 自动刷新最新开奖信息
- 详细的奖金和销售数据显示

## 部署指南

### 一键部署（推荐）
```bash
curl -fsSL https://raw.githubusercontent.com/clover-eric/ssq/main/deploy.sh | bash
```

### 手动部署

1. 构建并运行容器
```bash
docker-compose up -d
```

2. 访问应用
打开浏览器访问：http://localhost:6168

3. 停止容器
```bash
docker-compose down
```

4. 查看日志
```bash
docker-compose logs -f
```

## 开发环境
- Python 3.9
- Flask 2.0.1
- Docker 20.10+
- Docker Compose 1.29+

## 项目结构
```
.
├── Dockerfile
├── docker-compose.yml
├── app.py
├── requirements.txt
├── static/
└── templates/
```

## 依赖安装
```bash
pip install -r requirements.txt
```

## 本地运行
```bash
flask run --port=6168
