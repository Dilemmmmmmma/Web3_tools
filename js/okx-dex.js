// OKX DEX 模块

// OKX DEX API 配置 - 暴露给前台
// 默认（试用）API配置（用于引导）
const DEFAULT_OKX_DEX_CONFIG = {
  apiKey: '5f5799b8-d227-4ae8-98ea-6f3d0933c7e7',
  secretKey: 'F342316DA7360A846F49C194AAB54DFE',
  projectId: '23ef930617db1af68869a957d04c47f6',
  baseUrl: 'www.okx.com',
  passphrase: '!Qa8562152'
};
// 合并本地存储覆盖（若用户保存，则以用户为准）
(function(){
  const saved = localStorage.getItem('okxDexApiConfig');
  const cfg = saved ? (window.safeParse ? window.safeParse(saved, {}) : JSON.parse(saved)) : {};
  window.OKX_DEX_CONFIG = Object.assign({}, DEFAULT_OKX_DEX_CONFIG, cfg);
})();

function getOkxDexConfig(){ return window.OKX_DEX_CONFIG || {}; }

// 支持的代币配置
const SUPPORTED_TOKENS = {
    'ethereum': {
        // 以太坊主网
        USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6, symbol: 'USDT' },
        USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC' },
        WETH: { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18, symbol: 'WETH' }
    },
    'bsc': {
        // BSC 主网（BEP-20）
        USDT: { address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, symbol: 'USDT' },
        USDC: { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, symbol: 'USDC' },
        WBNB: { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, symbol: 'WBNB' }
    },
    'solana': {
        // Solana 主网（SPL）
        USDT: { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, symbol: 'USDT' },
        USDC: { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, symbol: 'USDC' },
        SOL:  { address: 'So11111111111111111111111111111111111111112', decimals: 9, symbol: 'SOL' },
        WSOL: { address: 'So11111111111111111111111111111111111111112', decimals: 9, symbol: 'WSOL' }
    }
};

// （已移除）测试私钥生成功能

// （已移除）Base58编码函数

// 网络配置
const NETWORK_CONFIG = {
    'ethereum': { chainId: 1, name: 'Ethereum', symbol: 'ETH' },
    'bsc': { chainId: 56, name: 'BSC', symbol: 'BNB' },
    'solana': { chainId: 501, name: 'Solana', symbol: 'SOL', rpcUrl: 'https://solana-rpc.publicnode.com', rpcUrls: [
        'https://lb.drpc.org/solana/ArYqq_IQskf6nONKe1Vm049howYGA2YR8Ir6ssvAG40d'  
    ] }
};

// Solana 连接管理器
let solanaConnection = null;
let solanaRpcIndex = 0;

function getSolanaRpcList() {
    const primary = NETWORK_CONFIG.solana.rpcUrl ? [NETWORK_CONFIG.solana.rpcUrl] : [];
    const extras = NETWORK_CONFIG.solana.rpcUrls || [];
    // 合并并去重，保证 rpcUrl 优先
    const merged = [...primary, ...extras].filter((url, idx, arr) => url && arr.indexOf(url) === idx);
    return merged.length > 0 ? merged : ['https://solana-rpc.publicnode.com'];
}

function getCurrentSolanaRpc() {
    const list = getSolanaRpcList();
    return list[Math.min(solanaRpcIndex, list.length - 1)];
}

function switchToNextSolanaRpc() {
    const list = getSolanaRpcList();
    if (solanaRpcIndex < list.length - 1) {
        solanaRpcIndex += 1;
        try {
            if (typeof window !== 'undefined' && window.solanaWeb3) {
                const { Connection } = window.solanaWeb3;
                solanaConnection = new Connection(getCurrentSolanaRpc(), { confirmTransactionInitialTimeout: 60000 });
                console.warn('已切换Solana RPC到:', getCurrentSolanaRpc());
            }
        } catch (_) { /* 忽略 */ }
        return true;
    }
    return false;
}

// 通用：携带RPC自动切换的执行器
async function withSolanaRpcFailover(action) {
    const list = getSolanaRpcList();
    let attempts = 0;
    let lastError = null;
    while (attempts < list.length) {
        const conn = initSolanaConnection();
        try {
            return await action(conn);
        } catch (e) {
            lastError = e;
            console.warn('Solana RPC调用失败，准备切换RPC重试:', e?.message || e);
            if (!switchToNextSolanaRpc()) break;
            attempts++;
        }
    }
    throw lastError;
}

// 初始化Solana连接
function initSolanaConnection() {
    if (!solanaConnection) {
        if (typeof window !== 'undefined' && window.solanaWeb3) {
            const { Connection } = window.solanaWeb3;
            solanaConnection = new Connection(getCurrentSolanaRpc(), {
                confirmTransactionInitialTimeout: 60000
            });
        } else {
            console.warn('Solana Web3.js 未加载，请确保已引入 @solana/web3.js');
        }
    }
    return solanaConnection;
}

// 检查是否为Solana网络
function isSolanaNetwork(chainId) {
    return chainId === NETWORK_CONFIG.solana.chainId || chainId === NETWORK_CONFIG.solana.chainId.toString();
}

