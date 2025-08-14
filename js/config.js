// 配置管理模块

// 网络配置
const networks = {
    // 主网
    'ethereum': {
        name: 'Ethereum主网',
        nativeCurrency: 'ETH',
        rpc: 'https://eth.llamarpc.com',
        chainId: 1
    },
    'bsc': {
        name: 'BSC主网',
        nativeCurrency: 'BNB',
        rpc: 'https://bsc-dataseed.binance.org',
        chainId: 56
    },
    'polygon': {
        name: 'Polygon主网',
        nativeCurrency: 'MATIC',
        rpc: 'https://polygon-rpc.com',
        chainId: 137
    },
    'arbitrum': {
        name: 'Arbitrum One主网',
        nativeCurrency: 'ETH',
        rpc: 'https://arb1.arbitrum.io/rpc',
        chainId: 42161
    },
    'arbitrum-nova': {
        name: 'Arbitrum Nova主网',
        nativeCurrency: 'ETH',
        rpc: 'https://nova.arbitrum.io/rpc',
        chainId: 42170
    },
    'optimism': {
        name: 'Optimism主网',
        nativeCurrency: 'ETH',
        rpc: 'https://mainnet.optimism.io',
        chainId: 10
    },
    'base': {
        name: 'Base主网',
        nativeCurrency: 'ETH',
        rpc: 'https://mainnet.base.org',
        chainId: 8453
    },
    'avalanche': {
        name: 'Avalanche主网',
        nativeCurrency: 'AVAX',
        rpc: 'https://api.avax.network/ext/bc/C/rpc',
        chainId: 43114
    },
    'fantom': {
        name: 'Fantom主网',
        nativeCurrency: 'FTM',
        rpc: 'https://rpc.ftm.tools',
        chainId: 250
    },
    'zksync': {
        name: 'zkSync主网',
        nativeCurrency: 'ETH',
        rpc: 'https://mainnet.era.zksync.io',
        chainId: 324
    },
    'polygon-zkevm': {
        name: 'Polygon zkEVM主网',
        nativeCurrency: 'ETH',
        rpc: 'https://zkevm-rpc.com',
        chainId: 1101
    },
    'linea': {
        name: 'Linea主网',
        nativeCurrency: 'ETH',
        rpc: 'https://rpc.linea.build',
        chainId: 59144
    },
    'scroll': {
        name: 'Scroll主网',
        nativeCurrency: 'ETH',
        rpc: 'https://rpc.scroll.io',
        chainId: 534352
    },
    'blast': {
        name: 'Blast主网',
        nativeCurrency: 'ETH',
        rpc: 'https://rpc.blast.io',
        chainId: 81457
    },
    'opbnb': {
        name: 'opBNB主网',
        nativeCurrency: 'BNB',
        rpc: 'https://opbnb-mainnet-rpc.bnbchain.org',
        chainId: 204
    },
    'gnosis': {
        name: 'Gnosis主网',
        nativeCurrency: 'XDAI',
        rpc: 'https://rpc.gnosischain.com',
        chainId: 100
    },
    'cronos': {
        name: 'Cronos主网',
        nativeCurrency: 'CRO',
        rpc: 'https://evm.cronos.org',
        chainId: 25
    },
    'fraxtal': {
        name: 'Fraxtal主网',
        nativeCurrency: 'FXTL',
        rpc: 'https://rpc.frax.com',
        chainId: 252
    },
    'hyperevm': {
        name: 'HyperEVM主网',
        nativeCurrency: 'HYP',
        rpc: 'https://rpc.hyperevm.com',
        chainId: 999
    },
    'mantle': {
        name: 'Mantle主网',
        nativeCurrency: 'MNT',
        rpc: 'https://rpc.mantle.xyz',
        chainId: 5000
    },
    'memecore': {
        name: 'Memecore主网',
        nativeCurrency: 'MEME',
        rpc: 'https://rpc.memecore.com',
        chainId: 4352
    },
    'moonbeam': {
        name: 'Moonbeam主网',
        nativeCurrency: 'GLMR',
        rpc: 'https://rpc.api.moonbeam.network',
        chainId: 1284
    },
    'moonriver': {
        name: 'Moonriver主网',
        nativeCurrency: 'MOVR',
        rpc: 'https://rpc.api.moonriver.moonbeam.network',
        chainId: 1285
    },
    'katana': {
        name: 'Katana主网',
        nativeCurrency: 'KAT',
        rpc: 'https://rpc.katana.com',
        chainId: 747474
    },
    'sei': {
        name: 'Sei主网',
        nativeCurrency: 'SEI',
        rpc: 'https://rpc.sei.io',
        chainId: 1329
    },
    'sonic': {
        name: 'Sonic主网',
        nativeCurrency: 'SONIC',
        rpc: 'https://rpc.sonic.com',
        chainId: 146
    },
    'sophon': {
        name: 'Sophon主网',
        nativeCurrency: 'SOPH',
        rpc: 'https://rpc.sophon.com',
        chainId: 50104
    },
    'swellchain': {
        name: 'Swellchain主网',
        nativeCurrency: 'SWELL',
        rpc: 'https://rpc.swellchain.com',
        chainId: 1923
    },
    'taiko': {
        name: 'Taiko主网',
        nativeCurrency: 'ETH',
        rpc: 'https://rpc.a2.taiko.xyz',
        chainId: 167000
    },
    'unichain': {
        name: 'Unichain主网',
        nativeCurrency: 'UNI',
        rpc: 'https://rpc.unichain.com',
        chainId: 130
    },
    'wemix': {
        name: 'WEMIX3.0主网',
        nativeCurrency: 'WEMIX',
        rpc: 'https://api.wemix.com',
        chainId: 1111
    },
    'world': {
        name: 'World主网',
        nativeCurrency: 'WORLD',
        rpc: 'https://rpc.world.com',
        chainId: 480
    },
    'xai': {
        name: 'Xai主网',
        nativeCurrency: 'XAI',
        rpc: 'https://rpc.xai.com',
        chainId: 660279
    },
    'xdc': {
        name: 'XDC主网',
        nativeCurrency: 'XDC',
        rpc: 'https://erpc.xinfin.network',
        chainId: 50
    },
    'bittorrent': {
        name: 'BitTorrent主网',
        nativeCurrency: 'BTT',
        rpc: 'https://rpc.bittorrentchain.io',
        chainId: 199
    },
    'berachain': {
        name: 'Berachain主网',
        nativeCurrency: 'BERA',
        rpc: 'https://rpc.berachain.com',
        chainId: 80094
    },
    'celo': {
        name: 'Celo主网',
        nativeCurrency: 'CELO',
        rpc: 'https://forno.celo.org',
        chainId: 42220
    },
    'abstract': {
        name: 'Abstract主网',
        nativeCurrency: 'ABS',
        rpc: 'https://rpc.abstract.com',
        chainId: 2741
    },
    'apechain': {
        name: 'ApeChain主网',
        nativeCurrency: 'APE',
        rpc: 'https://rpc.apechain.com',
        chainId: 33139
    },
    
    // 测试网
    'ethereum-sepolia': {
        name: 'Ethereum Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        chainId: 11155111
    },
    'ethereum-holesky': {
        name: 'Ethereum Holesky测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://holesky.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        chainId: 17000
    },
    'ethereum-hoodi': {
        name: 'Ethereum Hoodi测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://hoodi.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        chainId: 560048
    },
    'abstract-sepolia': {
        name: 'Abstract Sepolia测试网',
        nativeCurrency: 'ABS',
        rpc: 'https://rpc.abstract-sepolia.com',
        chainId: 11124
    },
    'apechain-curtis': {
        name: 'ApeChain Curtis测试网',
        nativeCurrency: 'APE',
        rpc: 'https://rpc.apechain-curtis.com',
        chainId: 33111
    },
    'arbitrum-sepolia': {
        name: 'Arbitrum Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
        chainId: 421614
    },
    'avalanche-fuji': {
        name: 'Avalanche Fuji测试网',
        nativeCurrency: 'AVAX',
        rpc: 'https://api.avax-test.network/ext/bc/C/rpc',
        chainId: 43113
    },
    'base-sepolia': {
        name: 'Base Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://sepolia.base.org',
        chainId: 84532
    },
    'berachain-bepolia': {
        name: 'Berachain Bepolia测试网',
        nativeCurrency: 'BERA',
        rpc: 'https://rpc.berachain-bepolia.com',
        chainId: 80069
    },
    'bittorrent-testnet': {
        name: 'BitTorrent测试网',
        nativeCurrency: 'BTT',
        rpc: 'https://testnet-rpc.bittorrentchain.io',
        chainId: 1028
    },
    'blast-sepolia': {
        name: 'Blast Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://sepolia.blast.io',
        chainId: 168587773
    },
    'bsc-testnet': {
        name: 'BSC测试网',
        nativeCurrency: 'BNB',
        rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
        chainId: 97
    },
    'celo-alfajores': {
        name: 'Celo Alfajores测试网',
        nativeCurrency: 'CELO',
        rpc: 'https://alfajores-forno.celo-testnet.org',
        chainId: 44787
    },
    'fraxtal-testnet': {
        name: 'Fraxtal测试网',
        nativeCurrency: 'FXTL',
        rpc: 'https://rpc.frax-testnet.com',
        chainId: 2522
    },
    'linea-sepolia': {
        name: 'Linea Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://rpc.sepolia.linea.build',
        chainId: 59141
    },
    'mantle-sepolia': {
        name: 'Mantle Sepolia测试网',
        nativeCurrency: 'MNT',
        rpc: 'https://rpc.sepolia.mantle.xyz',
        chainId: 5003
    },
    'memecore-testnet': {
        name: 'Memecore测试网',
        nativeCurrency: 'MEME',
        rpc: 'https://rpc.memecore-testnet.com',
        chainId: 43521
    },
    'moonbase-alpha': {
        name: 'Moonbase Alpha测试网',
        nativeCurrency: 'DEV',
        rpc: 'https://rpc.api.moonbase.moonbeam.network',
        chainId: 1287
    },
    'monad-testnet': {
        name: 'Monad测试网',
        nativeCurrency: 'MONAD',
        rpc: 'https://rpc.monad-testnet.com',
        chainId: 10143
    },
    'optimism-sepolia': {
        name: 'Optimism Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://sepolia.optimism.io',
        chainId: 11155420
    },
    'polygon-amoy': {
        name: 'Polygon Amoy测试网',
        nativeCurrency: 'MATIC',
        rpc: 'https://rpc-amoy.polygon.technology',
        chainId: 80002
    },
    'sei-testnet': {
        name: 'Sei测试网',
        nativeCurrency: 'SEI',
        rpc: 'https://rpc.sei-testnet.com',
        chainId: 1328
    },
    'scroll-sepolia': {
        name: 'Scroll Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://sepolia-rpc.scroll.io',
        chainId: 534351
    },
    'sonic-blaze': {
        name: 'Sonic Blaze测试网',
        nativeCurrency: 'SONIC',
        rpc: 'https://rpc.sonic-blaze.com',
        chainId: 57054
    },
    'sophon-sepolia': {
        name: 'Sophon Sepolia测试网',
        nativeCurrency: 'SOPH',
        rpc: 'https://rpc.sophon-sepolia.com',
        chainId: 531050104
    },
    'swellchain-testnet': {
        name: 'Swellchain测试网',
        nativeCurrency: 'SWELL',
        rpc: 'https://rpc.swellchain-testnet.com',
        chainId: 1924
    },
    'taiko-hekla': {
        name: 'Taiko Hekla L2测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://rpc.test.taiko.xyz',
        chainId: 167009
    },
    'unichain-sepolia': {
        name: 'Unichain Sepolia测试网',
        nativeCurrency: 'UNI',
        rpc: 'https://rpc.unichain-sepolia.com',
        chainId: 1301
    },
    'wemix-testnet': {
        name: 'WEMIX3.0测试网',
        nativeCurrency: 'WEMIX',
        rpc: 'https://api.test.wemix.com',
        chainId: 1112
    },
    'world-sepolia': {
        name: 'World Sepolia测试网',
        nativeCurrency: 'WORLD',
        rpc: 'https://rpc.world-sepolia.com',
        chainId: 4801
    },
    'xai-sepolia': {
        name: 'Xai Sepolia测试网',
        nativeCurrency: 'XAI',
        rpc: 'https://rpc.xai-sepolia.com',
        chainId: 37714555429
    },
    'xdc-apothem': {
        name: 'XDC Apothem测试网',
        nativeCurrency: 'XDC',
        rpc: 'https://erpc.apothem.network',
        chainId: 51
    },
    'zksync-sepolia': {
        name: 'zkSync Sepolia测试网',
        nativeCurrency: 'ETH',
        rpc: 'https://sepolia.era.zksync.dev',
        chainId: 300
    },
    'opbnb-testnet': {
        name: 'opBNB测试网',
        nativeCurrency: 'BNB',
        rpc: 'https://opbnb-testnet-rpc.bnbchain.org',
        chainId: 5611
    }
};

