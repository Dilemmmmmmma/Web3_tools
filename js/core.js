// 核心功能模块

// 数据保存和加载功能
const Storage = {
    // 保存数据到localStorage
    save: function(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },
    
    // 从localStorage加载数据
    load: function(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('加载数据失败:', e);
            return defaultValue;
        }
    },
    
    // 删除数据
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('删除数据失败:', e);
        }
    }
};

// 私钥加密解密功能
const CryptoManager = {
    // 生成加密密钥
    async generateKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        const saltBuffer = encoder.encode(salt);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );
        
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },
    
    // 加密数据
    async encrypt(data, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const key = await this.generateKey(password, salt);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            dataBuffer
        );
        
        return {
            salt: Array.from(salt),
            iv: Array.from(iv),
            data: Array.from(new Uint8Array(encrypted))
        };
    },
    
    // 解密数据
    async decrypt(encryptedData, password) {
        const salt = new Uint8Array(encryptedData.salt);
        const iv = new Uint8Array(encryptedData.iv);
        const data = new Uint8Array(encryptedData.data);
        
        const key = await this.generateKey(password, salt);
        
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }
};

// 安全存储模块
const SecureStorage = {
    // 保存加密的私钥
    async saveEncryptedPrivateKey(key, privateKey) {
        const password = document.getElementById('encryptionPassword')?.value;
        if (!password) {
            console.warn('未设置加密密码，跳过私钥保存');
            return;
        }
        
        try {
            const encrypted = await CryptoManager.encrypt(privateKey, password);
            Storage.save(`encrypted_${key}`, encrypted);
            console.log(`私钥已加密保存: ${key}`);
        } catch (error) {
            console.error('保存加密私钥失败:', error);
        }
    },
    
    // 通用：保存加密数据
    async saveEncrypted(key, data) {
        const password = document.getElementById('encryptionPassword')?.value;
        if (!password) {
            throw new Error('未设置加密密码');
        }
        const encrypted = await CryptoManager.encrypt(data, password);
        Storage.save(`encrypted_generic_${key}`, encrypted);
    },

    // 加载加密的私钥
    async loadEncryptedPrivateKey(key) {
        const password = document.getElementById('encryptionPassword')?.value;
        if (!password) {
            console.warn('未设置加密密码，无法加载私钥');
            return null;
        }
        
        try {
            const encrypted = Storage.load(`encrypted_${key}`);
            if (!encrypted) return null;
            
            const decrypted = await CryptoManager.decrypt(encrypted, password);
            return decrypted;
        } catch (error) {
            console.error('加载加密私钥失败:', error);
            throw new Error('密码错误或私钥数据损坏');
        }
    },

    // 通用：加载加密数据
    async loadEncrypted(key) {
        const password = document.getElementById('encryptionPassword')?.value;
        if (!password) {
            console.warn('未设置加密密码，无法加载加密数据');
            return null;
        }
        const encrypted = Storage.load(`encrypted_generic_${key}`);
        if (!encrypted) return null;
        return await CryptoManager.decrypt(encrypted, password);
    },
    
    // 清除所有加密的私钥
    clearAllEncryptedKeys() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('encrypted_') || key.startsWith('encrypted_generic_')) {
                Storage.remove(key);
            }
        });
        console.log('所有加密私钥与加密数据已清除');
    }
};

// 工具函数
function log(message) {
    const logContent = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString();
    logContent.textContent += `[${timestamp}] ${message}\n`;
    logContent.scrollTop = logContent.scrollHeight;
}

// 统一非阻塞通知（替代大部分 alert）
function notify({ type = 'info', title = '提示', message = '', durationMs = 5000 } = {}) {
    const toast = document.getElementById('notificationToast');
    if (!toast) {
        // 回退到阻塞式，仅在没有DOM时
        try { alert(title + (message ? `\n${message}` : '')); } catch (_) {}
        return;
    }
    const titleEl = toast.querySelector('.title');
    const messageEl = toast.querySelector('.message');

    titleEl.textContent = title || '提示';
    messageEl.textContent = message || '';

    // 类型样式
    let bg = 'linear-gradient(135deg, #17a2b8 0%, #20c997 100%)'; // info
    if (type === 'success') bg = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    if (type === 'warning') bg = 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)';
    if (type === 'error') bg = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
    toast.style.background = bg;

    // 展示与关闭
    toast.classList.add('show');
    if (notify.__timer) clearTimeout(notify.__timer);
    notify.__timer = setTimeout(() => {
        toast.classList.remove('show');
    }, durationMs);
}

