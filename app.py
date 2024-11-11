from flask import Flask, render_template, jsonify, request
import requests
from datetime import datetime
import hashlib
import hmac
import random
import string
import time
import os

app = Flask(__name__)

# 从环境变量获取端口，如果没有则使用51168
PORT = int(os.environ.get('PORT', 51168))

# API配置
API_URL = "https://www.idcd.com/api/welfare-lottery"
CLIENT_ID = "c0b29b3c-9a17-488b-aca7-b56ec3a12af7"
CLIENT_SECRET = "5d6d01bba406d58f764ae5c7d26229eaf650ed8cd969000688c96804722e80de"

def generate_headers():
    """生成API调用所需的请求头参数"""
    # 生成32位随机字符串作为Nonce
    nonce = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    # 获取当前时间戳
    timestamp = str(int(time.time()))
    signature_method = "HmacSHA256"
    
    # 按照文档要求拼接待签名字符串
    plain_text = CLIENT_ID + nonce + timestamp + signature_method
    
    # 使用HmacSHA256计算签名
    signature = hmac.new(
        CLIENT_SECRET.encode('utf-8'),
        plain_text.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # 返回符合文档要求的请求头
    return {
        'ClientID': CLIENT_ID,
        'Nonce': nonce,
        'Timestamp': timestamp,
        'SignatureMethod': signature_method,
        'Signature': signature,
        'Content-Type': 'application/json'
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/latest')
def get_latest_draws():
    """获取最近10期开奖结果"""
    headers = generate_headers()
    
    # 获取当前日期
    current_date = datetime.now()
    current_year = current_date.year
    
    # 计算最新一期的期号
    week_number = int(current_date.strftime('%W'))
    day_of_week = current_date.weekday()
    time_of_day = current_date.hour * 100 + current_date.minute
    
    # 计算本周的期数偏移
    week_offset = 0
    if day_of_week < 1:  # 周一
        week_offset = -1
    elif day_of_week == 1 and time_of_day < 2115:  # 周二未开奖
        week_offset = -1
    elif day_of_week < 3:  # 周二已开奖或周三
        week_offset = 0
    elif day_of_week == 3 and time_of_day < 2115:  # 周四未开奖
        week_offset = 0
    elif day_of_week < 6:  # 周四已开奖或周五、周六
        week_offset = 1
    elif day_of_week == 6 and time_of_day < 2115:  # 周日未开奖
        week_offset = 1
    
    # 计算最新期号
    estimated_periods = week_number * 3
    if week_offset == -1:
        estimated_periods -= 1
    elif week_offset == 1:
        estimated_periods += 1
    
    # 确保期号格式为 YYYY+3位数字
    latest_period = f"{current_year}{estimated_periods:03d}"
    
    # 计算查询区间，确保能获取到10期数据
    end_period = int(estimated_periods)
    start_period = end_period - 15  # 扩大查询范围，确保能获取到10期数据
    
    # 处理跨年的情况
    if start_period < 1:
        start_no = f"{current_year-1}{156+start_period:03d}"
    else:
        start_no = f"{current_year}{start_period:03d}"
    
    end_no = latest_period
    
    # 根据文档设置请求参数
    params = {
        'type': 'ssq',
        'start_no': start_no,
        'end_no': end_no
    }
    
    try:
        response = requests.get(API_URL, headers=headers, params=params)
        data = response.json()
        
        if data.get('status') and data.get('code') == 200:
            # 确保获取最近10期数据
            latest_draws = sorted(data.get('data', []), 
                                key=lambda x: int(x['no']), 
                                reverse=True)[:10]
            return jsonify({
                'success': True, 
                'data': latest_draws,
                'request_id': data.get('request_id')
            })
        else:
            return jsonify({
                'success': False, 
                'message': data.get('message', '请求失败'),
                'request_id': data.get('request_id')
            })
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'服务器错误: {str(e)}',
            'code': 500
        })

@app.route('/api/query/<draw_no>')
def query_draw(draw_no):
    """查询指定期号的开奖结果"""
    headers = generate_headers()
    
    # 根据文档设置请求参数
    params = {
        'type': 'ssq',
        'start_no': draw_no,
        'end_no': draw_no
    }
    
    try:
        response = requests.get(API_URL, headers=headers, params=params)
        data = response.json()
        
        if data.get('status') and data.get('code') == 200:
            result_data = data.get('data', [])
            return jsonify({
                'success': True, 
                'data': result_data[0] if result_data else None,
                'request_id': data.get('request_id')
            })
        else:
            return jsonify({
                'success': False, 
                'message': data.get('message', '未找到该期开奖结果'),
                'request_id': data.get('request_id')
            })
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'服务器错误: {str(e)}',
            'code': 500
        })

@app.route('/health')
def health_check():
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True) 