// 查询 UI（从业务中分离）
(function(){
  async function runQuery({ tokenAddress, addresses }){
    closeModal('queryModal');
    showProgress('查询代币余额');
    setupTableHeader('query');
    const provider = await getProvider(); if (!provider) return;
    const tokenName = tokenAddress ? await getTokenSymbol(provider, tokenAddress) : '原生代币';
    let success=0, fail=0;
    for (let i=0;i<addresses.length;i++){
      const address = addresses[i]; const rowId = `query-${Date.now()}-${i}`;
      addTableRow({ id: rowId, address, token: tokenName, balance: '🔄 查询中...', status: 'processing' });
      updateProgress(((i+1)/addresses.length)*100, `正在查询 ${i+1}/${addresses.length}...`);
      try{
        let balance;
        if (!tokenAddress){ balance = await provider.getBalance(address); balance = ethers.utils.formatEther(balance); }
        else {
          const contract = new ethers.Contract(tokenAddress,["function balanceOf(address owner) view returns (uint256)","function decimals() view returns (uint8)"],provider);
          let decimals = 18; try { decimals = await contract.decimals(); } catch(_){}
          const raw = await contract.balanceOf(address); balance = ethers.utils.formatUnits(raw, decimals);
        }
        updateTableRow(rowId, { status:'success', balance }); success++;
      }catch(err){
        let errorMessage = '查询失败';
        if (err.message?.includes('invalid address')) errorMessage='地址无效';
        else if (err.message?.includes('network')) errorMessage='网络错误';
        else if (err.message?.includes('contract')) errorMessage='合约错误';
        updateTableRow(rowId, { status:'failed', balance: errorMessage, address, token: tokenName }); fail++;
      }
      if (i<addresses.length-1) await new Promise(r=>setTimeout(r,500));
    }
    updateProgress(100, `查询完成！成功: ${success}, 失败: ${fail}`);
  }

  function executeQuery(){
    const tokenAddress = document.getElementById('modalQueryTokenAddress').value.trim();
    const addresses = document.getElementById('modalQueryAddresses').value.split('\n').map(a=>a.trim()).filter(Boolean);
    if (addresses.length===0){ if (window.notifyError) notifyError('请填写查询地址列表'); else alert('请填写查询地址列表'); return; }
    runQuery({ tokenAddress, addresses });
  }

  window.executeQuery = executeQuery;
})(); 