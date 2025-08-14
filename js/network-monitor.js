// 网络监控模块

// 网络监控全局变量
let lastBlockHeight = 0;
let lastBlockTime = 0;

// 启动网络监控
function startNetworkMonitoring() {
  // 使用统一计时器，幂等启动
  if (typeof startTimer === 'function') {
    startTimer('network-monitor', async () => {
      await updateNetworkStatus();
    }, 5000);
  } else {
    // 兜底：直接执行一次
    updateNetworkStatus();
  }
  // 立即执行一次
  updateNetworkStatus();
}

// 更新网络状态
async function updateNetworkStatus() {
  try {
    const provider = await getProvider();
    if (!provider) {
      updateNetworkDisplay('连接失败', '-', '-', '❌ 无连接');
      return;
    }

    const startTime = Date.now();

    // 获取最新区块
    const latestBlock = await provider.getBlock('latest');
    const currentTime = Date.now();
    const latency = currentTime - startTime;

    if (latestBlock) {
      const blockHeight = latestBlock.number;
      const blockTime = latestBlock.timestamp * 1000;

      // 计算区块延迟
      let blockDelay = '正常';
      if (lastBlockHeight > 0 && lastBlockTime > 0) {
        const timeDiff = currentTime - lastBlockTime;
        const blockDiff = blockHeight - lastBlockHeight;

        if (blockDiff > 0) {
          const avgBlockTime = timeDiff / blockDiff;
          if (avgBlockTime > 15000) { // 15秒
            blockDelay = '延迟';
          } else if (avgBlockTime > 10000) { // 10秒
            blockDelay = '较慢';
          }
        }
      }

      // 更新显示
      updateNetworkDisplay(
        blockHeight.toLocaleString(),
        `${latency}ms`,
        blockDelay === '正常' ? '✅ 正常' : 
        blockDelay === '较慢' ? '⚠️ 较慢' : '❌ 延迟'
      );

      // 保存当前状态
      lastBlockHeight = blockHeight;
      lastBlockTime = blockTime;

      // 预连接优化：保持连接活跃
      if (latency > 2000) { // 延迟超过2秒时
        console.log('网络延迟较高，尝试预连接...');
        provider.getNetwork().catch(() => {}); // 静默预连接
      }

    } else {
      updateNetworkDisplay('-', '-', '❌ 获取失败');
    }

  } catch (error) {
    console.error('网络状态更新失败:', error);
    updateNetworkDisplay('-', '-', '❌ 连接错误');
  }
}

// 更新网络显示
function updateNetworkDisplay(blockHeight, latency, status) {
  const blockHeightEl = document.getElementById('blockHeightDisplay');
  const latencyEl = document.getElementById('networkLatencyDisplay');
  const statusEl = document.getElementById('connectionStatusDisplay');

  if (blockHeightEl) blockHeightEl.textContent = blockHeight;
  if (latencyEl) latencyEl.textContent = latency;
  if (statusEl) statusEl.textContent = status;
}

// 停止网络监控
function stopNetworkMonitoring() {
  if (typeof stopTimer === 'function') {
    stopTimer('network-monitor');
  }
}

// 页面卸载时清理监控
window.addEventListener('beforeunload', () => {
  stopNetworkMonitoring();
}); 

// 挂载网络监控相关函数到window
window.startNetworkMonitoring = startNetworkMonitoring;
window.stopNetworkMonitoring = stopNetworkMonitoring; 