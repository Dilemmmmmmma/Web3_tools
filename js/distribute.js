// 代币分发模块
// 包含分发代币的所有功能

// 核心执行（由 UI 传参调用）
async function runDistribute({ privateKey, tokenAddress, amount, addresses }) {
  showProgress('分发代币');
  setupTableHeader('distribute');

  const config = await getProviderAndWalletFromKey(privateKey);
  if (!config) return;

  const tokenName = tokenAddress ? await getTokenSymbol(config.provider, tokenAddress) : '原生代币';
  let success = 0, fail = 0;

  const savedCfg = (window.Storage ? Storage.load('crypto-tool-config', {}) : {});
  const concurrency = Math.max(1, Math.min(20, Number(savedCfg.distributeConcurrency || 6))); // 建议 5-8，避免RPC限速
  let index = 0;
  const tasks = Array.from({ length: Math.min(concurrency, addresses.length) }, () => worker());

  async function worker() {
    while (index < addresses.length) {
      const i = index++;
      const address = addresses[i];
      const rowId = `distribute-${Date.now()}-${i}`;
      addTableRow({ id: rowId, address, token: tokenName, amount, status: 'processing' });
      updateProgress(((i + 1) / addresses.length) * 100, `正在分发 ${i + 1}/${addresses.length}...`);

      try {
        let result;
        if (!tokenAddress) {
          const transaction = { to: address, value: ethers.utils.parseEther(amount) };
          const gasSettings = await getOptimizedGasSettings(config.wallet, transaction);
          result = await config.wallet.sendTransaction({ ...transaction, ...gasSettings });
        } else {
          const contract = new ethers.Contract(tokenAddress, [
            'function transfer(address to, uint256 value) public returns (bool)',
            'function decimals() view returns (uint8)'
          ], config.wallet);
          let decimals = 18; try { decimals = await contract.decimals(); } catch(_){}
          const amountParsed = ethers.utils.parseUnits(amount, decimals);
          const transaction = await contract.populateTransaction.transfer(address, amountParsed);
          const gasSettings = await getOptimizedGasSettings(config.wallet, transaction);
          result = await contract.transfer(address, amountParsed, gasSettings);
        }
        await result.wait();
        updateTableRow(rowId, { status: 'success', hash: result.hash }); success++;
      } catch (error) {
        updateTableRow(rowId, { status: 'failed', address, token: tokenName, amount }); fail++;
        if (window.notifyError) notifyError(`分发失败: ${error.message}`);
        console.error(`分发失败 ${address}:`, error);
      }
    }
  }

  await Promise.all(tasks);
  updateProgress(100, `分发完成！成功: ${success}, 失败: ${fail}`);
}

// 保留工具函数
async function distributeERC20(wallet, provider, tokenAddress, amount, addresses) {
  const abi = ["function transfer(address to, uint256 value) public returns (bool)"]; const contract = new ethers.Contract(tokenAddress, abi, wallet);
  let decimals = 18; try { const decAbi = ["function decimals() view returns (uint8)"]; const decContract = new ethers.Contract(tokenAddress, decAbi, provider); decimals = await decContract.decimals(); log(`代币精度: ${decimals}`); } catch(_) { log('无法获取decimals，默认使用18'); }
  const transferAmount = ethers.utils.parseUnits(amount, decimals);
  log(`开始分发ERC20代币，总共${addresses.length}个地址`);
  let success = 0, fail = 0, failList = [];
  for (let i = 0; i < addresses.length; i++) { const to = addresses[i]; updateProgress(i + 1, addresses.length); let ok = false; for (let retry = 0; retry < 3; retry++) { try { log(`正在向 ${to} 分发代币...`); const tx = await contract.transfer(to, transferAmount); log(`交易哈希: ${tx.hash}`); await tx.wait(); log(`✅ ${to} 分发成功!`); success++; ok = true; break; } catch (err) { log(`❌ ${to} 分发失败，重试${retry + 1}/3: ${err.reason || err.message}`); await new Promise(res => setTimeout(res, 3000)); } } if (!ok) { fail++; failList.push(to); } }
  log('\n📊 分发报告：'); log(`共${addresses.length}个地址，成功分发${success}个，失败${fail}个`); if (failList.length > 0) { log('失败地址列表：'); failList.forEach(addr => log(`  ${addr}`)); }
}

async function distributeNative(wallet, provider, amount, addresses) {
  const transferAmount = ethers.utils.parseEther(amount); log(`开始分发原生代币，总共${addresses.length}个地址`);
  let success = 0, fail = 0, failList = [];
  for (let i = 0; i < addresses.length; i++) { const to = addresses[i]; updateProgress(i + 1, addresses.length); let ok = false; for (let retry = 0; retry < 3; retry++) { try { log(`正在向 ${to} 分发原生代币...`); const tx = await wallet.sendTransaction({ to, value: transferAmount }); log(`交易哈希: ${tx.hash}`); await tx.wait(); log(`✅ ${to} 分发原生代币成功!`); success++; ok = true; break; } catch (err) { log(`❌ ${to} 分发原生代币失败，重试${retry + 1}/3: ${err.reason || err.message}`); await new Promise(res => setTimeout(res, 3000)); } } if (!ok) { fail++; failList.push(to); } }
  log('\n📊 原生代币分发报告：'); log(`共${addresses.length}个地址，成功分发${success}个，失败${fail}个`); if (failList.length > 0) { log('失败地址列表：'); failList.forEach(addr => log(`  ${addr}`)); }
}

// 导出核心
window.runDistribute = runDistribute; 