// 自定义网络管理
let customNetworks = Storage.load('custom-networks', {});

// 基于名称的简单测试网识别
function __isTestnetName(name) {
    const kw = ['测试网', 'Testnet', 'Sepolia', 'Holesky', 'Fuji', 'Amoy', 'Curtis', 'Apothem', 'Blaze', 'Hekla'];
    return kw.some(k => (name || '').toLowerCase().includes(k.toLowerCase()));
}

// 可选的浏览器回退映射（当 networks 未提供 explorer 时）
const __explorerFallbackByChainId = {
    1: 'https://etherscan.io',
    56: 'https://bscscan.com',
    137: 'https://polygonscan.com',
    10: 'https://optimistic.etherscan.io',
    42161: 'https://arbiscan.io',
    8453: 'https://basescan.org',
    43114: 'https://snowtrace.io',
    250: 'https://ftmscan.com',
    1101: 'https://zkevm.polygonscan.com',
    59144: 'https://lineascan.build',
    534352: 'https://scrollscan.com',
    81457: 'https://blastscan.io',
    204: 'https://opbnb.bscscan.com',
    100: 'https://gnosisscan.io',
    25: 'https://cronoscan.com',
};

// 从SSOT获取：按 chainId 查找（包含自定义网络）
function getNetworkByChainId(chainId) {
    const cid = Number(chainId);
    for (const [key, n] of Object.entries(networks)) {
        if (Number(n.chainId) === cid) return { key, ...n };
    }
    for (const [key, n] of Object.entries(customNetworks || {})) {
        if (Number(n.chainId) === cid) return { key, ...n };
    }
    return null;
}

