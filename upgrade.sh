#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}开始升级双色球应用...${NC}"

# 检查是否在项目目录中
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}错误：请在项目根目录中运行此脚本${NC}"
    exit 1
fi

# 备份当前版本
echo -e "${YELLOW}备份当前版本...${NC}"
timestamp=$(date +%Y%m%d_%H%M%S)
backup_dir="../ssq_backup_${timestamp}"
mkdir -p "$backup_dir"
cp -r * "$backup_dir"

# 拉取最新代码
echo -e "${GREEN}拉取最新代码...${NC}"
git fetch origin
git reset --hard origin/main

# 停止当前运行的容器
echo -e "${YELLOW}停止当前运行的容器...${NC}"
docker-compose down

# 清理旧的镜像
echo -e "${YELLOW}清理旧的镜像...${NC}"
docker image prune -f

# 重新构建并启动
echo -e "${GREEN}重新构建并启动应用...${NC}"
docker-compose up -d --build

# 检查升级状态
if [ $? -eq 0 ]; then
    echo -e "${GREEN}升级成功！${NC}"
    echo -e "应用已重启，访问 http://localhost:51168 查看"
    echo -e "\n${YELLOW}升级日志：${NC}"
    docker-compose logs
    
    # 清理30天前的备份
    find ../ -name "ssq_backup_*" -type d -mtime +30 -exec rm -rf {} \;
else
    echo -e "${RED}升级失败，正在回滚...${NC}"
    # 回滚到备份版本
    cp -r "$backup_dir"/* .
    docker-compose up -d --build
    echo -e "${YELLOW}已回滚到备份版本${NC}"
fi 