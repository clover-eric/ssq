# 使用国内镜像源
FROM registry.cn-hangzhou.aliyuncs.com/library/python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY requirements.txt .

# 安装依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 6168

# 设置环境变量
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# 启动应用
CMD ["flask", "run", "--host=0.0.0.0", "--port=6168"]