// 新增：按 key 获取网络（包含自定义网络）
function getNetworkByKey(key) {
    if (!key) return null;
    if (networks[key]) return { key, ...networks[key] };
    if (customNetworks && customNetworks[key]) return { key, ...customNetworks[key] };
    return null;
}

// Explorer 获取：优先 networks.explorer，其次回退映射
function getExplorerForChainId(chainId) {
    const n = getNetworkByChainId(chainId);
    if (n && n.explorer) return n.explorer;
    return __explorerFallbackByChainId[Number(chainId)] || null;
}

// 别名：getExplorer(chainId)
function getExplorer(chainId) { return getExplorerForChainId(chainId); }

// 由 SSOT 动态渲染下拉（主网/测试网 分组）
function populatePresetNetworks() {
    const sel = document.getElementById('networkSelect');
    if (!sel) return;
    // 清空现有选项
    sel.innerHTML = '';

    // 自定义/添加项
    const optCustom = document.createElement('option');
    optCustom.value = '';
    optCustom.textContent = '自定义';
    sel.appendChild(optCustom);

    const optAdd = document.createElement('option');
    optAdd.value = 'add-network';
    optAdd.textContent = '➕ 添加网络...';
    optAdd.style.background = '#e8f5e8';
    optAdd.style.fontWeight = 'bold';
    sel.appendChild(optAdd);

    // 主网/测试网分隔
    const sepMain = document.createElement('option');
    sepMain.disabled = true;
    sepMain.textContent = '──── 主网 ────';
    sepMain.style.background = '#28a745';
    sepMain.style.color = '#fff';
    sepMain.style.fontWeight = 'bold';
    sel.appendChild(sepMain);

    // 主网
    Object.entries(networks)
        .filter(([, n]) => !__isTestnetName(n.name))
        .forEach(([key, n]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = n.name;
            sel.appendChild(opt);
        });

    const sepTest = document.createElement('option');
    sepTest.disabled = true;
    sepTest.textContent = '──── 测试网 ────';
    sepTest.style.background = '#ffc107';
    sepTest.style.color = '#333';
    sepTest.style.fontWeight = 'bold';
    sel.appendChild(sepTest);

    // 测试网
    Object.entries(networks)
        .filter(([, n]) => __isTestnetName(n.name))
        .forEach(([key, n]) => {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = n.name;
            sel.appendChild(opt);
        });

    // 将自定义网络的渲染交给现有的 loadCustomNetworks，避免重复分隔符
    if (typeof loadCustomNetworks === 'function') {
        loadCustomNetworks();
    }
}

