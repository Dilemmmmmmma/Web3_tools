// 合约调用模块
// 包含合约调用的所有功能

// 合约相关变量
let currentContract = null;
let currentWallet = null;
let contractABI = null;

// 加载合约ABI
async function loadContractABI() {
    const privateKey = document.getElementById('contractPrivateKey').value.trim();
    const contractAddress = document.getElementById('contractAddress').value.trim();
    
    if (!privateKey || !contractAddress) {
        alert('请填写钱包私钥和合约地址');
        return;
    }
    
    // 检查当前网络是否支持（从 config.js 的 SSOT 派生）
    const currentNetworkText = document.getElementById('currentNetworkDisplay').textContent;
    const chainIdVal = document.getElementById('chainId')?.value;
    let isSupported = true;
    try {
        // 若存在 chainId，则以 chainId 为准
        if (chainIdVal && typeof window.getNetworkByChainId === 'function') {
            const n = window.getNetworkByChainId(Number(chainIdVal));
            isSupported = !!n; // 在 SSOT 中存在即认为受支持
        } else {
            // 回退：基于展示文案匹配常见关键字
            const keywords = ['Ethereum', 'BSC', 'Polygon', 'Arbitrum', 'Optimism', 'Base', 'Avalanche', 'Fantom', 'zkSync', 'Linea', 'Scroll', 'Blast', 'opBNB', 'Gnosis', 'Cronos', 'Fraxtal', 'HyperEVM', 'Mantle', 'Memecore', 'Moonbeam', 'Moonriver', 'Katana', 'Sei', 'Sonic', 'Sophon', 'Swellchain', 'Taiko', 'Unichain', 'WEMIX', 'World', 'Xai', 'XDC', 'BitTorrent', 'Berachain', 'Celo', 'Abstract', 'ApeChain', 'Sepolia', 'Holesky', 'Hoodi', 'Fuji', 'Amoy'];
            isSupported = keywords.some(k => currentNetworkText.includes(k));
        }
    } catch (_) {}
    
    if (!isSupported) {
        alert('当前网络暂不支持合约调用功能，请切换到支持的区块链网络');
        return;
    }
    
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        alert('请输入正确的私钥格式 (0x开头的66位十六进制)');
        return;
    }
    
    if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
        alert('请输入正确的合约地址格式 (0x开头的42位十六进制)');
        return;
    }
    
    try {
        const provider = await getProvider();
        if (!provider) return;
        
        // 创建钱包
        currentWallet = new ethers.Wallet(privateKey, provider);
        
        // 尝试从Etherscan获取ABI（用 chainId 构造）
        const network = await provider.getNetwork();
        let abiUrl = '';
        
        console.log(`使用Etherscan V2 API获取 Chain ID ${network.chainId} 合约ABI`);
        abiUrl = `https://api.etherscan.io/v2/api?chainid=${network.chainId}&module=contract&action=getabi&address=${contractAddress}&apikey=GUSR84GNVIJYF662YKHJBZFGNDK2HZB3P3`;
        
        // 显示加载状态
        const resultArea = document.getElementById('contractResultArea');
        const resultDiv = document.getElementById('contractResult');
        if (resultArea && resultDiv) {
            resultDiv.textContent = '🔄 正在获取合约ABI...';
            resultDiv.style.color = '#007bff';
            resultArea.style.display = 'block';
        }
        
        // 获取ABI
        // const response = await fetch(abiUrl);
        // if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
        // const data = await response.json();
        const { ok, data, error } = await (window.tryRequestJson ? window.tryRequestJson(abiUrl, { timeoutMs: 12000, retries: 2 }) : { ok: false, error: new Error('requestJson不可用') });
        if (!ok) { throw error; }
        console.log('API响应:', data);
        
        if (data.status === '1' && data.result) {
            let parsedAbi = null;
            try { parsedAbi = JSON.parse(data.result); } catch(_) { parsedAbi = null; }
            if (!parsedAbi) throw new Error('ABI解析失败');
            contractABI = parsedAbi;
            window.contractABI = contractABI;
            currentContract = new ethers.Contract(contractAddress, contractABI, currentWallet);
            
            // 显示合约信息
            document.getElementById('contractAddressDisplay').textContent = contractAddress;
            document.getElementById('walletAddressDisplay').textContent = currentWallet.address;
            
            // 显示网络信息（从 SSOT 派生名称）
            const n = (typeof window.getNetworkByChainId === 'function') ? window.getNetworkByChainId(network.chainId) : null;
            const networkInfo = document.createElement('div');
            const esc = (window.escapeHtml ? window.escapeHtml : (v)=>String(v??''));
            networkInfo.innerHTML = `<strong>网络:</strong> <span style="color: #28a745;">${n ? esc(n.name) : `Chain ${network.chainId}`}</span>`;
            const interactionArea = document.getElementById('contractInteractionArea');
            if (interactionArea) {
                const backgroundDiv = interactionArea.querySelector('div[style*="background: #e7f3ff"]');
                if (backgroundDiv) {
                    backgroundDiv.appendChild(networkInfo);
                }
            }
            
            // 加载方法列表
            if (typeof window.loadContractMethods === 'function') window.loadContractMethods();
            
            // 显示交互区域
            document.getElementById('contractInteractionArea').style.display = 'block';
            
            // 更新结果状态
            if (resultArea && resultDiv) {
                resultDiv.textContent = '✅ 合约加载成功！';
                resultDiv.style.color = '#28a745';
            }
            
            console.log('合约加载成功:', contractAddress);
            
        } else if (data.status === '0' && data.message === 'NOTOK') {
            if (data.result && data.result.includes('API Key')) {
                alert('Etherscan V2 API Key无效或已过期，请联系管理员更新');
            } else if (data.result && data.result.includes('Contract source code not verified')) {
                alert('合约未验证，无法自动获取ABI。请手动提供合约接口或使用已验证的合约地址。');
            } else {
                alert('无法获取合约ABI: ' + (data.result || data.message));
            }
            console.error('API错误:', data);
        } else {
            alert('无法获取合约ABI，请确认合约地址正确或手动提供接口');
            console.error('API响应异常:', data);
        }
        
    } catch (error) {
        console.error('加载合约失败:', error);
        alert('加载合约失败: ' + error.message);
    }
}

