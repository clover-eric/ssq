#!/bin/bash

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}开始部署双色球应用...${NC}"

# 检查端口占用
check_port() {
    if lsof -i:$1 > /dev/null 2>&1; then
        echo -e "${YELLOW}端口 $1 已被占用，正在尝试释放...${NC}"
        sudo fuser -k $1/tcp
        sleep 2
    fi
}

# 检查必要的端口
check_port 51168

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

# 清理旧容器和目录
if [ -d "ssq" ]; then
    echo -e "${YELLOW}清理旧部署...${NC}"
    cd ssq
    docker-compose down --remove-orphans 2>/dev/null
    cd ..
    rm -rf ssq
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
    echo -e "\n${YELLOW}部署日志：${NC}"
    docker-compose logs
else
    echo -e "${RED}部署失败，错误日志：${NC}"
    docker-compose logs
fi 