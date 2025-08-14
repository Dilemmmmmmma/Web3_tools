// EVM地址生成器模块

// EVM生成器全局变量
let evmWorkers = [];
let evmResults = [];
let evmIsGenerating = false;
let evmFoundCount = 0;
let evmTotalScans = 0;
let evmStartTime = 0;
let evmTargetCount = 50;
let evmThreadCount = 8;
let evmStartPattern = '';
let evmEndPattern = '';

// 初始化EVM生成器
function initEvmGenerator() {
    // 检测CPU核心数
    const cores = navigator.hardwareConcurrency || 4;
    evmThreadCount = Math.min(cores * 2, 16); // 最多16线程
    document.getElementById('threadCountDisplay').textContent = evmThreadCount;
    
    // 加载设置
    loadEvmSettings();
}

// 加载EVM设置
function loadEvmSettings() {
    const settings = localStorage.getItem('evm-generator-settings');
    if (settings) {
        const parsed = (window.safeParse ? window.safeParse(settings, {}) : JSON.parse(settings));
        evmThreadCount = parsed.threadCount || evmThreadCount;
        document.getElementById('threadCountDisplay').textContent = evmThreadCount;
        document.getElementById('evmStartPattern').value = parsed.startPattern || '';
        document.getElementById('evmEndPattern').value = parsed.endPattern || '';
        document.getElementById('evmTargetCount').value = parsed.targetCount || 50;
    }
}

// 保存EVM设置
function saveEvmSettings() {
    const settings = {
        threadCount: evmThreadCount,
        startPattern: document.getElementById('evmStartPattern').value,
        endPattern: document.getElementById('evmEndPattern').value,
        targetCount: parseInt(document.getElementById('evmTargetCount').value)
    };
    localStorage.setItem('evm-generator-settings', JSON.stringify(settings));
}

// 调整线程数量
function changeThreadCount(delta) {
    evmThreadCount = Math.max(1, Math.min(32, evmThreadCount + delta));
    document.getElementById('threadCountDisplay').textContent = evmThreadCount;
    saveEvmSettings();
}

// 地址匹配函数
function matchEvmAddress(address, startPattern, endPattern) {
    const addr = address.toLowerCase();
    const start = startPattern.toLowerCase();
    const end = endPattern.toLowerCase();
    
    return (!start || addr.startsWith('0x' + start)) &&
           (!end || addr.endsWith(end));
}

// 创建Web Worker代码
function createWorkerCode() {
    return `
        // 导入ethers.js (在Worker中)
        importScripts('https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js');
        
        let scans = 0;
        const BATCH_SIZE = 50;
        
        function matchAddress(address, startPattern, endPattern) {
            const addr = address.toLowerCase();
            return (!startPattern || addr.startsWith('0x' + startPattern.toLowerCase())) &&
                   (!endPattern || addr.endsWith(endPattern.toLowerCase()));
        }
        
        function generateBatch() {
            const results = [];
            for (let i = 0; i < BATCH_SIZE; i++) {
                // 生成随机钱包
                const wallet = ethers.Wallet.createRandom();
                results.push({
                    address: wallet.address,
                    privateKey: wallet.privateKey,
                    mnemonic: wallet.mnemonic.phrase
                });
                scans++;
            }
            return results;
        }
        
        self.onmessage = function(e) {
            const { startPattern, endPattern } = e.data;
            
            while (true) {
                const batch = generateBatch();
                
                for (const wallet of batch) {
                    if (matchAddress(wallet.address, startPattern, endPattern)) {
                        self.postMessage({
                            type: 'found',
                            payload: wallet
                        });
                    }
                }
                
                // 每1000次扫描报告一次进度
                if (scans % 1000 === 0) {
                    self.postMessage({
                        type: 'progress',
                        payload: { scans: 1000 }
                    });
                }
            }
        };
    `;
}

// 开始EVM地址生成
function startEvmGeneration() {
    if (evmIsGenerating) return;
    
    // 获取配置
    evmStartPattern = document.getElementById('evmStartPattern').value.trim();
    evmEndPattern = document.getElementById('evmEndPattern').value.trim();
    evmTargetCount = parseInt(document.getElementById('evmTargetCount').value) || 50;
    
    // 保存设置
    saveEvmSettings();
    
    // 重置状态
    evmResults = [];
    evmFoundCount = 0;
    evmTotalScans = 0;
    evmStartTime = Date.now();
    evmIsGenerating = true;
    
    // 更新UI
    document.getElementById('startGenerateBtn').style.display = 'none';
    document.getElementById('stopGenerateBtn').style.display = 'inline-block';
    document.getElementById('downloadResultsBtn').style.display = 'none';
    document.getElementById('evmProgress').style.display = 'block';
    document.getElementById('evmTargetDisplay').textContent = evmTargetCount;
    
    // 清空结果表格
    document.getElementById('evmResultBody').innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6c757d;"><div style="font-size: 16px;">🔄 正在生成靓号地址...</div><small style="color: #8e9295;">请耐心等待，生成的地址将实时显示在下方</small></td></tr>';
    
    // 创建Workers
    createEvmWorkers();
    
    // 启动进度更新器
    startProgressUpdater();
    
    console.log('🚀 开始生成EVM地址，目标:', evmTargetCount, '线程:', evmThreadCount);
}