// 加载合约方法 → 已迁移至 js/ui/contract-ui.js

// 加载方法参数 → UI 渲染已迁移至 js/ui/contract-ui.js
function loadMethodParams() {
    const methodName = document.getElementById('contractMethodSelect').value;
    if (!methodName || !contractABI) return;
    
    const method = contractABI.find(item => item.name === methodName);
    if (!method) return;
    
    const paramsContainer = document.getElementById('methodParamsContainer');
    paramsContainer.innerHTML = '';
    
    if (method.inputs.length === 0) {
        paramsContainer.innerHTML = '<p style="color: #6c757d; margin: 0;">此方法无需参数</p>';
        document.getElementById('methodParamsArea').style.display = 'block';
        return;
    }
    
    method.inputs.forEach((input, index) => {
        const paramDiv = document.createElement('div');
        paramDiv.style.marginBottom = '10px';
        
        const placeholder = getParamPlaceholder(input.type);
        const helpText = getParamHelpText(input.type);
        
        paramDiv.innerHTML = `
            <label style="display: block; margin-bottom: 5px; font-weight: 500;">
                ${input.name || `参数${index + 1}`} (${input.type}):
            </label>
            <input type="text" 
                   id="param_${index}" 
                   placeholder="${placeholder}"
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <small style="color: #6c757d;">${input.type}</small>
            ${helpText ? `<br><small style="color: #007bff;">💡 ${helpText}</small>` : ''}
        `;
        
        paramsContainer.appendChild(paramDiv);
    });
    
    document.getElementById('methodParamsArea').style.display = 'block';
}

// 获取参数帮助文本
function getParamHelpText(type) {
    switch (type) {
        case 'address[]': return '支持空格分隔、逗号分隔、JSON数组格式或一行一个地址';
        case 'uint256[]': return '支持空格分隔、逗号分隔、JSON数组格式或一行一个数字';
        case 'string[]': return '支持空格分隔、逗号分隔、JSON数组格式或一行一个文本';
        case 'bool[]': return '支持空格分隔、逗号分隔、JSON数组格式或一行一个布尔值';
        default: return '';
    }
}

