// 页面初始化与首次使用引导（从 main.js 抽离）
(function(){
  function safe(fn){ try { fn && fn(); } catch(e){ console.error(e); } }

  function initAutoSave(){
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.id && input.id.includes('modalNetwork')) return;
      input.addEventListener('input', () => { if (typeof window.saveFormData === 'function') window.saveFormData(); });
      input.addEventListener('change', () => { if (typeof window.saveFormData === 'function') window.saveFormData(); });
    });
    const passwordInput = document.getElementById('encryptionPassword');
    if (passwordInput && typeof window.loadEncryptedPrivateKeys === 'function') {
      const deb = (window.debounce || ((f, t)=>{ let h; return (...a)=>{ clearTimeout(h); h=setTimeout(()=>f(...a), t); }; }));
      passwordInput.addEventListener('input', deb(window.loadEncryptedPrivateKeys, 1000));
    }
  }

  function initFirstUseHints(){
    const hasConfigured = (window.Storage && window.Storage.load) ? window.Storage.load('has-configured', false) : false;
    const configTip = document.getElementById('configTip');
    if (!hasConfigured) {
      setTimeout(()=>{ if (configTip) configTip.style.display = 'block'; }, 1000);
      const configToggle = document.getElementById('configToggle');
      if (configToggle) setTimeout(()=> configToggle.classList.add('pulse'), 2000);
    }
  }

  function ensureDefaultNetwork(){
    const sel = document.getElementById('networkSelect');
    if (sel && !sel.value) {
      sel.value = 'bsc';
      if (typeof window.switchNetwork === 'function') window.switchNetwork();
    }
  }

  function initThreadModeToggle(){
    const threadModeCheckbox = document.getElementById('inputdataThreadMode');
    const threadConfig = document.getElementById('inputdataThreadConfig');
    if (threadModeCheckbox && threadConfig) {
      threadModeCheckbox.addEventListener('change', function(){
        threadConfig.style.display = this.checked ? 'block' : 'none';
      });
    }
  }

  function initNetworkMonitor(){
    if (typeof window.startNetworkMonitoring === 'function') window.startNetworkMonitoring();
  }

  function sanityChecks(){
    const contractModal = document.getElementById('contractModal');
    console[contractModal ? 'log' : 'error'](contractModal ? '✅ 合约模态框已找到' : '❌ 合约模态框未找到');
  }

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(()=>{
      safe(()=> typeof window.loadCustomNetworks === 'function' && window.loadCustomNetworks());
      safe(()=> typeof window.loadFormData === 'function' && window.loadFormData());
      ensureDefaultNetwork();
      setTimeout(()=>{ initAutoSave(); }, 200);
      initFirstUseHints();
      initNetworkMonitor();
      initThreadModeToggle();
      sanityChecks();
    }, 100);
  });
})(); 