const CLIENTS_KEY = 'clienti_itpro_clients';

function customConfirm(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'flex';
    
    const handleOk = () => { cleanup(); resolve(true); };
    const handleCancel = () => { cleanup(); resolve(false); };
    const cleanup = () => {
      modal.style.display = 'none';
      document.getElementById('confirmOk').removeEventListener('click', handleOk);
      document.getElementById('confirmCancel').removeEventListener('click', handleCancel);
    };
    
    document.getElementById('confirmOk').addEventListener('click', handleOk);
    document.getElementById('confirmCancel').addEventListener('click', handleCancel);
  });
}

const ERROR_TYPES = {
  'Hardware': ['Computer non si accende', 'Schermo nero', 'Hard disk pieno', 'Problemi USB', 'Problemi tastiera', 'Problemi mouse', 'Problemi stampante', 'Altro'],
  'Software': ['Programma non si apre', 'Errore applicazione', 'Aggiornamento fallito', 'Licenza scaduta', 'Crash sistema', 'Virus/malware', 'Applicazione lenta', 'Altro'],
  'Rete': ['Nessuna connessione', 'WiFi non funziona', 'Connessione lenta', 'VPN problema', 'Server non raggiungibile', 'DNS errore', 'Porta bloccata', 'Altro'],
  'Sicurezza': ['Account compromesso', 'Password dimenticata', '2FA problema', 'Sospetto malware', 'Phishing', 'Accesso non autorizzato', 'Certificato scaduto', 'Altro'],
  'Email': ['Email non inviata', 'Email non ricevuta', 'Problema Outlook', 'Spam', 'Casella piena', 'Alias problema', 'Sincronizzazione', 'Altro'],
  'Account': ['Password reset', 'Profilo bloccato', 'Permessi insufficienti', 'Login fallito', 'Account disattivato', 'Multi-factor issue', 'Directory error', 'Altro'],
  'Stampa': ['Stampante offline', 'Stampa non parte', 'Coda bloccata', 'Qualità scadente', 'Inceppamento', 'Driver mancante', 'Network printer', 'Altro'],
  'Altro': ['Altro problema']
};

function updateErrorTypes() {
  const category = document.getElementById('clientCategory').value;
  const errorTypeGroup = document.getElementById('errorTypeGroup');
  const errorTypeSelect = document.getElementById('clientErrorType');
  
  if (!category) {
    errorTypeGroup.style.display = 'none';
    return;
  }
  
  errorTypeGroup.style.display = 'block';
  errorTypeSelect.innerHTML = '<option value="">Seleziona...</option>';
  
  const errors = ERROR_TYPES[category] || [];
  errors.forEach(err => {
    const option = document.createElement('option');
    option.value = err;
    option.textContent = err;
    errorTypeSelect.appendChild(option);
  });
}