// 生成签名
async function generateSignature(timestamp, method, requestPath, body = '') {
    const message = timestamp + method + requestPath + body;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(getOkxDexConfig().secretKey || '');
    const messageData = encoder.encode(message);
    
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

// 获取请求头
async function getHeaders(method, requestPath, body = '') {
    const timestamp = new Date().toISOString();
    const signature = await generateSignature(timestamp, method, requestPath, body);
    
    return {
        'OK-ACCESS-KEY': (getOkxDexConfig().apiKey || ''),
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': (getOkxDexConfig().passphrase || ''),
        'Content-Type': 'application/json'
    };
}

// 发送API请求
async function makeRequest(endpoint, method = 'GET', data = null) {
    try {
        const url = `https://${getOkxDexConfig().baseUrl || 'www.okx.com'}${endpoint}`;
        const headers = await getHeaders(method, endpoint, data ? JSON.stringify(data) : '');
        
        const options = {
            method: method,
            headers: headers
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (result.code === '0') {
            return result.data;
        } else {
            throw new Error(result.msg || 'API请求失败');
        }
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// 1. 获取兑换报价
async function getSwapQuote(fromToken, toToken, amount, chainId, slippage = '2.0') {
    // 确保滑点参数在有效范围内
    const slippageValue = parseFloat(slippage);
    if (slippageValue < 0.1 || slippageValue > 50) {
        throw new Error(`滑点参数无效: ${slippage}，必须在0.1-50之间`);
    }
    
    // 检查是否为Solana网络
    if (isSolanaNetwork(chainId)) {
        console.log(`正在获取Solana ${fromToken.symbol} 到 ${toToken.symbol} 的兑换报价...`);
    } else {
        console.log(`正在获取 ${fromToken.symbol} 到 ${toToken.symbol} 的兑换报价...`);
    }
    
    try {
        const endpoint = '/api/v5/dex/aggregator/quote';

        // 对Solana将人类可读金额转换为基础单位
        let amountParam = amount;
        if (isSolanaNetwork(chainId) && typeof amount === 'string' && amount !== 'all') {
            const isIntegerLike = /^[0-9]+$/.test(amount);
            if (!isIntegerLike && typeof fromToken.decimals === 'number') {
                amountParam = toBaseUnitsDecimalString(amount, fromToken.decimals);
            }
        }
        
        const params = {
            chainId: chainId.toString(),
            fromTokenAddress: fromToken.address,
            toTokenAddress: toToken.address,
            amount: amountParam,
            slippage: slippage
        };
        
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        const result = await makeRequest(`${endpoint}?${queryString}`);
        
        if (result && result.length > 0) {
            console.log('✓ 获取报价成功');
            return result[0];
        } else {
            throw new Error('获取报价失败');
        }
    } catch (error) {
        console.error('获取报价失败:', error.message);
        throw error;
    }
}

// 2. 获取授权交易
async function getApprovalTransaction(tokenAddress, amount, chainId) {
    try {
        console.log('正在获取授权交易...');
        
        const endpoint = '/api/v5/dex/aggregator/approve-transaction';
        const params = {
            chainId: chainId.toString(),
            tokenContractAddress: tokenAddress,
            approveAmount: '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        };
        
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        const result = await makeRequest(`${endpoint}?${queryString}`);
        
        if (result) {
            console.log('✓ 获取授权交易成功');
            return result;
        } else {
            throw new Error('获取授权交易失败');
        }
    } catch (error) {
        console.error('获取授权交易失败:', error.message);
        throw error;
    }
}

// 3. 获取兑换交易
async function getSwapTransaction(quoteData, userAddress, chainId, slippage = '2.0') {
    // 确保滑点参数在有效范围内
    const slippageValue = parseFloat(slippage);
    if (slippageValue < 0.1 || slippageValue > 50) {
        throw new Error(`滑点参数无效: ${slippage}，必须在0.1-50之间`);
    }
    
    // 检查是否为Solana网络
    if (isSolanaNetwork(chainId)) {
        console.log('正在获取Solana兑换交易...');
    } else {
        console.log('正在获取兑换交易...');
    }
    
    console.log('兑换交易参数:', {
        chainId: chainId,
        fromTokenAddress: quoteData.fromToken.tokenContractAddress,
        toTokenAddress: quoteData.toToken.tokenContractAddress,
        amount: quoteData.fromTokenAmount,
        userWalletAddress: userAddress,
        slippage: slippage
    });
    
    try {
        const endpoint = '/api/v5/dex/aggregator/swap';
        const params = {
            chainId: chainId.toString(),
            fromTokenAddress: quoteData.fromToken.tokenContractAddress,
            toTokenAddress: quoteData.toToken.tokenContractAddress,
            amount: quoteData.fromTokenAmount,
            userWalletAddress: userAddress,
            slippage: slippage.toString()
        };
        
        const queryString = Object.keys(params)
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');
        
        const result = await makeRequest(`${endpoint}?${queryString}`);
        
        if (result) {
            console.log('✓ 获取兑换交易成功');
            return result;
        } else {
            throw new Error('获取兑换交易失败');
        }
    } catch (error) {
        console.error('获取兑换交易失败:', error.message);
        throw error;
    }
}

// 4. 获取Gas价格
async function getGasPrice(chainId) {
    try {
        const endpoint = `/api/v5/dex/pre-transaction/gas-price?chainIndex=${chainId}`;
        const result = await makeRequest(endpoint);
        
        if (result && result.length > 0) {
            return result[0];
        }
        throw new Error('获取Gas Price失败');
    } catch (error) {
        console.error('获取Gas Price错误:', error);
        // 返回默认值
        return {
            normal: '110000000',
            min: '100000000',
            max: '120000000'
        };
    }
}

// 5. 检查授权额度
async function checkAllowance(tokenAddress, spenderAddress, walletAddress, provider) {
    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            [
                'function allowance(address,address) view returns (uint256)',
                'function balanceOf(address) view returns (uint256)'
            ],
            provider
        );
        
        const allowance = await tokenContract.allowance(walletAddress, spenderAddress);
        const balance = await tokenContract.balanceOf(walletAddress);
        
        // 检查是否为无限授权（最大值）
        const maxUint256 = ethers.BigNumber.from('115792089237316195423570985008687907853269984665640564039457584007913129639935');
        const isInfiniteApproval = allowance.eq(maxUint256);
        
        return {
            allowance: allowance,
            balance: balance,
            isEnough: isInfiniteApproval || allowance.gte(balance),
            isInfinite: isInfiniteApproval
        };
    } catch (error) {
        console.error('检查授权额度失败:', error.message);
        return {
            allowance: ethers.BigNumber.from(0),
            balance: ethers.BigNumber.from(0),
            isEnough: false,
            isInfinite: false
        };
    }
}

// 6. 执行授权交易
async function executeApproval(approvalData, privateKey, provider, nonceManager = null) {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        
        // 获取nonce
        let nonce;
        if (nonceManager && nonceManager[wallet.address] !== undefined) {
            nonce = nonceManager[wallet.address]++;
        } else {
            nonce = await provider.getTransactionCount(wallet.address, 'pending');
        }
        
        // 处理授权交易数据结构
        let toAddress, txData, gasLimit, gasPrice;
        
        if (Array.isArray(approvalData) && approvalData.length > 0) {
            // 授权交易的to地址应该是代币合约地址，而不是DEX合约地址
            // 从data中解析出代币合约地址
            const data = approvalData[0].data;
            if (data && data.startsWith('0x095ea7b3')) {
                // 这是approve函数调用，to地址应该是代币合约地址
                // 我们需要从调用getApprovalTransaction时传入的tokenAddress获取
                toAddress = approvalData[0].tokenContractAddress || approvalData[0].to;
            } else {
                toAddress = approvalData[0].dexContractAddress || approvalData[0].to;
            }
            txData = approvalData[0].data;
            gasLimit = approvalData[0].gasLimit;
            gasPrice = approvalData[0].gasPrice; // 使用API返回的gasPrice
        } else if (approvalData && typeof approvalData === 'object') {
            toAddress = approvalData.tokenContractAddress || approvalData.to;
            txData = approvalData.data;
            gasLimit = approvalData.gasLimit;
            gasPrice = approvalData.gasPrice; // 使用API返回的gasPrice
        } else {
            throw new Error('无效的授权交易数据格式');
        }
        
        if (!toAddress || !txData) {
            console.error('授权交易数据:', approvalData);
            throw new Error(`授权交易数据缺少必要字段: to=${toAddress}, data=${txData ? '存在' : '缺失'}`);
        }
        
        const approveTx = {
            to: toAddress,
            data: txData,
            gasLimit: ethers.BigNumber.from(gasLimit || '70000'),
            gasPrice: ethers.BigNumber.from(gasPrice || '100000000'), // 使用API返回的gasPrice
            nonce: nonce
        };
        
        // 计算预估gas费用
        const estimatedGasCost = approveTx.gasLimit.mul(approveTx.gasPrice);
        const estimatedGasCostEth = ethers.utils.formatEther(estimatedGasCost);
        
        console.log('发送授权交易:', {
            to: approveTx.to,
            data: approveTx.data.substring(0, 66) + '...',
            gasLimit: approveTx.gasLimit.toString(),
            gasPrice: approveTx.gasPrice.toString(),
            estimatedCost: `${estimatedGasCostEth} BNB`,
            nonce: approveTx.nonce,
            spender: '0x2c34A2Fb1d0b4f55de51E1d0bDEfaDDce6b7cDD6' // 显示被授权的地址
        });
        
        const response = await wallet.sendTransaction(approveTx);
        console.log('授权交易已发送，hash:', response.hash);
        
        const receipt = await response.wait();
        console.log('授权交易已上链！区块号:', receipt.blockNumber, '状态:', receipt.status);
        
        if (receipt.status === 0) {
            // 尝试获取更详细的错误信息
            let errorMessage = '授权失败: 区块状态为0';
            try {
                const reason = await provider.call(approveTx, receipt.blockNumber);
                console.log('交易失败原因:', reason);
            } catch (callError) {
                console.log('无法获取详细错误信息:', callError.message);
            }
            throw new Error(errorMessage);
        }
        
        return {
            success: receipt.status === 1,
            hash: response.hash,
            blockNumber: receipt.blockNumber
        };
    } catch (error) {
        console.error('授权交易失败:', error.message);
        throw error;
    }
}

// 7. 执行兑换交易
async function executeSwap(swapData, privateKey, provider, nonceManager = null) {
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        
        // 获取nonce
        let nonce;
        if (nonceManager && nonceManager[wallet.address] !== undefined) {
            nonce = nonceManager[wallet.address]++;
        } else {
            nonce = await provider.getTransactionCount(wallet.address, 'pending');
        }
        
        // 处理兑换交易数据结构
        let swapToAddress, swapTxData, swapGasLimit, swapValue, swapGasPrice;
        
        if (Array.isArray(swapData) && swapData.length > 0) {
            swapToAddress = swapData[0].tx?.to || swapData[0].dexContractAddress;
            swapTxData = swapData[0].tx?.data || swapData[0].data;
            swapGasLimit = swapData[0].tx?.gas || swapData[0].gasLimit;
            swapValue = swapData[0].tx?.value || swapData[0].value || '0';
            swapGasPrice = swapData[0].tx?.gasPrice || swapData[0].gasPrice; // 使用API返回的gasPrice
        } else if (swapData && typeof swapData === 'object') {
            swapToAddress = swapData.tx?.to || swapData.dexContractAddress;
            swapTxData = swapData.tx?.data || swapData.data;
            swapGasLimit = swapData.tx?.gas || swapData.gasLimit;
            swapValue = swapData.tx?.value || swapData.value || '0';
            swapGasPrice = swapData.tx?.gasPrice || swapData.gasPrice; // 使用API返回的gasPrice
        } else {
            throw new Error('无效的兑换交易数据格式');
        }
        
        if (!swapToAddress || !swapTxData) {
            console.error('兑换交易数据:', swapData);
            throw new Error(`兑换交易数据缺少必要字段: to=${swapToAddress}, data=${swapTxData ? '存在' : '缺失'}`);
        }
        
        const swapTx = {
            to: swapToAddress,
            data: swapTxData,
            gasLimit: ethers.BigNumber.from(swapGasLimit).mul(120).div(100), // 增加20%的Gas Limit
            gasPrice: ethers.BigNumber.from(swapGasPrice || '100000000'), // 使用API返回的gasPrice
            value: ethers.BigNumber.from(swapValue),
            nonce: nonce
        };
        
        // 计算预估gas费用
        const estimatedGasCost = swapTx.gasLimit.mul(swapTx.gasPrice);
        const estimatedGasCostEth = ethers.utils.formatEther(estimatedGasCost);
        
        console.log('发送兑换交易:', {
            to: swapTx.to,
            data: swapTx.data.substring(0, 66) + '...',
            gasLimit: swapTx.gasLimit.toString(),
            gasPrice: swapTx.gasPrice.toString(),
            estimatedCost: `${estimatedGasCostEth} BNB`,
            value: swapTx.value.toString(),
            nonce: swapTx.nonce
        });
        
        const response = await wallet.sendTransaction(swapTx);
        console.log('兑换交易已发送，hash:', response.hash);
        
        const receipt = await response.wait();
        console.log('兑换交易已上链！区块号:', receipt.blockNumber, '状态:', receipt.status);
        
        if (receipt.status === 0) {
            // 尝试获取更详细的错误信息
            let errorMessage = '交易失败: 区块状态为0，可能原因：滑点过大、余额不足、或网络拥堵';
            try {
                const reason = await provider.call(swapTx, receipt.blockNumber);
                console.log('交易失败原因:', reason);
            } catch (callError) {
                console.log('无法获取详细错误信息:', callError.message);
            }
            throw new Error(errorMessage);
        }
        
        return {
            success: receipt.status === 1,
            hash: response.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };
    } catch (error) {
        console.error('兑换交易失败:', error.message);
        // 如果是交易失败，返回更详细的错误信息
        if (error.code === 'CALL_EXCEPTION') {
            throw new Error(`交易执行失败: ${error.message}. 可能原因：滑点过大、余额不足、或网络拥堵`);
        }
        throw error;
    }
}

// 8. 获取支持的代币列表
function getSupportedTokens(network) {
    const cfg = SUPPORTED_TOKENS[network] || {};
    // 对 EVM 网络做规范化校验；Solana 略过
    if (typeof ethers !== 'undefined' && (network === 'ethereum' || network === 'bsc')) {
        const normalized = {};
        for (const [sym, t] of Object.entries(cfg)) {
            if (t && t.address && ethers.utils.isAddress(t.address)) {
                normalized[sym] = t;
            } else {
                // 跳过非规范地址，避免后续授权/兑换失败
                continue;
            }
        }
        return normalized;
    }
    return cfg;
}

// 9. 获取网络配置
function getNetworkConfig(network) {
    return NETWORK_CONFIG[network] || null;
}

// 10. 获取代币余额
async function getTokenBalance(tokenAddress, walletAddress, provider) {
    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function balanceOf(address) view returns (uint256)'],
            provider
        );
        
        const balance = await tokenContract.balanceOf(walletAddress);
        return balance;
    } catch (error) {
        console.error('获取代币余额失败:', error.message);
        return ethers.BigNumber.from(0);
    }
}

