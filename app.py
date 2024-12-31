from flask import Flask, render_template, jsonify, request
import requests
import json
from datetime import datetime
import re
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def fetch_lottery_data(issue_count=30):
    """
    从福利彩票官方API获取开奖信息
    """
    try:
        url = "http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice"
        params = {
            "name": "ssq",
            "issueCount": str(issue_count),
            "issueStart": "",
            "issueEnd": "",
            "dayStart": "",
            "dayEnd": ""
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
            "Referer": "http://www.cwl.gov.cn/",
            "Host": "www.cwl.gov.cn",
            "Origin": "http://www.cwl.gov.cn"
        }
        
        logger.debug("正在获取开奖数据...")
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('state') == 0 and data.get('result'):
            results = []
            for item in data['result']:
                # 处理红球和蓝球
                red_balls = item.get('red', '').split(',')
                blue_ball = item.get('blue', '')
                
                lottery_item = {
                    'code': item.get('code', ''),  # 期号
                    'date': item.get('date', ''),  # 开奖日期
                    'red': ','.join(red_balls),  # 红球
                    'blue': blue_ball,  # 蓝球
                    'sales': str(item.get('sales', '0')),  # 销量
                    'poolmoney': str(item.get('poolmoney', '0')),  # 奖池
                    'prizegrades': item.get('prizegrades', [])  # 中奖信息
                }
                results.append(lottery_item)
            
            logger.debug(f"成功获取到 {len(results)} 条数据")
            return results[:issue_count]
        else:
            logger.error("API返回数据格式错误")
            return []
            
    except requests.RequestException as e:
        logger.error(f"网络请求错误: {str(e)}")
        return []
    except Exception as e:
        logger.error(f"意外错误: {str(e)}")
        return []

def format_issue_number(issue_number):
    """
    格式化期号为正确的格式（例如：2023001）
    """
    try:
        # 移除所有非数字字符
        issue_number = re.sub(r'\D', '', issue_number)
        
        # 如果长度小于3，说明只输入了期号，需要加上年份
        if len(issue_number) <= 3:
            current_year = datetime.now().year
            issue_number = f"{current_year}{issue_number.zfill(3)}"
        # 如果长度是4，可能是年份简写（如23）加期号
        elif len(issue_number) == 4:
            year_prefix = '20'  # 假设是2000年以后
            issue_number = f"{year_prefix}{issue_number}"
        # 如果长度是5或6，需要补全到7位
        elif len(issue_number) in [5, 6]:
            issue_number = issue_number.zfill(7)
        # 如果长度大于7，截取最后7位
        elif len(issue_number) > 7:
            issue_number = issue_number[-7:]
            
        logger.debug(f"格式化期号结果: {issue_number}")
        return issue_number
        
    except Exception as e:
        logger.error(f"格式化期号时发生错误: {str(e)}")
        return None

def fetch_specific_issue(issue_number):
    """
    获取特定期号的开奖信息
    """
    try:
        # 格式化期号
        formatted_issue = format_issue_number(issue_number)
        if not formatted_issue or len(formatted_issue) != 7:
            logger.warning(f"无效的期号格式: {issue_number}")
            return None
            
        # 构建查询URL
        url = "http://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice"
        params = {
            "name": "ssq",
            "issueCount": "50",  # 增加查询范围到50期
            "issueStart": "",
            "issueEnd": "",
            "dayStart": "",
            "dayEnd": ""
        }
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept": "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Connection": "keep-alive",
            "Referer": "http://www.cwl.gov.cn/",
            "Host": "www.cwl.gov.cn",
            "Origin": "http://www.cwl.gov.cn"
        }
        
        logger.debug(f"正在查询期号: {formatted_issue}")
        response = requests.get(url, headers=headers, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get('state') == 0 and data.get('result'):
            # 在结果中查找匹配的期号
            for item in data['result']:
                if item.get('code') == formatted_issue:
                    logger.info(f"找到期号 {formatted_issue} 的数据")
                    return {
                        'code': item.get('code', ''),
                        'date': item.get('date', ''),
                        'red': item.get('red', ''),
                        'blue': item.get('blue', ''),
                        'sales': str(item.get('sales', '0')),
                        'poolmoney': str(item.get('poolmoney', '0')),
                        'prizegrades': item.get('prizegrades', [])
                    }
            
            logger.warning(f"未找到期号 {formatted_issue} 的数据")
            return None
        else:
            logger.error("API返回数据格式错误")
            return None
            
    except requests.RequestException as e:
        logger.error(f"查询期号 {formatted_issue} 时发生网络错误: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"查询期号 {formatted_issue} 时发生意外错误: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/lottery/latest')
def get_latest_lottery():
    data = fetch_lottery_data(1)
    return jsonify(data[0] if data else None)

@app.route('/api/lottery/history')
def get_lottery_history():
    try:
        data = fetch_lottery_data(10)  # 只获取最近10期数据
        if not data:
            return jsonify([]), 404
        return jsonify(data)
    except Exception as e:
        logger.error(f"获取历史开奖数据失败: {str(e)}")
        return jsonify({"error": "获取历史开奖数据失败"}), 500

@app.route('/api/lottery/issue/<issue_number>')
def get_specific_issue(issue_number):
    if not issue_number:
        return jsonify({"error": "期号不能为空"}), 400
        
    logger.info(f"收到期号查询请求: {issue_number}")
    data = fetch_specific_issue(issue_number)
    
    if data is None:
        return jsonify({"error": "未找到该期开奖信息"}), 404
        
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=6168)