// 获取参数占位符
function getParamPlaceholder(type) {
    switch (type) {
        case 'address': return '0x...';
        case 'uint256': return '123456';
        case 'string': return '文本内容';
        case 'bool': return 'true 或 false';
        case 'address[]': return '0x123... 0x456... 或 0x123...,0x456... 或 ["0x123...","0x456..."] 或 一行一个地址';
        case 'uint256[]': return '1 2 3 或 1,2,3 或 [1,2,3] 或 一行一个数字';
        case 'string[]': return 'text1 text2 或 text1,text2 或 ["text1","text2"] 或 一行一个文本';
        case 'bool[]': return 'true false 或 true,false 或 [true,false] 或 一行一个布尔值';
        default: return '参数值';
    }
}

// 执行合约方法
async function executeContractMethod() {
    if (!currentContract || !currentWallet) {
        alert('请先加载合约');
        return;
    }
    
    const methodName = document.getElementById('contractMethodSelect').value;
    if (!methodName) {
        alert('请选择要执行的方法');
        return;
    }
    
    try {
        // 获取参数
        const method = contractABI.find(item => item.name === methodName);
        const params = [];
        
        for (let i = 0; i < method.inputs.length; i++) {
            const paramValue = document.getElementById(`param_${i}`).value.trim();
            if (!paramValue) {
                alert(`请填写参数: ${method.inputs[i].name || `参数${i + 1}`}`);
                return;
            }
            
            // 参数类型转换
            let convertedParam = paramValue;
            switch (method.inputs[i].type) {
                case 'uint256':
                    convertedParam = ethers.BigNumber.from(paramValue);
                    break;
                case 'bool':
                    convertedParam = paramValue.toLowerCase() === 'true';
                    break;
                case 'address[]':
                case 'uint256[]':
                case 'string[]':
                case 'bool[]':
                    // 处理数组类型
                    try {
                        if (paramValue.startsWith('[') && paramValue.endsWith(']')) {
                            // 如果是JSON格式的数组字符串，解析它
                            convertedParam = (window.safeParse ? window.safeParse(paramValue, null) : JSON.parse(paramValue));
                            if (!Array.isArray(convertedParam)) throw new Error('数组JSON需为数组类型');
                        } else if (paramValue.includes(',')) {
                            // 如果是逗号分隔的字符串，分割成数组
                            convertedParam = paramValue.split(',').map(item => item.trim());
                        } else if (paramValue.includes('\n')) {
                            // 如果包含换行符，按行分割
                            convertedParam = paramValue.split('\n').map(item => item.trim()).filter(item => item.length > 0);
                        } else if (paramValue.includes(' ') && paramValue.split(' ').filter(item => item.trim().length > 0).length > 1) {
                            // 如果是空格分隔的字符串，分割成数组
                            convertedParam = paramValue.split(' ').map(item => item.trim()).filter(item => item.length > 0);
                        } else {
                            // 单个值，包装成数组
                            convertedParam = [paramValue];
                        }
                    } catch (e) {
                        throw new Error(`数组参数格式错误: ${paramValue}`);
                    }
                    break;
                case 'address':
                    // 确保地址格式正确
                    if (!paramValue.startsWith('0x') || paramValue.length !== 42) {
                        throw new Error(`地址格式错误: ${paramValue}`);
                    }
                    break;
            }
            
            params.push(convertedParam);
        }
        
        // 估算Gas
        const gasEstimate = await currentContract.estimateGas[methodName](...params);
        const gasSettings = await getOptimizedGasSettings(currentWallet, {
            to: currentContract.address,
            data: currentContract.interface.encodeFunctionData(methodName, params)
        });
        
        // 执行交易
        const tx = await currentContract[methodName](...params, {
            gasLimit: gasEstimate.mul(120).div(100), // 增加20%缓冲
            ...gasSettings
        });
        
        // 等待确认
        const receipt = await tx.wait();
        
        // 显示结果
        showContractResult({
            success: true,
            hash: tx.hash,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber
        });
        
    } catch (error) {
        console.error('执行合约方法失败:', error);
        showContractResult({
            success: false,
            error: error.message
        });
    }
}

