// 重试编排（从 main.js 抽离）
(function() {
  async function retryFailed() {
    window.failedOperations = window.failedOperations || [];
    if (window.failedOperations.length === 0) {
      if (window.notifyInfo) window.notifyInfo('没有失败的操作需要重试'); else alert('没有失败的操作需要重试');
      return;
    }
    const retryBtn = document.getElementById('retryFailedBtn');
    if (retryBtn) { retryBtn.disabled = true; retryBtn.textContent = '🔄 重试中...'; }

    // 读取筛选条件
    const onlyBalance = !!document.getElementById('retryFilterBalance')?.checked;
    const onlyNetwork = !!document.getElementById('retryFilterNetwork')?.checked;
    const useBackoff = !!document.getElementById('retryExpBackoff')?.checked;

    let operationsToRetry = [...window.failedOperations];
    // 基于 reason 字段或 balance 文案、network 关键字进行简单过滤
    operationsToRetry = operationsToRetry.filter(op => {
      const reason = (op.reason || op.amount || op.balance || '').toString();
      if (onlyBalance) return /余额不足|balance/i.test(reason);
      if (onlyNetwork) return /网络|network|timeout|429|5\d\d/i.test(reason);
      return true;
    });

    window.failedOperations = [];
    try {
      switch(window.currentOperationType) {
        case 'distribute': await retryDistributeFiltered(operationsToRetry, useBackoff); break;
        case 'collect': await retryCollectFiltered(operationsToRetry, useBackoff); break;
        case 'query': await retryQueryFiltered(operationsToRetry, useBackoff); break;
        case 'inputdata': await retryInputDataFiltered(operationsToRetry, useBackoff); break;
      }
    } catch (e) { console.error('重试过程中出错:', e); }
    if (retryBtn) { retryBtn.disabled = false; retryBtn.textContent = '🔄 失败重试'; }
    if (window.updateSummary) window.updateSummary();
  }

  async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
  const backoff = (n) => Math.min(5000, 500 * Math.pow(2, Math.max(0, n)) + Math.round(Math.random()*200));

  async function retryDistributeFiltered(operations, useBackoff){
    const privateKey = document.getElementById('modalDistributePrivateKey').value;
    const tokenAddress = document.getElementById('modalDistributeTokenAddress').value.trim();
    if (!privateKey) { if (window.notifyError) window.notifyError('请重新填写分发私钥'); return; }
    const config = await window.getProviderAndWalletFromKey(privateKey);
    if (!config) return;
    let attempt = 0;
    for (const op of operations) {
      const rowId = op.id; window.updateTableRow(rowId, { status: 'processing' });
      try {
        let result;
        if (!tokenAddress) {
          result = await config.wallet.sendTransaction({ to: op.address, value: ethers.utils.parseEther(op.amount.toString()) });
        } else {
          const contract = new ethers.Contract(tokenAddress, ["function transfer(address to, uint256 value) public returns (bool)","function decimals() view returns (uint8)"], config.wallet);
          let decimals = 18; try { decimals = await contract.decimals(); } catch(_){ }
          const amount = ethers.utils.parseUnits(op.amount.toString(), decimals);
          result = await contract.transfer(op.address, amount);
        }
        await result.wait(); window.updateTableRow(rowId, { status: 'success', hash: result.hash });
      } catch (e) {
        window.updateTableRow(rowId, { status: 'failed' }); console.error(`重试失败 ${op.address}:`, e);
        if (useBackoff) { await sleep(backoff(attempt++)); } else { await sleep(800); }
      }
    }
  }

  // 兼容旧函数名（默认开启指数退避）
  async function retryDistribute(operations) { return retryDistributeFiltered(operations, true); }

  async function retryCollectFiltered(operations, useBackoff) {
    const provider = await window.getProvider(); if (!provider) return;
    const toAddress = document.getElementById('modalCollectToAddress').value.trim();
    const tokenAddress = document.getElementById('modalCollectTokenAddress').value.trim();
    const collectAll = document.getElementById('collectAllTokens').checked;
    const collectAmount = document.getElementById('modalCollectAmount').value.trim();
    let attempt = 0;
    for (const op of operations) {
      const rowId = op.id; window.updateTableRow(rowId, { status: 'processing' });
      try {
        const wallet = new ethers.Wallet(op.privateKey, provider);
        let result; let actualAmount = '0';
        if (!tokenAddress) {
          const balance = await provider.getBalance(wallet.address);
          const feeData = await provider.getFeeData();
          const gasPrice = feeData.gasPrice || ethers.utils.parseUnits('5','gwei');
          const gasLimit = ethers.BigNumber.from('21000');
          const fee = gasPrice.mul(gasLimit);
          if (balance.gt(fee)) { const value = balance.sub(fee); actualAmount = ethers.utils.formatEther(value);
            result = await wallet.sendTransaction({ to: toAddress, value }); await result.wait();
            window.updateTableRow(rowId, { status: 'success', hash: result.hash, amount: actualAmount });
          } else { window.updateTableRow(rowId, { status: 'failed', amount: `余额不足: ${ethers.utils.formatEther(balance)}` }); }
        } else {
          const contract = new ethers.Contract(tokenAddress, ["function transfer(address to, uint256 value) public returns (bool)","function balanceOf(address owner) view returns (uint256)","function decimals() view returns (uint8)"], wallet);
          let decimals = 18; try { decimals = await contract.decimals(); } catch(_){ }
          const balance = await contract.balanceOf(wallet.address);
          if (balance.gt(0)) {
            let transferAmount; if (collectAll || !collectAmount) { transferAmount = balance; actualAmount = ethers.utils.formatUnits(balance, decimals); }
            else { try { transferAmount = ethers.utils.parseUnits(collectAmount, decimals); if (transferAmount.gt(balance)) { window.updateTableRow(rowId, { status: 'failed', amount: `余额不足: ${ethers.utils.formatUnits(balance, decimals)}`}); continue; } actualAmount = collectAmount; } catch(_) { window.updateTableRow(rowId, { status: 'failed', amount: '归集数量格式错误' }); continue; } }
            result = await contract.transfer(toAddress, transferAmount); await result.wait();
            window.updateTableRow(rowId, { status: 'success', hash: result.hash, amount: actualAmount });
          } else { window.updateTableRow(rowId, { status: 'failed', amount: '余额为0' }); }
        }
      } catch (e) {
        window.updateTableRow(rowId, { status: 'failed' }); console.error(`重试归集失败 ${op.address}:`, e);
        if (useBackoff) { await sleep(backoff(attempt++)); } else { await sleep(800); }
      }
    }
  }

  async function retryCollect(operations) { return retryCollectFiltered(operations, true); }

  async function retryQueryFiltered(operations, useBackoff) {
    const provider = await window.getProvider(); if (!provider) return;
    const tokenAddress = document.getElementById('modalQueryTokenAddress').value.trim();
    let attempt = 0;
    for (const op of operations) {
      const rowId = op.id; window.updateTableRow(rowId, { status: 'processing' });
      try {
        let balance = '0';
        if (!tokenAddress) { const b = await provider.getBalance(op.address); balance = ethers.utils.formatEther(b); }
        else { const contract = new ethers.Contract(tokenAddress, ["function balanceOf(address owner) view returns (uint256)","function decimals() view returns (uint8)"], provider); let decimals = 18; try { decimals = await contract.decimals(); } catch(_){} const raw = await contract.balanceOf(op.address); balance = ethers.utils.formatUnits(raw, decimals); }
        window.updateTableRow(rowId, { status: 'success', balance });
      } catch (e) {
        window.updateTableRow(rowId, { status: 'failed' }); console.error(`重试查询失败 ${op.address}:`, e);
        if (useBackoff) { await sleep(backoff(attempt++)); } else { await sleep(500); }
      }
    }
  }

  async function retryQuery(operations) { return retryQueryFiltered(operations, true); }

  async function retryInputDataFiltered(operations, useBackoff) {
    let attempt = 0;
    for (const op of operations) {
      const rowId = op.id; window.updateTableRow(rowId, { status: 'processing' });
      try {
        const cfg = await window.getProviderAndWalletFromKey(op.privateKey); if (!cfg) { window.updateTableRow(rowId, { status: 'failed' }); continue; }
        const toAddress = document.getElementById('modalInputdataTo').value.trim();
        const value = document.getElementById('modalInputdataValue').value.trim();
        const data = document.getElementById('modalInputdataData').value.trim();
        const tx = { to: toAddress, value: value ? ethers.utils.parseEther(value) : 0, data: data || '0x' };
        const result = await cfg.wallet.sendTransaction(tx); await result.wait();
        window.updateTableRow(rowId, { status: 'success', hash: result.hash });
      } catch (e) {
        window.updateTableRow(rowId, { status: 'failed' }); console.error(`重试InputData失败 ${op.address}:`, e);
        if (useBackoff) { await sleep(backoff(attempt++)); } else { await sleep(800); }
      }
    }
  }

  async function retryInputData(operations) { return retryInputDataFiltered(operations, true); }

  async function retrySingleOperation(rowId) {
    const op = (window.failedOperations || []).find(x => x.id === rowId);
    if (!op) { if (window.notifyInfo) window.notifyInfo('未找到对应的失败操作'); else alert('未找到对应的失败操作'); return; }
    window.updateTableRow(rowId, { status: 'processing' });
    try {
      switch(window.currentOperationType) {
        case 'distribute': await retrySingleDistribute(op); break;
        case 'collect': await retrySingleCollect(op); break;
        case 'query': await retrySingleQuery(op); break;
        case 'inputdata': await retrySingleInputData(op); break;
        default: if (window.notifyError) window.notifyError('不支持的操作类型'); window.updateTableRow(rowId, { status: 'failed' }); return;
      }
    } catch (e) { console.error('重试单个操作失败:', e); window.updateTableRow(rowId, { status: 'failed' }); }
  }

  async function retrySingleDistribute(operation) {
    const privateKey = document.getElementById('modalDistributePrivateKey').value;
    const tokenAddress = document.getElementById('modalDistributeTokenAddress').value.trim();
    if (!privateKey) { if (window.notifyError) window.notifyError('请重新填写分发私钥'); window.updateTableRow(operation.id, { status: 'failed' }); return; }
    const cfg = await window.getProviderAndWalletFromKey(privateKey); if (!cfg) { window.updateTableRow(operation.id, { status: 'failed' }); return; }
    try {
      let result;
      if (!tokenAddress) {
        result = await cfg.wallet.sendTransaction({ to: operation.address, value: ethers.utils.parseEther(operation.amount.toString()) });
      } else {
        const contract = new ethers.Contract(tokenAddress, ["function transfer(address to, uint256 value) public returns (bool)","function decimals() view returns (uint8)"], cfg.wallet);
        let decimals = 18; try { decimals = await contract.decimals(); } catch(_){}
        const amount = ethers.utils.parseUnits(operation.amount.toString(), decimals);
        result = await contract.transfer(operation.address, amount);
      }
      await result.wait(); window.updateTableRow(operation.id, { status: 'success', hash: result.hash });
    } catch (e) { window.updateTableRow(operation.id, { status: 'failed' }); console.error(`重试分发失败 ${operation.address}:`, e); }
  }

  async function retrySingleCollect(operation) {
    const provider = await window.getProvider(); if (!provider) { window.updateTableRow(operation.id, { status: 'failed' }); return; }
    try {
      const wallet = new ethers.Wallet(operation.privateKey, provider);
      const toAddress = document.getElementById('modalCollectToAddress').value.trim();
      const tokenAddress = document.getElementById('modalCollectTokenAddress').value.trim();
      if (!tokenAddress) {
        const balance = await provider.getBalance(wallet.address);
        const baseTx = { to: toAddress, value: balance };
        const gasSettings = await window.getOptimizedGasSettings(wallet, baseTx);
        const fee = gasSettings.gasPrice.mul(gasSettings.gasLimit);
        if (balance.gt(fee)) {
          const value = balance.sub(fee);
          const result = await wallet.sendTransaction({ to: toAddress, value, ...gasSettings }); await result.wait();
          window.updateTableRow(operation.id, { status: 'success', hash: result.hash, amount: ethers.utils.formatEther(value) });
        } else {
          window.updateTableRow(operation.id, { status: 'failed', amount: `余额不足: ${ethers.utils.formatEther(balance)}` });
        }
      } else {
        const contract = new ethers.Contract(tokenAddress, ["function transfer(address to, uint256 value) public returns (bool)","function balanceOf(address owner) view returns (uint256)","function decimals() view returns (uint8)"], wallet);
        let decimals = 18; try { decimals = await contract.decimals(); } catch(_){}
        const balance = await contract.balanceOf(wallet.address);
        if (balance.gt(0)) {
          const tx = await contract.populateTransaction.transfer(toAddress, balance);
          const gasSettings = await window.getOptimizedGasSettings(wallet, tx);
          const result = await contract.transfer(toAddress, balance, gasSettings); await result.wait();
          window.updateTableRow(operation.id, { status: 'success', hash: result.hash, amount: ethers.utils.formatUnits(balance, decimals) });
        } else { window.updateTableRow(operation.id, { status: 'failed', amount: '余额为0' }); }
      }
    } catch (e) { window.updateTableRow(operation.id, { status: 'failed' }); console.error('重试归集失败:', e); }
  }

  async function retrySingleQuery(operation) {
    const provider = await window.getProvider(); if (!provider) { window.updateTableRow(operation.id, { status: 'failed' }); return; }
    try {
      const tokenAddress = document.getElementById('modalQueryTokenAddress').value.trim();
      if (!tokenAddress) {
        const balance = await provider.getBalance(operation.address);
        window.updateTableRow(operation.id, { status: 'success', balance: ethers.utils.formatEther(balance) });
      } else {
        const contract = new ethers.Contract(tokenAddress, ["function balanceOf(address owner) view returns (uint256)","function decimals() view returns (uint8)","function symbol() view returns (string)"], provider);
        let decimals = 18; try { decimals = await contract.decimals(); } catch(_){}
        const balance = await contract.balanceOf(operation.address);
        window.updateTableRow(operation.id, { status: 'success', balance: ethers.utils.formatUnits(balance, decimals) });
      }
    } catch (e) { window.updateTableRow(operation.id, { status: 'failed' }); console.error(`重试查询失败 ${operation.address}:`, e); }
  }

  async function retrySingleInputData(operation) {
    try {
      const cfg = await window.getProviderAndWalletFromKey(operation.privateKey); if (!cfg) { window.updateTableRow(operation.id, { status: 'failed' }); return; }
      const toAddress = document.getElementById('modalInputdataTo').value.trim();
      const value = document.getElementById('modalInputdataValue').value.trim();
      const data = document.getElementById('modalInputdataData').value.trim();
      const tx = { to: toAddress, value: value ? ethers.utils.parseEther(value) : 0, data: data || '0x' };
      const result = await cfg.wallet.sendTransaction(tx); await result.wait();
      window.updateTableRow(operation.id, { status: 'success', hash: result.hash });
    } catch (e) { window.updateTableRow(operation.id, { status: 'failed' }); console.error(`重试InputData失败 ${operation.address}:`, e); }
  }

  // 对外
  window.retryFailed = retryFailed;
  window.retryDistribute = retryDistribute;
  window.retryCollect = retryCollect;
  window.retryQuery = retryQuery;
  window.retryInputData = retryInputData;
  window.retrySingleOperation = retrySingleOperation;
  window.retrySingleDistribute = retrySingleDistribute;
  window.retrySingleCollect = retrySingleCollect;
  window.retrySingleQuery = retrySingleQuery;
  window.retrySingleInputData = retrySingleInputData;
})(); 