// 11. 获取原生代币余额
async function getNativeBalance(walletAddress, provider) {
    try {
        const balance = await provider.getBalance(walletAddress);
        return balance;
    } catch (error) {
        console.error('获取原生代币余额失败:', error.message);
        return ethers.BigNumber.from(0);
    }
}

// 12. 格式化代币数量
function formatTokenAmount(amount, decimals) {
    return ethers.utils.formatUnits(amount, decimals);
}

// 13. 解析代币数量
function parseTokenAmount(amount, decimals) {
    return ethers.utils.parseUnits(amount, decimals);
}

// 14. 验证地址格式
function isValidAddress(address) {
    return ethers.utils.isAddress(address);
}

// 15. 获取交易状态
async function getTransactionStatus(txHash, provider) {
    try {
        const receipt = await provider.getTransactionReceipt(txHash);
        return {
            status: receipt.status === 1 ? 'success' : 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
        };
    } catch (error) {
        console.error('获取交易状态失败:', error.message);
        return { status: 'pending' };
    }
}

// 16. 获取代币信息
async function getTokenInfo(tokenAddress, provider) {
    try {
        const tokenContract = new ethers.Contract(
            tokenAddress,
            [
                'function name() view returns (string)',
                'function symbol() view returns (string)',
                'function decimals() view returns (uint8)'
            ],
            provider
        );
        
        const [name, symbol, decimals] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals()
        ]);
        
        return {
            address: tokenAddress,
            name: name,
            symbol: symbol,
            decimals: decimals
        };
    } catch (error) {
        console.error('获取代币信息失败:', error.message);
        return null;
    }
}

