// 代币归集模块
// 包含归集代币的所有功能

// 执行代币归集
async function executeCollectModal() {
    const toAddress = document.getElementById('modalCollectToAddress').value.trim();
    const tokenAddress = document.getElementById('modalCollectTokenAddress').value.trim();
    const privateKeys = document.getElementById('modalCollectPrivateKeys').value
        .split('\n')
        .map(a => a.trim())
        .filter(Boolean);
    const collectAll = document.getElementById('collectAllTokens').checked;
    const collectAmount = document.getElementById('modalCollectAmount').value.trim();
    const enableMonitor = document.getElementById('enableMonitorMode').checked;
        
    if (!toAddress) {
        if (window.notifyError) notifyError('请填写归集地址'); else alert('请填写归集地址');
        return;
    }
        
    if (privateKeys.length === 0) {
        if (window.notifyError) notifyError('请填写归集钱包私钥列表'); else alert('请填写归集钱包私钥列表');
        return;
    }
    
    // 如果启用监控模式，启动监控
    if (enableMonitor) {
        startMonitorMode();
        closeModal('collectModal');
        return;
    }
    
    closeModal('collectModal');
    showProgress('归集代币');
    setupTableHeader('collect');
    
    const provider = await getProvider();
    if (!provider) return;
    
    // 确定代币类型和名称
    const tokenName = tokenAddress ? await getTokenSymbol(provider, tokenAddress) : '原生代币';
    
    let success = 0;
    let fail = 0;
    let completed = 0;

    const savedCfg = (window.Storage ? Storage.load('crypto-tool-config', {}) : {});
    const concurrency = Math.max(1, Math.min(20, Number(savedCfg.collectConcurrency || 6))); // 建议 5-8，根据RPC限速调整
    let idx = 0;

    async function worker() {
        while (idx < privateKeys.length) {
            const i = idx++;
            const privateKey = privateKeys[i];
            const wallet = new ethers.Wallet(privateKey, provider);
            const fromAddress = wallet.address;
            const rowId = `collect-${Date.now()}-${i}`;
            
            addTableRow({
                id: rowId,
                fromAddress: fromAddress,
                toAddress: toAddress,
                token: tokenName,
                amount: '待查询',
                status: 'processing'
            });
            
            try {
                let result;
                let actualAmount = '0';
                
                if (!tokenAddress) {
                    // 归集原生代币
                    const balance = await provider.getBalance(wallet.address);
                    
                    // 计算要归集的数量
                    let transferAmount;
                    if (collectAll || !collectAmount) {
                        // 归集全部余额
                        const baseTransaction = { to: toAddress, value: balance };
                        const gasSettings = await getOptimizedGasSettings(wallet, baseTransaction);
                        const fee = gasSettings.gasPrice.mul(gasSettings.gasLimit);
                        
                        if (balance.gt(fee)) {
                            transferAmount = balance.sub(fee);
                            actualAmount = ethers.utils.formatEther(transferAmount);
                        } else {
                            updateTableRow(rowId, { status: 'failed', amount: `余额不足: ${ethers.utils.formatEther(balance)}` });
                            fail++; completed++; updateProgress((completed / privateKeys.length) * 100, `已完成 ${completed}/${privateKeys.length}`); continue;
                        }
                    } else {
                        // 归集指定数量
                        try {
                            transferAmount = ethers.utils.parseEther(collectAmount);
                            if (transferAmount.gt(balance)) {
                                updateTableRow(rowId, { status: 'failed', amount: `余额不足: ${ethers.utils.formatEther(balance)}` });
                                fail++; completed++; updateProgress((completed / privateKeys.length) * 100, `已完成 ${completed}/${privateKeys.length}`); continue;
                            }
                            actualAmount = collectAmount;
                        } catch (_) {
                            updateTableRow(rowId, { status: 'failed', amount: '归集数量格式错误' });
                            fail++; completed++; updateProgress((completed / privateKeys.length) * 100, `已完成 ${completed}/${privateKeys.length}`); continue;
                        }
                    }
                    
                    // 执行归集
                    const gasSettings = await getOptimizedGasSettings(wallet, { to: toAddress, value: transferAmount });
                    result = await wallet.sendTransaction({ 
                        to: toAddress, 
                        value: transferAmount,
                        ...gasSettings
                    });
                    await result.wait();
                    
                    // 确保actualAmount有正确的值
                    const finalAmount = actualAmount || ethers.utils.formatEther(transferAmount);
                    
                    updateTableRow(rowId, { 
                        status: 'success', 
                        hash: result.hash,
                        amount: finalAmount,
                        privateKey: privateKey  // 保存私钥用于重试
                    });
                    success++;
                } else {
                    // 归集ERC20代币
                    const contract = new ethers.Contract(tokenAddress, [
                        "function transfer(address to, uint256 value) public returns (bool)",
                        "function balanceOf(address owner) view returns (uint256)",
                        "function decimals() view returns (uint8)"
                    ], wallet);
                    
                    let decimals = 18;
                    try {
                        decimals = await contract.decimals();
                    } catch (_) {
                        console.log('无法获取decimals，使用默认值18');
                    }
                    
                    const balance = await contract.balanceOf(wallet.address);
                    if (balance.gt(0)) {
                        // 计算要归集的数量
                        let transferAmount;
                        if (collectAll || !collectAmount) {
                            // 归集全部余额
                            transferAmount = balance;
                            actualAmount = ethers.utils.formatUnits(balance, decimals);
                        } else {
                            // 归集指定数量
                            try {
                                transferAmount = ethers.utils.parseUnits(collectAmount, decimals);
                                if (transferAmount.gt(balance)) {
                                    updateTableRow(rowId, { status: 'failed', amount: `余额不足: ${ethers.utils.formatUnits(balance, decimals)}` });
                                    fail++; completed++; updateProgress((completed / privateKeys.length) * 100, `已完成 ${completed}/${privateKeys.length}`); continue;
                                }
                                actualAmount = collectAmount;
                            } catch (_) {
                                updateTableRow(rowId, { status: 'failed', amount: '归集数量格式错误' });
                                fail++; completed++; updateProgress((completed / privateKeys.length) * 100, `已完成 ${completed}/${privateKeys.length}`); continue;
                            }
                        }
                        
                        // 获取Gas设置
                        const transaction = await contract.populateTransaction.transfer(toAddress, transferAmount);
                        const gasSettings = await getOptimizedGasSettings(wallet, transaction);
                        
                        result = await contract.transfer(toAddress, transferAmount, gasSettings);
                        await result.wait();
                        
                        // 确保actualAmount有正确的值
                        const finalAmount = actualAmount || ethers.utils.formatUnits(transferAmount, decimals);
                        
                        updateTableRow(rowId, { 
                            status: 'success', 
                            hash: result.hash,
                            amount: finalAmount,
                            privateKey: privateKey  // 保存私钥用于重试
                        });
                        success++;
                    } else {
                        updateTableRow(rowId, { status: 'failed', amount: '余额为0' });
                        fail++;
                    }
                }
            } catch (error) {
                updateTableRow(rowId, { status: 'failed', fromAddress, toAddress, token: tokenName, amount: '归集失败', privateKey });
                if (window.notifyError) notifyError(`归集失败: ${error.message}`);
                console.error(`归集失败 ${fromAddress}:`, error);
                fail++;
            } finally {
                completed++;
                updateProgress((completed / privateKeys.length) * 100, `已完成 ${completed}/${privateKeys.length}`);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, privateKeys.length) }, () => worker()));
    
    // 完成
    updateProgress(100, `归集完成！成功: ${success}, 失败: ${fail}`);
    
    // 保存私钥到加密存储
    if (privateKeys.length > 0) {
        await SecureStorage.saveEncryptedPrivateKey('collectPrivateKeys', privateKeys.join('\n'));
    }
}

