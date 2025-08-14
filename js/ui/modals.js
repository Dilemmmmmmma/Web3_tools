// 弹窗与视图切换（从 main.js 抽离）
(function() {
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  // 移除 Alpha 排行榜与价格通知相关 UI

  async function selectOperation(type) {
    switch (type) {
      case 'distribute':
        document.getElementById('distributeModal').style.display = 'block';
        break;
      case 'collect':
        document.getElementById('collectModal').style.display = 'block';
        break;
      case 'query':
        document.getElementById('queryModal').style.display = 'block';
        break;
      case 'inputdata':
        document.getElementById('inputdataModal').style.display = 'block';
        break;
      case 'contract':
        try {
          const modal = document.getElementById('contractModal');
          if (modal) {
            modal.style.display = 'block';
          } else {
            console.error('❌ 合约模态框元素未找到');
            if (window.notifyError) window.notifyError('合约模态框未找到，请刷新页面重试');
          }
        } catch (e) {
          console.error('❌ 打开合约模态框时出错:', e);
          if (window.notifyError) window.notifyError(e.message, '打开合约模态框时出错');
        }
        break;
      case 'evmGenerator':
        document.getElementById('evmGeneratorModal').style.display = 'block';
        if (!window.evmGeneratorInitialized && typeof window.initEvmGenerator === 'function') {
          window.evmGeneratorInitialized = true;
          window.initEvmGenerator();
        }
        break;
      case 'okxDex':
        document.getElementById('okxDexModal').style.display = 'block';
        if (!window.okxDexInitialized && typeof window.initOkxDex === 'function') {
          window.okxDexInitialized = true;
          window.initOkxDex();
        }
        break;
    }
  }

  // 点击遮罩关闭
  window.addEventListener('click', function(event) {
    if (event.target && event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  // 对外暴露
  window.selectOperation = selectOperation;
  window.closeModal = closeModal;
  // 已移除 Alpha 排行榜/价格通知函数导出
})(); 