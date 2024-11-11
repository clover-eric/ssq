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

# 创建临时目录
WORK_DIR="/root/ssq"
TEMP_DIR="/tmp/ssq_upgrade_$(date +%s)"
mkdir -p "$TEMP_DIR"

# 下载最新代码
echo -e "${GREEN}下载最新代码...${NC}"
cd "$TEMP_DIR"
curl -L "https://codeload.github.com/clover-eric/ssq/zip/refs/heads/main" -o main.zip
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
if [ -d "$WORK_DIR" ]; then
    echo -e "${YELLOW}备份当前版本...${NC}"
    BACKUP_DIR="/root/ssq_backup_$(date +%Y%m%d_%H%M%S)"
    cp -r "$WORK_DIR" "$BACKUP_DIR"
fi

# 停止当前运行的容器
echo -e "${YELLOW}停止当前运行的容器...${NC}"
if [ -f "$WORK_DIR/docker-compose.yml" ]; then
    cd "$WORK_DIR"
    docker-compose down 2>/dev/null || true
fi

# 清理旧的镜像
echo -e "${YELLOW}清理旧的镜像...${NC}"
docker image prune -f

# 创建工作目录
mkdir -p "$WORK_DIR"

# 复制新文件
echo -e "${GREEN}更新文件...${NC}"
cp -r "$TEMP_DIR"/ssq-main/* "$WORK_DIR/"

# 创建正确的 Dockerfile
cat > "$WORK_DIR/Dockerfile" << 'EOL'
# 使用 Python 3.9 作为基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PORT=51168

# 安装 curl（用于健康检查）
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# 设置pip镜像源
RUN pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 创建日志目录
RUN mkdir -p logs

# 暴露端口
EXPOSE 51168

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:51168", "app:app", "--timeout", "120"]
EOL

# 切换到工作目录
cd "$WORK_DIR"

# 重新构建并启动
echo -e "${GREEN}重新构建并启动应用...${NC}"
if docker-compose up -d --build; then
    echo -e "${GREEN}升级成功！${NC}"
    echo -e "应用已重启，访问 http://localhost:51168 查看"
    echo -e "\n${YELLOW}升级日志：${NC}"
    docker-compose logs
    
    # 清理30天前的备份
    find /root -maxdepth 1 -name "ssq_backup_*" -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
else
    echo -e "${RED}升级失败，正在回滚...${NC}"
    if [ -d "$BACKUP_DIR" ]; then
        rm -rf "$WORK_DIR"
        cp -r "$BACKUP_DIR" "$WORK_DIR"
        cd "$WORK_DIR"
        docker-compose up -d --build
        echo -e "${YELLOW}已回滚到备份版本${NC}"
    else
        echo -e "${RED}无可用的备份版本，请尝试重新部署${NC}"
        echo -e "运行: curl -fsSL https://raw.githubusercontent.com/clover-eric/ssq/main/deploy.sh | bash"
    fi
fi

# 清理临时文件
rm -rf "$TEMP_DIR"