// 创建Workers
function createEvmWorkers() {
    const workerCode = createWorkerCode();
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    
    for (let i = 0; i < evmThreadCount; i++) {
        const worker = new Worker(workerUrl);
        
        worker.onmessage = function(e) {
            const { type, payload } = e.data;
            
            if (type === 'found' && evmFoundCount < evmTargetCount) {
                evmFoundCount++;
                evmResults.push(payload);
                
                console.log('找到靓号:', payload.address);
                updateEvmResultsTable();
                
                if (evmFoundCount >= evmTargetCount) {
                    stopEvmGeneration();
                }
            } else if (type === 'progress') {
                evmTotalScans += payload.scans;
            }
        };
        
        worker.onerror = function(error) {
            console.error('Worker错误:', error);
        };
        
        // 启动Worker
        worker.postMessage({
            startPattern: evmStartPattern,
            endPattern: evmEndPattern
        });
        
        evmWorkers.push(worker);
    }
}

// 停止EVM地址生成
function stopEvmGeneration() {
    if (!evmIsGenerating) return;
    
    evmIsGenerating = false;
    
    // 终止所有Workers
    evmWorkers.forEach(worker => {
        worker.terminate();
    });
    evmWorkers = [];
    
    // 更新UI
    document.getElementById('startGenerateBtn').style.display = 'inline-block';
    document.getElementById('stopGenerateBtn').style.display = 'none';
    
    if (evmResults.length > 0) {
        document.getElementById('downloadResultsBtn').style.display = 'inline-block';
    }
    
    const duration = (Date.now() - evmStartTime) / 1000;
    const speed = (evmFoundCount / duration).toFixed(2);
    
    console.log('✅ 生成完成! 找到', evmFoundCount, '个靓号，用时', duration.toFixed(2), '秒，速度', speed, '个/秒');
}

// 更新结果表格
function updateEvmResultsTable() {
    const tbody = document.getElementById('evmResultBody');
    
    if (evmResults.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #6c757d;"><div style="font-size: 16px;">📭 暂无结果</div><small style="color: #8e9295;">请配置参数后开始生成</small></td></tr>';
        return;
    }
    
    tbody.innerHTML = evmResults.map((result, index) => `
        <tr>
            <td style="text-align: center; font-weight: 500;">${index + 1}</td>
            <td>
                <div style="font-family: monospace; font-size: 0.9rem; word-break: break-all; position: relative;">
                    ${result.address}
                    <button onclick="copyToClipboard('${result.address}')" class="btn btn-sm btn-outline-primary" style="margin-left: 8px; padding: 2px 6px; font-size: 12px;" title="复制地址">
                        📋
                    </button>
                </div>
            </td>
            <td>
                <div style="font-family: monospace; font-size: 0.85rem; word-break: break-all; max-width: 200px; overflow: hidden; text-overflow: ellipsis; position: relative;">
                    <span title="${result.privateKey}">${result.privateKey}</span>
                    <button onclick="copyToClipboard('${result.privateKey}')" class="btn btn-sm btn-outline-warning" style="margin-left: 8px; padding: 2px 6px; font-size: 12px;" title="复制私钥">
                        🔑
                    </button>
                </div>
            </td>
            <td>
                <div style="font-size: 0.85rem; word-break: break-all; max-width: 250px; overflow: hidden; text-overflow: ellipsis; position: relative;">
                    <span title="${result.mnemonic}">${result.mnemonic}</span>
                    <button onclick="copyToClipboard('${result.mnemonic}')" class="btn btn-sm btn-outline-success" style="margin-left: 8px; padding: 2px 6px; font-size: 12px;" title="复制助记词">
                        🎯
                    </button>
                </div>
            </td>
            <td style="text-align: center;">
                <button onclick="copyEvmRowData(${index})" class="btn btn-sm btn-outline-info" title="复制全部信息" style="margin-right: 5px;">
                    📄
                </button>
                <button onclick="copyToClipboard('${result.address}')" class="btn btn-sm btn-outline-secondary" title="仅复制地址">
                    📋
                </button>
            </td>
        </tr>
    `).join('');
}