// 17. 批量执行兑换
async function batchExecuteSwap(swapConfigs, privateKeys, provider) {
    // 检查是否为Solana网络
    const isSolana = swapConfigs.length > 0 && isSolanaNetwork(swapConfigs[0].chainId);
    
    if (isSolana) {
        console.log('检测到Solana网络，使用Solana批量执行函数');
        return await batchExecuteSolanaSwap(swapConfigs, privateKeys);
    }
    
    const results = [];
    
    // 为每个钱包创建nonce管理器
    const nonceManagers = {};
    
    for (let i = 0; i < swapConfigs.length; i++) {
        const config = swapConfigs[i];
        const privateKey = privateKeys[i];
        
        try {
            const wallet = new ethers.Wallet(privateKey, provider);
            
            // 初始化nonce管理器
            if (!nonceManagers[wallet.address]) {
                nonceManagers[wallet.address] = await provider.getTransactionCount(wallet.address, 'pending');
            }
            
            console.log(`\n=== 处理钱包 ${i + 1}/${swapConfigs.length}: ${wallet.address} ===`);
            
            // 步骤1: 查询当前钱包余额
            console.log(`📊 查询余额...`);
            
            // 检查代币配置
            if (!config.fromToken || !config.toToken) {
                console.log(`❌ 代币配置错误: fromToken=${config.fromToken}, toToken=${config.toToken}`);
                results.push({
                    index: i,
                    wallet: wallet.address,
                    status: 'failed',
                    reason: '代币配置错误，请重新选择代币'
                });
                continue;
            }
            
            const balance = await getTokenBalance(config.fromToken.address, wallet.address, provider);
            let requiredAmount;
            
            if (config.allTokens) {
                // 兑换所有代币
                const balanceFormatted = ethers.utils.formatUnits(balance, config.fromToken.decimals);
                console.log(`💰 钱包余额: ${balanceFormatted} ${config.fromToken.symbol}`);
                
                if (balance.isZero()) {
                    console.log(`⏭️ 余额为0，跳过该钱包`);
                    results.push({
                        index: i,
                        wallet: wallet.address,
                        status: 'skipped',
                        reason: `余额为0: ${config.fromToken.symbol}`
                    });
                    continue;
                }
                requiredAmount = balance; // 使用全部余额
                console.log(`🎯 将兑换全部余额: ${balanceFormatted} ${config.fromToken.symbol}`);
            } else {
                // 兑换指定数量
                console.log(`💰 钱包余额: ${ethers.utils.formatUnits(balance, config.fromToken.decimals)} ${config.fromToken.symbol}`);
                console.log(`🎯 目标兑换: ${config.amount} ${config.fromToken.symbol}`);
                requiredAmount = ethers.utils.parseUnits(config.amount, config.fromToken.decimals);
                
                if (balance.lt(requiredAmount)) {
                    console.log(`⏭️ 余额不足，跳过该钱包`);
                    results.push({
                        index: i,
                        wallet: wallet.address,
                        status: 'skipped',
                        reason: `余额不足: 需要 ${config.amount} ${config.fromToken.symbol}, 实际余额 ${ethers.utils.formatUnits(balance, config.fromToken.decimals)} ${config.fromToken.symbol}`
                    });
                    continue;
                }
            }
            
            // 步骤2: 获取实时报价
            console.log(`📈 获取实时报价...`);
            const quoteData = await getSwapQuote(config.fromToken, config.toToken, requiredAmount.toString(), config.chainId, config.slippage || '0.5');
            console.log(`✅ 报价获取成功`);
            
            // 步骤3: 检查授权
            console.log(`🔐 检查授权状态...`);
            const spenderAddress = '0x2c34A2Fb1d0b4f55de51E1d0bDEfaDDce6b7cDD6';
            const allowanceInfo = await checkAllowance(config.fromToken.address, spenderAddress, wallet.address, provider);
            
            console.log(`🔑 授权信息:`, {
                allowance: allowanceInfo.isInfinite ? '无限授权' : ethers.utils.formatUnits(allowanceInfo.allowance, config.fromToken.decimals),
                balance: ethers.utils.formatUnits(allowanceInfo.balance, config.fromToken.decimals),
                required: config.allTokens ? '全部余额' : config.amount,
                isEnough: allowanceInfo.isEnough,
                isInfinite: allowanceInfo.isInfinite
            });
            
            if (!allowanceInfo.isEnough) {
                const currentAllowance = allowanceInfo.isInfinite ? '无限授权' : ethers.utils.formatUnits(allowanceInfo.allowance, config.fromToken.decimals);
                console.log(`⚠️ 需要授权，当前授权: ${currentAllowance}`);
                
                // 步骤4: 执行授权
                console.log(`🔐 执行授权交易...`);
                const approvalData = await getApprovalTransaction(config.fromToken.address, requiredAmount.toString(), config.chainId);
                
                // 确保授权数据包含代币合约地址
                if (Array.isArray(approvalData) && approvalData.length > 0) {
                    approvalData[0].tokenContractAddress = config.fromToken.address;
                } else if (approvalData && typeof approvalData === 'object') {
                    approvalData.tokenContractAddress = config.fromToken.address;
                }
                
                const approvalResult = await executeApproval(approvalData, privateKey, provider, nonceManagers);
                
                if (!approvalResult.success) {
                    console.log(`❌ 授权失败`);
                    results.push({
                        index: i,
                        wallet: wallet.address,
                        status: 'failed',
                        reason: '授权失败'
                    });
                    continue;
                }
                
                console.log(`✅ 授权成功，交易哈希: ${approvalResult.hash}`);
            } else {
                console.log(`✅ 已有足够授权，跳过授权步骤`);
            }
            
            // 步骤5: 执行兑换交易
            console.log(`🔄 执行兑换交易...`);
            let swapResult;
            let retryCount = 0;
            const maxRetries = 2;
            
            while (retryCount <= maxRetries) {
                try {
                    // 根据重试次数调整滑点值
                    let slippageValue;
                    if (retryCount === 0) {
                        slippageValue = config.slippage || '0.5';
                    } else if (retryCount === 1) {
                        slippageValue = '1.0';
                    } else {
                        slippageValue = '2.0';
                    }
                    
                    console.log(`📊 使用滑点: ${slippageValue}% (重试: ${retryCount}/${maxRetries + 1})`);
                    const swapData = await getSwapTransaction(quoteData, wallet.address, config.chainId, slippageValue);
                    swapResult = await executeSwap(swapData, privateKey, provider, nonceManagers);
                    console.log(`✅ 兑换交易成功，哈希: ${swapResult.hash}`);
                    break; // 成功则跳出循环
                } catch (error) {
                    retryCount++;
                    console.log(`⚠️ 兑换失败 (${retryCount}/${maxRetries + 1}): ${error.message}`);
                    
                    if (retryCount > maxRetries) {
                        throw error; // 重试次数用完，抛出错误
                    }
                    
                    console.log(`⏳ 等待1秒后重试...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            
            results.push({
                index: i,
                wallet: wallet.address,
                status: swapResult.success ? 'success' : 'failed',
                hash: swapResult.hash,
                reason: swapResult.success ? '兑换成功' : `兑换失败: ${swapResult.reason || '未知错误'}`
            });
            
            console.log(`🎉 钱包 ${i + 1} 处理完成\n`);
            
        } catch (error) {
            let errorMessage = error.message;
            
            console.log(`❌ 钱包 ${i + 1} 处理失败: ${error.message}`);
            
            // 提供更友好的错误信息
            if (errorMessage.includes('insufficient funds')) {
                errorMessage = '余额不足';
            } else if (errorMessage.includes('nonce')) {
                errorMessage = '交易nonce错误，请稍后重试';
            } else if (errorMessage.includes('gas')) {
                errorMessage = 'Gas费用不足';
            } else if (errorMessage.includes('slippage')) {
                errorMessage = '滑点过大，请调整兑换数量';
            } else if (errorMessage.includes('CALL_EXCEPTION')) {
                errorMessage = '交易执行失败，可能原因：滑点过大、余额不足、或网络拥堵';
            }
            
            results.push({
                index: i,
                wallet: privateKey ? new ethers.Wallet(privateKey).address : 'unknown',
                status: 'failed',
                reason: errorMessage
            });
            
            console.log(`💔 钱包 ${i + 1} 处理失败\n`);
        }
    }
    
    return results;
}

// 18. 验证代币地址
async function validateTokenAddress(tokenAddress, provider) {
    try {
        const tokenInfo = await getTokenInfo(tokenAddress, provider);
        return tokenInfo !== null;
    } catch (error) {
        return false;
    }
}

// ========== Solana 特定函数 ==========

// 19. Solana - 准备交易
async function prepareSolanaTransaction(callData) {
    try {
        console.log('正在准备Solana交易...');
        
        const connection = initSolanaConnection();
        if (!connection) {
            throw new Error('Solana连接未初始化');
        }
        
        // 动态加载Solana Web3.js
        if (!window.solanaWeb3) {
            throw new Error('Solana Web3.js 未加载');
        }
        
        const { Transaction, VersionedTransaction } = window.solanaWeb3;
        
        // 解码base58编码的交易数据
        const decodedTransaction = bs58Decode(callData);
        
        // 获取最新的blockhash（带RPC故障切换）
        const recentBlockHash = await withSolanaRpcFailover(async (conn) => {
            return await conn.getLatestBlockhash();
        });
        console.log('✓ 获取blockhash成功');
        
        let tx;
        
        // 尝试反序列化为版本化交易
        try {
            tx = VersionedTransaction.deserialize(decodedTransaction);
            console.log('✓ 创建版本化交易成功');
            tx.message.recentBlockhash = recentBlockHash.blockhash;
        } catch (e) {
            // 如果版本化失败，回退到传统交易
            console.log('版本化交易失败，尝试传统交易');
            tx = Transaction.from(decodedTransaction);
            console.log('✓ 创建传统交易成功');
            tx.recentBlockhash = recentBlockHash.blockhash;
        }
        
        return {
            transaction: tx,
            recentBlockHash
        };
    } catch (error) {
        console.error('准备Solana交易失败:', error.message);
        throw error;
    }
}

// 20. Solana - 签名交易
async function signSolanaTransaction(transaction, privateKey) {
    try {
        console.log('正在签名Solana交易...');
        
        if (!window.solanaWeb3) {
            throw new Error('Solana Web3.js 未加载');
        }
        
        const { Keypair, VersionedTransaction, Transaction } = window.solanaWeb3;
        
        // 仅使用 base58 解码的私钥创建 Keypair
        const decoded = bs58Decode(privateKey);
        const keypair = Keypair.fromSecretKey(decoded);
        console.log('✓ 使用base58私钥签名');
        
        if (transaction instanceof VersionedTransaction) {
            transaction.sign([keypair]);
        } else if (transaction instanceof Transaction) {
            if (!transaction.feePayer) transaction.feePayer = keypair.publicKey;
            transaction.partialSign(keypair);
        } else {
            throw new Error('未知的Solana交易类型');
        }
        
        console.log('✓ Solana交易签名成功');
        return transaction;
    } catch (error) {
        console.error('签名Solana交易失败:', error.message);
        throw error;
    }
}

// 21. Solana - 广播交易
async function broadcastSolanaTransaction(signedTransaction) {
    try {
        console.log('正在广播Solana交易...');
        
        const connection = initSolanaConnection();
        if (!connection) {
            throw new Error('Solana连接未初始化');
        }
        
        // 序列化交易
        const serializedTransaction = signedTransaction.serialize();
        
        // 发送到Solana网络（带RPC故障切换）
        const signature = await withSolanaRpcFailover(async (conn) => {
            return await conn.sendRawTransaction(serializedTransaction, {
                skipPreflight: false,
                preflightCommitment: 'confirmed',
                maxRetries: 3
            });
        });
        
        console.log('✓ Solana交易广播成功，签名:', signature);
        return signature;
    } catch (error) {
        console.error('广播Solana交易失败:', error.message);
        throw error;
    }
}

// 22. Solana - 等待交易确认
async function waitForSolanaConfirmation(signature) {
    try {
        console.log('等待Solana交易确认...');
        const connection = initSolanaConnection();
        if (!connection) {
            throw new Error('Solana连接未初始化');
        }

        // 使用 getSignatureStatuses 轮询，最长等待60秒
        const deadline = Date.now() + 60000;
        while (Date.now() < deadline) {
            const statusResp = await withSolanaRpcFailover(async (conn) => conn.getSignatureStatuses([signature]));
            const status = statusResp && statusResp.value && statusResp.value[0];
            if (status) {
                if (status.err) {
                    throw new Error('Solana交易确认失败: ' + JSON.stringify(status.err));
                }
                if (status.confirmations === null || (typeof status.confirmationStatus === 'string' && (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized'))) {
                    console.log('✓ Solana交易确认成功');
                    return status;
                }
            }
            await new Promise(r => setTimeout(r, 1500));
        }

        // 超时：返回pending而不抛错
        return { pending: true };
    } catch (error) {
        console.error('等待Solana交易确认失败:', error.message);
        throw error;
    }
}

// 23. Solana - 检查代币余额
async function checkSolanaTokenBalance(tokenAddress, walletAddress) {
    try {
        let connection = initSolanaConnection();
        if (!connection) {
            throw new Error('Solana连接未初始化');
        }
        
        if (!window.solanaWeb3) {
            throw new Error('Solana Web3.js 未加载');
        }
        
        const { PublicKey } = window.solanaWeb3;
        
        const publicKey = new PublicKey(walletAddress);
        const tokenPublicKey = new PublicKey(tokenAddress);
        
        // 原生SOL余额（带RPC失败自动切换）
        if (tokenAddress === 'So11111111111111111111111111111111111111112') {
            const lamports = await withSolanaRpcFailover(async (conn) => {
                return await conn.getBalance(publicKey, { commitment: 'confirmed' });
            });
            return lamports / 1e9;
        }

        // SPL Token余额（带RPC失败自动切换）
        const tokenAccounts = await withSolanaRpcFailover(async (conn) => {
            return await conn.getParsedTokenAccountsByOwner(publicKey, { mint: tokenPublicKey });
        });
        
        if (tokenAccounts.value.length === 0) {
            return 0;
        }
        
        return tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    } catch (error) {
        console.error('检查Solana代币余额失败:', error.message);
        return -1; // 返回-1表示未知（例如CORS导致的失败），避免误判为0
    }
}

// 24. Solana - 检查SOL余额
async function checkSolanaBalance(walletAddress) {
    try {
        const connection = initSolanaConnection();
        if (!connection) {
            throw new Error('Solana连接未初始化');
        }
        
        if (!window.solanaWeb3) {
            throw new Error('Solana Web3.js 未加载');
        }
        
        const { PublicKey } = window.solanaWeb3;
        
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey, { commitment: 'confirmed' });
        
        return balance / 1e9; // SOL有9位小数
    } catch (error) {
        console.error('检查Solana余额失败:', error.message);
        return 0;
    }
}

// 25. Solana - 执行兑换交易
async function executeSolanaSwap(swapData, privateKey) {
    try {
        console.log('正在执行Solana兑换交易...');
        const { transaction } = await prepareSolanaTransaction(swapData[0].tx.data);
        const signedTransaction = await signSolanaTransaction(transaction, privateKey);
        const signature = await broadcastSolanaTransaction(signedTransaction);

        // 等待确认，若超时则视为pending返回
        const confirmResult = await waitForSolanaConfirmation(signature);
        const isPending = confirmResult && confirmResult.pending;

        return {
            success: true,
            hash: signature,
            blockNumber: null,
            status: isPending ? 'pending' : 'confirmed'
        };
    } catch (error) {
        console.error('Solana兑换交易失败:', error.message);
        throw error;
    }
}

// 26. Solana - 批量执行兑换
async function batchExecuteSolanaSwap(swapConfigs, privateKeys) {
    console.log('=== 批量执行Solana兑换 ===');
    console.log('私钥数量:', privateKeys.length);
    if (privateKeys.length > 0) {
        const masked = privateKeys[0].length >= 6 ? `${privateKeys[0].slice(0,2)}***${privateKeys[0].slice(-2)}` : '***';
        console.log('首个私钥(打码):', masked, '长度:', privateKeys[0].length);
    }
    const results = [];
    
    for (let i = 0; i < swapConfigs.length; i++) {
        const config = swapConfigs[i];
        const privateKey = privateKeys[i];
        
        try {
            if (!window.solanaWeb3) {
                throw new Error('Solana Web3.js 未加载');
            }
            
            const { Keypair } = window.solanaWeb3;
            
            // 验证私钥格式
            const validatedPrivateKey = validateSolanaPrivateKey(privateKey);
            
            // 创建Keypair
            let keypair;
            try {
                keypair = Keypair.fromSecretKey(validatedPrivateKey);
            } catch (error) {
                // 如果直接使用失败，尝试解码
                const decoded = bs58Decode(validatedPrivateKey);
                keypair = Keypair.fromSecretKey(decoded);
            }
            
            console.log('✓ Keypair创建成功，钱包地址:', keypair.publicKey.toString());
            
            const walletAddress = keypair.publicKey.toString();
            
            console.log(`\n=== 处理Solana钱包 ${i + 1}/${swapConfigs.length}: ${walletAddress} ===`);

            // 预创建ATA，避免 AccountNotInitialized
            const fromIsSOL = config.fromToken.address === 'So11111111111111111111111111111111111111112';
            const toIsSOL = config.toToken.address === 'So11111111111111111111111111111111111111112';
            if (!fromIsSOL) {
                await ensureAssociatedTokenAccount(config.fromToken.address, walletAddress, keypair);
            }
            if (!toIsSOL) {
                await ensureAssociatedTokenAccount(config.toToken.address, walletAddress, keypair);
            }

            // 计算用于报价的基础单位数量（字符串）
            let amountForQuote = config.amount;

            // 若来源为SOL，先将用户希望兑换的数量wrap为WSOL，并同步用于报价的lamports
            if (fromIsSOL) {
                let amountStr = config.amount;
                if (amountStr === 'all') {
                    const solBalance = await checkSolanaBalance(walletAddress);
                    amountStr = (solBalance > 0 ? Math.max(solBalance - 0.002, 0) : 0).toString();
                }
                const decimalLamports = toBaseUnitsDecimalString(amountStr, config.fromToken.decimals); // 9位小数
                const lamports = parseInt(decimalLamports, 10);
                if (lamports > 0) {
                    await wrapNativeSolIfNeeded(walletAddress, keypair, lamports);
                }
                amountForQuote = lamports.toString();
            } else {
                // 非SOL来源：处理 all 和小数
                if (config.amount === 'all') {
                    const bal = await checkSolanaTokenBalance(config.fromToken.address, walletAddress);
                    const safeBal = bal > 0 ? bal : 0;
                    amountForQuote = toBaseUnitsDecimalString(safeBal.toString(), config.fromToken.decimals);
                } else if (typeof config.amount === 'string' && !/^[0-9]+$/.test(config.amount)) {
                    amountForQuote = toBaseUnitsDecimalString(config.amount, config.fromToken.decimals);
                }
            }
            
            // 检查余额
            const balance = await checkSolanaTokenBalance(config.fromToken.address, walletAddress);
            console.log(`💰 钱包余额: ${balance} ${config.fromToken.symbol}`);
            
            // -1 表示查询失败（可能CORS），不中断流程，仅提醒
            if (balance === -1) {
                console.warn('⚠️ 无法查询余额（可能CORS），继续尝试兑换');
            } else if (config.amount !== 'all' && balance < parseFloat(config.amount)) {
                console.log(`⏭️ 余额不足，跳过该钱包`);
                results.push({
                    index: i,
                    wallet: walletAddress,
                    status: 'skipped',
                    reason: `余额不足: 需要 ${config.amount} ${config.fromToken.symbol}, 实际余额 ${balance} ${config.fromToken.symbol}`
                });
                continue;
            }
            
            // 获取兑换报价
            console.log(`📈 获取实时报价...`);
            const quoteData = await getSwapQuote(config.fromToken, config.toToken, amountForQuote, config.chainId, config.slippage || '0.5');
            console.log(`✅ 报价获取成功`);
            
            // 获取兑换交易
            console.log(`🔄 获取兑换交易...`);
            const swapData = await getSwapTransaction(quoteData, walletAddress, config.chainId, config.slippage || '0.5');
            
            // 执行兑换
            console.log(`🔄 执行兑换交易...`);
            const swapResult = await executeSolanaSwap(swapData, privateKey);

            // 后置处理：确保严格的资产形态
            // from 是 SOL：结束后尝试关闭WSOL，避免残留WSOL
            if (fromIsSOL) {
                try { await unwrapNativeSolIfNeeded(walletAddress, keypair); } catch (e) { /* 忽略 */ }
            }
            // to 是 SOL：OKX聚合器路由可能产出WSOL，结束后尝试关闭WSOL
            if (toIsSOL) {
                try { await unwrapNativeSolIfNeeded(walletAddress, keypair); } catch (e) { /* 忽略 */ }
            }
            
            results.push({
                index: i,
                wallet: walletAddress,
                status: swapResult.status || 'success',
                hash: swapResult.hash,
                reason: swapResult.status === 'pending' ? '已广播，等待确认' : '兑换成功'
            });
            
            console.log(`🎉 Solana钱包 ${i + 1} 处理完成\n`);
            
        } catch (error) {
            console.log(`❌ Solana钱包 ${i + 1} 处理失败: ${error.message}`);
            
            let walletAddress = 'unknown';
            try {
                if (privateKey) {
                    const { Keypair } = window.solanaWeb3;
                    let keypair;
                    try {
                        keypair = Keypair.fromSecretKey(privateKey);
                    } catch (e1) {
                        if (privateKey.includes(',')) {
                            const keyArray = privateKey.split(',').map(Number);
                            keypair = Keypair.fromSecretKey(new Uint8Array(keyArray));
                        } else if (privateKey.startsWith('[') && privateKey.endsWith(']')) {
                            const keyArray = JSON.parse(privateKey);
                            keypair = Keypair.fromSecretKey(new Uint8Array(keyArray));
                        } else {
                            const decoded = bs58Decode(privateKey);
                            keypair = Keypair.fromSecretKey(decoded);
                        }
                    }
                    walletAddress = keypair.publicKey.toString();
                }
            } catch (e) {
                // 忽略错误，使用默认值
            }
            
            results.push({
                index: i,
                wallet: walletAddress,
                status: 'failed',
                reason: error.message
            });
        }
    }
    
    return results;
}

// 27. 工具函数 - Base58解码（无精度丢失）
function bs58Decode(str) {
    if (typeof str !== 'string') {
        throw new Error('Invalid input for base58 decode');
    }
    str = str.trim();
    if (str.length === 0) return new Uint8Array([]);

    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const MAP = new Uint8Array(256);
    MAP.fill(255);
    for (let i = 0; i < ALPHABET.length; i++) {
        MAP[ALPHABET.charCodeAt(i)] = i;
    }

    // 统计前导'1'（对应前导0x00）
    let leadingZeros = 0;
    while (leadingZeros < str.length && str[leadingZeros] === '1') {
        leadingZeros++;
    }

    // 基于字节数组进行进位运算，避免JS大整数溢出
    const bytes = []; // 小端存储（低位在前）
    for (let i = 0; i < str.length; i++) {
        const c = str.charCodeAt(i);
        const value = MAP[c];
        if (value === 255) {
            throw new Error('Invalid base58 character');
        }
        // 跳过作为前导零计数的'1'
        if (i < leadingZeros && value === 0) continue;

        let carry = value;
        for (let j = 0; j < bytes.length; j++) {
            const x = bytes[j] * 58 + carry;
            bytes[j] = x & 0xff;
            carry = x >> 8;
        }
        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }

    // 添加前导零
    for (let k = 0; k < leadingZeros; k++) {
        bytes.push(0);
    }

    // 转换为大端
    bytes.reverse();
    return Uint8Array.from(bytes);
}

// 28. Solana私钥验证和转换
function validateSolanaPrivateKey(privateKey) {
    if (!privateKey || typeof privateKey !== 'string') {
        throw new Error('私钥不能为空');
    }
    
    // 清理私钥字符串
    privateKey = privateKey.trim();
    
    // 检查是否为有效的base58格式
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    const isValidBase58 = base58Regex.test(privateKey);
    
    if (!isValidBase58) {
        throw new Error('私钥格式错误：只支持base58字符串格式');
    }
    
    // 检查长度
    if (privateKey.length !== 88) {
        throw new Error(`私钥长度错误：应为88个字符，实际为${privateKey.length}个字符`);
    }
    
    // 直接返回私钥字符串，让后续函数处理
    return privateKey;
}

// 轻量级十进制字符串 -> 基础单位（不丢精度）
function toBaseUnitsDecimalString(amountStr, decimals) {
    if (typeof amountStr !== 'string') amountStr = String(amountStr);
    amountStr = amountStr.trim();
    if (amountStr.length === 0) return '0';
    if (!amountStr.includes('.')) {
        // 纯整数，直接补零
        return amountStr + '0'.repeat(decimals);
    }
    const [intPart, fracPartRaw] = amountStr.split('.');
    const fracPart = (fracPartRaw || '').slice(0, decimals); // 截断到decimals位
    const paddedFrac = fracPart + '0'.repeat(Math.max(0, decimals - fracPart.length));
    const combined = (intPart || '0') + paddedFrac;
    // 去掉前导零
    return combined.replace(/^0+(?!$)/, '');
}

// 关联代币账户（ATA）辅助
async function ensureAssociatedTokenAccount(mintAddress, ownerAddress, payerKeypair) {
    if (!window.solanaWeb3) throw new Error('Solana Web3.js 未加载');
    const { PublicKey, SystemProgram, Transaction, TransactionInstruction, SYSVAR_RENT_PUBKEY } = window.solanaWeb3;

    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

    const owner = new PublicKey(ownerAddress);
    const mint = new PublicKey(mintAddress);

    // 已存在则跳过
    const existing = await withSolanaRpcFailover(async (conn) => {
        return await conn.getParsedTokenAccountsByOwner(owner, { mint });
    });
    if (existing.value && existing.value.length > 0) {
        return existing.value[0].pubkey.toString();
    }

    // 推导ATA地址
    const [ata] = await PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // 构造创建ATA指令（CreateAssociatedTokenAccount）
    const ix = new TransactionInstruction({
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        keys: [
            { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: true }, // payer
            { pubkey: ata, isSigner: false, isWritable: true },                   // associated account
            { pubkey: owner, isSigner: false, isWritable: false },               // owner
            { pubkey: mint, isSigner: false, isWritable: false },                // mint
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        ],
        data: new Uint8Array([0])
    });

    // 发送交易（带RPC故障切换）
    const { blockhash } = await withSolanaRpcFailover(async (conn) => {
        return await conn.getLatestBlockhash();
    });

    const tx = new Transaction({ feePayer: payerKeypair.publicKey, recentBlockhash: blockhash });
    tx.add(ix);
    tx.partialSign(payerKeypair);

    const signature = await withSolanaRpcFailover(async (conn) => {
        return await conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 });
    });

    await waitForSolanaConfirmation(signature);

    return ata.toString();
}

// 将原生SOL包裹为WSOL（向ATA转入lamports并SyncNative）
async function wrapNativeSolIfNeeded(ownerAddress, payerKeypair, lamports) {
    if (lamports <= 0) return null;
    if (!window.solanaWeb3) throw new Error('Solana Web3.js 未加载');
    const { PublicKey, SystemProgram, Transaction, TransactionInstruction } = window.solanaWeb3;
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112');

    // 确保WSOL ATA存在
    const ata = await ensureAssociatedTokenAccount(NATIVE_MINT, ownerAddress, payerKeypair);
    const ataPubkey = new PublicKey(ata);

    const { blockhash } = await withSolanaRpcFailover(async (conn) => conn.getLatestBlockhash());
    const tx = new Transaction({ feePayer: payerKeypair.publicKey, recentBlockhash: blockhash });

    // 向WSOL ATA转入lamports
    tx.add(SystemProgram.transfer({ fromPubkey: payerKeypair.publicKey, toPubkey: ataPubkey, lamports }));

    // SyncNative 指令（索引17）
    const syncIx = new TransactionInstruction({
        programId: TOKEN_PROGRAM_ID,
        keys: [{ pubkey: ataPubkey, isSigner: false, isWritable: true }],
        data: new Uint8Array([17])
    });
    tx.add(syncIx);

    tx.partialSign(payerKeypair);
    const sig = await withSolanaRpcFailover(async (conn) => conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 }));
    await waitForSolanaConfirmation(sig);
    return ata;
}

// 关闭WSOL账户以解包为原生SOL（CloseAccount）
async function unwrapNativeSolIfNeeded(ownerAddress, payerKeypair) {
    if (!window.solanaWeb3) throw new Error('Solana Web3.js 未加载');
    const { PublicKey, Transaction, TransactionInstruction } = window.solanaWeb3;
    const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
    const NATIVE_MINT = new PublicKey('So11111111111111111111111111111111111111112');

    const ownerPubkey = new PublicKey(ownerAddress);

    // 查找所有WSOL账户
    const list = await withSolanaRpcFailover(async (conn) =>
        conn.getParsedTokenAccountsByOwner(ownerPubkey, { mint: NATIVE_MINT })
    );
    if (!list.value.length) return null;

    const { blockhash } = await withSolanaRpcFailover(async (conn) => conn.getLatestBlockhash());
    const tx = new Transaction({ feePayer: payerKeypair.publicKey, recentBlockhash: blockhash });

    let hasIx = false;
    for (const acc of list.value) {
        const ataPubkey = acc.pubkey;
        const uiAmount = Number(acc.account.data.parsed.info.tokenAmount.uiAmount || 0);
        // 不论余额是否为0，统一尝试关闭，允许重复调用
        const closeIx = new TransactionInstruction({
            programId: TOKEN_PROGRAM_ID,
            keys: [
                { pubkey: ataPubkey, isSigner: false, isWritable: true },
                { pubkey: ownerPubkey, isSigner: false, isWritable: true },
                { pubkey: payerKeypair.publicKey, isSigner: true, isWritable: false }
            ],
            data: new Uint8Array([9])
        });
        tx.add(closeIx);
        hasIx = true;
    }

    if (!hasIx) return null;

    tx.partialSign(payerKeypair);
    const sig = await withSolanaRpcFailover(async (conn) =>
        conn.sendRawTransaction(tx.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 3 })
    );
    await waitForSolanaConfirmation(sig);
    return sig;
}

// Solana: 校验地址（SPL mint 或公钥）
function isValidSolanaAddress(address) {
    try {
        if (!window.solanaWeb3) return false;
        const { PublicKey } = window.solanaWeb3;
        new PublicKey(address);
        return true;
    } catch (_) { return false; }
}

// Solana: 读取 SPL 代币 decimals
async function getSolanaTokenDecimals(mintAddress) {
    if (!window.solanaWeb3) throw new Error('Solana Web3.js 未加载');
    const { PublicKey } = window.solanaWeb3;
    const mint = new PublicKey(mintAddress);
    const resp = await withSolanaRpcFailover(async (conn) => conn.getParsedAccountInfo(mint));
    const info = resp && resp.value && resp.value.data && resp.value.data.parsed && resp.value.data.parsed.info;
    if (!info || typeof info.decimals !== 'number') throw new Error('无法获取代币精度');
    return info.decimals;
}

// Solana: 获取代币信息（symbol 简化为自定义）
async function getSolanaTokenInfo(mintAddress) {
    const decimals = await getSolanaTokenDecimals(mintAddress);
    return { address: mintAddress, name: 'SPL-Token', symbol: 'SPL', decimals };
}

// 导出所有接口
window.OKXDEX = {
    // 配置
    config: getOkxDexConfig(),
    supportedTokens: SUPPORTED_TOKENS,
    networkConfig: NETWORK_CONFIG,
    
    // 核心功能
    getSwapQuote,
    getApprovalTransaction,
    getSwapTransaction,
    getGasPrice,
    checkAllowance,
    executeApproval,
    executeSwap,
    
    // 工具函数
    getSupportedTokens,
    getNetworkConfig,
    getTokenBalance,
    getNativeBalance,
    formatTokenAmount,
    parseTokenAmount,
    isValidAddress,
    getTransactionStatus,
    
    // 新增功能
    getTokenInfo,
    batchExecuteSwap,
    validateTokenAddress,
    
    // Solana特定功能
    prepareSolanaTransaction,
    signSolanaTransaction,
    broadcastSolanaTransaction,
    waitForSolanaConfirmation,
    checkSolanaTokenBalance,
    checkSolanaBalance,
    executeSolanaSwap,
    batchExecuteSolanaSwap,
    
    // 辅助函数
    generateSignature,
    getHeaders,
    makeRequest,
    initSolanaConnection,
    isSolanaNetwork,
    bs58Decode,
    validateSolanaPrivateKey,
    toBaseUnitsDecimalString,
    ensureAssociatedTokenAccount,
    wrapNativeSolIfNeeded,
    unwrapNativeSolIfNeeded,
    isValidSolanaAddress,
    getSolanaTokenDecimals,
    getSolanaTokenInfo
};

console.log('✅ OKX DEX 模块加载完成（包含Solana支持）');

// （已移除）测试入口

// （已移除）测试自定义解码函数

// （已移除）测试你的私钥函数

// （已移除）验证Solana私钥格式函数

// （已移除）生成有效Solana私钥函数

// （已移除）Base58编码函数（重复）

// （已移除）生成有效Solana私钥函数（重复）

// （已移除）验证Solana私钥函数（测试）