// 配置面板控制
function toggleConfig() {
    const panel = document.getElementById('configPanel');
    const overlay = document.getElementById('configOverlay');
    const toggle = document.getElementById('configToggle');
    
    if (panel.classList.contains('open')) {
        closeConfig();
    } else {
        openConfig();
    }
}

function openConfig() {
    const panel = document.getElementById('configPanel');
    const overlay = document.getElementById('configOverlay'); 
    const toggle = document.getElementById('configToggle');
    
    panel.classList.add('open');
    overlay.classList.add('open');
    toggle.classList.add('active');
    
    // 首次打开时隐藏提示和脉冲动画
    const hasConfigured = Storage.load('has-configured', false);
    if (!hasConfigured) {
        Storage.save('has-configured', true);
        const configTip = document.getElementById('configTip');
        if (configTip) {
            configTip.style.display = 'none';
        }
        // 移除脉冲动画
        toggle.classList.remove('pulse');
    }
}

function closeConfig() {
    const panel = document.getElementById('configPanel');
    const overlay = document.getElementById('configOverlay');
    const toggle = document.getElementById('configToggle');
    
    panel.classList.remove('open');
    overlay.classList.remove('open');
    toggle.classList.remove('active');
}

// 网络切换功能
function switchNetwork() {
    // 在程序化更新期间抑制覆盖保存
    try { window.__suppressOverrideSave = true; } catch(_) {}
    const networkSelect = document.getElementById('networkSelect');
    const selectedNetwork = networkSelect.value;
    
    // 如果选择"添加网络"选项
    if (selectedNetwork === 'add-network') {
        document.getElementById('addNetworkModal').style.display = 'block';
        // 重置选择为自定义
        networkSelect.value = '';
        // 微任务后解除抑制
        setTimeout(() => { try { window.__suppressOverrideSave = false; } catch(_) {} }, 0);
        return;
    }
    
    let network = null;
    
    // 检查是否是预设网络
    if (selectedNetwork && networks[selectedNetwork]) {
        network = networks[selectedNetwork];
    }
    // 检查是否是自定义网络  
    else if (selectedNetwork && customNetworks[selectedNetwork]) {
        network = customNetworks[selectedNetwork];
    }
    
    if (network) {
        // 先设置为默认，再应用用户覆盖
        document.getElementById('rpc').value = network.rpc;
        document.getElementById('chainId').value = network.chainId;
        document.getElementById('chainId').setAttribute('readonly', 'readonly');

        // 应用用户为该网络保存的RPC覆盖
        try {
            const overrides = Storage.load('crypto-tool-rpc-overrides', {});
            const ov = overrides[selectedNetwork];
            if (ov && typeof ov === 'string' && ov.trim().length > 0) {
                document.getElementById('rpc').value = ov;
            }
        } catch(_) {}
        
        // 更新UI中的网络名称
        const networkName = `${network.name} (${network.nativeCurrency})`;
        const distributeNetworkNameEl = document.getElementById('distributeNetworkName');
        const distributeCurrentNetworkEl = document.getElementById('distributeCurrentNetwork');
        const collectNetworkNameEl = document.getElementById('collectNetworkName');
        const collectCurrentNetworkEl = document.getElementById('collectCurrentNetwork');
        const queryNetworkNameEl = document.getElementById('queryNetworkName');
        const currentNetworkDisplayEl = document.getElementById('currentNetworkDisplay');
        if (distributeNetworkNameEl) distributeNetworkNameEl.textContent = network.nativeCurrency;
        if (distributeCurrentNetworkEl) distributeCurrentNetworkEl.textContent = networkName;
        if (collectNetworkNameEl) collectNetworkNameEl.textContent = network.nativeCurrency;
        if (collectCurrentNetworkEl) collectCurrentNetworkEl.textContent = networkName;
        if (queryNetworkNameEl) queryNetworkNameEl.textContent = network.nativeCurrency;
        if (currentNetworkDisplayEl) currentNetworkDisplayEl.textContent = networkName;
        
        log(`已切换到 ${networkName}`);
    } else {
        // 自定义网络
        document.getElementById('chainId').removeAttribute('readonly');
        
        // 更新UI显示为自定义
        const distributeNetworkNameEl = document.getElementById('distributeNetworkName');
        const distributeCurrentNetworkEl = document.getElementById('distributeCurrentNetwork');
        const collectNetworkNameEl = document.getElementById('collectNetworkName');
        const collectCurrentNetworkEl = document.getElementById('collectCurrentNetwork');
        const queryNetworkNameEl = document.getElementById('queryNetworkName');
        const currentNetworkDisplayEl = document.getElementById('currentNetworkDisplay');
        if (distributeNetworkNameEl) distributeNetworkNameEl.textContent = '原生代币';
        if (distributeCurrentNetworkEl) distributeCurrentNetworkEl.textContent = '自定义网络';
        if (collectNetworkNameEl) collectNetworkNameEl.textContent = '原生代币';
        if (collectCurrentNetworkEl) collectCurrentNetworkEl.textContent = '自定义网络';
        if (queryNetworkNameEl) queryNetworkNameEl.textContent = '原生代币';
        if (currentNetworkDisplayEl) currentNetworkDisplayEl.textContent = '自定义网络';
    }
    
    // 网络选择保存（仅网络相关字段，避免覆盖并发等设置）
    // 不再自动保存，改由用户点击“保存配置”显式保存

    // 切换后更新覆盖提示UI
    try { if (typeof updateRpcOverrideUi === 'function') updateRpcOverrideUi(); } catch(_) {}
    // 微任务后解除抑制
    setTimeout(() => { try { window.__suppressOverrideSave = false; } catch(_) {} }, 0);
}