// 启动进度更新器
function startProgressUpdater() {
    const progressInterval = setInterval(() => {
        if (!evmIsGenerating) {
            clearInterval(progressInterval);
            return;
        }
        
        updateEvmProgress();
    }, 1000);
}

// 更新进度显示
function updateEvmProgress() {
    const elapsed = Date.now() - evmStartTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const speed = evmTotalScans / (elapsed / 1000);
    const progressPercent = Math.min((evmFoundCount / evmTargetCount) * 100, 100);
    
    document.getElementById('evmElapsedTime').textContent = timeStr;
    document.getElementById('evmGenerationSpeed').textContent = speed.toFixed(0);
    document.getElementById('evmFoundCount').textContent = evmFoundCount;
    document.getElementById('evmScannedCount').textContent = evmTotalScans.toLocaleString();
    document.getElementById('evmProgressBar').style.width = progressPercent + '%';
}

// 下载结果
function downloadEvmResults() {
    if (evmResults.length === 0) {
        alert('❌ 没有结果可以下载');
        return;
    }
    
    // 创建CSV内容
    const csvContent = [
        ['序号', 'EVM地址', '私钥', '助记词'].join(','),
        ...evmResults.map((result, index) => [
            index + 1,
            result.address,
            result.privateKey,
            '"' + result.mnemonic + '"'
        ].join(','))
    ].join('\n');
    
    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `evm_addresses_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📥 下载了', evmResults.length, '个地址结果');
}

// 复制到剪贴板 (增强版)
function copyToClipboard(text) {
    const btn = event.target;
    const originalText = btn.textContent;
    
    // 成功复制的回调
    function onSuccess() {
        btn.textContent = '✅';
        btn.style.background = '#28a745';
        btn.style.color = 'white';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.color = '';
        }, 1500);
    }
    
    // 方法1: 现代剪贴板API (HTTPS环境)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            onSuccess();
        }).catch(err => {
            console.log('现代API失败，尝试传统方法:', err);
            tryLegacyCopy(text, onSuccess);
        });
        return;
    }
    
    // 方法2: 传统方法
    tryLegacyCopy(text, onSuccess);
}

// 传统复制方法
function tryLegacyCopy(text, onSuccess) {
    try {
        // 创建临时文本区域
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        
        // 选择并复制
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            onSuccess();
        } else {
            showManualCopy(text);
        }
    } catch (err) {
        console.error('传统复制方法失败:', err);
        showManualCopy(text);
    }
}

// 显示手动复制对话框
function showManualCopy(text) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    `;
    
    content.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">📋 手动复制</h3>
        <p style="margin: 0 0 15px 0; color: #666;">请手动选择下面的文本并复制 (Ctrl+C)</p>
        <textarea readonly style="
            width: 100%;
            height: 60px;
            padding: 10px;
            border: 2px solid #007bff;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
            resize: none;
            background: #f8f9fa;
        " id="manualCopyText">${text}</textarea>
        <div style="margin-top: 15px;">
            <button id="selectAllBtn" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-right: 10px;
                cursor: pointer;
            ">全选文本</button>
            <button id="closeManualCopy" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            ">关闭</button>
        </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // 自动选择文本
    const textarea = content.querySelector('#manualCopyText');
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 100);
    
    // 全选按钮
    content.querySelector('#selectAllBtn').onclick = () => {
        textarea.focus();
        textarea.select();
    };
    
    // 关闭按钮
    content.querySelector('#closeManualCopy').onclick = () => {
        document.body.removeChild(modal);
    };
    
    // 点击外部关闭
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

// 复制EVM生成结果的完整信息
function copyEvmRowData(index) {
    if (index < 0 || index >= evmResults.length) {
        alert('❌ 数据索引错误');
        return;
    }
    
    const result = evmResults[index];
    const fullData = `靓号地址 #${index + 1}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 地址 (Address):
${result.address}

🔑 私钥 (Private Key):
${result.privateKey}

🎯 助记词 (Mnemonic):
${result.mnemonic}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  请妥善保管私钥和助记词，不要泄露给他人！`;
    
    copyToClipboard(fullData);
} 

// 挂载EVM生成器相关函数到window
window.startEvmGeneration = startEvmGeneration;
window.stopEvmGeneration = stopEvmGeneration;
window.downloadEvmResults = downloadEvmResults;
window.changeThreadCount = changeThreadCount;
window.initEvmGenerator = initEvmGenerator; 