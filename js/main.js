// 主要功能模块 - 整合所有功能

// 全局变量
let currentOperation = '';
let failedOperations = [];
let currentOperationType = '';
let notificationPermission = false;

// 页面加载时初始化 → 已抽离至 js/ui/init.js
window.addEventListener('DOMContentLoaded', () => {
    // 延迟执行，确保所有依赖函数都已加载
    setTimeout(() => {
        try {
            // 加载自定义网络
            if (typeof loadCustomNetworks === 'function') {
                loadCustomNetworks();
            } else {
                console.error('loadCustomNetworks函数未定义');
            }
            
            // 加载保存的数据
            if (typeof loadFormData === 'function') {
                loadFormData();
            } else {
                console.error('loadFormData函数未定义');
            }
            
            // 如果没有保存的网络选择，不强制默认BSC，保持用户选择或等待保存的配置恢复
            // 由 loadFormData 和 populatePresetNetworks 负责恢复与渲染
            
            // 检查是否首次使用
            const hasConfigured = Storage.load('has-configured', false);
            const configTip = document.getElementById('configTip');
            
            if (!hasConfigured) {
                // 显示配置提示
                setTimeout(() => {
                    if (configTip) configTip.style.display = 'block';
                }, 1000);
                
                // 添加脉冲动画吸引注意
                const configToggle = document.getElementById('configToggle');
                if (configToggle) {
                    setTimeout(() => {
                        configToggle.classList.add('pulse');
                    }, 2000);
                }
            }
            
            // 为所有输入框添加自动保存功能
            setTimeout(() => {
                const inputs = document.querySelectorAll('input, textarea, select');
                inputs.forEach(input => {
                    // 跳过弹窗中的网络配置输入框
                    if (input.id && input.id.includes('modalNetwork')) return;
                    // 避免对关键网络字段进行自动保存（改为通过显式“保存配置”触发）
                    if (['rpc', 'networkSelect', 'chainId'].includes(input.id)) return;
                    
                    input.addEventListener('input', saveFormData);
                    input.addEventListener('change', saveFormData);
                });
                
                // 设置密码输入监听器，当用户输入密码时自动尝试加载私钥
                const passwordInput = document.getElementById('encryptionPassword');
                if (passwordInput) {
                    passwordInput.addEventListener('input', debounce(loadEncryptedPrivateKeys, 1000));
                }
                
                // 初始化归集数量输入框状态
                const collectAllCheckbox = document.getElementById('collectAllTokens');
                if (collectAllCheckbox) {
                    toggleCollectAmount();
                }
                
                // 检查通知权限状态
                if ('Notification' in window) {
                    notificationPermission = Notification.permission === 'granted';
                }
            }, 200);
        } catch (error) {
            console.error('初始化过程中出错:', error);
        }
    }, 100);
});

// 弹窗与视图切换 → 已迁移至 js/ui/modals.js
// 通知相关函数 → 已迁移至 js/ui/notifications.js
// 进度区 UI → 已迁移至 js/ui/progress.js
// 归集 UI → 已迁移至 js/ui/collect-ui.js

// 统一保留 showProgress/hideProgress 的入口由 ui/progress.js 提供

// 表格与统计函数建议使用 js/ui/table.js 的实现

// 全局错误处理
window.addEventListener('error', function(event) {
    console.error('全局JavaScript错误:', event.error);
    console.error('错误位置:', event.filename, '行:', event.lineno);
});