// 归集原生代币
async function collectNative(provider, toAddress, privateKeys) {
    log(`开始归集原生代币到地址: ${toAddress}`);
    log(`总共${privateKeys.length}个钱包需要归集`);
    
    let success = 0, fail = 0, failList = [];
    
    for (let i = 0; i < privateKeys.length; i++) {
        const pk = privateKeys[i];
        updateProgress(i + 1, privateKeys.length);
        
        try {
            const wallet = new ethers.Wallet(pk, provider);
            const balance = await provider.getBalance(wallet.address);
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice || ethers.utils.parseUnits('5', 'gwei');
            const gasLimit = ethers.BigNumber.from('21000');
            const fee = gasPrice.mul(gasLimit);
            
            log(`钱包 ${wallet.address} 余额: ${ethers.utils.formatEther(balance)} 原生代币`);
            
            if (balance.gt(fee)) {
                const value = balance.sub(fee);
                log(`正在归集 ${ethers.utils.formatEther(value)} 原生代币...`);
                const tx = await wallet.sendTransaction({ to: toAddress, value });
                log(`交易哈希: ${tx.hash}`);
                await tx.wait();
                log(`✅ ${wallet.address} 归集成功!`);
                success++;
            } else {
                log(`❌ ${wallet.address} 余额不足，无法归集`);
                fail++;
                failList.push(wallet.address);
            }
        } catch (err) {
            log(`❌ 钱包归集失败: ${err.reason || err.message}`);
            fail++;
            failList.push(pk);
        }
    }
    
    log('\n📊 原生代币归集报告：');
    log(`共${privateKeys.length}个钱包，成功归集${success}个，失败${fail}个`);
    if (failList.length > 0) {
        log('失败钱包列表：');
        failList.forEach(addr => log(`  ${addr}`));
    }
}

