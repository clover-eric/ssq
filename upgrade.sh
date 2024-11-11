#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}开始升级双色球应用...${NC}"

# 检查curl命令
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}正在安装curl...${NC}"
    if command -v yum &> /dev/null; then
        sudo yum install -y curl
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y curl
    else
        echo -e "${RED}无法安装curl，请手动安装后重试${NC}"
        exit 1
    fi
fi

# 检查unzip命令
if ! command -v unzip &> /dev/null; then
    echo -e "${YELLOW}正在安装unzip...${NC}"
    if command -v yum &> /dev/null; then
        sudo yum install -y unzip
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y unzip
    else
        echo -e "${RED}无法安装unzip，请手动安装后重试${NC}"
        exit 1
    fi
fi

# 创建临时目录
TEMP_DIR="/tmp/ssq_upgrade_$(date +%s)"
mkdir -p "$TEMP_DIR"
cd "$TEMP_DIR"

# 下载最新代码
echo -e "${GREEN}下载最新代码...${NC}"
curl -L "https://github.com/clover-eric/ssq/archive/refs/heads/main.zip" -o main.zip
if [ $? -ne 0 ]; then
    echo -e "${RED}下载失败，请检查网络连接${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 解压代码
unzip -q main.zip
if [ $? -ne 0 ]; then
    echo -e "${RED}解压失败${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# 备份当前版本
if [ -f "/root/ssq/docker-compose.yml" ]; then
    echo -e "${YELLOW}备份当前版本...${NC}"
    BACKUP_DIR="/root/ssq_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    cp -r /root/ssq/* "$BACKUP_DIR/" 2>/dev/null || true
fi

# 停止当前运行的容器
echo -e "${YELLOW}停止当前运行的容器...${NC}"
if [ -f "/root/ssq/docker-compose.yml" ]; then
    cd /root/ssq
    docker-compose down 2>/dev/null || true
fi

# 清理旧的镜像
echo -e "${YELLOW}清理旧的镜像...${NC}"
docker image prune -f

# 复制新文件
echo -e "${GREEN}更新文件...${NC}"
mkdir -p /root/ssq
cp -r "$TEMP_DIR"/ssq-main/* /root/ssq/

# 切换到应用目录
cd /root/ssq

# 重新构建并启动
echo -e "${GREEN}重新构建并启动应用...${NC}"
if docker-compose up -d --build; then
    echo -e "${GREEN}升级成功！${NC}"
    echo -e "应用已重启，访问 http://localhost:51168 查看"
    echo -e "\n${YELLOW}升级日志：${NC}"
    docker-compose logs
    
    # 清理30天前的备份
    find /root -maxdepth 1 -name "ssq_backup_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
    
    # 清理临时文件
    rm -rf "$TEMP_DIR"
else
    echo -e "${RED}升级失败，正在回滚...${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf /root/ssq
        cp -r "$BACKUP_DIR" /root/ssq
        cd /root/ssq
        docker-compose up -d --build
        echo -e "${YELLOW}已回滚到备份版本${NC}"
    else
        echo -e "${RED}无可用的备份版本，请尝试重新部署${NC}"
        echo -e "运行: curl -fsSL https://raw.githubusercontent.com/clover-eric/ssq/main/deploy.sh | bash"
    fi
fi

# 清理临时文件
rm -rf "$TEMP_DIR"