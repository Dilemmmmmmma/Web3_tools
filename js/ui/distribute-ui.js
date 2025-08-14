// 分发 UI（从业务中分离）
(function(){
  function executeDistribute(){
    const privateKey = document.getElementById('modalDistributePrivateKey').value;
    const tokenAddress = document.getElementById('modalDistributeTokenAddress').value.trim();
    const amount = document.getElementById('modalDistributeAmount').value;
    const addresses = document.getElementById('modalDistributeAddresses').value
      .split('\n').map(a=>a.trim()).filter(Boolean);

    if (!privateKey) { if (window.notifyError) notifyError('请填写分发私钥'); else alert('请填写分发私钥'); return; }
    if (!amount) { if (window.notifyError) notifyError('请填写分发数量'); else alert('请填写分发数量'); return; }
    if (addresses.length===0) { if (window.notifyError) notifyError('请填写接收地址列表'); else alert('请填写接收地址列表'); return; }

    closeModal('distributeModal');
    window.runDistribute({ privateKey, tokenAddress, amount, addresses })
      .then(async ()=>{
        await SecureStorage.saveEncryptedPrivateKey('distributePrivateKey', privateKey);
      })
      .catch(e=>console.error(e));
  }
  window.executeDistribute = executeDistribute;
})(); 