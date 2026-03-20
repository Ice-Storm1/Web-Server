const ADMINS_KEY = 'clienti_itpro_admins';
const USERS_KEY = 'clienti_itpro_users';
const SETTINGS_KEY = 'clienti_itpro_settings';

const DEFAULT_ADMIN = {
  username: "Francesco",
  password: "K9mP#2xL$vN5qR!jH8cW@3tY"
};

function getDefaultAdmins() {
  return [DEFAULT_ADMIN];
}

function getStoredAdmins() {
  const defaultAdmins = getDefaultAdmins();
  localStorage.setItem(ADMINS_KEY, JSON.stringify(defaultAdmins));
  return defaultAdmins;
}

window.getAdmins = function() {
  return getStoredAdmins();
};

window.saveAdmins = function(admins) {
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
};

window.showToast = (function() {
  let lastMessage = '';
  let lastTime = 0;
  
  return function(message, type = 'success') {
    const now = Date.now();
    if (message === lastMessage && now - lastTime < 500) return;
    lastMessage = message;
    lastTime = now;
    
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✓', error: '✕', warning: '⚠' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close">×</button>
    `;
    container.appendChild(toast);
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    setTimeout(() => {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };
})();
