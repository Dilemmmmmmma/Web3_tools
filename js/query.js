// 余额查询模块
// 包含查询代币余额的所有功能

// 执行代币余额查询
async function executeQuery() {
    const tokenAddress = document.getElementById('modalQueryTokenAddress').value.trim();
    const addresses = document.getElementById('modalQueryAddresses').value
        .split('\n')
        .map(a => a.trim())
        .filter(Boolean);
    
    if (addresses.length === 0) {
        if (window.notifyError) notifyError('请填写查询地址列表'); else alert('请填写查询地址列表');
        return;
    }
    
    closeModal('queryModal');
    showProgress('查询代币余额');
    setupTableHeader('query');
    
    const provider = await getProvider();
    if (!provider) return;
    
    const tokenName = tokenAddress ? await getTokenSymbol(provider, tokenAddress) : '原生代币';
    let success = 0;
    let fail = 0;

    // 受限并发池
    const savedCfg = (window.Storage ? Storage.load('crypto-tool-config', {}) : {});
    const concurrency = Math.max(1, Math.min(20, Number(savedCfg.queryConcurrency || 8)));
    let index = 0;
    const tasks = Array.from({ length: Math.min(concurrency, addresses.length) }, () => worker());

    async function worker() {
        while (index < addresses.length) {
            const i = index++;
            const address = addresses[i];
            const rowId = `query-${Date.now()}-${i}`;

            addTableRow({ id: rowId, address, token: tokenName, balance: '🔄 查询中...', status: 'processing' });
            updateProgress(((i + 1) / addresses.length) * 100, `正在查询 ${i + 1}/${addresses.length}...`);

            try {
                let balance;
                if (!tokenAddress) {
                    balance = await provider.getBalance(address);
                    balance = ethers.utils.formatEther(balance);
                } else {
                    const contract = new ethers.Contract(tokenAddress, [
                        'function balanceOf(address owner) view returns (uint256)',
                        'function decimals() view returns (uint8)'
                    ], provider);
                    let decimals = 18;
                    try { decimals = await contract.decimals(); } catch (_) {}
                    const rawBalance = await contract.balanceOf(address);
                    balance = ethers.utils.formatUnits(rawBalance, decimals);
                }
                updateTableRow(rowId, { status: 'success', balance });
                success++;
            } catch (error) {
                let errorMessage = '查询失败';
                if (error.message?.includes('invalid address')) errorMessage = '地址无效';
                else if (error.message?.includes('network')) errorMessage = '网络错误';
                else if (error.message?.includes('contract')) errorMessage = '合约错误';
                updateTableRow(rowId, { status: 'failed', balance: errorMessage, address, token: tokenName });
                fail++;
            }
        }
    }

    await Promise.all(tasks);

    // 统计
    let totalBalance = 0;
    const tableRows = document.querySelectorAll('#tableBody tr');
    tableRows.forEach(row => {
        const balanceCell = row.cells[3];
        if (balanceCell) {
            const balanceText = balanceCell.textContent.replace(/,/g, '');
            const balance = parseFloat(balanceText);
            if (!isNaN(balance)) totalBalance += balance;
        }
    });
    let formattedTotal = totalBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 6 });
    updateProgress(100, `查询完成！成功: ${success}, 失败: ${fail}，总余额: ${formattedTotal}`);
}

