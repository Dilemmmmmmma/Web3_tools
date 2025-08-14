// InputData UI（从业务中分离）
(function(){
  async function execSingle(provider, toAddress, value, data, privateKeys){
    for (let i = 0; i < privateKeys.length; i++) {
      const privateKey = privateKeys[i];
      const wallet = new ethers.Wallet(privateKey, provider);
      const fromAddress = wallet.address;
      const rowId = `inputdata-${Date.now()}-${i}`;
      addTableRow({ id: rowId, fromAddress, toAddress, value, status: 'processing' });
      updateProgress(((i+1)/privateKeys.length)*100, `正在发送 ${i+1}/${privateKeys.length}...`);
      try {
        const transaction = { to: toAddress, value: ethers.utils.parseEther(value), data };
        const gasSettings = await getOptimizedGasSettings(wallet, transaction);
        const result = await wallet.sendTransaction({ ...transaction, ...gasSettings });
        await result.wait();
        updateTableRow(rowId, { status:'success', hash: result.hash });
      } catch (error) {
        updateTableRow(rowId, { status:'failed', fromAddress, toAddress, value, privateKey });
      }
      if (i < privateKeys.length - 1) await new Promise(r => setTimeout(r, 1000));
    }
  }

  async function execBatch(provider, toAddress, value, data, privateKeys, threadCount){
    const batchSize = Math.min(threadCount, 10);
    const batches = []; for (let i=0;i<privateKeys.length;i+=batchSize) batches.push(privateKeys.slice(i,i+batchSize));
    let processedCount = 0;
    for (let batchIndex=0; batchIndex<batches.length; batchIndex++){
      const batch = batches[batchIndex];
      await Promise.all(batch.map(async (pk, idx) => {
        const globalIndex = batchIndex * batchSize + idx;
        const wallet = new ethers.Wallet(pk, provider);
        const fromAddress = wallet.address;
        const rowId = `inputdata-${Date.now()}-${globalIndex}`;
        addTableRow({ id: rowId, fromAddress, toAddress, value, status: 'processing' });
        try {
          const transaction = { to: toAddress, value: ethers.utils.parseEther(value), data };
          const gasSettings = await getOptimizedGasSettings(wallet, transaction);
          const result = await wallet.sendTransaction({ ...transaction, ...gasSettings });
          await result.wait();
          updateTableRow(rowId, { status:'success', hash: result.hash });
        } catch (error) {
          updateTableRow(rowId, { status:'failed', fromAddress, toAddress, value, privateKey: pk });
        }
        processedCount++; updateProgress((processedCount/privateKeys.length)*100, `正在发送 ${processedCount}/${privateKeys.length}... (批次 ${batchIndex+1}/${batches.length})`);
      }));
      if (batchIndex < batches.length - 1) await new Promise(r=>setTimeout(r,2000));
    }
  }

  async function executeInputdata(){
    const toAddress = document.getElementById('modalInputdataTo').value;
    const value = document.getElementById('modalInputdataValue').value || '0';
    const data = document.getElementById('modalInputdataData').value;
    const privateKeys = document.getElementById('modalInputdataPrivateKeys').value.split('\n').map(a=>a.trim()).filter(Boolean);
    const threadMode = document.getElementById('inputdataThreadMode')?.checked || false;
    const threadCount = parseInt(document.getElementById('inputdataThreadCount')?.value) || 5;

    if (!toAddress) { if (window.notifyError) notifyError('请填写接收地址'); else alert('请填写接收地址'); return; }
    if (!data || !data.startsWith('0x')) { if (window.notifyError) notifyError('请填写正确的InputData (以0x开头的十六进制)'); else alert('请填写正确的InputData'); return; }
    if (privateKeys.length===0) { if (window.notifyError) notifyError('请填写发送钱包私钥列表'); else alert('请填写发送钱包私钥列表'); return; }

    closeModal('inputdataModal');
    showProgress('发送InputData');
    setupTableHeader('inputdata');

    const provider = await getProvider(); if (!provider) return;
    if (threadMode && privateKeys.length > 10) {
      await execBatch(provider, toAddress, value, data, privateKeys, threadCount);
    } else {
      await execSingle(provider, toAddress, value, data, privateKeys);
    }
    updateProgress(100, '发送完成');
    if (privateKeys.length>0) await SecureStorage.saveEncryptedPrivateKey('inputdataPrivateKeys', privateKeys.join('\n'));
  }

  window.executeInputdata = executeInputdata;
})(); 