// 页面初始化 → 已抽离至 js/ui/init.js
 document.addEventListener('DOMContentLoaded', function() {
    // 启动网络监控
    startNetworkMonitoring();
    
    // InputData线程模式切换
    const threadModeCheckbox = document.getElementById('inputdataThreadMode');
    const threadConfig = document.getElementById('inputdataThreadConfig');
    
    if (threadModeCheckbox && threadConfig) {
        threadModeCheckbox.addEventListener('change', function() {
            threadConfig.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // 调试：检查合约模态框是否存在
    const contractModal = document.getElementById('contractModal');
    if (contractModal) {
        console.log('✅ 合约模态框已找到');
            } else {
        console.error('❌ 合约模态框未找到');
    }
    
    // 其他初始化代码...
});

// 重试失败的操作 → 已抽离至 js/ops/retry.js
async function retryFailed() {
    if (failedOperations.length === 0) {
        alert('没有失败的操作需要重试');
        return;
    }
    
    const retryBtn = document.getElementById('retryFailedBtn');
    retryBtn.disabled = true;
    retryBtn.textContent = '🔄 重试中...';
    
    // 清除失败记录，准备重试
    const operationsToRetry = [...failedOperations];
    failedOperations = [];
    
    try {
        // 根据操作类型执行重试
        switch(currentOperationType) {
            case 'distribute':
                await retryDistribute(operationsToRetry);
                break;
            case 'collect':
                await retryCollect(operationsToRetry);
                break;
            case 'query':
                await retryQuery(operationsToRetry);
                break;
            case 'inputdata':
                await retryInputData(operationsToRetry);
                break;
        }
    } catch (error) {
        console.error('重试过程中出错:', error);
    }
    
    retryBtn.disabled = false;
    retryBtn.textContent = '🔄 失败重试';
    updateSummary();
}

// 其余重试函数已抽离至 js/ops/retry.js

// 隐藏Alpha排行榜 → 已抽离至 js/ui/modals.js
function hideAlphaRanking() {
    // 显示操作选择区域
    document.querySelector('.operation-section').style.display = 'block';
    document.querySelector('.header').style.display = 'block';
    
    // 隐藏Alpha排行榜区域
    document.getElementById('alphaRankingSection').style.display = 'none';
    
    // 页面滚动到顶部
    window.scrollTo(0, 0);
}

// 关闭弹窗 → 已抽离至 js/ui/modals.js
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 点击弹窗外部关闭 → 已抽离至 js/ui/modals.js
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// 请求浏览器通知权限
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        notificationPermission = permission === 'granted';
        return notificationPermission;
    }
    return false;
}

// 显示浏览器通知
// 已抽离至 js/ui/notifications.js
function showBrowserNotification(title, message) {
    if (notificationPermission && 'Notification' in window) {
        new Notification(title, {
            body: message,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2328a745"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>',
            badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2328a745"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
        });
    }
}

// 显示右上角弹窗通知
// 已抽离至 js/ui/notifications.js
function showToastNotification(title, message, icon = '💰') {
    const toast = document.getElementById('notificationToast');
    const titleEl = toast.querySelector('.title');
    const messageEl = toast.querySelector('.message');
    const iconEl = toast.querySelector('.icon');
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    iconEl.textContent = icon;
    
    toast.classList.add('show');
    
    // 5秒后自动隐藏
    setTimeout(() => {
        closeNotification();
    }, 5000);
}

// 关闭通知弹窗
// 已抽离至 js/ui/notifications.js
function closeNotification() {
    const toast = document.getElementById('notificationToast');
    toast.classList.remove('show');
}

// 归集数量控制函数
function toggleCollectAmount() {
    const collectAll = document.getElementById('collectAllTokens').checked;
    const amountInput = document.getElementById('collectAmountInput');
    const amountField = document.getElementById('modalCollectAmount');
    
    if (collectAll) {
        amountInput.style.display = 'none';
        amountField.value = '';
    } else {
        amountInput.style.display = 'block';
    }
}

// 监控模式控制函数
function toggleMonitorMode() {
    const enableMonitor = document.getElementById('enableMonitorMode').checked;
    const monitorConfig = document.getElementById('monitorModeConfig');
    
    if (enableMonitor) {
        monitorConfig.style.display = 'block';
    } else {
        monitorConfig.style.display = 'none';
    }
}

// 进度显示功能
function showProgress(operationType = '执行操作') {
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('logSection').style.display = 'none';
    document.getElementById('logContent').textContent = '';
    
    // 设置操作标题
    document.getElementById('operationTitle').textContent = `📊 ${operationType}`;
    
    // 重置表格和统计
    resetTable();
    resetSummary();
    
    // 隐藏重试按钮
    document.getElementById('retryFailedBtn').style.display = 'none';
}

// 重置表格 → 已抽离至 js/ui/table.js
// 重置统计信息 → 已抽离至 js/ui/table.js
// 表格头/行/统计/筛选由 js/ui/table.js 提供，全局直接使用其导出
// 由 ui/table.js 负责，无需本地委托函数
// 隐藏进度
function hideProgress() {
    document.getElementById('progressSection').style.display = 'none';
}

// 筛选逻辑由 ui/table.js 负责，无需本地委托函数
// 获取当前网络原生代币符号
function getCurrentNetworkCurrency() {
    const networkSelect = document.getElementById('networkSelect');
    const selectedNetwork = networkSelect.value;
    
    if (selectedNetwork && networks[selectedNetwork]) {
        return networks[selectedNetwork].nativeCurrency;
    }
    
    // 从自定义网络获取
    const customNetworks = Storage.load('custom-networks', {});
    if (customNetworks[selectedNetwork]) {
        return customNetworks[selectedNetwork].nativeCurrency;
    }
    
    return 'ETH'; // 默认值
} 

// 挂载核心操作函数到window，确保HTML可直接调用
window.selectOperation = selectOperation;
window.closeModal = closeModal;
window.showProgress = showProgress;
// 表格相关API由 js/ui/table.js 统一导出，避免覆盖
// window.setupTableHeader = setupTableHeader;
// window.addTableRow = addTableRow;
// window.updateTableRow = updateTableRow;
window.updateProgress = updateProgress;
// window.updateSummary = updateSummary;
window.getTokenSymbol = getTokenSymbol;
window.getProviderAndWalletFromKey = getProviderAndWalletFromKey;
window.getOptimizedGasSettings = getOptimizedGasSettings;
window.getProvider = getProvider;
window.log = log;
// 下列重试相关API由 js/ops/retry.js 导出，避免此处提前挂载未定义
if (typeof window.retryFailed === 'undefined' && typeof retryFailed !== 'undefined') window.retryFailed = retryFailed;
if (typeof window.retrySingleOperation === 'undefined' && typeof retrySingleOperation !== 'undefined') window.retrySingleOperation = retrySingleOperation;
if (typeof window.retrySingleDistribute === 'undefined' && typeof retrySingleDistribute !== 'undefined') window.retrySingleDistribute = retrySingleDistribute;
if (typeof window.retrySingleCollect === 'undefined' && typeof retrySingleCollect !== 'undefined') window.retrySingleCollect = retrySingleCollect;
if (typeof window.retrySingleQuery === 'undefined' && typeof retrySingleQuery !== 'undefined') window.retrySingleQuery = retrySingleQuery;
if (typeof window.retrySingleInputData === 'undefined' && typeof retrySingleInputData !== 'undefined') window.retrySingleInputData = retrySingleInputData;
// 兼容分发等功能
if (typeof window.executeDistribute === 'undefined' && typeof executeDistribute !== 'undefined') {
  window.executeDistribute = executeDistribute;
}

// ==================== OKX DEX 相关函数 ====================

// 初始化OKX DEX
function initOkxDex() {
    console.log('初始化OKX DEX...');
    updateOkxDexTokens();
    updateOkxDexNetworkInfo();
    
    // 加载API配置信息
    loadOkxDexApiConfig();
    
    // 初始化Solana连接
    if (window.OKXDEX) {
        window.OKXDEX.initSolanaConnection();
    }
    
    // 显示余额检查提示
    document.getElementById('okxDexBalanceCheck').style.display = 'block';
}

// 更新代币选择
// 已抽离至 js/integrations/okx-dex-ui.js
function updateOkxDexTokens() {
    const network = document.getElementById('okxDexNetwork').value;
    const fromTokenSelect = document.getElementById('okxDexFromToken');
    const toTokenSelect = document.getElementById('okxDexToToken');
    const solanaNotice = document.getElementById('solanaNotice');
    
    if (!fromTokenSelect || !toTokenSelect) return;
    
    // 显示/隐藏Solana提示
    if (solanaNotice) {
        solanaNotice.style.display = network === 'solana' ? 'block' : 'none';
    }
    
    const tokens = OKXDEX.getSupportedTokens(network);
    const tokenSymbols = Object.keys(tokens);
    
    // 清空选项
    fromTokenSelect.innerHTML = '';
    toTokenSelect.innerHTML = '';
    
    // 添加代币选项
    tokenSymbols.forEach(symbol => {
        const fromOption = document.createElement('option');
        fromOption.value = symbol;
        fromOption.textContent = symbol;
        fromTokenSelect.appendChild(fromOption);
        
        const toOption = document.createElement('option');
        toOption.value = symbol;
        toOption.textContent = symbol;
        toTokenSelect.appendChild(toOption);
    });

    // 强制追加"自定义地址"选项（Solana 也支持）
    const appendCustomOption = (selectEl) => {
        const exists = Array.from(selectEl.options).some(opt => opt.value === 'custom');
        if (!exists) {
            const opt = document.createElement('option');
            opt.value = 'custom';
            opt.textContent = '自定义地址';
            selectEl.appendChild(opt);
        }
    };
    appendCustomOption(fromTokenSelect);
    appendCustomOption(toTokenSelect);
    
    // 设置默认选择
    if (tokenSymbols.includes('USDT') && tokenSymbols.includes('USDC')) {
        fromTokenSelect.value = 'USDT';
        toTokenSelect.value = 'USDC';
    } else if (network === 'solana' && tokenSymbols.includes('USDT') && tokenSymbols.includes('SOL')) {
        fromTokenSelect.value = 'USDT';
        toTokenSelect.value = 'SOL';
    }
    
    updateOkxDexNetworkInfo();
    updateOkxDexTokenInputs();
}

// 更新代币输入框显示
// 已抽离至 js/integrations/okx-dex-ui.js
function updateOkxDexTokenInputs() {
    const fromTokenSelect = document.getElementById('okxDexFromToken');
    const toTokenSelect = document.getElementById('okxDexToToken');
    const fromTokenAddress = document.getElementById('okxDexFromTokenAddress');
    const toTokenAddress = document.getElementById('okxDexToTokenAddress');
    const network = document.getElementById('okxDexNetwork').value;
    
    if (!fromTokenSelect || !toTokenSelect || !fromTokenAddress || !toTokenAddress) return;
    
    // 显示/隐藏自定义地址输入框（Solana 也支持）
    fromTokenAddress.style.display = fromTokenSelect.value === 'custom' ? 'block' : 'none';
    toTokenAddress.style.display = toTokenSelect.value === 'custom' ? 'block' : 'none';
    
    // 如果代币选择发生变化，清除之前的报价
    updateOkxDexQuote();
}

// 更新网络信息显示
// 已抽离至 js/integrations/okx-dex-ui.js
function updateOkxDexNetworkInfo() {
    const network = document.getElementById('okxDexNetwork').value;
    const networkInfo = document.getElementById('okxDexNetworkInfo');
    const networkConfig = OKXDEX.getNetworkConfig(network);
    
    if (networkInfo && networkConfig) {
        networkInfo.textContent = `当前网络: ${networkConfig.name} (${networkConfig.symbol})`;
    }
}

// 获取代币配置
async function getOkxDexTokenConfig(tokenSymbol, tokenAddress, network) {
    // Solana 允许自定义代币（SPL mint 地址）
    if (tokenSymbol === 'custom') {
        if (network === 'solana') {
            if (!tokenAddress || !OKXDEX.isValidSolanaAddress(tokenAddress)) {
                throw new Error('无效的Solana代币地址');
            }
            try {
                const decimals = await OKXDEX.getSolanaTokenDecimals(tokenAddress);
                return {
                    address: tokenAddress,
                    symbol: 'CUSTOM',
                    decimals: decimals,
                    name: 'SPL Token'
                };
            } catch (e) {
                // 获取不到精度时默认9
                return { address: tokenAddress, symbol: 'CUSTOM', decimals: 9, name: 'SPL Token' };
            }
        }
        
        // EVM 自定义
        if (!tokenAddress || !OKXDEX.isValidAddress(tokenAddress)) {
            throw new Error('无效的代币地址');
        }
        try {
            const rpcUrl = getRpcUrlForNetwork(network);
            const provider = getProviderCached(rpcUrl);
            const tokenInfo = await OKXDEX.getTokenInfo(tokenAddress, provider);
            if (tokenInfo) {
                return { address: tokenAddress, symbol: tokenInfo.symbol || 'CUSTOM', decimals: tokenInfo.decimals, name: tokenInfo.name };
            }
        } catch (_) {}
        return { address: tokenAddress, symbol: 'CUSTOM', decimals: 18, name: 'Custom Token' };
    } else {
        // 预设代币
        const tokens = OKXDEX.getSupportedTokens(network);
        const token = tokens[tokenSymbol];
        if (!token) throw new Error(`不支持的代币: ${tokenSymbol}`);
        return token;
    }
}

// 自动获取报价（防抖）
let autoQuoteTimer = null;
// 已抽离至 js/integrations/okx-dex-ui.js
function autoGetOkxDexQuote() {
    if (autoQuoteTimer) {
        clearTimeout(autoQuoteTimer);
    }
    
    autoQuoteTimer = setTimeout(() => {
        const amount = document.getElementById('okxDexAmount').value.trim();
        if (amount && parseFloat(amount) > 0) {
            getOkxDexQuote();
        }
    }, 1000); // 1秒延迟
}

// 检查余额
async function checkOkxDexBalance() {
    const privateKey = document.getElementById('okxDexPrivateKey').value.trim();
    const network = document.getElementById('okxDexNetwork').value;
    
    if (!privateKey) {
        alert('请输入钱包私钥');
        return;
    }
    
    try {
        updateOkxDexStatus('正在检查余额...', 'info');
        
        // 获取网络配置
        const networkConfig = OKXDEX.getNetworkConfig(network);
        if (!networkConfig) {
            throw new Error('不支持的网络');
        }
        
        let balanceDetails = '';
        
        if (network === 'solana') {
            // Solana网络余额检查
            if (!window.solanaWeb3) {
                throw new Error('Solana Web3.js 未加载');
            }
            
            const { Keypair } = window.solanaWeb3;
            
            // 验证私钥格式并创建Keypair
            const secretKey = OKXDEX.validateSolanaPrivateKey(privateKey);
            const keypair = Keypair.fromSecretKey(secretKey);
            const walletAddress = keypair.publicKey.toString();
            
            // 获取SOL余额
            const solBalance = await OKXDEX.checkSolanaBalance(walletAddress);
            balanceDetails += `<strong>SOL 余额:</strong> ${solBalance} SOL<br>`;
            
            // 获取代币余额
            const tokens = OKXDEX.getSupportedTokens(network);
            for (const [symbol, token] of Object.entries(tokens)) {
                if (symbol !== 'SOL') {
                    const balance = await OKXDEX.checkSolanaTokenBalance(token.address, walletAddress);
                    balanceDetails += `<strong>${symbol} 余额:</strong> ${balance} ${symbol}<br>`;
                }
            }
        } else {
            // EVM网络余额检查
            const rpcUrl = getRpcUrlForNetwork(network);
            const provider = getProviderCached(rpcUrl);
            const wallet = new ethers.Wallet(privateKey, provider);
            
            // 获取原生代币余额
            const nativeBalance = await OKXDEX.getNativeBalance(wallet.address, provider);
            const formattedNativeBalance = OKXDEX.formatTokenAmount(nativeBalance, 18);
            
            // 获取代币余额
            const tokens = OKXDEX.getSupportedTokens(network);
            balanceDetails = `<strong>${networkConfig.symbol} 余额:</strong> ${formattedNativeBalance} ${networkConfig.symbol}<br>`;
            
            for (const [symbol, token] of Object.entries(tokens)) {
                const balance = await OKXDEX.getTokenBalance(token.address, wallet.address, provider);
                const formattedBalance = OKXDEX.formatTokenAmount(balance, token.decimals);
                balanceDetails += `<strong>${symbol} 余额:</strong> ${formattedBalance} ${symbol}<br>`;
            }
        }
        
        // 显示余额信息
        document.getElementById('okxDexBalanceDetails').innerHTML = balanceDetails;
        document.getElementById('okxDexBalanceInfo').style.display = 'block';
        
        updateOkxDexStatus('余额检查完成', 'success');
        
    } catch (error) {
        console.error('检查余额失败:', error);
        updateOkxDexStatus('余额检查失败: ' + error.message, 'error');
    }
}

// 获取报价
// 已抽离至 js/integrations/okx-dex-ui.js
async function getOkxDexQuote() {
    const network = document.getElementById('okxDexNetwork').value;
    const fromTokenSymbol = document.getElementById('okxDexFromToken').value;
    const toTokenSymbol = document.getElementById('okxDexToToken').value;
    const fromTokenAddress = document.getElementById('okxDexFromTokenAddress').value.trim();
    const toTokenAddress = document.getElementById('okxDexToTokenAddress').value.trim();
    const amount = document.getElementById('okxDexAmount').value.trim();
    const allTokensCheckbox = document.getElementById('okxDexAllTokens');
    
    // 检查是否选择兑换所有代币
    if (!allTokensCheckbox.checked && !amount) {
        updateOkxDexStatus('请输入兑换数量或选择兑换所有代币', 'error');
        return;
    }
    
    if (fromTokenSymbol === toTokenSymbol && fromTokenAddress === toTokenAddress) {
        updateOkxDexStatus('支付代币和接收代币不能相同', 'error');
        return;
    }
    
    try {
        updateOkxDexStatus('正在获取报价...', 'info');
        
        // 获取网络配置
        const networkConfig = OKXDEX.getNetworkConfig(network);
        if (!networkConfig) {
            throw new Error('不支持的网络');
        }
        
        // 获取代币配置
        const fromToken = await getOkxDexTokenConfig(fromTokenSymbol, fromTokenAddress, network);
        const toToken = await getOkxDexTokenConfig(toTokenSymbol, toTokenAddress, network);
        
        // 获取滑点设置
        const slippage = document.getElementById('okxDexSlippage').value || '0.5';
        
        let quoteData;
        if (allTokensCheckbox.checked) {
            // 兑换所有代币时，使用一个示例数量获取报价
            const sampleAmount = OKXDEX.parseTokenAmount('1', fromToken.decimals); // 使用1个代币作为示例
            quoteData = await OKXDEX.getSwapQuote(fromToken, toToken, sampleAmount.toString(), networkConfig.chainId, slippage);

            // 使用报价中的代币元数据覆盖显示（解决自定义地址显示 CUSTOM 的问题）
            if (network === 'solana' && quoteData) {
                if (quoteData.fromToken) {
                    if (quoteData.fromToken.tokenSymbol) fromToken.symbol = quoteData.fromToken.tokenSymbol;
                    if (quoteData.fromToken.decimal !== undefined) fromToken.decimals = Number(quoteData.fromToken.decimal);
                }
                if (quoteData.toToken) {
                    if (quoteData.toToken.tokenSymbol) toToken.symbol = quoteData.toToken.tokenSymbol;
                    if (quoteData.toToken.decimal !== undefined) toToken.decimals = Number(quoteData.toToken.decimal);
                }
            }
            
            // 显示特殊提示
            const quoteDetails = `
                <strong>💡 兑换所有代币模式</strong><br>
                <strong>示例报价 (1 ${fromToken.symbol}):</strong><br>
                <strong>支付:</strong> 1 ${fromToken.symbol}<br>
                <strong>接收:</strong> ${OKXDEX.formatTokenAmount(quoteData.toTokenAmount, toToken.decimals)} ${toToken.symbol}<br>
                <strong>价格影响:</strong> ${quoteData.priceImpactPercentage}%<br>
                <strong>兑换率:</strong> 1 ${fromToken.symbol} = ${(quoteData.toTokenAmount / quoteData.fromTokenAmount).toFixed(6)} ${toToken.symbol}<br>
                <small style="color: #6c757d;">实际兑换时将使用每个钱包的实际余额</small>
            `;
            
            document.getElementById('okxDexQuoteDetails').innerHTML = quoteDetails;
            document.getElementById('okxDexQuoteInfo').style.display = 'block';
            
            // 保存报价数据
            window.currentOkxDexQuote = quoteData;
            window.currentOkxDexFromToken = fromToken;
            window.currentOkxDexToToken = toToken;
            
            updateOkxDexStatus('兑换所有代币模式报价获取成功', 'success');
            return;
        } else {
            // 兑换指定数量
            const parsedAmount = OKXDEX.parseTokenAmount(amount, fromToken.decimals);
            quoteData = await OKXDEX.getSwapQuote(fromToken, toToken, parsedAmount.toString(), networkConfig.chainId, slippage);

            // 使用报价中的代币元数据覆盖显示（解决自定义地址显示 CUSTOM 的问题）
            if (network === 'solana' && quoteData) {
                if (quoteData.fromToken) {
                    if (quoteData.fromToken.tokenSymbol) fromToken.symbol = quoteData.fromToken.tokenSymbol;
                    if (quoteData.fromToken.decimal !== undefined) fromToken.decimals = Number(quoteData.fromToken.decimal);
                }
                if (quoteData.toToken) {
                    if (quoteData.toToken.tokenSymbol) toToken.symbol = quoteData.toToken.tokenSymbol;
                    if (quoteData.toToken.decimal !== undefined) toToken.decimals = Number(quoteData.toToken.decimal);
                }
            }
        }
        
        // 显示报价信息
        const quoteDetails = `
            <strong>支付:</strong> ${OKXDEX.formatTokenAmount(quoteData.fromTokenAmount, fromToken.decimals)} ${fromToken.symbol}<br>
            <strong>接收:</strong> ${OKXDEX.formatTokenAmount(quoteData.toTokenAmount, toToken.decimals)} ${toToken.symbol}<br>
            <strong>价格影响:</strong> ${quoteData.priceImpactPercentage}%<br>
            <strong>兑换率:</strong> 1 ${fromToken.symbol} = ${(quoteData.toTokenAmount / quoteData.fromTokenAmount).toFixed(6)} ${toToken.symbol}
        `;
        
        document.getElementById('okxDexQuoteDetails').innerHTML = quoteDetails;
        document.getElementById('okxDexQuoteInfo').style.display = 'block';
        
        // 保存报价数据
        window.currentOkxDexQuote = quoteData;
        window.currentOkxDexFromToken = fromToken;
        window.currentOkxDexToToken = toToken;
        
        updateOkxDexStatus('报价获取成功', 'success');
        
    } catch (error) {
        console.error('获取报价失败:', error);
        updateOkxDexStatus('获取报价失败: ' + error.message, 'error');
    }
}

// 批量执行兑换
// 已抽离至 js/integrations/okx-dex-ui.js
async function executeOkxDexBatchSwap() {
    const privateKeysText = document.getElementById('okxDexPrivateKeys').value.trim();
    const network = document.getElementById('okxDexNetwork').value;
    const allTokensCheckbox = document.getElementById('okxDexAllTokens');
    const amount = document.getElementById('okxDexAmount').value.trim();
    
    if (!privateKeysText) {
        updateOkxDexStatus('请输入钱包私钥列表', 'error');
        return;
    }
    
    // 检查是否选择兑换所有代币
    if (!allTokensCheckbox.checked && !amount) {
        updateOkxDexStatus('请输入兑换数量或选择兑换所有代币', 'error');
        return;
    }
    
    // 检查代币配置
    if (!window.currentOkxDexFromToken || !window.currentOkxDexToToken) {
        updateOkxDexStatus('请先选择支付代币和接收代币', 'error');
        return;
    }
    
    if (!allTokensCheckbox.checked && !window.currentOkxDexQuote) {
        updateOkxDexStatus('请先获取报价', 'error');
        return;
    }
    
    try {
        updateOkxDexStatus('正在准备批量兑换...', 'info');
        
        // 解析私钥列表
        const privateKeys = privateKeysText.split('\n').map(key => key.trim()).filter(key => key);
        if (privateKeys.length === 0) {
            updateOkxDexStatus('没有有效的私钥', 'error');
            return;
        }
        
        // 获取网络配置
        const networkConfig = OKXDEX.getNetworkConfig(network);
        if (!networkConfig) {
            throw new Error('不支持的网络');
        }
        
        // 获取滑点设置
        const slippage = document.getElementById('okxDexSlippage').value || '0.5';
        
        // 准备兑换配置
        const swapConfigs = privateKeys.map(() => ({
            fromToken: window.currentOkxDexFromToken,
            toToken: window.currentOkxDexToToken,
            amount: allTokensCheckbox.checked ? 'all' : amount,
            chainId: networkConfig.chainId,
            slippage: slippage,
            allTokens: allTokensCheckbox.checked
        }));
        
        // 显示进度
        showProgress(`批量兑换 (${privateKeys.length}个钱包)`);
        setupTableHeader('okxDexBatch');
        
        let results;
        
        if (network === 'solana') {
            // Solana网络批量兑换
            if (!window.solanaWeb3) {
                throw new Error('Solana Web3.js 未加载');
            }
            
            // 初始化Solana连接
            OKXDEX.initSolanaConnection();
            
            results = await OKXDEX.batchExecuteSolanaSwap(swapConfigs, privateKeys);
        } else {
            // EVM网络批量兑换
            const rpcUrl = getRpcUrlForNetwork(network);
            const provider = getProviderCached(rpcUrl);
            results = await OKXDEX.batchExecuteSwap(swapConfigs, privateKeys, provider);
        }
        
        // 显示结果
        results.forEach((result, index) => {
            const displayStatus = (result.status === 'success' || result.status === 'pending' || result.status === 'confirmed') ? 'success'
                                : (result.status === 'skipped' ? 'skipped' : 'failed');
            
            addTableRow({
                id: `okxDex_${index}`,
                wallet: result.wallet,
                status: displayStatus,
                reason: result.reason,
                hash: result.hash || '-'
            });
        });
        
        updateSummary();
        const pendingCount = results.filter(r => r.status === 'pending').length;
        const successCount = results.filter(r => r.status === 'success' || r.status === 'pending' || r.status === 'confirmed').length;
        const skippedCount = results.filter(r => r.status === 'skipped').length;
        const failedCount = results.filter(r => r.status === 'failed').length;
        updateOkxDexStatus(`批量兑换完成: 成功 ${successCount}个${pendingCount > 0 ? ` (含待确认 ${pendingCount}个)` : ''}, 跳过 ${skippedCount}个, 失败 ${failedCount}个`, 'success');
        
    } catch (error) {
        console.error('批量兑换失败:', error);
        updateOkxDexStatus('批量兑换失败: ' + error.message, 'error');
    }
}

// 更新报价（当参数改变时）
// 已抽离至 js/integrations/okx-dex-ui.js
function updateOkxDexQuote() {
    // 清除之前的报价
    document.getElementById('okxDexQuoteInfo').style.display = 'none';
    window.currentOkxDexQuote = null;
    // 不清除代币配置，因为用户可能只是切换模式
}

// 更新状态显示
// 已抽离至 js/integrations/okx-dex-ui.js
function updateOkxDexStatus(message, type = 'info') {
    const statusElement = document.getElementById('okxDexStatus');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.style.display = 'block';
    
    // 根据类型设置颜色
    switch (type) {
        case 'success':
            statusElement.style.background = '#d4edda';
            statusElement.style.color = '#155724';
            break;
        case 'error':
            statusElement.style.background = '#f8d7da';
            statusElement.style.color = '#721c24';
            break;
        case 'info':
        default:
            statusElement.style.background = '#d1ecf1';
            statusElement.style.color = '#0c5460';
            break;
    }
}

// 获取网络RPC URL
function getRpcUrlForNetwork(network) {
    const rpcUrls = {
        'ethereum': 'https://eth.llamarpc.com',
        'bsc': 'https://bsc-dataseed1.binance.org/'
    };
    
    return rpcUrls[network] || 'https://eth.llamarpc.com';
}

// 切换兑换数量输入框
// 已抽离至 js/integrations/okx-dex-ui.js
function toggleOkxDexAmountInput() {
    const allTokensCheckbox = document.getElementById('okxDexAllTokens');
    const amountInput = document.getElementById('okxDexAmount');
    
    if (allTokensCheckbox.checked) {
        amountInput.disabled = true;
        amountInput.value = '';
        amountInput.placeholder = '已选择兑换所有代币';
    } else {
        amountInput.disabled = false;
        amountInput.placeholder = '0.1';
    }
    
    // 切换模式时清除报价
    updateOkxDexQuote();
}

// 加载API配置
// 已抽离至 js/integrations/okx-dex-ui.js（若集成未定义，则提供空实现）
if (typeof window.loadOkxDexApiConfig === 'undefined') {
    window.loadOkxDexApiConfig = function() {};
}

// 保存API配置
// 已抽离至 js/integrations/okx-dex-ui.js（若集成未定义，则提供空实现）
if (typeof window.saveOkxDexApiConfig === 'undefined') {
    window.saveOkxDexApiConfig = function() {};
}

// 重置API配置
// 已抽离至 js/integrations/okx-dex-ui.js（若集成未定义，则提供空实现）
if (typeof window.resetOkxDexApiConfig === 'undefined') {
    window.resetOkxDexApiConfig = function() {};
}

// 挂载OKX DEX函数到window
window.initOkxDex = initOkxDex;
// OKX DEX UI 相关挂载移至 js/integrations/okx-dex-ui.js
// OKX DEX UI 相关函数已迁移至 js/integrations/okx-dex-ui.js
// OKX DEX UI 相关函数已迁移至 js/integrations/okx-dex-ui.js 