// 查询ERC20代币余额
async function queryTokenBalance(provider, tokenAddress, addresses) {
    const abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)"
    ];
    
    try {
        const contract = new ethers.Contract(tokenAddress, abi, provider);
        
        // 获取代币信息
        let symbol = "Token", decimals = 18;
        try {
            symbol = await contract.symbol();
            decimals = await contract.decimals();
            log(`代币信息: ${symbol} (精度: ${decimals})`);
        } catch (e) {
            log('无法获取代币信息，使用默认值');
        }
        
        log(`开始查询 ${symbol} 代币余额，总共${addresses.length}个地址`);
        
        let totalBalance = ethers.BigNumber.from('0');
        let validCount = 0;
        
        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            updateProgress(i + 1, addresses.length);
            
            try {
                const balance = await contract.balanceOf(address);
                const formattedBalance = ethers.utils.formatUnits(balance, decimals);
                
                if (balance.gt(0)) {
                    log(`✅ ${address}: ${formattedBalance} ${symbol}`);
                    totalBalance = totalBalance.add(balance);
                    validCount++;
                } else {
                    log(`⚪ ${address}: 0 ${symbol}`);
                }
            } catch (err) {
                log(`❌ ${address}: 查询失败 - ${err.reason || err.message}`);
            }
        }
        
        const formattedTotal = ethers.utils.formatUnits(totalBalance, decimals);
        log('\n📊 查询报告：');
        log(`总共查询${addresses.length}个地址`);
        log(`有余额的地址：${validCount}个`);
        log(`代币总余额：${formattedTotal} ${symbol}`);
        
    } catch (error) {
        log(`查询失败: ${error.message}`);
        if (window.notifyError) notifyError(`查询失败: ${error.message}`); else alert(`查询失败: ${error.message}`);
    }
}

// 查询原生代币余额
async function queryNativeBalance(provider, addresses) {
    try {
        // 获取当前网络信息
        let networkName = "原生代币";
        let symbol = "Token";
        
        const networkSelect = document.getElementById('networkSelect');
        const selectedNetwork = networkSelect.value;
        if (selectedNetwork && networks[selectedNetwork]) {
            networkName = networks[selectedNetwork].name;
            symbol = networks[selectedNetwork].nativeCurrency;
        } else if (selectedNetwork && customNetworks[selectedNetwork]) {
            networkName = customNetworks[selectedNetwork].name;
            symbol = customNetworks[selectedNetwork].nativeCurrency;
        } else {
            try {
                const network = await provider.getNetwork();
                switch(network.chainId) {
                    case 1: symbol = "ETH"; networkName = "以太坊主网"; break;
                    case 56: symbol = "BNB"; networkName = "BSC主网"; break;
                    case 137: symbol = "MATIC"; networkName = "Polygon主网"; break;
                    case 42161: symbol = "ETH"; networkName = "Arbitrum主网"; break;
                    case 10: symbol = "ETH"; networkName = "Optimism主网"; break;
                    case 43114: symbol = "AVAX"; networkName = "Avalanche主网"; break;
                    case 250: symbol = "FTM"; networkName = "Fantom主网"; break;
                    default: symbol = "Token"; networkName = `链ID ${network.chainId}`;
                }
            } catch (e) {
                log('无法获取网络信息，使用默认值');
            }
        }
        
        log(`开始查询 ${networkName} 原生代币 (${symbol}) 余额，总共${addresses.length}个地址`);
        
        let totalBalance = ethers.BigNumber.from('0');
        let validCount = 0;
        
        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            updateProgress(i + 1, addresses.length);
            
            try {
                const balance = await provider.getBalance(address);
                const formattedBalance = ethers.utils.formatEther(balance);
                
                if (balance.gt(0)) {
                    log(`✅ ${address}: ${formattedBalance} ${symbol}`);
                    totalBalance = totalBalance.add(balance);
                    validCount++;
                } else {
                    log(`⚪ ${address}: 0 ${symbol}`);
                }
            } catch (err) {
                log(`❌ ${address}: 查询失败 - ${err.reason || err.message}`);
            }
        }
        
        const formattedTotal = ethers.utils.formatEther(totalBalance);
        log('\n📊 查询报告：');
        log(`总共查询${addresses.length}个地址`);
        log(`有余额的地址：${validCount}个`);
        log(`${symbol} 总余额：${formattedTotal} ${symbol}`);
        log(`网络：${networkName}`);
        
    } catch (error) {
        log(`查询失败: ${error.message}`);
        if (window.notifyError) notifyError(`查询失败: ${error.message}`); else alert(`查询失败: ${error.message}`);
    }
}

// 应用余额筛选 → 已迁移至 js/ui/table.js

// 清除余额筛选 → 已迁移至 js/ui/table.js 

// 挂载查询相关函数到window
window.executeQuery = executeQuery; 