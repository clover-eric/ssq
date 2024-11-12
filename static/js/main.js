document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const latestDraw = document.getElementById('latestDraw');
    const historyDraws = document.getElementById('historyDraws');
    const searchBtn = document.getElementById('searchBtn');
    const drawNumber = document.getElementById('drawNumber');
    const notification = document.getElementById('notification');
    const currentDateElement = document.getElementById('currentDate');
    const resultTitle = document.getElementById('resultTitle');
    const resetBtn = document.getElementById('resetBtn');
    const generateBtn = document.getElementById('generateBtn');
    const numberContainer = document.getElementById('numberContainer');
    const modeBtns = document.querySelectorAll('.mode-btn');
    
    let currentMode = 'random';
    let isGenerating = false;

    // 更新日期显示
    function updateCurrentDate() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        currentDateElement.textContent = now.toLocaleDateString('zh-CN', options);
    }

    // 初始更新日期
    updateCurrentDate();

    // 每分钟更新一次日期
    setInterval(updateCurrentDate, 60000);

    // 显示通知
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.style.backgroundColor = isError ? '#FF3B30' : 'rgba(0,0,0,0.8)';
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // 格式化开奖号码
    function formatDrawNumbers(numberStr) {
        const numbers = numberStr.split(',');
        const redBalls = numbers.slice(0, 6);
        const blueBall = numbers[6];
        
        return `
            ${redBalls.map(num => `<span class="ball red-ball">${num}</span>`).join('')}
            <span class="ball blue-ball">${blueBall}</span>
        `;
    }

    // 格式化金额
    function formatAmount(amount) {
        return parseFloat(amount).toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // 渲染开奖结果
    function renderDraw(draw, container, isLatest = false) {
        if (isLatest) {
            // 最新开奖结果染
            const drawHtml = `
                <div class="draw-info">
                    <div class="draw-info-item">
                        <span class="draw-info-label">期号</span>
                        <span class="draw-info-value">${draw.no}</span>
                    </div>
                    <div class="draw-info-item">
                        <span class="draw-info-label">开奖日期</span>
                        <span class="draw-info-value">${draw.date.split(' ')[0]}</span>
                    </div>
                </div>
                <div class="draw-numbers">
                    ${formatDrawNumbers(draw.number)}
                </div>
                <div class="amount-info">
                    <div class="amount-item">
                        <div class="amount-label">本期销售金额</div>
                        <div class="amount-value">￥${formatAmount(draw.sale_amount)}</div>
                    </div>
                    <div class="amount-item">
                        <div class="amount-label">奖池滚存金额</div>
                        <div class="amount-value">￥${formatAmount(draw.pool_amount)}</div>
                    </div>
                </div>
            `;
            container.innerHTML = drawHtml;
        } else {
            // 保持历史开奖结果的原有渲染方式
            const drawHtml = `
                <div class="draw-info">
                    <div>
                        <strong>期号：</strong>${draw.no}
                        <strong>开奖日期：</strong>${draw.date.split(' ')[0]}
                    </div>
                </div>
                <div class="draw-numbers">
                    ${formatDrawNumbers(draw.number)}
                </div>
            `;
            const drawItem = document.createElement('div');
            drawItem.className = 'draw-item';
            drawItem.innerHTML = drawHtml;
            container.appendChild(drawItem);
        }
    }

    // 验证期号格式
    function validateDrawNumber(value) {
        const pattern = /^\d{7}$/;
        return pattern.test(value);
    }

    // 显示/隐藏重置按钮
    function toggleResetButton(show) {
        resetBtn.style.display = show ? 'block' : 'none';
    }

    // 重置搜索框状态
    function resetSearchState() {
        drawNumber.value = '';
        toggleResetButton(false);
        drawNumber.classList.remove('shake');
    }

    // 处理无效输入
    function handleInvalidInput() {
        drawNumber.classList.add('shake');
        setTimeout(() => drawNumber.classList.remove('shake'), 500);
        showNotification('请输入正确的7位数字期号', true);
    }

    // 修改查询函数
    async function queryDraw(drawNo) {
        try {
            if (!validateDrawNumber(drawNo)) {
                handleInvalidInput();
                return;
            }

            latestDraw.innerHTML = '<div class="loading">查询中...</div>';
            historyDraws.innerHTML = '<div class="loading">加载中...</div>';
            
            resultTitle.textContent = `第 ${drawNo} 期开奖`;
            const response = await fetch(`/api/query/${drawNo}`);
            const data = await response.json();
            
            if (data.success && data.data) {
                latestDraw.innerHTML = '';
                historyDraws.innerHTML = '';
                renderDraw(data.data, latestDraw, true);
                toggleResetButton(true);
                showNotification('查询成功');
            } else {
                showNotification(data.message || '未找到该期开奖结果', true);
                resultTitle.textContent = '最新开奖';
                toggleResetButton(false);
                loadLatestDraws();
            }
        } catch (error) {
            showNotification('查询失败，请稍后重试', true);
            resultTitle.textContent = '最新开奖';
            toggleResetButton(false);
            loadLatestDraws();
        }
    }

    // 修改加载最新数据函数
    async function loadLatestDraws() {
        try {
            resultTitle.textContent = '最新开奖';
            resetSearchState();
            
            latestDraw.innerHTML = '<div class="loading">加载中...</div>';
            historyDraws.innerHTML = '<div class="loading">加载中...</div>';
            
            const response = await fetch('/api/latest');
            const data = await response.json();
            
            if (data.success) {
                latestDraw.innerHTML = '';
                historyDraws.innerHTML = '';
                renderDraw(data.data[0], latestDraw, true);
                data.data.slice(1).forEach(draw => {
                    renderDraw(draw, historyDraws);
                });
            } else {
                showNotification(data.message, true);
            }
        } catch (error) {
            showNotification('获取数据失败，请稍后重试', true);
        }
    }

    // 绑定事件
    searchBtn.addEventListener('click', () => {
        const value = drawNumber.value.trim();
        if (value) {
            queryDraw(value);
        } else {
            handleInvalidInput();
        }
    });

    resetBtn.addEventListener('click', loadLatestDraws);

    drawNumber.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    drawNumber.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^\d]/g, '').slice(0, 7);
    });

    // 切换生成模式
    modeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            if (isGenerating) return;
            
            // 移除所有按钮的active类
            modeBtns.forEach(b => b.classList.remove('active'));
            // 给当前按钮添加active类
            this.classList.add('active');
            
            // 更新当前模式
            currentMode = this.dataset.mode;
            
            // 获取批量选项元素
            const batchOptions = document.querySelector('.batch-options');
            
            // 无论是哪种模式，都保持批量选项可见
            batchOptions.style.display = 'flex';
            
            // 如果是智能推荐模式，可以根据需要调整批量选项的最大值
            const batchCount = document.getElementById('batchCount');
            if (currentMode === 'smart') {
                // 清空现有选项
                batchCount.innerHTML = '';
                // 添加新的选项（这里限制智能推荐最多5注）
                [1, 3, 5].forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = `${value}注`;
                    batchCount.appendChild(option);
                });
            } else {
                // 随机模式恢复原有选项
                batchCount.innerHTML = '';
                [1, 3, 5, 10].forEach(value => {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = `${value}注`;
                    batchCount.appendChild(option);
                });
            }
        });
    });

    // 生成随机号码
    function generateNumbers() {
        // 生成红球号码(1-33)
        let redBalls = new Set(); // 使用Set避免重复
        while (redBalls.size < 6) {
            const num = Math.floor(Math.random() * 33) + 1;
            redBalls.add(num);
        }
        // 转换为数组并排序
        const sortedRedBalls = Array.from(redBalls).sort((a, b) => a - b);
        
        // 生成蓝球号码(1-16)
        const blueBall = Math.floor(Math.random() * 16) + 1;
        
        return [...sortedRedBalls, blueBall];
    }

    // 获取最近开奖数据
    function getRecentDrawsData() {
        // 从页面已加载的数据中获取最近的开奖记录
        const historyDrawItems = document.querySelectorAll('.draw-item');
        const latestDrawItem = document.querySelector('.latest .draw-numbers');
        const recentDraws = [];
        
        // 添加最新一期数据
        if (latestDrawItem) {
            const numbers = Array.from(latestDrawItem.querySelectorAll('.ball'))
                .map(ball => ball.textContent.trim())
                .join(',');
            recentDraws.push({ number: numbers });
        }
        
        // 添加历史数据
        historyDrawItems.forEach(item => {
            const numbers = Array.from(item.querySelectorAll('.ball'))
                .map(ball => ball.textContent.trim())
                .join(',');
            recentDraws.push({ number: numbers });
        });
        
        return recentDraws;
    }

    // 分析热门号码
    function analyzeHotNumbers(draws, type) {
        const numberFrequency = {};
        
        draws.forEach(draw => {
            if (!draw || !draw.number) return; // 添加空值检查
            
            const numbers = draw.number.split(',');
            if (!numbers || !numbers.length) return; // 添加数组检查
            
            const targetNumbers = type === 'red' ? numbers.slice(0, 6) : [numbers[6]];
            
            targetNumbers.forEach(num => {
                if (!num) return; // 添加数字检查
                const number = parseInt(num);
                if (!isNaN(number)) { // 确保转换后是有效数字
                    numberFrequency[number] = (numberFrequency[number] || 0) + 1;
                }
            });
        });
        
        return numberFrequency;
    }

    // 根据频率生成推荐号码
    function generateRecommendedNumbers(frequency, count, maxNumber) {
        // 如果没有有效的频率数据，使用随机生成
        if (Object.keys(frequency).length === 0) {
            const numbers = new Set();
            while (numbers.size < count) {
                numbers.add(Math.floor(Math.random() * maxNumber) + 1);
            }
            return Array.from(numbers).sort((a, b) => a - b);
        }
        
        const numbers = [];
        const weightedPool = [];
        
        // 创建加权号码池
        for (let i = 1; i <= maxNumber; i++) {
            const weight = frequency[i] || 1;
            for (let j = 0; j < weight; j++) {
                weightedPool.push(i);
            }
        }
        
        // 从加权池中随机选择号码
        while (numbers.length < count) {
            const index = Math.floor(Math.random() * weightedPool.length);
            const number = weightedPool[index];
            if (!numbers.includes(number)) {
                numbers.push(number);
            }
        }
        
        return numbers.sort((a, b) => a - b);
    }

    // 智能推荐号码生成
    function generateSmartNumbers() {
        const recentDraws = getRecentDrawsData();
        
        // 如果没有历史数据，返回随机号码
        if (!recentDraws || recentDraws.length === 0) {
            return generateNumbers();
        }
        
        // 分析热门号码
        const redHotNumbers = analyzeHotNumbers(recentDraws, 'red');
        const blueHotNumbers = analyzeHotNumbers(recentDraws, 'blue');
        
        // 根据热门号码生成推荐号码
        const recommendedReds = generateRecommendedNumbers(redHotNumbers, 6, 33);
        const recommendedBlue = generateRecommendedNumbers(blueHotNumbers, 1, 16)[0];
        
        return [...recommendedReds, recommendedBlue];
    }

    // 生成历史记录管理
    const numberHistory = {
        records: [],
        maxRecords: 50, // 最多保存50条记录
        
        add(numbers, mode) {
            const record = {
                id: Date.now(),
                numbers: [...numbers],
                mode: mode,
                timestamp: new Date().toLocaleString('zh-CN')
            };
            this.records.unshift(record);
            
            // 限制记录数量
            if (this.records.length > this.maxRecords) {
                this.records.pop();
            }
            
            // 保存到localStorage
            this.saveToStorage();
            // 更新显示
            this.updateDisplay();
        },
        
        clear() {
            this.records = [];
            this.saveToStorage();
            this.updateDisplay();
        },
        
        saveToStorage() {
            localStorage.setItem('numberHistory', JSON.stringify(this.records));
        },
        
        loadFromStorage() {
            const saved = localStorage.getItem('numberHistory');
            if (saved) {
                this.records = JSON.parse(saved);
                this.updateDisplay();
            }
        },
        
        updateDisplay() {
            const historyContainer = document.getElementById('generatedHistory');
            if (!historyContainer) return;
            
            if (this.records.length === 0) {
                historyContainer.innerHTML = '<div class="empty-history">暂无生成记录</div>';
                return;
            }
            
            historyContainer.innerHTML = this.records.map(record => `
                <div class="history-item" data-id="${record.id}">
                    <div class="history-numbers">
                        ${record.numbers.slice(0, 6).map(num => 
                            `<span class="ball red-ball">${num.toString().padStart(2, '0')}</span>`
                        ).join('')}
                        <span class="ball blue-ball">${record.numbers[6].toString().padStart(2, '0')}</span>
                    </div>
                    <div class="history-info">
                        <span class="history-mode">${record.mode === 'random' ? '随机生成' : '智能推荐'}</span>
                        <span class="history-time">${record.timestamp}</span>
                    </div>
                    <div class="history-actions">
                        <button class="copy-btn" onclick="copyNumbers(${record.id})">复制</button>
                        <button class="delete-btn" onclick="deleteRecord(${record.id})">删除</button>
                    </div>
                </div>
            `).join('');
        }
    };

    // 复制号码到剪贴板
    function copyNumbers(recordId) {
        const record = numberHistory.records.find(r => r.id === recordId);
        if (!record) return;
        
        const numbers = record.numbers.map(num => num.toString().padStart(2, '0'));
        const text = `红球: ${numbers.slice(0, 6).join(' ')} 蓝球: ${numbers[6]}`;
        
        navigator.clipboard.writeText(text).then(() => {
            showNotification('号码已复制到剪贴板');
        }).catch(() => {
            showNotification('复制失败，请手动复制', true);
        });
    }

    // 删除记录
    function deleteRecord(recordId) {
        numberHistory.records = numberHistory.records.filter(r => r.id !== recordId);
        numberHistory.saveToStorage();
        numberHistory.updateDisplay();
    }

    // 批量生成号码
    async function generateMultipleNumbers(count) {
        const numbers = [];
        for (let i = 0; i < count; i++) {
            const set = currentMode === 'random' ? generateNumbers() : generateSmartNumbers();
            numbers.push(set);
        }
        return numbers;
    }

    // 更新生成器UI
    function updateGeneratorUI(mode) {
        const randomBtn = document.querySelector('.mode-btn[data-mode="random"]');
        const smartBtn = document.querySelector('.mode-btn[data-mode="smart"]');
        const generateBtn = document.getElementById('generateBtn');
        const btnIcon = generateBtn.querySelector('.btn-icon');
        const btnText = generateBtn.querySelector('.btn-text');
        const batchOptions = document.querySelector('.batch-options');
        const batchCount = document.getElementById('batchCount');
        
        // 更新按钮状态
        randomBtn.classList.toggle('active', mode === 'random');
        smartBtn.classList.toggle('active', mode === 'smart');
        
        // 更新生成按钮样式和文本
        if (mode === 'random') {
            generateBtn.className = 'action-btn generate-btn random-mode';
            btnIcon.textContent = '🎲';
            btnText.textContent = '随机生成';
            
            // 随机模式的批量选项
            batchCount.innerHTML = '';
            [1, 3, 5, 10].forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = `${value}注`;
                batchCount.appendChild(option);
            });
        } else {
            generateBtn.className = 'action-btn generate-btn smart-mode';
            btnIcon.textContent = '🤖';
            btnText.textContent = '智能推荐';
            
            // 智能推荐模式的批量选项
            batchCount.innerHTML = '';
            [1, 3, 5].forEach(value => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = `${value}注`;
                batchCount.appendChild(option);
            });
        }
        
        // 保持批量选项始终可见
        if (batchOptions) {
            batchOptions.style.display = 'flex';
            batchOptions.style.opacity = '1';
            batchOptions.style.pointerEvents = 'auto';
        }
    }

    // 初始化号码生成器
    function initNumberGenerator() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        const generateBtn = document.getElementById('generateBtn');
        const batchCountInput = document.getElementById('batchCount');
        let currentMode = 'random';
        let isGenerating = false;
        
        // 加载历史记录
        numberHistory.loadFromStorage();
        
        // 模式切换事件
        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (isGenerating) return;
                
                currentMode = btn.dataset.mode;
                updateGeneratorUI(currentMode);
            });
        });
        
        // 生成按钮点击事件
        generateBtn.addEventListener('click', async () => {
            if (isGenerating) return;
            
            isGenerating = true;
            generateBtn.disabled = true;
            
            try {
                const batchCount = parseInt(batchCountInput?.value || '1');
                const count = Math.min(Math.max(1, batchCount), 10); // 限制1-10组
                
                if (count === 1) {
                    // 单组号码生成
                    const numbers = currentMode === 'random' ? 
                        generateNumbers() : generateSmartNumbers();
                    
                    await animateNumbers(numbers);
                    numberHistory.add(numbers, currentMode);
                } else {
                    // 批量生成
                    const allNumbers = await generateMultipleNumbers(count);
                    for (const numbers of allNumbers) {
                        await animateNumbers(numbers);
                        numberHistory.add(numbers, currentMode);
                        // 短暂延迟，让用户能看每组号码
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                }
            } finally {
                isGenerating = false;
                generateBtn.disabled = false;
            }
        });
        
        // 清空历史记录按钮事件
        const clearHistoryBtn = document.getElementById('clearHistory');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                if (confirm('确定要清空所有生成记录吗？')) {
                    numberHistory.clear();
                }
            });
        }
    }

    // 初始化
    initNumberGenerator();

    // 优化后的号码动画显示函数
    async function animateNumbers(numbers) {
        const balls = document.querySelectorAll('.lottery-ball');
        const ballNumbers = document.querySelectorAll('.ball-number');
        
        // 重置所有球的状态
        balls.forEach((ball, index) => {
            ball.style.animation = '';
            const ballNumber = ballNumbers[index];
            ballNumber.style.opacity = '0';
            ballNumber.textContent = '';
        });
        
        // 同时开始所有球的旋转动画
        const animations = numbers.map((number, index) => {
            return new Promise(resolve => {
                const ball = balls[index];
                const ballNumber = ballNumbers[index];
                const formattedNumber = number.toString().padStart(2, '0');
                
                // 设置初始旋转动画
                ball.style.animation = 'ballRotate 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                
                // 错开显示时间，但间隔更短
                setTimeout(() => {
                    // 显示号码
                    ballNumber.textContent = formattedNumber;
                    ballNumber.style.opacity = '1';
                    ballNumber.style.animation = 'numberReveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
                    
                    // 完成后添加轻微弹跳效果
                    ball.style.animation = 'ballBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    
                    resolve();
                }, index * 100); // 将间隔时间从300ms减少到100ms
            });
        });
        
        // 等待所有动画完成
        await Promise.all(animations);
    }

    // 生成按钮点击效果
    generateBtn.addEventListener('mousedown', function(e) {
        const ripple = this.querySelector('.generate-ripple');
        if (ripple) {
            ripple.style.width = '0';
            ripple.style.height = '0';
            requestAnimationFrame(() => {
                ripple.style.width = '300%';
                ripple.style.height = '300%';
            });
        }
    });

    generateBtn.addEventListener('mouseup', function() {
        const ripple = this.querySelector('.generate-ripple');
        if (ripple) {
            ripple.style.width = '0';
            ripple.style.height = '0';
        }
    });

    // 初始加载
    loadLatestDraws();

    // 添加生成记录到历史列表
    function addToHistory(numbers, mode) {
        const historyList = document.getElementById('generatedHistory');
        const emptyHistory = historyList.querySelector('.empty-history');
        if (emptyHistory) {
            emptyHistory.remove();
        }

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const timestamp = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        historyItem.innerHTML = `
            <div class="history-content">
                <div class="history-info">
                    <span class="history-time">${timestamp}</span>
                    <span class="history-mode">${mode === 'random' ? '随机生成' : '智能推荐'}</span>
                </div>
                <div class="history-numbers">${numbers}</div>
            </div>
            <div class="history-actions">
                <button class="copy-btn" title="复制号码">
                    <span class="btn-icon">📋</span>
                </button>
                <button class="delete-btn" title="删除记录">
                    <span class="btn-icon">🗑️</span>
                </button>
            </div>
        `;

        // 绑定复制按钮事件
        const copyBtn = historyItem.querySelector('.copy-btn');
        copyBtn.addEventListener('click', function() {
            const numbersText = this.closest('.history-item').querySelector('.history-numbers').textContent;
            navigator.clipboard.writeText(numbersText).then(() => {
                showNotification('号码已复制到剪贴板');
            }).catch(err => {
                showNotification('复制失败，请手动复制');
                console.error('复制失败:', err);
            });
        });

        // 绑定删除按钮事件
        const deleteBtn = historyItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            const item = this.closest('.history-item');
            item.classList.add('deleting');
            setTimeout(() => {
                item.remove();
                // 如果没有记录了，显示空状态
                const historyList = document.getElementById('generatedHistory');
                if (historyList.children.length === 0) {
                    historyList.innerHTML = '<div class="empty-history">暂无生成记录</div>';
                }
                // 更新本地存储
                updateLocalStorage();
            }, 300);
        });

        // 添加到历史列表的开头
        historyList.insertBefore(historyItem, historyList.firstChild);
        
        // 限制历史记录数量为50条
        while (historyList.children.length > 50) {
            historyList.lastChild.remove();
        }

        // 更新本地存储
        updateLocalStorage();
    }

    // 更新本地存储
    function updateLocalStorage() {
        const historyList = document.getElementById('generatedHistory');
        const historyItems = Array.from(historyList.querySelectorAll('.history-item')).map(item => {
            return {
                time: item.querySelector('.history-time').textContent,
                mode: item.querySelector('.history-mode').textContent === '随机生成' ? 'random' : 'smart',
                numbers: item.querySelector('.history-numbers').textContent
            };
        });
        localStorage.setItem('generatedHistory', JSON.stringify(historyItems));
    }

    // 从本地存储加载历史记录
    function loadHistoryFromStorage() {
        const historyList = document.getElementById('generatedHistory');
        const savedHistory = localStorage.getItem('generatedHistory');
        
        if (savedHistory) {
            const historyItems = JSON.parse(savedHistory);
            historyList.innerHTML = ''; // 清空现有内容
            
            historyItems.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-content">
                        <div class="history-info">
                            <span class="history-time">${item.time}</span>
                            <span class="history-mode">${item.mode === 'random' ? '随机生成' : '智能推荐'}</span>
                        </div>
                        <div class="history-numbers">${item.numbers}</div>
                    </div>
                    <div class="history-actions">
                        <button class="copy-btn" title="复制号码">
                            <span class="btn-icon">📋</span>
                        </button>
                        <button class="delete-btn" title="删除记录">
                            <span class="btn-icon">🗑️</span>
                        </button>
                    </div>
                `;
                
                // 绑定按钮事件
                bindHistoryItemEvents(historyItem);
                historyList.appendChild(historyItem);
            });
        }
    }

    // 绑定历史记录项的事件
    function bindHistoryItemEvents(historyItem) {
        // 绑定复制按钮事件
        const copyBtn = historyItem.querySelector('.copy-btn');
        copyBtn.addEventListener('click', function() {
            const numbersText = this.closest('.history-item').querySelector('.history-numbers').textContent;
            navigator.clipboard.writeText(numbersText).then(() => {
                showNotification('号码已复制到剪贴板');
            }).catch(err => {
                showNotification('复制失败，请手动复制');
                console.error('复制失败:', err);
            });
        });

        // 绑定删除按钮事件
        const deleteBtn = historyItem.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function() {
            const item = this.closest('.history-item');
            item.classList.add('deleting');
            setTimeout(() => {
                item.remove();
                // 如果没有记录了，显示空状态
                const historyList = document.getElementById('generatedHistory');
                if (historyList.children.length === 0) {
                    historyList.innerHTML = '<div class="empty-history">暂无生成记录</div>';
                }
                // 更新本地存储
                updateLocalStorage();
            }, 300);
        });
    }

    // 清空历史记录
    document.getElementById('clearHistory').addEventListener('click', function() {
        const historyList = document.getElementById('generatedHistory');
        historyList.innerHTML = '<div class="empty-history">暂无生成记录</div>';
        localStorage.removeItem('generatedHistory');
        showNotification('历史记录已清空');
    });

    // 初始化时加载历史记录
    document.addEventListener('DOMContentLoaded', function() {
        loadHistoryFromStorage();
        // ... 其他初始化代码 ...
    });

    // 添加历史记录项的函数
    function addHistoryItem(numbers, mode, timestamp) {
        const historyList = document.getElementById('generatedHistory');
        const emptyHistory = historyList.querySelector('.empty-history');
        if (emptyHistory) {
            historyList.innerHTML = '';
        }

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // 创建号码区域
        const numbersSpan = document.createElement('span');
        numbersSpan.className = 'history-numbers';
        numbersSpan.textContent = `${numbers.slice(0, 6).map(n => n.toString().padStart(2, '0')).join(' ')} ${numbers[6].toString().padStart(2, '0')}`;
        
        // 创建右侧区域
        const rightSection = document.createElement('div');
        rightSection.className = 'history-right';
        
        // 创建模式标签
        const modeSpan = document.createElement('span');
        modeSpan.className = 'history-mode';
        modeSpan.textContent = mode === 'random' ? '随机生成' : '智能推荐';
        
        // 创建时间标签
        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-time';
        timeSpan.textContent = new Date(timestamp).toLocaleString();
        
        // 创建操作按钮区域
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'history-actions';
        
        // 创建复制按钮
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '复制';
        copyBtn.onclick = function() {
            const numbers = this.closest('.history-item').querySelector('.history-numbers').textContent;
            navigator.clipboard.writeText(numbers).then(() => {
                showNotification('号码已复制到剪贴板');
            }).catch(err => {
                showNotification('复制失败，请手动复制');
                console.error('复制失败:', err);
            });
        };
        
        // 创建删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = function() {
            const item = this.closest('.history-item');
            item.classList.add('deleting');
            setTimeout(() => {
                item.remove();
                // 如果没有记录了，显示空状态
                if (historyList.children.length === 0) {
                    historyList.innerHTML = '<div class="empty-history">暂无生成记录</div>';
                }
                // 更新本地存储
                saveHistoryToStorage();
            }, 300);
        };
        
        // 组装右侧区域
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(deleteBtn);
        rightSection.appendChild(modeSpan);
        rightSection.appendChild(timeSpan);
        rightSection.appendChild(actionsDiv);
        
        // 组装整个记录项
        historyItem.appendChild(numbersSpan);
        historyItem.appendChild(rightSection);
        
        // 添加到历史列表的开头
        historyList.insertBefore(historyItem, historyList.firstChild);
        
        // 保存到本地存储
        saveHistoryToStorage();
    }

    // 保存历史记录到本地存储
    function saveHistoryToStorage() {
        const historyList = document.getElementById('generatedHistory');
        const records = [];
        
        historyList.querySelectorAll('.history-item').forEach(item => {
            const numbers = item.querySelector('.history-numbers').textContent;
            const mode = item.querySelector('.history-mode').textContent === '随机生成' ? 'random' : 'smart';
            const time = item.querySelector('.history-time').textContent;
            
            records.push({
                numbers: numbers,
                mode: mode,
                timestamp: new Date(time).getTime()
            });
        });
        
        localStorage.setItem('generatedHistory', JSON.stringify(records));
    }
}); 