// 估算Gas
async function estimateGas() {
    if (!currentContract) {
        alert('请先加载合约');
        return;
    }
    
    const methodName = document.getElementById('contractMethodSelect').value;
    if (!methodName) {
        alert('请选择要估算的方法');
        return;
    }
    
    try {
        const method = contractABI.find(item => item.name === methodName);
        const params = [];
        
        for (let i = 0; i < method.inputs.length; i++) {
            const paramValue = document.getElementById(`param_${i}`).value.trim();
            if (!paramValue) {
                alert(`请填写参数: ${method.inputs[i].name || `参数${i + 1}`}`);
                return;
            }
            
            let convertedParam = paramValue;
            switch (method.inputs[i].type) {
                case 'uint256':
                    convertedParam = ethers.BigNumber.from(paramValue);
                    break;
                case 'bool':
                    convertedParam = paramValue.toLowerCase() === 'true';
                    break;
                case 'address[]':
                case 'uint256[]':
                case 'string[]':
                case 'bool[]':
                    // 处理数组类型
                    try {
                        if (paramValue.startsWith('[') && paramValue.endsWith(']')) {
                            // 如果是JSON格式的数组字符串，解析它
                            convertedParam = (window.safeParse ? window.safeParse(paramValue, null) : JSON.parse(paramValue));
                            if (!Array.isArray(convertedParam)) throw new Error('数组JSON需为数组类型');
                        } else if (paramValue.includes(',')) {
                            // 如果是逗号分隔的字符串，分割成数组
                            convertedParam = paramValue.split(',').map(item => item.trim());
                        } else if (paramValue.includes('\n')) {
                            // 如果包含换行符，按行分割
                            convertedParam = paramValue.split('\n').map(item => item.trim()).filter(item => item.length > 0);
                        } else if (paramValue.includes(' ') && paramValue.split(' ').filter(item => item.trim().length > 0).length > 1) {
                            // 如果是空格分隔的字符串，分割成数组
                            convertedParam = paramValue.split(' ').map(item => item.trim()).filter(item => item.length > 0);
                        } else {
                            // 单个值，包装成数组
                            convertedParam = [paramValue];
                        }
                    } catch (e) {
                        throw new Error(`数组参数格式错误: ${paramValue}`);
                    }
                    break;
                case 'address':
                    // 确保地址格式正确
                    if (!paramValue.startsWith('0x') || paramValue.length !== 42) {
                        throw new Error(`地址格式错误: ${paramValue}`);
                    }
                    break;
            }
            
            params.push(convertedParam);
        }
        
        const gasEstimate = await currentContract.estimateGas[methodName](...params);
        
        showContractResult({
            success: true,
            gasEstimate: gasEstimate.toString(),
            message: 'Gas估算成功'
        });
        
    } catch (error) {
        console.error('Gas估算失败:', error);
        showContractResult({
            success: false,
            error: error.message
        });
    }
}

// 显示合约执行结果 → 已迁移至 js/ui/contract-ui.js
function showContractResult(result) {
    const resultArea = document.getElementById('contractResultArea');
    const resultDiv = document.getElementById('contractResult');
    
    if (result.success) {
        let resultText = '✅ 执行成功\n\n';
        
        if (result.hash) {
            resultText += `交易哈希: ${result.hash}\n`;
            resultText += `区块号: ${result.blockNumber}\n`;
            resultText += `Gas使用: ${result.gasUsed}\n`;
        }
        
        if (result.gasEstimate) {
            resultText += `Gas估算: ${result.gasEstimate}\n`;
        }
        
        if (result.message) {
            resultText += `\n${result.message}`;
        }
        
        resultDiv.textContent = resultText;
        resultDiv.style.color = '#28a745';
        
    } else {
        resultDiv.textContent = `❌ 执行失败\n\n错误信息: ${result.error}`;
        resultDiv.style.color = '#dc3545';
    }
    
    resultArea.style.display = 'block';
}

