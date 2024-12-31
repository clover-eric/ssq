#!/bin/bash
set -euo pipefail

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建项目目录
PROJECT_DIR="$HOME/ssq"
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# 下载必要文件
curl -fsSL -o Dockerfile https://github.com/clover-eric/ssq/raw/main/Dockerfile
curl -fsSL -o docker-compose.yml https://github.com/clover-eric/ssq/raw/main/docker-compose.yml
curl -fsSL -o app.py https://github.com/clover-eric/ssq/raw/main/app.py
curl -fsSL -o requirements.txt https://github.com/clover-eric/ssq/raw/main/requirements.txt
mkdir -p templates
curl -fsSL -o templates/index.html https://github.com/clover-eric/ssq/raw/main/templates/index.html

# 启动服务
docker-compose up -d

echo "部署成功！"
echo "访问地址：http://localhost:6168"
