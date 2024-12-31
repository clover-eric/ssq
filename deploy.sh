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

# 检查Docker服务是否运行
if ! docker info &> /dev/null; then
    echo "Docker服务未运行，正在尝试启动..."
    if command -v systemctl &> /dev/null; then
        systemctl start docker
    elif command -v service &> /dev/null; then
        service docker start
    else
        echo "无法找到systemctl或service命令来启动Docker"
        exit 1
    fi
    
    # 再次检查Docker服务是否启动成功
    if ! docker info &> /dev/null; then
        echo "无法启动Docker服务，请手动启动后再试"
        exit 1
    fi
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

# 检查sudo权限
if [ "$EUID" -ne 0 ]; then
    echo "需要root权限来配置Docker镜像源"
    echo "请使用sudo重新运行此脚本"
    exit 1
fi

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
if command -v systemctl &> /dev/null; then
    systemctl restart docker
elif command -v service &> /dev/null; then
    service docker restart
else
    echo "无法找到systemctl或service命令来重启Docker"
    exit 1
fi

# 启动服务
docker-compose up -d

echo "部署成功！"
echo "访问地址：http://localhost:6168"
