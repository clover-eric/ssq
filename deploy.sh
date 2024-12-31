#!/bin/bash
set -euo pipefail

# 日志函数
log() {
    echo -e "\n[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log "错误：$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 检查并安装依赖
install_dependencies() {
    log "检查系统依赖..."
    check_command curl
    check_command docker
    check_command docker-compose
}

# 创建项目目录
setup_project_dir() {
    local project_dir="$HOME/ssq"
    log "设置项目目录：$project_dir"
    mkdir -p "$project_dir"
    cd "$project_dir"
}

# 下载项目文件
download_files() {
    local base_url="https://raw.githubusercontent.com/clover-eric/ssq/main"
    local files=(
        "Dockerfile"
        "docker-compose.yml"
        "app.py"
        "requirements.txt"
        "templates/index.html"
    )

    log "开始下载项目文件..."
    for file in "${files[@]}"; do
        local dir=$(dirname "$file")
        if [ "$dir" != "." ]; then
            mkdir -p "$dir"
        fi
        log "下载 $file..."
        curl -fsSL --retry 3 --retry-delay 2 --max-time 30 -o "$file" "$base_url/$file" || {
            log "错误：无法下载 $file"
            exit 1
        }
    done
}

# 配置Docker镜像源
configure_docker() {
    if [ "$EUID" -ne 0 ]; then
        log "需要root权限来配置Docker镜像源"
        log "请使用sudo重新运行此脚本"
        exit 1
    fi

    log "配置Docker国内镜像源..."
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://registry.docker-cn.com"
  ]
}
EOF

    log "重启Docker服务..."
    if command -v systemctl &> /dev/null; then
        systemctl restart docker
    elif command -v service &> /dev/null; then
        service docker restart
    else
        log "错误：无法找到systemctl或service命令来重启Docker"
        exit 1
    fi
}

# 启动服务
start_service() {
    log "启动双色球查询服务..."
    docker-compose up -d
}

# 主函数
main() {
    log "开始部署双色球查询系统"
    
    install_dependencies
    setup_project_dir
    download_files
    configure_docker
    start_service

    log "部署成功！"
    log "访问地址：http://localhost:6168"
    log "可以使用以下命令查看日志：docker-compose logs -f"
}

main