// 加载自定义网络到选择框
function loadCustomNetworks() {
    const networkSelect = document.getElementById('networkSelect');
    const customOptions = networkSelect.querySelectorAll('.custom-network');
    
    // 删除现有的自定义网络选项
    customOptions.forEach(option => option.remove());
    
    // 添加自定义网络选项
    if (Object.keys(customNetworks).length > 0) {
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '──── 自定义网络 ────';
        separator.className = 'custom-network';
        networkSelect.appendChild(separator);
        
        Object.keys(customNetworks).forEach(key => {
            const network = customNetworks[key];
            const option = document.createElement('option');
            option.value = key;
            const name = (window.escapeHtml ? window.escapeHtml(network.name) : network.name);
            const cur = (window.escapeHtml ? window.escapeHtml(network.nativeCurrency) : network.nativeCurrency);
            option.textContent = `${name} (${cur})`;
            option.className = 'custom-network';
            networkSelect.appendChild(option);
        });
    }
}

// 自动保存配置数据
async function saveFormData() {
    const formData = {
        networkSelect: document.getElementById('networkSelect').value,
        // rpc/chainId 不再作为全局配置持久化，避免跨链污染
        gasPrice: document.getElementById('gasPrice').value,
        encryptionPassword: '', // 不保存密码
        savePrivateKeys: document.getElementById('savePrivateKeys')?.checked || false,
        // 保存各种地址列表和代币地址等 (不包含私钥)
        distributeTokenAddress: document.getElementById('modalDistributeTokenAddress')?.value || '',
        distributeAmount: document.getElementById('modalDistributeAmount')?.value || '',
        distributeAddresses: document.getElementById('modalDistributeAddresses')?.value || '',
        queryAddresses: document.getElementById('modalQueryAddresses')?.value || '',
        collectToAddress: document.getElementById('modalCollectToAddress')?.value || '',
        collectTokenAddress: document.getElementById('modalCollectTokenAddress')?.value || '',
        queryTokenAddress: document.getElementById('modalQueryTokenAddress')?.value || '',
        // 新增：并发度设置
        queryConcurrency: document.getElementById('queryConcurrency')?.value || 8,
        distributeConcurrency: document.getElementById('distributeConcurrency')?.value || 6,
        collectConcurrency: document.getElementById('collectConcurrency')?.value || 6,
        inputdataConcurrency: document.getElementById('inputdataConcurrency')?.value || 5,
    };
    Storage.save('crypto-tool-config', formData);

    // 按规范：仅当当前链的 RPC 与其默认值不同，且是 http(s) 时，才保存覆盖；等于默认则删除覆盖
    try {
        if (window.__suppressOverrideSave) { /* 跳过程序化更新期间的覆盖写入 */ return; }
        const overrides = Storage.load('crypto-tool-rpc-overrides', {});
        const key = formData.networkSelect;
        if (key) {
            const n = (networks[key] || customNetworks[key]);
            const defaultRpc = n?.rpc || '';
            const rpc = String(document.getElementById('rpc')?.value || '').trim();
            const isHttp = /^https?:\/\//i.test(rpc);
            if (isHttp && rpc && rpc !== defaultRpc) {
                overrides[key] = rpc;
            } else if (overrides[key]) {
                delete overrides[key];
            }
            Storage.save('crypto-tool-rpc-overrides', overrides);
        }
    } catch(_) {}

    // 将加密密码在本会话与本机存储（跨标签/重启）
    try {
        const pw = document.getElementById('encryptionPassword')?.value || '';
        if (pw) {
            sessionStorage.setItem('crypto-tool-epw', pw);
            localStorage.setItem('crypto-tool-epw', pw); // 注意：明文本机保存，供便捷使用
        } else {
            sessionStorage.removeItem('crypto-tool-epw');
            localStorage.removeItem('crypto-tool-epw');
        }
    } catch (_) {}

    // 仅在“勾选保存”且“已填写密码”时才保存加密私钥
    const wantSave = document.getElementById('savePrivateKeys')?.checked || false;
    const password = document.getElementById('encryptionPassword')?.value?.trim() || '';

    if (wantSave && password) {
        if (document.getElementById('modalDistributePrivateKey')?.value) {
            await SecureStorage.saveEncryptedPrivateKey(
                'distributePrivateKey',
                document.getElementById('modalDistributePrivateKey').value
            );
        }
        if (document.getElementById('modalCollectPrivateKeys')?.value) {
            await SecureStorage.saveEncryptedPrivateKey(
                'collectPrivateKeys',
                document.getElementById('modalCollectPrivateKeys').value
            );
        }
        if (document.getElementById('modalInputdataPrivateKeys')?.value) {
            await SecureStorage.saveEncryptedPrivateKey(
                'inputdataPrivateKeys',
                document.getElementById('modalInputdataPrivateKeys').value
            );
        }
    } else if (!wantSave) {
        // 未勾选保存时，出于安全考虑清除历史加密私钥（可选）
        try { SecureStorage.clearAllEncryptedKeys(); } catch (e) { /* 忽略清理异常 */ }
    }
}

