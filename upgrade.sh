#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}开始升级双色球应用...${NC}"

# 检查是否在项目目录中
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}正在创建临时目录...${NC}"
    TEMP_DIR="ssq_temp_$(date +%s)"
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
fi

# 备份当前版本（如果存在）
if [ -f "docker-compose.yml" ]; then
    echo -e "${YELLOW}备份当前版本...${NC}"
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="../ssq_backup_${timestamp}"
    mkdir -p "$backup_dir"
    cp -r * "$backup_dir" 2>/dev/null || true
fi

# 下载最新代码
echo -e "${GREEN}下载最新代码...${NC}"
curl -sSL https://github.com/clover-eric/ssq/archive/refs/heads/main.zip -o main.zip
unzip -q main.zip
rm main.zip
cp -r ssq-main/* .
rm -rf ssq-main

# 停止当前运行的容器
echo -e "${YELLOW}停止当前运行的容器...${NC}"
if [ -f "docker-compose.yml" ]; then
    docker-compose down 2>/dev/null || true
fi

# 清理旧的镜像
echo -e "${YELLOW}清理旧的镜像...${NC}"
docker image prune -f

# 重新构建并启动
echo -e "${GREEN}重新构建并启动应用...${NC}"
if docker-compose up -d --build; then
    echo -e "${GREEN}升级成功！${NC}"
    echo -e "应用已重启，访问 http://localhost:51168 查看"
    echo -e "\n${YELLOW}升级日志：${NC}"
    docker-compose logs
    
    # 清理30天前的备份
    find ../ -name "ssq_backup_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
    
    # 清理临时目录
    if [ -n "$TEMP_DIR" ]; then
        cd ..
        rm -rf "$TEMP_DIR"
    fi
else
    echo -e "${RED}升级失败，正在回滚...${NC}"
    if [ -d "$backup_dir" ]; then
        # 回滚到备份版本
        cp -r "$backup_dir"/* .
        docker-compose up -d --build
        echo -e "${YELLOW}已回滚到备份版本${NC}"
    else
        echo -e "${RED}无可用的备份版本，请尝试重新部署${NC}"
        echo -e "运行: curl -fsSL https://raw.githubusercontent.com/clover-eric/ssq/main/deploy.sh | bash"
    fi
fi 