// 显示手动输入ABI界面（UI）
function showManualABIInput() {
    const privateKey = document.getElementById('contractPrivateKey').value.trim();
    const contractAddress = document.getElementById('contractAddress').value.trim();
    
    if (!privateKey || !contractAddress) {
        alert('请先填写钱包私钥和合约地址');
        return;
    }
    
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
        alert('请输入正确的私钥格式 (0x开头的66位十六进制)');
        return;
    }
    
    if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
        alert('请输入正确的合约地址格式 (0x开头的42位十六进制)');
        return;
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; width: 80%; max-width: 600px; max-height: 80vh; overflow-y: auto;">
            <h3 style="margin-top: 0;">📝 手动输入合约ABI</h3>
            <p style="color: #666; margin-bottom: 15px;">请输入合约的ABI (Application Binary Interface) JSON格式</p>
            
            <textarea id="manualABIInput" 
                      placeholder='[{"type":"function","name":"transfer","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],"outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable"}]'
                      style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px;"></textarea>
            
            <div style="margin-top: 15px; text-align: right;">
                <button onclick="this.closest('div[style*=\'position: fixed\']').remove()" 
                        style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ddd; background: #f8f9fa; border-radius: 4px; cursor: pointer;">
                    取消
                </button>
                <button onclick="loadManualABI()" 
                        style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    加载ABI
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// 加载手动输入的ABI（UI）
function loadManualABI() {
    const abiInput = document.getElementById('manualABIInput').value.trim();
    if (!abiInput) {
        alert('请输入ABI内容');
        return;
    }
    
    try {
        const abi = JSON.parse(abiInput);
        if (!Array.isArray(abi)) {
            throw new Error('ABI必须是数组格式');
        }
        
        const privateKey = document.getElementById('contractPrivateKey').value.trim();
        const contractAddress = document.getElementById('contractAddress').value.trim();
        
        // 创建钱包和合约
        const provider = getProvider();
        if (!provider) return;
        
        currentWallet = new ethers.Wallet(privateKey, provider);
        contractABI = abi;
        window.contractABI = contractABI;
        currentContract = new ethers.Contract(contractAddress, contractABI, currentWallet);
        
        // 显示合约信息
        document.getElementById('contractAddressDisplay').textContent = contractAddress;
        document.getElementById('walletAddressDisplay').textContent = currentWallet.address;
        
        // 加载方法列表
        if (typeof window.loadContractMethods === 'function') window.loadContractMethods();
        
        // 显示交互区域
        document.getElementById('contractInteractionArea').style.display = 'block';
        
        // 关闭模态框
        document.querySelector('div[style*="position: fixed"]').remove();
        
        console.log('手动加载合约成功:', contractAddress);
        
    } catch (error) {
        console.error('解析ABI失败:', error);
        alert('ABI格式错误，请检查JSON格式是否正确');
    }
}

// 清空合约数据（UI）
function clearContractData() {
    document.getElementById('contractPrivateKey').value = '';
    document.getElementById('contractAddress').value = '';
    document.getElementById('contractInteractionArea').style.display = 'none';
    document.getElementById('contractResultArea').style.display = 'none';
    
    // 清空方法选择
    const methodSelect = document.getElementById('contractMethodSelect');
    if (methodSelect) {
        methodSelect.innerHTML = '<option value="">请选择合约方法...</option>';
    }
    
    // 清空参数区域
    const paramsArea = document.getElementById('methodParamsArea');
    if (paramsArea) {
        paramsArea.style.display = 'none';
    }
    
    // 清空网络信息
    const interactionArea = document.getElementById('contractInteractionArea');
    if (interactionArea) {
        const networkInfo = interactionArea.querySelector('div[style*="color: #28a745"]');
        if (networkInfo && networkInfo.parentNode) {
            networkInfo.parentNode.removeChild(networkInfo);
        }
    }
    
    currentContract = null;
    currentWallet = null;
    contractABI = null;
} 

// 仅业务：根据手动 ABI 载入合约与钱包
async function loadContractFromAbi(privateKey, contractAddress, abi) {
  const provider = await getProvider();
  if (!provider) throw new Error('Provider 不可用');
  currentWallet = new ethers.Wallet(privateKey, provider);
  contractABI = abi;
  window.contractABI = contractABI;
  currentContract = new ethers.Contract(contractAddress, contractABI, currentWallet);
  return { walletAddress: currentWallet.address, contractAddress: currentContract.address };
}

// 仅业务：清空当前合约状态
function clearContractState() {
  currentContract = null;
  currentWallet = null;
  contractABI = null;
  delete window.contractABI;
}

// 挂载合约调用相关函数到window
window.loadContractABI = loadContractABI;
window.executeContractMethod = executeContractMethod;
window.estimateGas = estimateGas;
// UI 相关由 js/ui/contract-ui.js 提供
// window.showManualABIInput / window.loadManualABI / window.clearContractData 迁移至 UI 层
// 由 UI 层提供的方法依赖：loadContractMethods/loadMethodParams
if (typeof window.loadContractMethods !== 'function') { window.loadContractMethods = function(){}; }
if (typeof window.loadMethodParams !== 'function') { window.loadMethodParams = function(){}; }
// 暴露业务接口
window.loadContractFromAbi = loadContractFromAbi;
window.clearContractState = clearContractState; 