// 归集ERC20代币
async function collectERC20(provider, toAddress, tokenAddress, privateKeys) {
    const abi = [
        "function transfer(address to, uint256 value) public returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
    ];
    
    try {
        // 获取代币信息
        const contract = new ethers.Contract(tokenAddress, abi, provider);
        let symbol = "Token", decimals = 18;
        try {
            symbol = await contract.symbol();
            decimals = await contract.decimals();
            log(`代币信息: ${symbol} (精度: ${decimals})`);
        } catch (e) {
            log('无法获取代币信息，使用默认值');
        }
        
        log(`开始归集 ${symbol} 代币到地址: ${toAddress}`);
        log(`总共${privateKeys.length}个钱包需要归集`);
        
        let success = 0, fail = 0, failList = [];
        let totalCollected = ethers.BigNumber.from('0');
        
        for (let i = 0; i < privateKeys.length; i++) {
            const pk = privateKeys[i];
            updateProgress(i + 1, privateKeys.length);
            
            try {
                const wallet = new ethers.Wallet(pk, provider);
                const tokenContract = new ethers.Contract(tokenAddress, abi, wallet);
                
                // 查询代币余额
                const balance = await tokenContract.balanceOf(wallet.address);
                const formattedBalance = ethers.utils.formatUnits(balance, decimals);
                
                log(`钱包 ${wallet.address} 余额: ${formattedBalance} ${symbol}`);
                
                if (balance.gt(0)) {
                    // 检查原生代币余额（用于支付Gas费）
                    const nativeBalance = await provider.getBalance(wallet.address);
                    const feeData = await provider.getFeeData();
                    const estimatedGas = ethers.BigNumber.from('100000'); // 估算Gas限制
                    const gasPrice = feeData.gasPrice || ethers.utils.parseUnits('5', 'gwei');
                    const estimatedFee = gasPrice.mul(estimatedGas);
                    
                    if (nativeBalance.lt(estimatedFee)) {
                        log(`❌ ${wallet.address} 原生代币余额不足支付Gas费，跳过`);
                        fail++;
                        failList.push(wallet.address);
                        continue;
                    }
                    
                    log(`正在归集 ${formattedBalance} ${symbol}...`);
                    const tx = await tokenContract.transfer(toAddress, balance);
                    log(`交易哈希: ${tx.hash}`);
                    await tx.wait();
                    log(`✅ ${wallet.address} 归集成功!`);
                    
                    totalCollected = totalCollected.add(balance);
                    success++;
                } else {
                    log(`⚪ ${wallet.address} 代币余额为0，跳过`);
                }
            } catch (err) {
                log(`❌ 钱包归集失败: ${err.reason || err.message}`);
                fail++;
                failList.push(pk);
            }
        }
        
        const formattedTotal = ethers.utils.formatUnits(totalCollected, decimals);
        log('\n📊 ERC20代币归集报告：');
        log(`共${privateKeys.length}个钱包，成功归集${success}个，失败${fail}个`);
        log(`总共归集：${formattedTotal} ${symbol}`);
        if (failList.length > 0) {
            log('失败钱包列表：');
            failList.forEach(addr => log(`  ${addr}`));
        }
        
    } catch (error) {
        log(`归集失败: ${error.message}`);
        if (window.notifyError) notifyError(`归集失败: ${error.message}`); else alert(`归集失败: ${error.message}`);
    }
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

// 监控模式变量
let monitorInterval = null;
let isMonitoring = false;

// 启动监控模式
async function startMonitorMode() {
    if (isMonitoring) {
        if (window.notifyInfo) notifyInfo('监控模式已在运行中'); else alert('监控模式已在运行中');
        return;
    }
    
    const checkInterval = parseInt(document.getElementById('monitorCheckInterval').value) * 1000;
    const minAmount = document.getElementById('monitorMinAmount').value;
    
    if (checkInterval < 1000 || checkInterval > 30000) {
        if (window.notifyError) notifyError('检查间隔必须在1-30秒之间'); else alert('检查间隔必须在1-30秒之间');
        return;
    }
    
    // 请求通知权限
    await requestNotificationPermission();
    
    isMonitoring = true;
    log('🔍 监控模式已启动，将定期检查钱包余额');
    
    // 更新按钮状态
    const startBtn = document.getElementById('collectStartBtn');
    const stopBtn = document.getElementById('collectStopBtn');
    if (startBtn) startBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';
    
    // 更新监控状态显示
    const monitorStatus = document.getElementById('collectMonitorStatus');
    const statusText = document.getElementById('collectStatusText');
    if (monitorStatus) monitorStatus.style.display = 'block';
    if (statusText) statusText.textContent = `归集监控运行中 (间隔: ${checkInterval/1000}秒)`;
    
    startTimer('collect-monitor', async () => {
        if (!isMonitoring) return;
        try {
            await checkAndCollectTokens(minAmount);
        } catch (error) {
            console.error('监控检查失败:', error);
            log('❌ 监控检查失败: ' + error.message);
        }
    }, checkInterval);
    
    // 立即执行一次检查
    setTimeout(async () => {
        if (isMonitoring) {
            await checkAndCollectTokens(minAmount);
        }
    }, 1000);
}

// 停止监控模式
function stopMonitorMode() {
    stopTimer('collect-monitor');
    isMonitoring = false;
    log('⏹️ 监控模式已停止');
    
    // 更新按钮状态
    const startBtn = document.getElementById('collectStartBtn');
    const stopBtn = document.getElementById('collectStopBtn');
    if (startBtn) startBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';
    
    // 更新监控状态显示
    const monitorStatus = document.getElementById('collectMonitorStatus');
    const statusText = document.getElementById('collectStatusText');
    if (monitorStatus) monitorStatus.style.display = 'none';
    if (statusText) statusText.textContent = '归集监控未启动';
}

// 检查并归集代币
async function checkAndCollectTokens(minAmount) {
    const toAddress = document.getElementById('modalCollectToAddress').value.trim();
    const tokenAddress = document.getElementById('modalCollectTokenAddress').value.trim();
    const privateKeys = document.getElementById('modalCollectPrivateKeys').value
        .split('\n')
        .map(a => a.trim())
        .filter(Boolean);
    
    if (!toAddress || privateKeys.length === 0) {
        stopMonitorMode();
        return;
    }
    
    const provider = await getProvider();
    if (!provider) return;
    
    const tokenName = tokenAddress ? await getTokenSymbol(provider, tokenAddress) : '原生代币';
    const minAmountBN = minAmount ? ethers.utils.parseUnits(minAmount, 18) : ethers.constants.Zero;
    
    for (const privateKey of privateKeys) {
        try {
            const wallet = new ethers.Wallet(privateKey, provider);
            const fromAddress = wallet.address;
            
            if (!tokenAddress) {
                // 检查原生代币
                const balance = await provider.getBalance(wallet.address);
                if (balance.gt(minAmountBN)) {
                    log(`💰 检测到 ${fromAddress} 有 ${ethers.utils.formatEther(balance)} 原生代币，开始归集...`);
                    await collectNativeToken(wallet, toAddress, balance);
                }
            } else {
                // 检查ERC20代币
                const contract = new ethers.Contract(tokenAddress, [
                    "function balanceOf(address owner) view returns (uint256)",
                    "function decimals() view returns (uint8)"
                ], provider);
                
                let decimals = 18;
                try {
                    decimals = await contract.decimals();
                } catch (e) {
                    console.log('无法获取decimals，使用默认值18');
                }
                
                const balance = await contract.balanceOf(wallet.address);
                const minAmountForToken = minAmount ? ethers.utils.parseUnits(minAmount, decimals) : ethers.constants.Zero;
                
                if (balance.gt(minAmountForToken)) {
                    log(`🪙 检测到 ${fromAddress} 有 ${ethers.utils.formatUnits(balance, decimals)} ${tokenName}，开始归集...`);
                    await collectERC20Token(wallet, toAddress, tokenAddress, balance, decimals);
                }
            }
        } catch (error) {
            console.error(`监控归集失败 ${fromAddress}:`, error);
            log(`❌ 监控归集失败 ${fromAddress}: ${error.message}`);
        }
    }
}

// 归集原生代币
async function collectNativeToken(wallet, toAddress, balance) {
    try {
        const baseTransaction = { to: toAddress, value: balance };
        const gasSettings = await getOptimizedGasSettings(wallet, baseTransaction);
        const fee = gasSettings.gasPrice.mul(gasSettings.gasLimit);
        
        if (balance.gt(fee)) {
            const value = balance.sub(fee);
            const result = await wallet.sendTransaction({ 
                to: toAddress, 
                value,
                ...gasSettings
            });
            await result.wait();
            
            const amount = ethers.utils.formatEther(value);
            const message = `从 ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} 归集了 ${amount} 原生代币`;
            
            log(`✅ 原生代币归集成功: ${result.hash}`);
            
            // 发送通知
            showBrowserNotification('归集成功', message);
            showToastNotification('归集成功', message, '💰');
        } else {
            log(`⚠️ 余额不足支付Gas费: ${ethers.utils.formatEther(balance)}`);
        }
    } catch (error) {
        throw error;
    }
}

// 归集ERC20代币
async function collectERC20Token(wallet, toAddress, tokenAddress, balance, decimals) {
    try {
        const contract = new ethers.Contract(tokenAddress, [
            "function transfer(address to, uint256 value) public returns (bool)"
        ], wallet);
        
        const transaction = await contract.populateTransaction.transfer(toAddress, balance);
        const gasSettings = await getOptimizedGasSettings(wallet, transaction);
        
        const result = await contract.transfer(toAddress, balance, gasSettings);
        await result.wait();
        
        const amount = ethers.utils.formatUnits(balance, decimals);
        const message = `从 ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} 归集了 ${amount} ERC20代币`;
        
        log(`✅ ERC20代币归集成功: ${result.hash}`);
        
        // 发送通知
        showBrowserNotification('归集成功', message);
        showToastNotification('归集成功', message, '🪙');
    } catch (error) {
        throw error;
    }
} 

// 挂载归集相关函数到window
window.executeCollectModal = executeCollectModal;
window.stopMonitorMode = stopMonitorMode;
window.toggleCollectAmount = toggleCollectAmount;
window.toggleMonitorMode = toggleMonitorMode;
window.startMonitorMode = startMonitorMode;
window.checkAndCollectTokens = checkAndCollectTokens;
window.collectNativeToken = collectNativeToken;
window.collectERC20Token = collectERC20Token; 