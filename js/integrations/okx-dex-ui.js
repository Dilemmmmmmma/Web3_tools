// OKX DEX UI 集成（从 main.js 抽离）
(function(){
  function initOkxDex() {
    if (window.OKXDEX) window.OKXDEX.initSolanaConnection();
    const el = document.getElementById('okxDexBalanceCheck');
    if (el) el.style.display = 'block';
  }

  function updateOkxDexTokens() {
    const network = document.getElementById('okxDexNetwork').value;
    const fromTokenSelect = document.getElementById('okxDexFromToken');
    const toTokenSelect = document.getElementById('okxDexToToken');
    const solanaNotice = document.getElementById('solanaNotice');
    if (!fromTokenSelect || !toTokenSelect) return;
    if (solanaNotice) solanaNotice.style.display = network === 'solana' ? 'block' : 'none';
    const tokens = OKXDEX.getSupportedTokens(network);
    const tokenSymbols = Object.keys(tokens);
    fromTokenSelect.innerHTML = '';
    toTokenSelect.innerHTML = '';
    tokenSymbols.forEach(symbol => {
      const f = document.createElement('option'); f.value = symbol; f.textContent = symbol; fromTokenSelect.appendChild(f);
      const t = document.createElement('option'); t.value = symbol; t.textContent = symbol; toTokenSelect.appendChild(t);
    });
    const appendCustom = (sel)=>{ const exists = Array.from(sel.options).some(o=>o.value==='custom'); if(!exists){ const o=document.createElement('option'); o.value='custom'; o.textContent='自定义地址'; sel.appendChild(o);} };
    appendCustom(fromTokenSelect); appendCustom(toTokenSelect);
    if (tokenSymbols.includes('USDT') && tokenSymbols.includes('USDC')) { fromTokenSelect.value='USDT'; toTokenSelect.value='USDC'; }
    else if (network==='solana' && tokenSymbols.includes('USDT') && tokenSymbols.includes('SOL')) { fromTokenSelect.value='USDT'; toTokenSelect.value='SOL'; }
    updateOkxDexNetworkInfo(); updateOkxDexTokenInputs();
  }

  function updateOkxDexTokenInputs() {
    const fromTokenSelect = document.getElementById('okxDexFromToken');
    const toTokenSelect = document.getElementById('okxDexToToken');
    const fromTokenAddress = document.getElementById('okxDexFromTokenAddress');
    const toTokenAddress = document.getElementById('okxDexToTokenAddress');
    if (!fromTokenSelect || !toTokenSelect || !fromTokenAddress || !toTokenAddress) return;
    fromTokenAddress.style.display = fromTokenSelect.value === 'custom' ? 'block' : 'none';
    toTokenAddress.style.display = toTokenSelect.value === 'custom' ? 'block' : 'none';
    updateOkxDexQuote();
  }

  function updateOkxDexNetworkInfo() {
    const network = document.getElementById('okxDexNetwork').value;
    const networkInfo = document.getElementById('okxDexNetworkInfo');
    const networkConfig = OKXDEX.getNetworkConfig(network);
    if (networkInfo && networkConfig) networkInfo.textContent = `当前网络: ${networkConfig.name} (${networkConfig.symbol})`;
  }

  async function getOkxDexTokenConfig(tokenSymbol, tokenAddress, network) {
    if (tokenSymbol === 'custom') {
      if (network === 'solana') {
        if (!tokenAddress || !OKXDEX.isValidSolanaAddress(tokenAddress)) throw new Error('无效的Solana代币地址');
        try { const decimals = await OKXDEX.getSolanaTokenDecimals(tokenAddress); return { address: tokenAddress, symbol: 'CUSTOM', decimals, name: 'SPL Token' }; }
        catch(_) { return { address: tokenAddress, symbol: 'CUSTOM', decimals: 9, name: 'SPL Token' }; }
      }
      if (!tokenAddress || !OKXDEX.isValidAddress(tokenAddress)) throw new Error('无效的代币地址');
      try { const rpcUrl = getRpcUrlForNetwork(network); const provider = getProviderCached(rpcUrl); const ti = await OKXDEX.getTokenInfo(tokenAddress, provider); if (ti) return { address: tokenAddress, symbol: ti.symbol || 'CUSTOM', decimals: ti.decimals, name: ti.name }; }
      catch(_){}
      return { address: tokenAddress, symbol: 'CUSTOM', decimals: 18, name: 'Custom Token' };
    } else {
      const tokens = OKXDEX.getSupportedTokens(network); const token = tokens[tokenSymbol]; if (!token) throw new Error(`不支持的代币: ${tokenSymbol}`); return token;
    }
  }

  let autoQuoteTimer = null;
  function autoGetOkxDexQuote() {
    if (autoQuoteTimer) clearTimeout(autoQuoteTimer);
    autoQuoteTimer = setTimeout(() => {
      const amount = document.getElementById('okxDexAmount').value.trim();
      if (amount && parseFloat(amount) > 0) getOkxDexQuote();
    }, 1000);
  }

  async function getOkxDexQuote() {
    const network = document.getElementById('okxDexNetwork').value;
    const fromTokenSymbol = document.getElementById('okxDexFromToken').value;
    const toTokenSymbol = document.getElementById('okxDexToToken').value;
    const fromTokenAddress = document.getElementById('okxDexFromTokenAddress').value.trim();
    const toTokenAddress = document.getElementById('okxDexToTokenAddress').value.trim();
    const amount = document.getElementById('okxDexAmount').value.trim();
    const allTokensCheckbox = document.getElementById('okxDexAllTokens');
    if (!allTokensCheckbox.checked && !amount) { updateOkxDexStatus('请输入兑换数量或选择兑换所有代币','error'); return; }
    if (fromTokenSymbol === toTokenSymbol && fromTokenAddress === toTokenAddress) { updateOkxDexStatus('支付代币和接收代币不能相同','error'); return; }
    try {
      updateOkxDexStatus('正在获取报价...','info');
      const networkConfig = OKXDEX.getNetworkConfig(network); if (!networkConfig) throw new Error('不支持的网络');
      const fromToken = await getOkxDexTokenConfig(fromTokenSymbol, fromTokenAddress, network);
      const toToken = await getOkxDexTokenConfig(toTokenSymbol, toTokenAddress, network);
      const slippage = document.getElementById('okxDexSlippage').value || '0.5';
      let quoteData;
      if (allTokensCheckbox.checked) {
        const sampleAmount = OKXDEX.parseTokenAmount('1', fromToken.decimals);
        quoteData = await OKXDEX.getSwapQuote(fromToken, toToken, sampleAmount.toString(), networkConfig.chainId, slippage);
        if (network === 'solana' && quoteData) {
          if (quoteData.fromToken) { if (quoteData.fromToken.tokenSymbol) fromToken.symbol = quoteData.fromToken.tokenSymbol; if (quoteData.fromToken.decimal!==undefined) fromToken.decimals = Number(quoteData.fromToken.decimal); }
          if (quoteData.toToken) { if (quoteData.toToken.tokenSymbol) toToken.symbol = quoteData.toToken.tokenSymbol; if (quoteData.toToken.decimal!==undefined) toToken.decimals = Number(quoteData.toToken.decimal); }
        }
        const details = `<strong>💡 兑换所有代币模式</strong><br><strong>示例报价 (1 ${fromToken.symbol}):</strong><br><strong>支付:</strong> 1 ${fromToken.symbol}<br><strong>接收:</strong> ${OKXDEX.formatTokenAmount(quoteData.toTokenAmount, toToken.decimals)} ${toToken.symbol}<br><strong>价格影响:</strong> ${quoteData.priceImpactPercentage}%<br><strong>兑换率:</strong> 1 ${fromToken.symbol} = ${(quoteData.toTokenAmount/quoteData.fromTokenAmount).toFixed(6)} ${toToken.symbol}<br><small style="color:#6c757d;">实际兑换时将使用每个钱包的实际余额</small>`;
        document.getElementById('okxDexQuoteDetails').innerHTML = details; document.getElementById('okxDexQuoteInfo').style.display = 'block';
        window.currentOkxDexQuote = quoteData; window.currentOkxDexFromToken = fromToken; window.currentOkxDexToToken = toToken;
        updateOkxDexStatus('兑换所有代币模式报价获取成功','success'); return;
      } else {
        const parsedAmount = OKXDEX.parseTokenAmount(amount, fromToken.decimals);
        quoteData = await OKXDEX.getSwapQuote(fromToken, toToken, parsedAmount.toString(), networkConfig.chainId, slippage);
        if (network === 'solana' && quoteData) {
          if (quoteData.fromToken) { if (quoteData.fromToken.tokenSymbol) fromToken.symbol = quoteData.fromToken.tokenSymbol; if (quoteData.fromToken.decimal!==undefined) fromToken.decimals = Number(quoteData.fromToken.decimal); }
          if (quoteData.toToken) { if (quoteData.toToken.tokenSymbol) toToken.symbol = quoteData.toToken.tokenSymbol; if (quoteData.toToken.decimal!==undefined) toToken.decimals = Number(quoteData.toToken.decimal); }
        }
      }
      const details = `<strong>支付:</strong> ${OKXDEX.formatTokenAmount(quoteData.fromTokenAmount, fromToken.decimals)} ${fromToken.symbol}<br><strong>接收:</strong> ${OKXDEX.formatTokenAmount(quoteData.toTokenAmount, toToken.decimals)} ${toToken.symbol}<br><strong>价格影响:</strong> ${quoteData.priceImpactPercentage}%<br><strong>兑换率:</strong> 1 ${fromToken.symbol} = ${(quoteData.toTokenAmount/quoteData.fromTokenAmount).toFixed(6)} ${toToken.symbol}`;
      document.getElementById('okxDexQuoteDetails').innerHTML = details; document.getElementById('okxDexQuoteInfo').style.display = 'block';
      window.currentOkxDexQuote = quoteData; window.currentOkxDexFromToken = fromToken; window.currentOkxDexToToken = toToken; updateOkxDexStatus('报价获取成功','success');
    } catch (e) { console.error('获取报价失败:', e); updateOkxDexStatus('获取报价失败: '+e.message,'error'); }
  }

  async function executeOkxDexBatchSwap() {
    const privateKeysText = document.getElementById('okxDexPrivateKeys').value.trim();
    const network = document.getElementById('okxDexNetwork').value;
    const allTokensCheckbox = document.getElementById('okxDexAllTokens');
    const amount = document.getElementById('okxDexAmount').value.trim();
    if (!privateKeysText) { updateOkxDexStatus('请输入钱包私钥列表','error'); return; }
    if (!allTokensCheckbox.checked && !amount) { updateOkxDexStatus('请输入兑换数量或选择兑换所有代币','error'); return; }
    if (!window.currentOkxDexFromToken || !window.currentOkxDexToToken) { updateOkxDexStatus('请先选择支付代币和接收代币','error'); return; }
    if (!allTokensCheckbox.checked && !window.currentOkxDexQuote) { updateOkxDexStatus('请先获取报价','error'); return; }
    try {
      updateOkxDexStatus('正在准备批量兑换...','info');
      const privateKeys = privateKeysText.split('\n').map(k=>k.trim()).filter(Boolean); if (privateKeys.length===0){ updateOkxDexStatus('没有有效的私钥','error'); return; }
      const networkConfig = OKXDEX.getNetworkConfig(network); if (!networkConfig) throw new Error('不支持的网络');
      const slippage = document.getElementById('okxDexSlippage').value || '0.5';
      const swapConfigs = privateKeys.map(()=>({ fromToken: window.currentOkxDexFromToken, toToken: window.currentOkxDexToToken, amount: allTokensCheckbox.checked ? 'all' : amount, chainId: networkConfig.chainId, slippage, allTokens: allTokensCheckbox.checked }));
      if (window.showProgress) window.showProgress(`批量兑换 (${privateKeys.length}个钱包)`);
      if (window.setupTableHeader) window.setupTableHeader('okxDexBatch');
      let results;
      if (network==='solana') { if (!window.solanaWeb3) throw new Error('Solana Web3.js 未加载'); OKXDEX.initSolanaConnection(); results = await OKXDEX.batchExecuteSolanaSwap(swapConfigs, privateKeys); }
      else { const rpcUrl = getRpcUrlForNetwork(network); const provider = getProviderCached(rpcUrl); results = await OKXDEX.batchExecuteSwap(swapConfigs, privateKeys, provider); }
      results.forEach((r,idx)=>{
        const displayStatus = (r.status==='success'||r.status==='pending'||r.status==='confirmed') ? 'success' : (r.status==='skipped' ? 'skipped' : 'failed');
        if (window.addTableRow) window.addTableRow({ id:`okxDex_${idx}`, wallet:r.wallet, status:displayStatus, reason:r.reason, hash:r.hash||'-' });
      });
      if (window.updateSummary) window.updateSummary();
      const pendingCount = results.filter(r=>r.status==='pending').length;
      const successCount = results.filter(r=>['success','pending','confirmed'].includes(r.status)).length;
      const skippedCount = results.filter(r=>r.status==='skipped').length;
      const failedCount = results.filter(r=>r.status==='failed').length;
      updateOkxDexStatus(`批量兑换完成: 成功 ${successCount}个${pendingCount>0?` (含待确认 ${pendingCount}个)`:''}, 跳过 ${skippedCount}个, 失败 ${failedCount}个`,'success');
    } catch(e) { console.error('批量兑换失败:', e); updateOkxDexStatus('批量兑换失败: '+e.message,'error'); }
  }

  function updateOkxDexQuote() {
    const info = document.getElementById('okxDexQuoteInfo'); if (info) info.style.display='none';
    window.currentOkxDexQuote = null;
  }

  function updateOkxDexStatus(message, type='info') {
    const statusElement = document.getElementById('okxDexStatus'); if (!statusElement) return;
    statusElement.textContent = message; statusElement.style.display='block';
    switch(type){ case 'success': statusElement.style.background='#d4edda'; statusElement.style.color='#155724'; break;
      case 'error': statusElement.style.background='#f8d7da'; statusElement.style.color='#721c24'; break;
      default: statusElement.style.background='#d1ecf1'; statusElement.style.color='#0c5460'; }
  }

  function getRpcUrlForNetwork(network){
    const rpcUrls = { 'ethereum': 'https://eth.llamarpc.com', 'bsc': 'https://bsc-dataseed1.binance.org/' };
    return rpcUrls[network] || 'https://eth.llamarpc.com';
  }

  function toggleOkxDexAmountInput(){
    const allTokensCheckbox = document.getElementById('okxDexAllTokens');
    const amountInput = document.getElementById('okxDexAmount');
    if (!allTokensCheckbox || !amountInput) return;
    if (allTokensCheckbox.checked){ amountInput.disabled = true; amountInput.value=''; amountInput.placeholder='已选择兑换所有代币'; }
    else { amountInput.disabled = false; amountInput.placeholder='0.1'; }
    updateOkxDexQuote();
  }

  function loadOkxDexApiConfig(){
    const apiKeyEl = document.getElementById('okxDexApiKey');
    const secretEl = document.getElementById('okxDexSecretKey');
    const projectEl = document.getElementById('okxDexProjectId');
    const passEl = document.getElementById('okxDexPassphrase');
    if (!apiKeyEl || !secretEl || !projectEl || !passEl) return;
    (async () => {
      try {
        const enc = await (window.SecureStorage?.loadEncrypted?.('okxDexApiConfig'));
        if (enc) {
          apiKeyEl.value = enc.apiKey || '';
          secretEl.value = enc.secretKey || '';
          projectEl.value = enc.projectId || '';
          passEl.value = enc.passphrase || '';
          return;
        }
      } catch (_) {}
      // 向后兼容：尝试旧的 localStorage（明文），读取后不再持久化明文
      const saved = localStorage.getItem('okxDexApiConfig');
      if (saved) {
        const cfg = (window.safeParse ? window.safeParse(saved, {}) : JSON.parse(saved));
        apiKeyEl.value = cfg.apiKey||''; secretEl.value = cfg.secretKey||''; projectEl.value = cfg.projectId||''; passEl.value = cfg.passphrase||'';
        try { localStorage.removeItem('okxDexApiConfig'); } catch(_){}
      } else { apiKeyEl.value=''; secretEl.value=''; projectEl.value=''; passEl.value=''; }
    })();
  }

  function saveOkxDexApiConfig(){
    const config = { apiKey: document.getElementById('okxDexApiKey').value.trim(), secretKey: document.getElementById('okxDexSecretKey').value.trim(), projectId: document.getElementById('okxDexProjectId').value.trim(), passphrase: document.getElementById('okxDexPassphrase').value.trim() };
    // 仅在设置了加密密码时才允许持久化
    const hasPassword = !!document.getElementById('encryptionPassword')?.value?.trim();
    if (!hasPassword) {
      if (window.notifyWarning) window.notifyWarning('未设置加密密码，配置将不会被保存');
    } else {
      (async () => {
        try { await window.SecureStorage.saveEncrypted('okxDexApiConfig', config); if (window.notifySuccess) window.notifySuccess('API配置已加密保存'); }
        catch (e) { if (window.notifyError) window.notifyError('保存失败: '+ e.message); }
      })();
    }
    // 同步到内存配置
    if (window.OKXDEX) window.OKXDEX.config = Object.assign({}, window.OKXDEX.config, config);
    window.OKX_DEX_CONFIG = Object.assign({}, (window.OKX_DEX_CONFIG || {}), config);
  }

  function resetOkxDexApiConfig(){
    try { localStorage.removeItem('okxDexApiConfig'); } catch(_){}
    if (window.SecureStorage?.clearAllEncryptedKeys) {
      // 仅清理与本模块相关的通用加密键
      try { localStorage.removeItem('encrypted_generic_okxDexApiConfig'); } catch(_){}
    }
    loadOkxDexApiConfig();
    updateOkxDexStatus('API配置已重置为默认','success');
  }

  // 暴露
  window.initOkxDex = initOkxDex;
  window.updateOkxDexTokens = updateOkxDexTokens;
  window.updateOkxDexNetworkInfo = updateOkxDexNetworkInfo;
  window.updateOkxDexTokenInputs = updateOkxDexTokenInputs;
  window.autoGetOkxDexQuote = autoGetOkxDexQuote;
  window.getOkxDexQuote = getOkxDexQuote;
  window.executeOkxDexBatchSwap = executeOkxDexBatchSwap;
  window.updateOkxDexQuote = updateOkxDexQuote;
  window.updateOkxDexStatus = updateOkxDexStatus;
  window.toggleOkxDexAmountInput = toggleOkxDexAmountInput;
  window.loadOkxDexApiConfig = loadOkxDexApiConfig;
  window.saveOkxDexApiConfig = saveOkxDexApiConfig;
  window.resetOkxDexApiConfig = resetOkxDexApiConfig;
})(); 