// 加载保存的配置数据
function loadFormData() {
    const formData = Storage.load('crypto-tool-config', {});
    
    // 不再从全局配置回填 rpc/chainId，避免跨链污染
    if (formData.gasPrice) document.getElementById('gasPrice').value = formData.gasPrice;
    if (formData.savePrivateKeys) document.getElementById('savePrivateKeys').checked = formData.savePrivateKeys;
    // 新增：并发度设置
    if (document.getElementById('queryConcurrency')) document.getElementById('queryConcurrency').value = formData.queryConcurrency || 8;
    if (document.getElementById('distributeConcurrency')) document.getElementById('distributeConcurrency').value = formData.distributeConcurrency || 6;
    if (document.getElementById('collectConcurrency')) document.getElementById('collectConcurrency').value = formData.collectConcurrency || 6;
    if (document.getElementById('inputdataConcurrency')) document.getElementById('inputdataConcurrency').value = formData.inputdataConcurrency || 5;

    // 恢复会话或本机密码
    try {
        const pw = sessionStorage.getItem('crypto-tool-epw') || localStorage.getItem('crypto-tool-epw');
        if (pw && document.getElementById('encryptionPassword')) document.getElementById('encryptionPassword').value = pw;
    } catch (_) {}
    
    // 延迟加载弹窗内容，因为弹窗元素可能还没创建
    setTimeout(() => {
        // 加载非私钥数据
        if (formData.distributeTokenAddress && document.getElementById('modalDistributeTokenAddress'))
            document.getElementById('modalDistributeTokenAddress').value = formData.distributeTokenAddress;
        if (formData.distributeAmount && document.getElementById('modalDistributeAmount'))
            document.getElementById('modalDistributeAmount').value = formData.distributeAmount;
        if (formData.distributeAddresses && document.getElementById('modalDistributeAddresses')) 
            document.getElementById('modalDistributeAddresses').value = formData.distributeAddresses;
        if (formData.queryAddresses && document.getElementById('modalQueryAddresses'))
            document.getElementById('modalQueryAddresses').value = formData.queryAddresses;
        if (formData.collectToAddress && document.getElementById('modalCollectToAddress'))
            document.getElementById('modalCollectToAddress').value = formData.collectToAddress;
        if (formData.collectTokenAddress && document.getElementById('modalCollectTokenAddress'))
            document.getElementById('modalCollectTokenAddress').value = formData.collectTokenAddress;
        if (formData.queryTokenAddress && document.getElementById('modalQueryTokenAddress'))
            document.getElementById('modalQueryTokenAddress').value = formData.queryTokenAddress;
    }, 100);
    
    // 设置网络选择并避免覆盖自定义RPC
    const sel = document.getElementById('networkSelect');
    if (formData.networkSelect) {
        sel.value = formData.networkSelect;
        switchNetwork();
        // 仅恢复 gasPrice，避免强行覆盖默认/覆盖逻辑
        if (formData.gasPrice) document.getElementById('gasPrice').value = formData.gasPrice;
    } else if (sel && !sel.value) {
        // 无保存选择时，选择一个合理默认（优先 ethereum，其次 bsc）
        if (sel.querySelector('option[value="ethereum"]')) sel.value = 'ethereum';
        else if (sel.querySelector('option[value="bsc"]')) sel.value = 'bsc';
        if (typeof window.switchNetwork === 'function') window.switchNetwork();
    }
}

// 仅保存网络相关（供 switchNetwork 调用）
function saveNetworkSelection() {
    const networkSelect = document.getElementById('networkSelect').value;
    const gasPrice = document.getElementById('gasPrice').value;

    const current = Storage.load('crypto-tool-config', {});
    const next = Object.assign({}, current, { networkSelect, gasPrice });
    Storage.save('crypto-tool-config', next);
}

