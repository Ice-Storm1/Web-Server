const TICKETS_KEY = 'clienti_itpro_tickets';
const CLIENTS_KEY = 'clienti_itpro_clients';
const ADMIN_KEY = 'clienti_itpro_admin';
const LOG_KEY = 'clienti_itpro_log';

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

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('clienti_itpro_user') || '{}');
}

function isAdmin() {
  const user = getCurrentUser();
  return user.isAdmin === true || user.isAdmin === 'true';
}

function createAdminUser() {
  const username = document.getElementById('newAdminUsername').value.trim();
  const password = document.getElementById('newAdminPassword').value;
  
  if (!username || !password) {
    showToast('Compila tutti i campi obbligatori', 'error');
    return;
  }
  
  const admins = window.getAdmins();
  if (admins.find(a => a.username === username)) {
    showToast('Username già esistente', 'error');
    return;
  }
  
  admins.push({ username, password });
  window.saveAdmins(admins);
  
  document.getElementById('newAdminUsername').value = '';
  document.getElementById('newAdminPassword').value = '';
  
  log('Nuovo admin creato: ' + username);
  showToast('Admin creato con successo', 'success');
  renderAdminList();
}

function checkAuth() {
  const user = localStorage.getItem('clienti_itpro_user');
  if (!user) {
    window.location.href = 'index.html';
    return false;
  }
  const userData = JSON.parse(user);
  if (userData.isAdmin !== true && userData.isAdmin !== 'true') {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

if (!checkAuth()) {
  throw new Error('Not authenticated');
}

function getTickets() {
  return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
}

function getClients() {
  return JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function getSettings() {
  return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
}

function applyTheme() {
  const settings = getSettings();
  const theme = settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

function log(action) {
  const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  logs.unshift({ time: new Date().toLocaleString('it-IT'), action });
  localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 50)));
  renderLog();
}

function renderLog() {
  const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  const container = document.getElementById('activityLog');
  
  if (logs.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted);">Nessuna attività registrata</p>';
    return;
  }
  
  container.innerHTML = logs.map(l => `
    <div class="log-item">
      <span class="log-time">${l.time}</span>
      ${l.action}
    </div>
  `).join('');
}

function getNextTicketId() {
  const tickets = getTickets();
  if (tickets.length === 0) return '1001';
  const numericIds = tickets.map(t => parseInt(t.id)).filter(n => !isNaN(n));
  if (numericIds.length === 0) return '1001';
  const maxId = Math.max(...numericIds);
  return String(Math.max(maxId + 1, 1001));
}

