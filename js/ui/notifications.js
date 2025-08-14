// 通知UI（从 main.js 抽离）
(function(){
  let notificationPermission = false;

  async function requestNotificationPermission(){
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      notificationPermission = permission === 'granted';
      return notificationPermission;
    }
    return false;
  }

  function showBrowserNotification(title, message){
    if (notificationPermission && 'Notification' in window) {
      new Notification(title, { body: message });
    } else if (window.notifyInfo) {
      window.notifyInfo(message, title);
    }
  }

  function showToastNotification(title, message, icon='💰'){
    // 复用 core.js 的 notify，并设置图标
    const toast = document.getElementById('notificationToast');
    if (toast) {
      const iconEl = toast.querySelector('.icon');
      if (iconEl) iconEl.textContent = icon;
    }
    if (window.notifyInfo) window.notifyInfo(message, title);
  }

  function closeNotification(){
    const toast = document.getElementById('notificationToast');
    if (toast) toast.classList.remove('show');
  }

  window.requestNotificationPermission = requestNotificationPermission;
  window.showBrowserNotification = showBrowserNotification;
  window.showToastNotification = showToastNotification;
  window.closeNotification = closeNotification;
})(); 