// 尝试加载加密的私钥
async function loadEncryptedPrivateKeys() {
    const password = document.getElementById('encryptionPassword').value;
    if (!password) return;
    
    // 延迟确保弹窗元素已加载
    setTimeout(async () => {
        try {
            const distributeKey = await SecureStorage.loadEncryptedPrivateKey('distributePrivateKey');
            if (distributeKey && document.getElementById('modalDistributePrivateKey')) {
                document.getElementById('modalDistributePrivateKey').value = distributeKey;
            }
            
            const collectKeys = await SecureStorage.loadEncryptedPrivateKey('collectPrivateKeys');
            if (collectKeys && document.getElementById('modalCollectPrivateKeys')) {
                document.getElementById('modalCollectPrivateKeys').value = collectKeys;
            }
            
            const inputdataKeys = await SecureStorage.loadEncryptedPrivateKey('inputdataPrivateKeys');
            if (inputdataKeys && document.getElementById('modalInputdataPrivateKeys')) {
                document.getElementById('modalInputdataPrivateKeys').value = inputdataKeys;
            }
        } catch (error) {
            console.error('加载加密私钥失败:', error);
            alert('密码错误或私钥数据损坏，无法加载保存的私钥');
        }
    }, 200);
}

// 清除所有数据
function clearAllData() {
    if (confirm('⚠️ 确定要清除所有保存的数据吗？\n\n包括：\n• 加密私钥和配置信息\n• 自定义网络\n• 地址列表\n\n此操作无法撤销！')) {
        if (confirm('🚨 最终确认：您真的要删除所有数据吗？\n点击"确定"将立即清除所有数据并刷新页面。')) {
            // 清除所有localStorage数据（限定本工具相关键）
            try {
                Storage.remove('custom-networks');
                Storage.remove('has-configured');
                Storage.remove('crypto-tool-config');
                Storage.remove('crypto-tool-rpc-overrides');
                localStorage.removeItem('okxDexApiConfig'); // 兼容旧明文
                localStorage.removeItem('crypto-tool-epw'); // 清除本机密码缓存
                // 清理其他功能键（可选）
                localStorage.removeItem('price-monitor-settings');
                localStorage.removeItem('token-alerts');
                localStorage.removeItem('evm-generator-settings');
                localStorage.removeItem('alphaFavs');
            } catch (_) {}
            // 清除会话存储中的密码
            try { sessionStorage.removeItem('crypto-tool-epw'); } catch (_) {}
            // 清除所有加密私钥
            try { SecureStorage.clearAllEncryptedKeys(); } catch (_) {}
            
            alert('✅ 所有数据已清除！页面将自动刷新。');
            // 刷新页面
            location.reload();
        }
    }
}

// ESC键关闭配置面板
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfig();
    }
}); 

// 添加自定义网络
function addCustomNetwork() {
    const name = document.getElementById('modalNetworkName').value.trim();
    const rpc = document.getElementById('modalNetworkRpc').value.trim();
    const chainId = document.getElementById('modalNetworkChainId').value.trim();
    const currency = document.getElementById('modalNetworkCurrency').value.trim();
    
    if (!name || !rpc || !chainId || !currency) {
        alert('请填写所有必填字段');
        return;
    }
    
    if (!/^https?:\/\//.test(rpc)) {
        alert('RPC节点地址必须以http://或https://开头');
        return;
    }
    
    if (isNaN(chainId) || parseInt(chainId) <= 0) {
        alert('链ID必须是正整数');
        return;
    }
    
    // 生成唯一键名
    const key = `custom_${Date.now()}`;
    
    // 保存自定义网络
    customNetworks[key] = {
        name: name,
        nativeCurrency: currency.toUpperCase(),
        rpc: rpc,
        chainId: parseInt(chainId)
    };
    
    Storage.save('custom-networks', customNetworks);
    loadCustomNetworks();
    
    // 关闭弹窗并清空输入
    closeModal('addNetworkModal');
    document.getElementById('modalNetworkName').value = '';
    document.getElementById('modalNetworkRpc').value = '';
    document.getElementById('modalNetworkChainId').value = '';
    document.getElementById('modalNetworkCurrency').value = '';
    
    // 自动选择新添加的网络
    document.getElementById('networkSelect').value = key;
    switchNetwork();
    
    // 关闭配置面板
    setTimeout(() => closeConfig(), 500);
    
    log(`✅ 成功添加自定义网络: ${name}`);
}

// 显示网络管理器
function showNetworkManager() {
    const listContainer = document.getElementById('customNetworksList');
    listContainer.innerHTML = '';
    
    if (Object.keys(customNetworks).length === 0) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = "text-align: center; padding: 40px; color: #666;";
        const p1 = document.createElement('p'); p1.textContent = '📭 暂无自定义网络';
        const p2 = document.createElement('p'); p2.textContent = '点击"添加新网络"按钮来添加您的第一个自定义网络';
        wrapper.appendChild(p1); wrapper.appendChild(p2);
        listContainer.appendChild(wrapper);
    } else {
        Object.keys(customNetworks).forEach(key => {
            const network = customNetworks[key];
            const networkItem = document.createElement('div');
            networkItem.style.cssText = `
                background: #f8f9fa;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            `;

            const left = document.createElement('div');
            const title = document.createElement('h4');
            title.style.cssText = 'margin: 0 0 5px 0; color: #333;';
            title.textContent = (window.escapeHtml ? window.escapeHtml(network.name) : network.name);
            const info = document.createElement('p');
            info.style.cssText = 'margin: 0; color: #666; font-size: 14px;';
            const rpc = (window.escapeHtml ? window.escapeHtml(network.rpc) : network.rpc);
            const cur = (window.escapeHtml ? window.escapeHtml(network.nativeCurrency) : network.nativeCurrency);
            info.textContent = `RPC: ${rpc}\n链ID: ${network.chainId} | 原生代币: ${cur}`;
            left.appendChild(title); left.appendChild(info);

            const delBtn = document.createElement('button');
            delBtn.className = 'btn';
            delBtn.style.cssText = 'background: #dc3545; color: white; padding: 8px 16px; font-size: 14px;';
            delBtn.textContent = '🗑️ 删除';
            delBtn.addEventListener('click', () => deleteCustomNetwork(key));

            networkItem.appendChild(left);
            networkItem.appendChild(delBtn);
            listContainer.appendChild(networkItem);
        });
    }
    
    document.getElementById('networkManagerModal').style.display = 'block';
}

