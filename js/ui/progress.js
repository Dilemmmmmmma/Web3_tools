// 进度UI（从 main.js 抽离）
(function(){
  function showProgress(operationType = '执行操作') {
    const section = document.getElementById('progressSection');
    const logSection = document.getElementById('logSection');
    const logContent = document.getElementById('logContent');
    if (section) section.style.display = 'block';
    if (logSection) logSection.style.display = 'none';
    if (logContent) logContent.textContent = '';
    const title = document.getElementById('operationTitle');
    if (title) title.textContent = `📊 ${operationType}`;
    if (typeof window.resetTable === 'function') window.resetTable();
    if (typeof window.resetSummary === 'function') window.resetSummary();
    const retryBtn = document.getElementById('retryFailedBtn');
    if (retryBtn) retryBtn.style.display = 'none';
  }

  function hideProgress(){
    const section = document.getElementById('progressSection');
    if (section) section.style.display = 'none';
  }

  window.showProgress = showProgress;
  window.hideProgress = hideProgress;
})(); 