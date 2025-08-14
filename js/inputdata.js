// InputData发送模块
// 包含发送InputData的所有功能

// 执行InputData发送 (线程模式) → 已迁移至 js/ui/inputdata-ui.js
/* async function executeInputdata() {
    const toAddress = document.getElementById('modalInputdataTo').value;
    const value = document.getElementById('modalInputdataValue').value || '0';
    const data = document.getElementById('modalInputdataData').value;
    const privateKeys = document.getElementById('modalInputdataPrivateKeys').value
        .split('\n')
        .map(a => a.trim())
        .filter(Boolean);
    const threadMode = document.getElementById('inputdataThreadMode')?.checked || false;
    const threadCount = parseInt(document.getElementById('inputdataThreadCount')?.value) || 5;
        
    if (!toAddress) {
        alert('请填写接收地址');
        return;
    }
    
    if (!data || !data.startsWith('0x')) {
        alert('请填写正确的InputData (以0x开头的十六进制)');
        return;
    }
    
    if (privateKeys.length === 0) {
        alert('请填写发送钱包私钥列表');
        return;
    }
    
    closeModal('inputdataModal');
    showProgress('发送InputData');
    setupTableHeader('inputdata');
    
    const provider = await getProvider();
    if (!provider) return;
    
    let success = 0;
    let fail = 0;
    
    if (threadMode && privateKeys.length > 10) {
        // 线程模式：分批并发处理
        await executeInputdataBatch(privateKeys, toAddress, value, data, threadCount);
    } else {
        // 单线程模式：顺序处理
        for (let i = 0; i < privateKeys.length; i++) {
            const privateKey = privateKeys[i];
            const wallet = new ethers.Wallet(privateKey, provider);
            const fromAddress = wallet.address;
            const rowId = `inputdata-${Date.now()}-${i}`;
            
            // 添加处理中的行
            addTableRow({
                id: rowId,
                fromAddress: fromAddress,
                toAddress: toAddress,
                value: value,
                status: 'processing'
            });
            
            // 更新进度
            const progress = ((i + 1) / privateKeys.length) * 100;
            updateProgress(progress, `正在发送 ${i + 1}/${privateKeys.length}...`);
            
            try {
                const transaction = {
                    to: toAddress,
                    value: ethers.utils.parseEther(value),
                    data: data
                };
                const gasSettings = await getOptimizedGasSettings(wallet, transaction);
                const result = await wallet.sendTransaction({
                    ...transaction,
                    ...gasSettings
                });
                
                // 等待交易确认
                await result.wait();
                
                // 更新为成功状态
                updateTableRow(rowId, { 
                    status: 'success', 
                    hash: result.hash 
                });
                success++;
                
            } catch (error) {
                updateTableRow(rowId, { 
                    status: 'failed',
                    fromAddress: fromAddress,
                    toAddress: toAddress,
                    value: value,
                    privateKey: privateKey  // 保存私钥用于重试
                });
                fail++;
                console.error(`InputData发送失败 ${fromAddress}:`, error);
            }
            
            // 添加延迟避免请求过快
            if (i < privateKeys.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }
    
    // 完成
    updateProgress(100, `发送完成！成功: ${success}, 失败: ${fail}`);
    
    // 保存私钥到加密存储
    if (privateKeys.length > 0) {
        await SecureStorage.saveEncryptedPrivateKey('inputdataPrivateKeys', privateKeys.join('\n'));
    }
} */

// 批量执行InputData (线程模式)
async function executeInputdataBatch(privateKeys, toAddress, value, data, threadCount) {
    const provider = await getProvider();
    if (!provider) return;

    // 读取配置中的并发（作为默认线程数）
    const savedCfg = (window.Storage ? Storage.load('crypto-tool-config', {}) : {});
    const configuredThreads = Math.max(1, Math.min(10, Number(savedCfg.inputdataConcurrency || 5)));
    const batchSize = Math.min(Math.max(1, Number(threadCount || configuredThreads)), 10); // 1-10 并发
    const batches = [];
    
    for (let i = 0; i < privateKeys.length; i += batchSize) {
        batches.push(privateKeys.slice(i, i + batchSize));
    }
    
    let success = 0;
    let fail = 0;
    let processedCount = 0; // 已广播计数
    let confirmedCount = 0; // 已确认计数

    const confirmations = [];
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchPromises = batch.map(async (privateKey, index) => {
            const globalIndex = batchIndex * batchSize + index;
            const wallet = new ethers.Wallet(privateKey, provider);
            const fromAddress = wallet.address;
            const rowId = `inputdata-${Date.now()}-${globalIndex}`;
            
            addTableRow({ id: rowId, fromAddress, toAddress, value, status: 'processing' });
            
            try {
                const txReq = { to: toAddress, value: ethers.utils.parseEther(value), data };
                const gasSettings = await getOptimizedGasSettings(wallet, txReq);
                const result = await wallet.sendTransaction({ ...txReq, ...gasSettings });
                
                updateTableRow(rowId, { status: 'processing', hash: result.hash, fromAddress, toAddress, value });
                success++;
                
                const confirmPromise = result.wait()
                  .then(() => { updateTableRow(rowId, { status: 'success', hash: result.hash }); confirmedCount++; })
                  .catch(err => { updateTableRow(rowId, { status: 'failed', fromAddress, toAddress, value, privateKey }); fail++; });
                confirmations.push(confirmPromise);
            } catch (error) {
                updateTableRow(rowId, { status: 'failed', fromAddress, toAddress, value, privateKey });
                fail++;
                console.error(`InputData发送失败 ${fromAddress}:`, error);
            } finally {
                processedCount++;
                const progress = Math.min(100, (processedCount / privateKeys.length) * 100);
                updateProgress(progress, `已广播 ${processedCount}/${privateKeys.length}，已确认 ${confirmedCount}`);
            }
        });
        
        await Promise.allSettled(batchPromises);
        
        if (batchIndex < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    // 可选：等待确认
    // await Promise.allSettled(confirmations);
}

// 发送InputData交易
async function sendInputData(provider, toAddress, value, data, privateKeys) {
    const transferValue = ethers.utils.parseEther(value);
    
    log(`开始发送InputData交易，总共${privateKeys.length}个钱包`);
    log(`接收地址: ${toAddress}`);
    log(`发送数量: ${value} 原生代币`);
    log(`InputData: ${data}`);
    
    let success = 0, fail = 0, failList = [];
    
    for (let i = 0; i < privateKeys.length; i++) {
        const pk = privateKeys[i];
        updateProgress(i + 1, privateKeys.length);
        
        try {
            const wallet = new ethers.Wallet(pk, provider);
            log(`正在从 ${wallet.address} 发送交易...`);
            
            const tx = await wallet.sendTransaction({
                to: toAddress,
                value: transferValue,
                data: data
            });
            
            log(`交易哈希: ${tx.hash}`);
            await tx.wait();
            log(`✅ ${wallet.address} 发送成功!`);
            success++;
        } catch (err) {
            log(`❌ ${pk} 发送失败: ${err.reason || err.message}`);
            fail++;
            failList.push(pk);
        }
    }
    
    log('\n📊 InputData发送报告：');
    log(`共${privateKeys.length}个钱包，成功发送${success}个，失败${fail}个`);
    if (failList.length > 0) {
        log('失败钱包列表：');
        failList.forEach(addr => log(`  ${addr}`));
    }
}

// 移除 window.executeInputdata 的导出，改由 ui 层导出 