function checkAuth() {
  const user = localStorage.getItem('clienti_itpro_user');
  if (!user) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

if (!checkAuth()) {
  // Will redirect
}

function getClients() {
  return JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function saveClients(clients) {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getSettings() {
  return JSON.parse(localStorage.getItem('clienti_itpro_settings') || '{}');
}

function applyTheme() {
  const settings = getSettings();
  const theme = settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('clienti_itpro_user') || '{}');
}

function isAdmin() {
  const user = getCurrentUser();
  return user.isAdmin === true || user.isAdmin === 'true';
}

function updateUserInfo() {
  const userStr = localStorage.getItem('clienti_itpro_user');
  const user = userStr ? JSON.parse(userStr) : {};
  const settings = getSettings();

  const name = user.name || "Utente";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  document
    .querySelectorAll(".user-avatar")
    .forEach((el) => (el.textContent = initials));
  
  const userNameEl = document.getElementById('userNameDisplay');
  if (userNameEl) {
    userNameEl.textContent = name;
  }
  document
    .querySelectorAll(".user-name")
    .forEach((el) => (el.textContent = name));
  
  const isUserAdmin = (user.isAdmin === true || user.isAdmin === 'true');
  document
    .querySelectorAll(".user-role")
    .forEach((el) => (el.textContent = isUserAdmin ? "Admin" : "Utente"));

  const adminPanel = document.getElementById("adminPanelLink");
  if (adminPanel) {
    adminPanel.style.display = isUserAdmin ? "flex" : "none";
  }
}

function renderClients() {
  const clients = getClients();
  const users = getUsers();
  const admins = window.getAdmins();
  const admin = isAdmin();
  
  const adminRows = admins.map(a => ({
    id: 'admin-' + a.username,
    name: a.username,
    category: 'Admin',
    status: 'admin',
    isUser: true,
    isAdminUser: true,
    createdAt: a.createdAt
  }));
  
  const userRows = users.map(user => ({
    id: 'user-' + user.username,
    name: user.name || user.username,
    category: user.category || '-',
    status: 'active',
    isUser: true,
    isAdminUser: false,
    createdAt: user.createdAt
  }));
  
  const clientRows = clients.map(c => ({...c, isUser: false, isAdminUser: false}));
  
  const allItems = [...adminRows, ...userRows, ...clientRows].sort((a, b) => {
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  
  const tbody = document.getElementById('clientsTableBody');
  
  if (allItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" class="empty-state">Nessun cliente.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = allItems.map(item => {
    const actions = admin ? `
      ${item.isUser && !item.isAdminUser ? `<button class="action-btn" onclick="deleteUser('${item.id.replace('user-', '')}')" title="Elimina Utente">🗑️</button>` : ''}
      ${item.isAdminUser ? `<button class="action-btn" onclick="deleteAdmin('${item.id.replace('admin-', '')}')" title="Elimina Admin">🗑️</button>` : ''}
      ${!item.isUser ? `<button class="action-btn" onclick="editClient('${item.id}')" title="Modifica">✎</button>` : ''}
      ${!item.isUser ? `<button class="action-btn" onclick="deleteClient('${item.id}')" title="Elimina">🗑️</button>` : ''}
    ` : '';
    
    const roleBadge = '';
    const statusLabel = item.status === 'admin' ? 'Admin' : item.status === 'active' ? 'Utente' : item.status === 'pending' ? 'In Attesa' : 'Inattivo';
    
    return `
    <tr>
      <td>
        <div class="client-info">
          <div class="client-avatar">${getInitials(item.name)}</div>
          <div class="client-name">${item.name}</div>
        </div>
      </td>
      <td><span class="status-badge ${item.status === 'admin' ? 'admin' : item.status}">${statusLabel}</span></td>
      <td>${actions}</td>
    </tr>
  `}).join('');
}

function openModal(editId = null) {
  if (!isAdmin()) return;
  
  const modal = document.getElementById('clientModal');
  const form = document.getElementById('clientForm');
  const title = document.getElementById('modalTitle');
  
  form.reset();
  
  if (editId) {
    const clients = getClients();
    const client = clients.find(c => c.id === editId);
    if (client) {
      title.textContent = 'Modifica Cliente';
      document.getElementById('clientName').value = client.name;
      document.getElementById('clientCompany').value = client.company || '';
      document.getElementById('clientEmail').value = client.email;
      document.getElementById('clientPhone').value = client.phone || '';
      document.getElementById('clientService').value = client.service || '';
      document.getElementById('clientNotes').value = client.notes || '';
      document.getElementById('clientStatus').value = client.status;
      form.dataset.editId = editId;
    }
  } else {
    title.textContent = 'Nuovo Cliente';
    delete form.dataset.editId;
  }
  
  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('clientModal').style.display = 'none';
}

function saveClient(e) {
  e.preventDefault();
  if (!isAdmin()) return;
  
  const client = {
    name: document.getElementById('clientName').value,
    company: document.getElementById('clientCompany').value,
    email: document.getElementById('clientEmail').value,
    phone: document.getElementById('clientPhone').value,
    job: document.getElementById('clientJob').value,
    category: document.getElementById('clientCategory').value,
    errorType: document.getElementById('clientErrorType').value,
    problem: document.getElementById('clientProblem').value,
    status: document.getElementById('clientStatus').value
  };
  
  let clients = getClients();
  const form = e.target;
  
  if (form.dataset.editId) {
    clients = clients.map(c => c.id === form.dataset.editId ? {...c, ...client, updatedAt: new Date().toISOString()} : c);
    showToast('Cliente modificato con successo', 'success');
  } else {
    client.id = Date.now().toString();
    client.createdAt = new Date().toISOString();
    clients.push(client);
    showToast('Cliente creato con successo', 'success');
  }
  
  saveClients(clients);
  closeModal();
  renderClients();
}

window.editClient = function(id) {
  if (!isAdmin()) return;
  openModal(id);
};

window.deleteClient = async function(id) {
  if (!isAdmin()) return;
  const confirmed = await customConfirm('Elimina Cliente', 'Sei sicuro di voler eliminare questo cliente?');
  if (!confirmed) return;
  let clients = getClients().filter(c => c.id !== id);
  saveClients(clients);
  renderClients();
  showToast('Cliente eliminato', 'success');
};

window.deleteUser = async function(username) {
  if (!isAdmin()) return;
  const confirmed = await customConfirm('Elimina Utente', 'Sei sicuro di voler eliminare questo utente?');
  if (!confirmed) return;
  let users = getUsers().filter(u => u.username !== username);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  renderClients();
  showToast('Utente eliminato', 'success');
};

window.deleteAdmin = async function(username) {
  if (!isAdmin()) return;
  const confirmed = await customConfirm('Elimina Admin', 'Sei sicuro di voler eliminare questo admin?');
  if (!confirmed) return;
  let admins = window.getAdmins().filter(a => a.username !== username);
  localStorage.setItem('clienti_itpro_admins', JSON.stringify(admins));
  renderClients();
  showToast('Admin eliminato', 'success');
};

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('addClientBtn')?.addEventListener('click', () => openModal());
  document.getElementById('closeModal')?.addEventListener('click', closeModal);
  document.getElementById('cancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('clientForm')?.addEventListener('submit', saveClient);
  document.getElementById('closeSettings')?.addEventListener('click', closeSettings);
  document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
});

function init() {
  updateUserInfo();
  applyTheme();
  renderClients();
  
  document.querySelectorAll('.has-submenu > .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      link.parentElement.classList.toggle('open');
    });
  });
  
  document.getElementById('logoIcon')?.addEventListener('click', function() {
    this.style.transform = 'rotate(180deg)';
    setTimeout(() => { this.style.transform = ''; }, 500);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function logout() {
  localStorage.removeItem('clienti_itpro_user');
  window.location.href = 'index.html';
}

async function deleteAccount() {
  const confirmed = await customConfirm('Elimina Account', 'Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.');
  if (!confirmed) return;
  const user = getCurrentUser();
  if (user.isAdmin) {
    let admins = window.getAdmins().filter(a => a.username !== user.username);
    localStorage.setItem('clienti_itpro_admins', JSON.stringify(admins));
  } else {
    let users = getUsers().filter(u => u.username !== user.username);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  localStorage.removeItem('clienti_itpro_user');
  showToast('Account eliminato con successo.', 'success');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

function openSettings() {
  const settings = getSettings();
  document.getElementById('settingTheme').value = settings.theme || 'dark';
  document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settingsModal').style.display = 'none';
}

function saveSettings() {
  const settings = {
    theme: document.getElementById('settingTheme').value
  };
  localStorage.setItem('clienti_itpro_settings', JSON.stringify(settings));
  
  applyTheme();
  
  updateUserInfo();
  closeSettings();
  showToast('Impostazioni salvate', 'success');
}

function changePassword() {
  const oldPw = document.getElementById('settingOldPassword')?.value;
  const newPw = document.getElementById('settingNewPassword')?.value;
  if (!oldPw || !newPw) { showToast('Compila entrambi i campi password', 'error'); return; }
  if (newPw.length < 4) { showToast('La password deve avere almeno 4 caratteri', 'error'); return; }

  const user = getCurrentUser();
  if (user.isAdmin) {
    const admins = JSON.parse(localStorage.getItem('clienti_itpro_admins') || '[]');
    const admin = admins.find(a => a.username === user.username);
    if (!admin || admin.password !== oldPw) { showToast('Password attuale errata', 'error'); return; }
    admin.password = newPw;
    localStorage.setItem('clienti_itpro_admins', JSON.stringify(admins));
  } else {
    const users = JSON.parse(localStorage.getItem('clienti_itpro_users') || '[]');
    const u = users.find(x => x.username === user.username);
    if (!u || u.password !== oldPw) { showToast('Password attuale errata', 'error'); return; }
    u.password = newPw;
    localStorage.setItem('clienti_itpro_users', JSON.stringify(users));
  }
  document.getElementById('settingOldPassword').value = '';
  document.getElementById('settingNewPassword').value = '';
  showToast('Password aggiornata', 'success');
}

document.getElementById('logoIcon')?.addEventListener('click', function() {
  this.style.transform = 'rotate(180deg)';
  setTimeout(() => { this.style.transform = ''; }, 500);
});
document.getElementById('closeSettings')?.addEventListener('click', closeSettings);
document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