function notifySuccess(message, title = '成功', durationMs) {
    notify({ type: 'success', title, message, durationMs });
}
function notifyInfo(message, title = '提示', durationMs) {
    notify({ type: 'info', title, message, durationMs });
}
function notifyWarning(message, title = '注意', durationMs) {
    notify({ type: 'warning', title, message, durationMs });
}
function notifyError(message, title = '错误', durationMs) {
    notify({ type: 'error', title, message, durationMs });
}

// 统一字符串转义，避免 XSS 注入
function escapeHtml(input) {
    const str = String(input ?? '');
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    return str.replace(/[&<>"'\/]/g, ch => map[ch]);
}

// 安全 JSON 解析
function safeParse(text, fallback = null) {
    try {
        return JSON.parse(text);
    } catch (_) {
        return fallback;
    }
}

// 统一定时器管理（幂等启动/停止，统一清理）
const __timers = new Map();
function startTimer(key, fn, ms) {
    if (!key || typeof fn !== 'function' || !Number.isFinite(ms)) return;
    stopTimer(key);
    const id = setInterval(fn, ms);
    __timers.set(key, id);
    return id;
}
function stopTimer(key) {
    const id = __timers.get(key);
    if (id) {
        clearInterval(id);
        __timers.delete(key);
    }
}
function clearAllTimers() {
    for (const [key, id] of __timers.entries()) {
        clearInterval(id);
    }
    __timers.clear();
}

window.addEventListener('beforeunload', () => {
    try { clearAllTimers(); } catch (_) {}
});

function updateProgress(current, total) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // 兼容旧签名：
    // - total 为 number: 按分子/分母计算百分比
    // - total 为 string: current 作为百分比（0-100），text = total
    // - 其他情况：仅文本
    if (typeof total === 'number' && total > 0 && typeof current === 'number') {
        const percentage = Math.max(0, Math.min(100, Math.round((current / total) * 100)));
        if (progressFill) progressFill.style.width = percentage + '%';
        if (progressText) progressText.textContent = `进度: ${current}/${total} (${percentage}%)`;
        // 记录最后百分比
        window.__lastProgressPercent = percentage;
        return;
    }
    if (typeof total === 'string') {
        // total 作为文本
        if (typeof current === 'number') {
            const p = Math.max(0, Math.min(100, Math.round(current)));
            if (progressFill) progressFill.style.width = p + '%';
            window.__lastProgressPercent = p;
        }
        if (progressText) progressText.textContent = `进度: ${total}`;
        return;
    }
    // 兜底：仅文本
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = `进度: ${current}/${total}`;
    window.__lastProgressPercent = 100;
}

// 统一新进度 API
function setProgress({ percent, text } = {}) {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    if (typeof percent === 'number') {
        const p = Math.max(0, Math.min(100, Math.round(percent)));
        if (progressFill) progressFill.style.width = p + '%';
        window.__lastProgressPercent = p;
    }
    if (typeof text === 'string') {
        if (progressText) progressText.textContent = text;
    }
}

function setProgressPercent(percent) {
    setProgress({ percent });
}

function setProgressText(text) {
    // 不改变百分比，仅更新文本
    setProgress({ percent: window.__lastProgressPercent, text });
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 缩短地址显示
function shortenAddress(address) {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

// 缩短哈希显示
function shortenHash(hash) {
    if (!hash) return '';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
}

// 统一输入校验与格式化（EVM）
function isEthAddress(address) {
    try {
        if (typeof ethers !== 'undefined' && ethers.utils?.isAddress) {
            return ethers.utils.isAddress(address);
        }
    } catch (_) {}
    // 简单回退校验
    return /^0x[0-9a-fA-F]{40}$/.test(address || '');
}

function isHex(value, { allowEmpty = false, evenLength = true } = {}) {
    if (value == null) return false;
    if (value === '0x' && allowEmpty) return true;
    if (!/^0x[0-9a-fA-F]*$/.test(value)) return false;
    if (evenLength && (value.length % 2 !== 0)) return false;
    return true;
}

function isAmount(str, decimals = 18, { allowZero = true } = {}) {
    if (typeof str !== 'string') str = String(str ?? '');
    str = str.trim();
    if (str.length === 0) return false;
    if (!/^\d+(?:\.\d+)?$/.test(str)) return false; // 仅支持十进制数字
    if (!allowZero && Number(str) === 0) return false;
    const parts = str.split('.');
    if (parts[1] && parts[1].length > decimals) return false;
    return true;
}

function parseAmount(str, decimals = 18) {
    try {
        if (!isAmount(str, decimals)) return null;
        if (typeof ethers !== 'undefined') {
            return ethers.utils.parseUnits(str, decimals);
        }
    } catch (_) {}
    return null;
}

function formatAddress(address) { return shortenAddress(address); }
function formatTxHash(hash) { return shortenHash(hash); }

// 获取区块浏览器URL
function getBlockExplorerUrl(hash) {
    const chainId = document.getElementById('chainId').value;
    try {
        // 优先从配置SSOT获取 explorer
        if (typeof window.getExplorerForChainId === 'function') {
            const base = window.getExplorerForChainId(chainId);
            if (base) return `${base}/tx/${hash}`;
        }
    } catch (_) {}
    // 回退：常见链
    switch(chainId) {
        case '56': return `https://bscscan.com/tx/${hash}`;
        case '1': return `https://etherscan.io/tx/${hash}`;
        case '137': return `https://polygonscan.com/tx/${hash}`;
        default: return `https://etherscan.io/tx/${hash}`;
    }
}

// 获取状态文本
function getStatusText(status) {
    switch(status) {
        case 'success': return '成功';
        case 'failed': return '失败';
        case 'processing': return '处理中';
        case 'skipped': return '跳过';
        default: return '未知';
    }
}

// 获取代币符号
async function getTokenSymbol(provider, tokenAddress) {
    try {
        const contract = new ethers.Contract(tokenAddress, [
            "function symbol() view returns (string)"
        ], provider);
        return await contract.symbol();
    } catch (error) {
        return 'ERC20';
    }
}

// 获取优化的Gas设置
async function getOptimizedGasSettings(wallet, transaction) {
    try {
        const feeData = await wallet.provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.utils.parseUnits('5', 'gwei');
        
        // 估算Gas限制
        let gasLimit;
        try {
            gasLimit = await wallet.provider.estimateGas(transaction);
            gasLimit = gasLimit.mul(120).div(100); // 增加20%缓冲
        } catch (error) {
            // 如果估算失败，使用默认值
            gasLimit = ethers.BigNumber.from('210000');
        }
        
        return {
            gasPrice: gasPrice,
            gasLimit: gasLimit
        };
    } catch (error) {
        console.error('获取Gas设置失败:', error);
        return {
            gasPrice: ethers.utils.parseUnits('5', 'gwei'),
            gasLimit: ethers.BigNumber.from('210000')
        };
    }
}

// Provider 缓存工厂（按 RPC 复用实例）
const __providerCache = new Map();
function getProviderCached(rpc) {
    if (!rpc) throw new Error('RPC未配置');
    if (!__providerCache.has(rpc)) {
        __providerCache.set(rpc, new ethers.providers.JsonRpcProvider(rpc));
    }
    return __providerCache.get(rpc);
}

// 统一请求封装：超时 / 重试 / 取消 / 错误语义
class RequestError extends Error {
    constructor(message, { code, status, url, body, attempt, cause } = {}) {
        super(message);
        this.name = 'RequestError';
        this.code = code || 'REQUEST_ERROR';
        this.status = typeof status === 'number' ? status : undefined;
        this.url = url;
        this.body = body;
        this.attempt = attempt;
        this.cause = cause;
    }
}

function __sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function requestJson(url, {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 12000,
    retries = 1,
    retryDelayBaseMs = 500,
    signal
} = {}) {
    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        const mergedSignal = controller.signal;
        try {
            const resp = await fetch(url, { method, headers, body, signal: mergedSignal });
            clearTimeout(timer);
            if (!resp.ok) {
                const text = await resp.text().catch(() => '');
                // 瞬态错误可重试：429/408/5xx
                const shouldRetry = [408, 429].includes(resp.status) || (resp.status >= 500 && resp.status <= 599);
                lastErr = new RequestError(`HTTP ${resp.status}`, {
                    code: `HTTP_${resp.status}`,
                    status: resp.status,
                    url,
                    body: text,
                    attempt
                });
                if (shouldRetry && attempt < retries) {
                    const backoff = retryDelayBaseMs * Math.pow(2, attempt) + Math.round(Math.random() * 100);
                    await __sleep(backoff);
                    continue;
                }
                throw lastErr;
            }
            // 尝试解析 JSON
            try {
                return await resp.json();
            } catch (e) {
                throw new RequestError('JSON_PARSE_ERROR', { code: 'JSON_PARSE_ERROR', url, attempt, cause: e });
            }
        } catch (e) {
            clearTimeout(timer);
            // 超时或网络错误
            const isAbort = e?.name === 'AbortError';
            const err = new RequestError(isAbort ? 'TIMEOUT' : 'NETWORK_ERROR', {
                code: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
                url,
                attempt,
                cause: e
            });
            lastErr = err;
            if (attempt < retries) {
                const backoff = retryDelayBaseMs * Math.pow(2, attempt) + Math.round(Math.random() * 100);
                await __sleep(backoff);
                continue;
            }
            throw lastErr;
        }
    }
    // 理论不可达
    throw lastErr || new RequestError('UNKNOWN');
}

async function tryRequestJson(url, options) {
    try {
        const data = await requestJson(url, options);
        return { ok: true, data };
    } catch (error) {
        return { ok: false, error };
    }
}

// 获取Provider
async function getProvider() {
    if (typeof ethers === 'undefined') {
        alert('ethers.js库尚未加载完成，请稍等片刻后重试');
        return null;
    }
    
    const rpcInput = document.getElementById('rpc');
    let rpc = rpcInput ? rpcInput.value : '';
    
    // 当 RPC 为空时，尝试根据当前选择的网络填充默认 RPC（避免初始化早期弹窗）
    if (!rpc) {
        try {
            const sel = document.getElementById('networkSelect')?.value;
            const n = sel ? (window.networks?.[sel] || window.customNetworks?.[sel]) : null;
            if (n && n.rpc) {
                rpc = n.rpc;
                if (rpcInput) rpcInput.value = rpc; // 回填到输入框
            }
        } catch (_) {}
    }
    
    if (!rpc) {
        // 静默返回，避免任何弹窗
        return null;
    }
    
    try {
        const provider = getProviderCached(rpc);
        
        // 自动获取链ID（如果用户没有设置）
        const chainIdInput = document.getElementById('chainId');
        if (chainIdInput && !chainIdInput.value) {
            try {
                const network = await provider.getNetwork();
                chainIdInput.value = network.chainId;
                log(`自动获取到链ID: ${network.chainId}`);
            } catch (e) {
                log('无法自动获取链ID，使用默认值');
            }
        }
        
        log(`连接到网络: ${rpc}`);
        
        return provider;
    } catch (error) {
        alert(`连接失败: ${error.message}`);
        return null;
    }
}

// 获取Provider和Wallet
async function getProviderAndWalletFromKey(privateKey) {
    if (typeof ethers === 'undefined') {
        alert('ethers.js库尚未加载完成，请稍等片刻后重试');
        return null;
    }
    
    const rpc = document.getElementById('rpc').value;
    
    if (!rpc) {
        alert('请先在基础配置中填写RPC节点');
        return null;
    }
    
    if (!privateKey) {
        alert('请提供私钥');
        return null;
    }
    
    try {
        const provider = getProviderCached(rpc);
        const wallet = new ethers.Wallet(privateKey, provider);
        
        // 自动获取链ID（如果用户没有设置）
        const chainIdInput = document.getElementById('chainId');
        if (!chainIdInput.value) {
            try {
                const network = await provider.getNetwork();
                chainIdInput.value = network.chainId;
                log(`自动获取到链ID: ${network.chainId}`);
            } catch (e) {
                log('无法自动获取链ID，使用默认值');
            }
        }
        
        log(`连接到网络: ${rpc}`);
        log(`钱包地址: ${wallet.address}`);
        
        return { provider, wallet };
    } catch (error) {
        alert(`连接失败: ${error.message}`);
        return null;
    }
}

// 检查ethers.js加载状态
function checkEthersLoading() {
    const loadingStatus = document.getElementById('loadingStatus');
    const statusText = document.getElementById('statusText');
    
    if (typeof ethers === 'undefined') {
        loadingStatus.style.display = 'block';
        statusText.textContent = '📡 正在加载区块链库...';
        setTimeout(checkEthersLoading, 500);
    } else {
        statusText.textContent = '✅ 区块链库加载成功！';
        setTimeout(() => {
            loadingStatus.style.display = 'none';
        }, 2000);
    }
}

// 页面加载完成后检查ethers状态
window.addEventListener('load', () => {
    setTimeout(checkEthersLoading, 100);
}); 

window.checkEthersLoading = checkEthersLoading;
window.getProviderCached = getProviderCached;
window.requestJson = requestJson;
window.tryRequestJson = tryRequestJson;
window.notify = notify;
window.notifySuccess = notifySuccess;
window.notifyInfo = notifyInfo;
window.notifyWarning = notifyWarning;
window.notifyError = notifyError;
window.escapeHtml = escapeHtml;
window.safeParse = safeParse;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.clearAllTimers = clearAllTimers; 
window.isEthAddress = isEthAddress;
window.isHex = isHex;
window.isAmount = isAmount;
window.parseAmount = parseAmount;
window.formatAddress = formatAddress;
window.formatTxHash = formatTxHash; 
window.setProgress = setProgress;
window.setProgressPercent = setProgressPercent;
window.setProgressText = setProgressText; 
window.SecureStorage = SecureStorage; 