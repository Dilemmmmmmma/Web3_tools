// 归集弹窗UI（从 main.js 抽离）
(function(){
  function toggleCollectAmount() {
    const collectAll = document.getElementById('collectAllTokens');
    const amountInput = document.getElementById('collectAmountInput');
    const amountField = document.getElementById('modalCollectAmount');
    if (!collectAll || !amountInput || !amountField) return;
    if (collectAll.checked) {
      amountInput.style.display = 'none';
      amountField.value = '';
    } else {
      amountInput.style.display = 'block';
    }
  }

  function toggleMonitorMode() {
    const enableMonitor = document.getElementById('enableMonitorMode');
    const monitorConfig = document.getElementById('monitorModeConfig');
    if (!enableMonitor || !monitorConfig) return;
    monitorConfig.style.display = enableMonitor.checked ? 'block' : 'none';
  }

  window.toggleCollectAmount = toggleCollectAmount;
  window.toggleMonitorMode = toggleMonitorMode;
})(); 