function generateTestClients() {
  let tickets = getTickets();
  const names = ['Marco', 'Laura', 'Giuseppe', 'Francesca', 'Andrea', 'Sofia', 'Luca', 'Giulia'];
  const companies = ['TechCorp', 'DigitalPro', 'InfoSystem', 'WebLab', 'CloudTech'];
  const services = ['Assistenza Tecnica', 'Sviluppo Web', 'Cloud Infrastructure', 'Cybersecurity', 'Database'];
  const statuses = ['open', 'open', 'in_progress', 'pending', 'closed'];
  const priorities = ['low', 'medium', 'medium', 'high', 'urgent'];
  
  const existingIds = new Set(tickets.map(t => t.id));
  
  for (let i = 0; i < 5; i++) {
    let newId;
    do {
      newId = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    } while (existingIds.has(newId));
    existingIds.add(newId);
    
    const name = names[Math.floor(Math.random() * names.length)];
    tickets.push({
      id: newId,
      client: name + ' ' + String.fromCharCode(65 + i),
      company: companies[Math.floor(Math.random() * companies.length)],
      phone: '+39 3' + Math.floor(Math.random() * 100000000),
      service: services[Math.floor(Math.random() * services.length)],
      description: 'Problema di test generato automaticamente.',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      notes: '',
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  localStorage.setItem('stats_needs_refresh', Date.now().toString());
  log('Generati 5 ticket test');
  updateStats();
  showToast('Generati 5 ticket test', 'success');
}

async function clearAllClients() {
  const confirmed = await customConfirm('Elimina Ticket', 'Eliminare tutti i ticket?');
  if (!confirmed) return;
  localStorage.removeItem(TICKETS_KEY);
  log('Tutti i ticket sono stati eliminati');
  updateStats();
  showToast('Tutti i ticket sono stati eliminati', 'success');
}

function exportData() {
  try {
    const data = {
      tickets: getTickets(),
      clients: getClients(),
      users: getUsers(),
      settings: JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'),
      admin: JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clienti_backup_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    log('Esportazione dati eseguita');
    showToast('Dati esportati con successo', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Errore durante esportazione', 'error');
  }
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.tickets) {
        localStorage.setItem(TICKETS_KEY, JSON.stringify(data.tickets));
        localStorage.setItem('stats_needs_refresh', Date.now().toString());
      }
      if (data.clients) localStorage.setItem(CLIENTS_KEY, JSON.stringify(data.clients));
      if (data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
      if (data.settings) localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      if (data.admin) localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
      log('Importazione dati eseguita');
      updateStats();
      showToast('Importazione completata', 'success');
    } catch (err) {
      showToast('Errore: file non valido', 'error');
    }
  };
  reader.readAsText(file);
}

function saveAdmin() {
  const nameEl = document.getElementById('adminName');
  const pwdEl = document.getElementById('adminPassword');
  
  const newName = nameEl ? nameEl.value : '';
  const newPwd = pwdEl ? pwdEl.value : '';

  const currentUser = getCurrentUser();
  if (newName) currentUser.name = newName;
  localStorage.setItem('clienti_itpro_user', JSON.stringify(currentUser));
  
  // Also update the admin in ADMINS_KEY
  const admins = window.getAdmins();
  const idx = admins.findIndex(a => a.username === currentUser.username);
  if (idx > -1) {
    if (newName) admins[idx].name = newName;
    if (newPwd) admins[idx].password = newPwd;
    window.saveAdmins(admins);
  }
  
  log('Profilo admin aggiornato');
  updateUserInfo();
  renderAdminList();
  if (pwdEl) pwdEl.value = '';
  showToast('Profilo aggiornato', 'success');
}

function logout() {
  localStorage.removeItem('clienti_itpro_user');
  window.location.href = 'index.html';
}

async function deleteAccount() {
  const confirmed = await customConfirm('Elimina Account', 'Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.');
  if (!confirmed) return;
  const user = getCurrentUser();
  const users = getUsers();
  const updatedUsers = users.filter(u => u.username !== user.username);
  localStorage.setItem('clienti_itpro_users', JSON.stringify(updatedUsers));
  localStorage.removeItem('clienti_itpro_user');
  showToast('Account eliminato con successo.', 'success');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

function clearLog() {
  localStorage.removeItem(LOG_KEY);
  renderLog();
  showToast('Log cancellato', 'success');
}

async function deleteAllUsers() {
  const confirmed = await customConfirm('Elimina Utenti', 'Eliminare tutti gli utenti registrati?');
  if (!confirmed) return;
  localStorage.setItem(USERS_KEY, '[]');
  showToast('Tutti gli utenti sono stati eliminati', 'success');
  updateStats();
}

async function resetAll() {
  const confirmed = await customConfirm('Reset Completo', 'Eliminerà tutti i dati. Vuoi continuare?');
  if (!confirmed) return;
  const confirmed2 = await customConfirm('Conferma Definitiva', 'I dati non potranno essere recuperati. Confermi?');
  if (!confirmed2) return;
  localStorage.clear();
  log('Reset completo eseguito');
  location.reload();
}

async function clearDatabase() {
  const confirmed = await customConfirm('Cancella Database', 'Eliminera tutti i ticket, clienti e utenti. Procedere?');
  if (!confirmed) return;
  const confirmed2 = await customConfirm('Conferma Cancellazione', 'Confermi la cancellazione definitiva?');
  if (!confirmed2) return;
  localStorage.removeItem('clienti_itpro_tickets');
  localStorage.removeItem('clienti_itpro_clients');
  localStorage.removeItem('clienti_itpro_users');
  localStorage.removeItem('clienti_itpro_chat');
  localStorage.removeItem('stats_needs_refresh');
  
  showToast('Database cancellato', 'success');
  log('Database cancellato');
  updateStats();
}

function updateStats() {
  const tickets = getTickets();
  const users = getUsers();
  document.getElementById('statTotal').textContent = tickets.length;
  document.getElementById('statUsers').textContent = users.length;
  renderUsersList();
}

function renderUsersList() {
  const users = getUsers();
  const tbody = document.getElementById('usersListBody');
  if (!tbody) return;
  
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">Nessun utente registrato</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${u.name}</td>
      <td>@${u.username}</td>
      <td><button class="action-btn" onclick="openClientDetails('${u.username}')" title="Visualizza">👁️</button></td>
    </tr>
  `).join('');
}

// Admin Management: List, Edit, Delete
function renderAdminList() {
  const admins = window.getAdmins();
  const currentUser = getCurrentUser();
  const tbody = document.getElementById('adminListBody');
  if (!tbody) return;
  
  if (admins.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color: var(--text-muted);">Nessun admin</td></tr>';
    return;
  }
  
  tbody.innerHTML = admins.map(admin => {
    const isMe = admin.username === currentUser.username;
    return `
    <tr>
      <td>${admin.username}${isMe ? ' <span style="color: var(--accent); font-size: 11px;">(tu)</span>' : ''}</td>
      <td>
        <button class="action-btn" onclick="editAdmin('${admin.username}')" title="Modifica">✏️</button>
        ${!isMe ? `<button class="action-btn" onclick="deleteAdmin('${admin.username}')" title="Elimina">🗑️</button>` : ''}
      </td>
    </tr>
  `;
  }).join('');
}

function editAdmin(username) {
  const admins = window.getAdmins();
  const admin = admins.find(a => a.username === username);
  if (!admin) return;
  
  document.getElementById('editAdminUsername').value = admin.username;
  document.getElementById('editAdminPassword').value = '';
  document.getElementById('editAdminModal').style.display = 'flex';
}

function closeEditAdmin() {
  document.getElementById('editAdminModal').style.display = 'none';
}

function saveEditAdmin() {
  const username = document.getElementById('editAdminUsername').value;
  const password = document.getElementById('editAdminPassword').value;
  
  const admins = window.getAdmins();
  const idx = admins.findIndex(a => a.username === username);
  if (idx === -1) return;
  
  if (password) admins[idx].password = password;
  window.saveAdmins(admins);
  
  closeEditAdmin();
  log('Admin modificato: ' + username);
  showToast('Admin aggiornato', 'success');
  renderAdminList();
}

async function deleteAdmin(username) {
  const currentUser = getCurrentUser();
  if (username === currentUser.username) {
    showToast('Non puoi eliminare te stesso', 'error');
    return;
  }
  
  if (!await customConfirm('Elimina Admin', 'Eliminare l\'admin "' + username + '"?')) return;
  
  const admins = window.getAdmins().filter(a => a.username !== username);
  window.saveAdmins(admins);
  log('Admin eliminato: ' + username);
  showToast('Admin eliminato', 'success');
  renderAdminList();
}

document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  renderLog();
  updateStats();
  renderAdminList();
  updateUserInfo();
  
  const user = getCurrentUser();
  const admins = window.getAdmins();
  const admin = admins.find(a => a.username === user.username) || {};
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl && admin.name) {
    adminNameEl.value = admin.name;
  }
});

function updateUserInfo() {
  const userStr = localStorage.getItem('clienti_itpro_user');
  const user = userStr ? JSON.parse(userStr) : {};
  
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
  document.querySelectorAll('.user-role').forEach(el => el.textContent = 'Admin');
  
  const adminPanel = document.getElementById('adminPanelLink');
  if (adminPanel) adminPanel.style.display = isAdmin() ? 'flex' : 'none';
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
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  
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
  const admins = window.getAdmins();
  const admin = admins.find(a => a.username === user.username);
  if (!admin || admin.password !== oldPw) { showToast('Password attuale errata', 'error'); return; }
  admin.password = newPw;
  window.saveAdmins(admins);
  document.getElementById('settingOldPassword').value = '';
  document.getElementById('settingNewPassword').value = '';
  showToast('Password aggiornata', 'success');
}

function openClientDetails(username) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return;
  
  const tickets = getTickets();
  const userTickets = tickets.filter(t => t.client === user.name);
  const openTickets = userTickets.filter(t => t.status === 'open' || t.status === 'waiting').length;
  const closedTickets = userTickets.filter(t => t.status === 'closed').length;
  const inProgressTickets = userTickets.filter(t => t.status === 'in_progress').length;
  
  const lastVisit = localStorage.getItem(`last_visit_${username}`) || 'Mai';
  const createdAt = user.createdAt || 'Non disponibile';
  
  const content = document.getElementById('clientDetailsContent');
  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <div class="user-avatar" style="width: 60px; height: 60px; font-size: 24px; margin: 0 auto 10px;">${user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}</div>
      <h3 style="margin: 0;">${user.name}</h3>
      <p style="color: var(--text-muted); margin: 5px 0;">@${user.username}</p>
    </div>
    <div style="display: grid; gap: 12px;">
      <div style="padding: 12px; background: var(--surface); border-radius: 8px;">
        <label style="font-size: 11px; color: var(--text-muted);">Data Registrazione</label>
        <div style="font-weight: 500;">${createdAt !== 'Non disponibile' ? new Date(createdAt).toLocaleDateString('it-IT') : createdAt}</div>
      </div>
      <div style="padding: 12px; background: var(--surface); border-radius: 8px;">
        <label style="font-size: 11px; color: var(--text-muted);">Ultimo Accesso</label>
        <div style="font-weight: 500;">${lastVisit !== 'Mai' ? new Date(lastVisit).toLocaleDateString('it-IT') + ' ' + new Date(lastVisit).toLocaleTimeString('it-IT') : lastVisit}</div>
      </div>
      <div style="padding: 12px; background: var(--surface); border-radius: 8px;">
        <label style="font-size: 11px; color: var(--text-muted);">Ticket Aperti</label>
        <div style="font-weight: 500; color: var(--accent);">${openTickets}</div>
      </div>
      <div style="padding: 12px; background: var(--surface); border-radius: 8px;">
        <label style="font-size: 11px; color: var(--text-muted);">Ticket Chiusi</label>
        <div style="font-weight: 500; color: var(--success);">${closedTickets}</div>
      </div>
      <div style="padding: 12px; background: var(--surface); border-radius: 8px;">
        <label style="font-size: 11px; color: var(--text-muted);">Ticket In Lavorazione</label>
        <div style="font-weight: 500; color: var(--warning);">${inProgressTickets}</div>
      </div>
    </div>
  `;
  
  document.getElementById('clientDetailsModal').style.display = 'flex';
}

function closeClientDetails() {
  document.getElementById('clientDetailsModal').style.display = 'none';
}

document.getElementById('logoIcon')?.addEventListener('click', function() {
  this.style.transform = 'rotate(180deg)';
  setTimeout(() => { this.style.transform = ''; }, 500);
});
document.getElementById('closeSettings')?.addEventListener('click', closeSettings);
document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);

document.querySelectorAll('#clientDetailsModal .modal-close').forEach(btn => {
  btn.addEventListener('click', closeClientDetails);
});

function exportDatabase() {
  try {
    const admins = window.getAdmins();
    const users = JSON.parse(localStorage.getItem('clienti_itpro_users') || '[]');
    const tickets = JSON.parse(localStorage.getItem('clienti_itpro_tickets') || '[]');
    
    const adminJson = JSON.stringify({ admins }, null, 2);
    const userJson = JSON.stringify({ users }, null, 2);
    
    const blob1 = new Blob([adminJson], { type: 'application/json' });
    const blob2 = new Blob([userJson], { type: 'application/json' });
    
    const a1 = document.createElement('a');
    a1.href = URL.createObjectURL(blob1);
    a1.download = 'database_admin.json';
    a1.click();
    URL.revokeObjectURL(a1.href);
    
    const a2 = document.createElement('a');
    a2.href = URL.createObjectURL(blob2);
    a2.download = 'database_user.json';
    a2.click();
    URL.revokeObjectURL(a2.href);
    
    showToast('Database esportato!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showToast('Errore durante esportazione', 'error');
  }
}

window.resetAll = resetAll;
window.clearDatabase = clearDatabase;
window.deleteAllUsers = deleteAllUsers;
window.clearAllClients = clearAllClients;
window.generateTestClients = generateTestClients;
window.exportDatabase = exportDatabase;