// 删除自定义网络
function deleteCustomNetwork(key) {
    const network = customNetworks[key];
    if (confirm(`确定要删除自定义网络"${network.name}"吗？\n此操作无法撤销。`)) {
        // 如果当前选择的就是要删除的网络，切换到Ethereum
        const currentNetwork = document.getElementById('networkSelect').value;
        if (currentNetwork === key) {
            document.getElementById('networkSelect').value = 'ethereum';
            switchNetwork();
        }
        
        delete customNetworks[key];
        Storage.save('custom-networks', customNetworks);
        loadCustomNetworks();
        showNetworkManager(); // 刷新管理器显示
        
        log(`🗑️ 已删除自定义网络: ${network.name}`);
    }
} 

// 挂载关键函数到window
window.loadCustomNetworks = loadCustomNetworks;
window.loadFormData = loadFormData;
window.switchNetwork = switchNetwork;
window.toggleConfig = toggleConfig;
window.closeConfig = closeConfig;
window.showNetworkManager = showNetworkManager;
window.clearAllData = clearAllData;
window.addCustomNetwork = addCustomNetwork;
window.saveFormData = saveFormData;
window.loadEncryptedPrivateKeys = loadEncryptedPrivateKeys;
window.deleteCustomNetwork = deleteCustomNetwork;
window.openConfig = openConfig;
window.populatePresetNetworks = populatePresetNetworks;
window.getNetworkByChainId = getNetworkByChainId;
window.getNetworkByKey = getNetworkByKey;
window.getExplorerForChainId = getExplorerForChainId;
window.getExplorer = getExplorer; 

// 暴露网络表供早期回退使用
window.networks = networks;
window.customNetworks = customNetworks;

// 辅助：保存并提示
window.saveConfigAndNotify = async function() {
    await saveFormData();
    const hasPw = !!(document.getElementById('encryptionPassword')?.value || '');
    if (window.notifySuccess) notifySuccess(`配置已保存${hasPw ? '（加密密码已缓存本机）' : ''}`);
};

// 恢复当前网络的默认RPC
window.resetRpcToDefault = function() {
    try { window.__suppressOverrideSave = true; } catch(_) {}
    const sel = document.getElementById('networkSelect').value;
    if (sel && (networks[sel] || customNetworks[sel])) {
        const n = networks[sel] || customNetworks[sel];
        document.getElementById('rpc').value = n.rpc;
        // 更新覆盖映射
        try {
            const overrides = Storage.load('crypto-tool-rpc-overrides', {});
            if (overrides[sel]) { delete overrides[sel]; Storage.save('crypto-tool-rpc-overrides', overrides); }
        } catch(_) {}
        updateRpcOverrideUi();
    }
    // 微任务后解除抑制
    setTimeout(() => { try { window.__suppressOverrideSave = false; } catch(_) {} }, 0);
};

function updateRpcOverrideUi() {
    try {
        const sel = document.getElementById('networkSelect').value;
        const badge = document.getElementById('rpcOverrideBadge');
        const btn = document.getElementById('rpcResetBtn');
        if (!sel || (!networks[sel] && !customNetworks[sel])) { if (badge) badge.style.display = 'none'; if (btn) btn.style.display = 'none'; return; }
        const n = networks[sel] || customNetworks[sel];
        const current = (document.getElementById('rpc').value || '').trim();
        const isOverride = current && current !== n.rpc;
        if (badge) badge.style.display = isOverride ? 'inline-block' : 'none';
        if (btn) btn.style.display = isOverride ? 'inline-block' : 'none';
    } catch(_) {}
}

// 在RPC变更时动态提示覆盖状态
(function(){
    const rpcInput = document.getElementById('rpc');
    if (rpcInput) {
        rpcInput.addEventListener('input', () => updateRpcOverrideUi());
    }
})(); 

// 清理工具：清空所有RPC覆盖
window.clearAllRpcOverrides = function() {
    try { Storage.save('crypto-tool-rpc-overrides', {}); } catch(_) {}
    updateRpcOverrideUi();
    if (window.notifySuccess) notifySuccess('已清除所有RPC覆盖');
};

// 抑制标记默认值
if (typeof window.__suppressOverrideSave === 'undefined') {
    window.__suppressOverrideSave = false;
}

// 主题应用与保存
window.applyTheme = function(mode) {
    const html = document.documentElement;
    let theme = mode || 'auto';
    if (theme === 'auto') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        html.setAttribute('data-theme', theme);
    }
    const current = Storage.load('crypto-tool-config', {});
    Storage.save('crypto-tool-config', Object.assign({}, current, { theme }));
}; 