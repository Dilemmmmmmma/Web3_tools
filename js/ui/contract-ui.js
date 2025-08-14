// 合约 UI 辅助（从业务中分离 UI 部分）
(function(){
  function showResultText(text, ok=true){
    const area = document.getElementById('contractResultArea');
    const div = document.getElementById('contractResult');
    if (!area || !div) return;
    div.textContent = text; div.style.color = ok ? '#28a745' : '#dc3545'; area.style.display='block';
  }

  function loadContractMethods(){
    if (!window.contractABI) return;
    const methodSelect = document.getElementById('contractMethodSelect');
    if (!methodSelect) return;
    methodSelect.innerHTML = '<option value="">请选择合约方法...</option>';
    const writeMethods = window.contractABI.filter(item => item.type==='function' && item.stateMutability!=='view' && item.stateMutability!=='pure');
    const esc = (v)=> (window.escapeHtml ? window.escapeHtml(v) : String(v ?? ''));
    writeMethods.forEach(method => {
      const option = document.createElement('option');
      option.value = method.name;
      option.textContent = `${esc(method.name)}(${(method.inputs||[]).map(input => esc(input.type)).join(', ')})`;
      methodSelect.appendChild(option);
    });
  }

  function loadMethodParams(){
    if (!window.contractABI) return;
    const methodName = document.getElementById('contractMethodSelect')?.value;
    if (!methodName) return;
    const method = window.contractABI.find(item => item.name === methodName);
    if (!method) return;
    const paramsContainer = document.getElementById('methodParamsContainer');
    const paramsArea = document.getElementById('methodParamsArea');
    if (!paramsContainer || !paramsArea) return;
    paramsContainer.innerHTML = '';
    if (method.inputs.length === 0) {
      paramsContainer.innerHTML = '<p style="color: #6c757d; margin: 0;">此方法无需参数</p>';
      paramsArea.style.display = 'block';
      return;
    }
    method.inputs.forEach((input, index) => {
      const paramDiv = document.createElement('div');
      paramDiv.style.marginBottom = '10px';
      const placeholderMap = { address:'0x...', uint256:'123456', string:'文本内容', bool:'true 或 false' };
      const placeholder = placeholderMap[input.type] || '参数值';
      paramDiv.innerHTML = `
        <label style="display:block;margin-bottom:5px;font-weight:500;">${input.name || `参数${index + 1}`} (${input.type}):</label>
        <input type="text" id="param_${index}" placeholder="${placeholder}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;">
        <small style="color:#6c757d;">${input.type}</small>
      `;
      paramsContainer.appendChild(paramDiv);
    });
    paramsArea.style.display = 'block';
  }

  // 覆盖 UI 输出函数
  window.showContractResult = function(result){
    if (result.success){
      let t = '✅ 执行成功\n\n';
      if (result.hash){ t += `交易哈希: ${result.hash}\n区块号: ${result.blockNumber}\nGas使用: ${result.gasUsed}\n`; }
      if (result.gasEstimate){ t += `Gas估算: ${result.gasEstimate}\n`; }
      if (result.message){ t += `\n${result.message}`; }
      showResultText(t, true);
    } else {
      showResultText(`❌ 执行失败\n\n错误信息: ${result.error}`, false);
    }
  };

  // UI: 手动 ABI 输入
  function showManualABIInput(){
    const privateKey = document.getElementById('contractPrivateKey').value.trim();
    const contractAddress = document.getElementById('contractAddress').value.trim();
    if (!privateKey || !contractAddress) { if (window.notifyError) notifyError('请先填写钱包私钥和合约地址'); else alert('请先填写钱包私钥和合约地址'); return; }
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) { if (window.notifyError) notifyError('请输入正确的私钥格式 (0x开头的66位十六进制)'); else alert('私钥格式错误'); return; }
    if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) { if (window.notifyError) notifyError('请输入正确的合约地址格式 (0x开头的42位十六进制)'); else alert('合约地址格式错误'); return; }
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
    modal.innerHTML = `
      <div style="background:white;padding:20px;border-radius:8px;width:80%;max-width:600px;max-height:80vh;overflow-y:auto;">
        <h3 style="margin-top:0;">📝 手动输入合约ABI</h3>
        <p style="color:#666;margin-bottom:15px;">请输入合约的ABI JSON</p>
        <textarea id="manualABIInput" style="width:100%;height:200px;padding:10px;border:1px solid #ddd;border-radius:4px;font-family:monospace;font-size:12px;" placeholder='[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"}]'></textarea>
        <div style="margin-top:15px;text-align:right;">
          <button id="btnCancelAbi" style="margin-right:10px;padding:8px 16px;border:1px solid #ddd;background:#f8f9fa;border-radius:4px;cursor:pointer;">取消</button>
          <button id="btnLoadAbi" style="padding:8px 16px;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">加载ABI</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.querySelector('#btnCancelAbi').onclick = () => modal.remove();
    modal.querySelector('#btnLoadAbi').onclick = async () => {
      const abiInput = document.getElementById('manualABIInput').value.trim();
      if (!abiInput) { if (window.notifyError) notifyError('请输入ABI内容'); else alert('请输入ABI内容'); return; }
      try {
        const abi = (window.safeParse ? window.safeParse(abiInput, null) : JSON.parse(abiInput));
        if (!Array.isArray(abi)) throw new Error('ABI必须是数组格式');
        const info = await window.loadContractFromAbi(privateKey, contractAddress, abi);
        document.getElementById('contractAddressDisplay').textContent = info.contractAddress;
        document.getElementById('walletAddressDisplay').textContent = info.walletAddress;
        loadContractMethods();
        document.getElementById('contractInteractionArea').style.display = 'block';
        modal.remove();
      } catch (e) {
        if (window.notifyError) notifyError(e.message); else alert('ABI格式错误，请检查JSON格式');
      }
    };
  }

  function clearContractData(){
    const ids = ['contractPrivateKey','contractAddress']; ids.forEach(id=>{ const el=document.getElementById(id); if (el) el.value=''; });
    const hideIds = ['contractInteractionArea','contractResultArea']; hideIds.forEach(id=>{ const el=document.getElementById(id); if (el) el.style.display='none'; });
    const methodSelect = document.getElementById('contractMethodSelect'); if (methodSelect) methodSelect.innerHTML = '<option value="">请选择合约方法...</option>';
    const paramsArea = document.getElementById('methodParamsArea'); if (paramsArea) paramsArea.style.display='none';
    if (typeof window.clearContractState === 'function') window.clearContractState();
  }

  // 对外挂载 UI 方法
  window.showManualABIInput = showManualABIInput;
  window.clearContractData = clearContractData;
  window.loadContractMethods = loadContractMethods;
  window.loadMethodParams = loadMethodParams;

  // 覆盖 UI 输出函数
  window.showContractResult = window.showContractResult;
})(); 