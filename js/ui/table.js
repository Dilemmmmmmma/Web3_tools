// 表格与统计渲染（从 main.js 抽离）

(function() {
  let currentOperationType = window.currentOperationType || '';

  function resetTable() {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');
    if (tableHeader) tableHeader.innerHTML = '';
    if (tableBody) tableBody.innerHTML = '';
  }

  function resetSummary() {
    const summary = document.getElementById('summaryInfo');
    if (summary) summary.style.display = 'none';
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = String(v); };
    set('totalCount', '0'); set('successCount', '0'); set('failedCount', '0');
  }

  function setupTableHeader(operationType) {
    currentOperationType = operationType;
    window.currentOperationType = operationType;
    const tableHeader = document.getElementById('tableHeader');
    if (!tableHeader) return;
    let headerHTML = '';
    switch(operationType) {
      case 'distribute':
        headerHTML = `
          <tr>
            <th>时间</th><th>地址</th><th>代币</th><th>数量</th><th>状态</th><th>哈希</th>
          </tr>`; break;
      case 'collect':
        headerHTML = `
          <tr>
            <th>时间</th><th>源地址</th><th>目标地址</th><th>代币</th><th>数量</th><th>状态</th><th>哈希</th>
          </tr>`; break;
      case 'query':
        headerHTML = `
          <tr>
            <th>时间</th><th>地址</th><th>代币</th><th>余额</th><th>状态</th>
          </tr>`; break;
      case 'inputdata':
        headerHTML = `
          <tr>
            <th>时间</th><th>源地址</th><th>目标地址</th><th>数值</th><th>状态</th><th>哈希</th>
          </tr>`; break;
      case 'contract':
        headerHTML = `
          <tr>
            <th>时间</th><th>合约地址</th><th>方法名</th><th>参数</th><th>状态</th><th>哈希</th>
          </tr>`; break;
      case 'okxDexBatch':
        headerHTML = `
          <tr>
            <th>时间</th><th>钱包地址</th><th>状态</th><th>说明</th><th>交易哈希</th>
          </tr>`; break;
    }
    tableHeader.innerHTML = headerHTML;
  }

  function getStatusText(status) {
    switch(status) {
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'processing': return '处理中';
      case 'skipped': return '跳过';
      default: return '未知';
    }
  }

  function addTableRow(data) {
    const tableBody = document.getElementById('tableBody');
    if (!tableBody) return;
    const row = document.createElement('tr');
    row.id = `row-${data.id || Date.now()}`;
    const currentTime = new Date().toLocaleTimeString();
    let cellsHTML = '';
    const shortenHash = window.shortenHash || (x => x);
    const getBlockExplorerUrl = window.getBlockExplorerUrl || (_ => '#');
    const esc = (v) => (window.escapeHtml ? window.escapeHtml(v) : String(v ?? ''));

    switch(currentOperationType) {
      case 'distribute':
        cellsHTML = `
          <td>${currentTime}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.address)}</td>
          <td>${esc(data.token || '原生代币')}</td>
          <td>${esc(String(data.amount))}</td>
          <td><span class="status-${esc(data.status)}">${esc(getStatusText(data.status))}</span></td>
          <td>${data.hash ? `<a href="${getBlockExplorerUrl(data.hash)}" target="_blank" class="hash-link">${shortenHash(data.hash)}</a>` : '-'}</td>
        `; break;
      case 'collect':
        cellsHTML = `
          <td>${currentTime}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.fromAddress)}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.toAddress)}</td>
          <td>${esc(data.token || '原生代币')}</td>
          <td>${esc(String(data.amount))}</td>
          <td><span class="status-${esc(data.status)}">${esc(getStatusText(data.status))}</span></td>
          <td>${data.hash ? `<a href="${getBlockExplorerUrl(data.hash)}" target="_blank" class="hash-link">${shortenHash(data.hash)}</a>` : '-'}</td>
        `; break;
      case 'query':
        cellsHTML = `
          <td>${currentTime}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.address)}</td>
          <td>${esc(data.token || '原生代币')}</td>
          <td>${esc(String(data.balance))}</td>
          <td><span class="status-${esc(data.status)}">${esc(getStatusText(data.status))}</span></td>
        `; break;
      case 'inputdata':
        cellsHTML = `
          <td>${currentTime}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.fromAddress)}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.toAddress)}</td>
          <td>${esc(String(data.value))}</td>
          <td><span class="status-${esc(data.status)}">${esc(getStatusText(data.status))}</span></td>
          <td>${data.hash ? `<a href="${getBlockExplorerUrl(data.hash)}" target="_blank" class="hash-link">${shortenHash(data.hash)}</a>` : '-'}</td>
        `; break;
      case 'contract':
        cellsHTML = `
          <td>${currentTime}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.contractAddress)}</td>
          <td>${esc(data.methodName)}</td>
          <td>${esc(data.params || '-')}</td>
          <td><span class="status-${esc(data.status)}">${esc(getStatusText(data.status))}</span></td>
          <td>${data.hash ? `<a href="${getBlockExplorerUrl(data.hash)}" target="_blank" class="hash-link">${shortenHash(data.hash)}</a>` : '-'}</td>
        `; break;
      case 'okxDexBatch':
        cellsHTML = `
          <td>${currentTime}</td>
          <td class="address-text" style="font-family: monospace; font-size: 12px; word-break: break-all;">${esc(data.wallet)}</td>
          <td><span class="status-${esc(data.status)}">${esc(getStatusText(data.status))}</span></td>
          <td>${esc(data.reason || '-')}</td>
          <td>${data.hash ? `<a href="${getBlockExplorerUrl(data.hash)}" target="_blank" class="hash-link">${shortenHash(data.hash)}</a>` : '-'}</td>
        `; break;
    }

    row.innerHTML = cellsHTML;
    tableBody.appendChild(row);

    if (data.status === 'failed') {
      window.failedOperations = window.failedOperations || [];
      window.failedOperations.push(data);
      const retryBtn = document.getElementById('retryFailedBtn');
      if (retryBtn) retryBtn.style.display = 'inline-block';
    }

    updateSummary();
  }

  function updateTableRow(rowId, data) {
    const row = document.getElementById(`row-${rowId}`);
    if (!row) return;
    window.failedOperations = (window.failedOperations || []).filter(op => op.id !== rowId);
    const statusCell = row.querySelector('.status-success, .status-failed, .status-processing');
    if (statusCell) {
      statusCell.className = `status-${data.status}`;
      statusCell.textContent = getStatusText(data.status);
    }
    if (data.hash) {
      const hashCell = row.cells[row.cells.length - 1];
      if (hashCell) hashCell.innerHTML = `<a href="${getBlockExplorerUrl(data.hash)}" target="_blank" class="hash-link">${shortenHash(data.hash)}</a>`;
    }
    if (data.balance !== undefined) {
      const balanceCell = row.cells[3];
      if (balanceCell) balanceCell.textContent = String(data.balance);
    }
    if (data.amount !== undefined) {
      const amountCell = row.cells[4];
      if (amountCell) amountCell.textContent = String(data.amount);
    }
    if (data.status === 'failed') {
      window.failedOperations.push({ ...data, id: rowId });
      const actionCell = row.cells[row.cells.length - 1];
      if (actionCell && data.privateKey) {
        actionCell.innerHTML = `${actionCell.innerHTML} <button class="btn btn-secondary btn-sm" onclick="retrySingleOperation('${rowId}')">重试</button>`;
      }
      const retryBtn = document.getElementById('retryFailedBtn');
      if (retryBtn) retryBtn.style.display = 'inline-block';
    }
    updateSummary();
  }

  function updateSummary() {
    const tbody = document.getElementById('tableBody');
    const summary = document.getElementById('summaryInfo');
    if (!tbody || !summary) return;

    const rows = Array.from(tbody.querySelectorAll('tr'));
    const total = rows.length;
    let success = 0, failed = 0;
    rows.forEach(tr => {
      const statusEl = tr.querySelector('.status-success, .status-failed, .status-processing');
      if (!statusEl) return;
      if (statusEl.classList.contains('status-success')) success++;
      else if (statusEl.classList.contains('status-failed')) failed++;
    });

    document.getElementById('totalCount').textContent = String(total);
    document.getElementById('successCount').textContent = String(success);
    document.getElementById('failedCount').textContent = String(failed);

    summary.style.display = total > 0 ? 'block' : 'none';

    // 余额筛选UI显示切换
    const balanceFilter = document.getElementById('balanceFilter');
    if (balanceFilter) balanceFilter.style.display = (window.currentOperationType === 'query') ? 'flex' : 'none';

    // 重试按钮显示
    const retryBtn = document.getElementById('retryFailedBtn');
    if (retryBtn) retryBtn.style.display = failed > 0 ? 'inline-block' : 'none';
  }

  function applyBalanceFilter() {
    const filterType = document.getElementById('filterType').value;
    const filterValue = parseFloat(document.getElementById('filterValue').value);
    if (isNaN(filterValue)) {
      if (window.notifyError) window.notifyError('请输入有效的数值'); else alert('请输入有效的数值');
      return;
    }
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.getElementsByTagName('tr');
    let visibleCount = 0;
    for (let row of rows) {
      const balanceCell = row.cells[3];
      if (balanceCell) {
        const balanceText = balanceCell.textContent.replace(/,/g, '');
        const balance = parseFloat(balanceText);
        let show = false;
        if (!isNaN(balance)) {
          switch (filterType) {
            case 'gt': show = balance > filterValue; break;
            case 'lt': show = balance < filterValue; break;
            case 'eq': show = Math.abs(balance - filterValue) < 1e-6; break;
          }
        }
        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      }
    }
    if (window.setProgressText) window.setProgressText(`筛选结果: 显示 ${visibleCount} 条记录`);
  }

  function clearBalanceFilter() {
    const tableBody = document.getElementById('tableBody');
    const rows = tableBody.getElementsByTagName('tr');
    for (let row of rows) row.style.display = '';
    const input = document.getElementById('filterValue');
    if (input) input.value = '';
    if (window.setProgressText) window.setProgressText('准备中...');
  }

  // 对外挂载（与 main.js 保持一致 API）
  window.resetTable = resetTable;
  window.resetSummary = resetSummary;
  window.setupTableHeader = setupTableHeader;
  window.addTableRow = addTableRow;
  window.updateTableRow = updateTableRow;
  window.updateSummary = updateSummary;
  window.applyBalanceFilter = applyBalanceFilter;
  window.clearBalanceFilter = clearBalanceFilter;
})(); 