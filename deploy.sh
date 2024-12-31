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

# 下载文件函数，带重试机制
download_with_retry() {
    local url=$1
    local output=$2
    local retries=3
    local timeout=10
    local delay=2

    for i in $(seq 1 $retries); do
        if curl -k -fsSL --connect-timeout $timeout --max-time 30 -o "$output" "$url"; then
            return 0
        else
            echo "下载失败，重试 $i/$retries..."
            sleep $delay
        fi
    done
    echo "错误：无法下载 $url"
    return 1
}

# 下载必要文件
download_with_retry https://raw.githubusercontent.com/clover-eric/ssq/main/Dockerfile Dockerfile || exit 1
download_with_retry https://raw.githubusercontent.com/clover-eric/ssq/main/docker-compose.yml docker-compose.yml || exit 1
download_with_retry https://raw.githubusercontent.com/clover-eric/ssq/main/app.py app.py || exit 1
download_with_retry https://raw.githubusercontent.com/clover-eric/ssq/main/requirements.txt requirements.txt || exit 1
mkdir -p templates
download_with_retry https://raw.githubusercontent.com/clover-eric/ssq/main/templates/index.html templates/index.html || exit 1

# 配置国内镜像源
mkdir -p /etc/docker
echo '{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://registry.docker-cn.com"
  ]
}' > /etc/docker/daemon.json

# 重启Docker服务
systemctl restart docker || service docker restart

# 启动服务
docker-compose up -d

echo "部署成功！"
echo "访问地址：http://localhost:6168"
