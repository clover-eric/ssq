#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}开始部署双色球应用...${NC}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker 未安装，正在安装...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose 未安装，正在安装...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 克隆项目
echo -e "${GREEN}克隆项目代码...${NC}"
git clone https://github.com/clover-eric/ssq.git
cd ssq

# 创建日志目录
mkdir -p logs

# 构建并启动容器
echo -e "${GREEN}构建并启动 Docker 容器...${NC}"
docker-compose up -d --build

# 检查部署状态
if [ $? -eq 0 ]; then
    echo -e "${GREEN}部署成功！${NC}"
    echo -e "应用已启动，访问 http://localhost:51168 查看"
else
    echo -e "${YELLOW}部署失败，请检查日志${NC}"
fi 