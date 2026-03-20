const STORAGE_KEY = 'clienti_itpro_tickets';
const CHAT_KEY = 'clienti_itpro_chat';

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function checkAuth() {
  const user = localStorage.getItem('clienti_itpro_user');
  if (!user) { window.location.href = 'index.html'; return false; }
  return true;
}

if (!checkAuth()) throw new Error('Not authenticated');

// ─── Core Helpers ───
function getTickets() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveTickets(tickets) { localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets)); }
function getInitials(name) { return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2); }

function customConfirm(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    modal.style.display = 'flex';
    
    const handleOk = () => {
      cleanup();
      resolve(true);
    };
    const handleCancel = () => {
      cleanup();
      resolve(false);
    };
    const cleanup = () => {
      modal.style.display = 'none';
      document.getElementById('confirmOk').removeEventListener('click', handleOk);
      document.getElementById('confirmCancel').removeEventListener('click', handleCancel);
    };
    
    document.getElementById('confirmOk').addEventListener('click', handleOk);
    document.getElementById('confirmCancel').addEventListener('click', handleCancel);
  });
}
function getSettings() { return JSON.parse(localStorage.getItem('clienti_itpro_settings') || '{}'); }
function getCurrentUser() { return JSON.parse(localStorage.getItem('clienti_itpro_user') || '{}'); }
function isAdmin() { return getCurrentUser().isAdmin === true; }

function applyTheme() {
  const settings = getSettings();
  const theme = settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
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
  if (adminPanel) adminPanel.style.display = isUserAdmin ? "flex" : "none";

  const clientiLink = document.getElementById("clientiLink");
  if (clientiLink) clientiLink.style.display = isUserAdmin ? "flex" : "none";

  const ticketsWorkCard = document.getElementById("ticketsWorkCard");
  if (ticketsWorkCard) ticketsWorkCard.style.display = isUserAdmin ? "block" : "none";

  const ticketsRecentCard = document.getElementById("ticketsRecentCard");
  if (ticketsRecentCard) ticketsRecentCard.style.display = isUserAdmin ? "none" : "block";
}

// ─── Render ───
function renderTickets() {
  const tickets = getTickets();
  const user = getCurrentUser();
  const isUserAdmin = user.isAdmin === true;
  const tbody = document.getElementById('ticketsTableBody');
  const recentTbody = document.getElementById('ticketsRecentTableBody');
  
  let userTickets;
  
  if (isUserAdmin) {
    userTickets = tickets.filter(t => t.assignedTo === user.name && t.status === 'in_progress');
  } else {
    userTickets = tickets.filter(t => t.client === user.name);
  }
  
  const sorted = [...userTickets].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById('totalTickets').textContent = tickets.filter(t => !isUserAdmin || (t.assignedTo === user.name)).length;
  document.getElementById('openTickets').textContent = tickets.filter(t => t.status === 'open' && (!isUserAdmin || t.assignedTo === user.name)).length;
  document.getElementById('waitingTickets').textContent = tickets.filter(t => t.status === 'waiting' || t.status === 'pending').length;
  document.getElementById('closedTickets').textContent = tickets.filter(t => t.status === 'closed').length;

  if (user.createdAt) {
    document.getElementById('accountAge').textContent = new Date(user.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  const lastVisit = localStorage.getItem('clienti_last_visit');
  const lastVisitEl = document.getElementById('lastVisit');
  if (lastVisitEl && lastVisit) {
    lastVisitEl.textContent = new Date(lastVisit).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  localStorage.setItem('clienti_last_visit', new Date().toISOString());

  if (isUserAdmin) {
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">Nessun ticket assegnato in lavorazione</td></tr>`;
    } else {
      tbody.innerHTML = sorted.slice(0, 5).map(ticket => `
        <tr>
          <td><span style="color: var(--text-muted); font-size: 12px;">#${ticket.id}</span></td>
          <td>${ticket.problem || ticket.service || ticket.description || '-'}</td>
          <td><span class="status-badge ${ticket.status}">${getStatusLabel(ticket.status)}</span></td>
          <td>${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('it-IT') : '-'}</td>
        </tr>
      `).join('');
    }
  } else {
    if (sorted.length === 0) {
      recentTbody.innerHTML = `<tr><td colspan="4" class="empty-state">Nessun ticket. Vai alla pagina Ticket per crearne uno.</td></tr>`;
    } else {
      recentTbody.innerHTML = sorted.slice(0, 5).map(ticket => `
        <tr>
          <td><span style="color: var(--text-muted); font-size: 12px;">#${ticket.id}</span></td>
          <td>${ticket.problem || ticket.service || ticket.description || '-'}</td>
          <td><span class="status-badge ${ticket.status}">${getStatusLabel(ticket.status)}</span></td>
          <td>${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('it-IT') : '-'}</td>
        </tr>
      `).join('');
    }
  }
}

async function deleteTicket(ticketId) {
  const confirmed = await customConfirm('Elimina Ticket', 'Sei sicuro di voler eliminare questo ticket?');
  if (!confirmed) return;
  
  const tickets = getTickets();
  const filtered = tickets.filter(t => t.id !== ticketId);
  saveTickets(filtered);
  localStorage.setItem('stats_needs_refresh', Date.now().toString());
  showToast('Ticket eliminato', 'success');
  renderTickets();
}

function getPriorityLabel(priority) {
  const labels = { low: 'Bassa', medium: 'Media', high: 'Alta', urgent: 'Urgente' };
  return labels[priority] || 'Media';
}

function getStatusLabel(status) {
  const labels = { open: 'Aperto', in_progress: 'In Lavorazione', pending: 'In Attesa', closed: 'Chiuso' };
  return labels[status] || status;
}

// ─── Settings ───
function openSettings() {
  const settings = getSettings();
  document.getElementById('settingTheme').value = settings.theme || 'dark';
  // Password change fields
  const pwOld = document.getElementById('settingOldPassword');
  const pwNew = document.getElementById('settingNewPassword');
  if (pwOld) pwOld.value = '';
  if (pwNew) pwNew.value = '';
  document.getElementById('settingsModal').style.display = 'flex';
}

function closeSettings() { document.getElementById('settingsModal').style.display = 'none'; }

function saveSettings() {
  const settings = { theme: document.getElementById('settingTheme').value };
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

function logout() { localStorage.removeItem('clienti_itpro_user'); window.location.href = 'index.html'; }

async function deleteAccount() {
  const confirmed = await customConfirm('Elimina Account', 'Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.');
  if (!confirmed) return;
  const user = getCurrentUser();
  const users = JSON.parse(localStorage.getItem('clienti_itpro_users') || '[]');
  localStorage.setItem('clienti_itpro_users', JSON.stringify(users.filter(u => u.username !== user.username)));
  localStorage.removeItem('clienti_itpro_user');
  showToast('Account eliminato', 'success');
  setTimeout(() => window.location.href = 'index.html', 1000);
}

// ─── Cookie Consent ───
function initCookies() {
  const consent = localStorage.getItem('cookie_consent');
  if (consent) return;
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.remove('hidden');
}

function acceptCookies() {
  localStorage.setItem('cookie_consent', 'accepted');
  document.getElementById('cookieBanner')?.classList.add('hidden');
}

function rejectCookies() {
  localStorage.setItem('cookie_consent', 'rejected');
  document.getElementById('cookieBanner')?.classList.add('hidden');
}

function cookieSettings() {
  localStorage.setItem('cookie_consent', 'custom');
  document.getElementById('cookieBanner')?.classList.add('hidden');
  showToast('Preferenze cookie salvate', 'success');
}

// ─── Init ───
document.querySelectorAll('.user-profile').forEach(el => {
  el.addEventListener('click', openSettings);
});

document.getElementById('logoIcon')?.addEventListener('click', function() {
  this.style.transform = 'rotate(180deg)';
  setTimeout(() => { this.style.transform = ''; }, 500);
});

document.getElementById('closeSettings')?.addEventListener('click', closeSettings);
document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);

function renderDashboardClients() {
  const user = getCurrentUser();
  const isUserAdmin = user.isAdmin === true || user.isAdmin === 'true';
  
  const clientsCard = document.getElementById('clientsCard');
  if (!isUserAdmin || !clientsCard) return;
  
  const users = getUsers();
  const tickets = getTickets();
  
  if (users.length === 0) {
    clientsCard.style.display = 'none';
    return;
  }
  
  clientsCard.style.display = 'block';
  
  const tbody = document.getElementById('dashboardClientsBody');
  tbody.innerHTML = users.map(u => {
    const userTickets = tickets.filter(t => t.client === u.name);
    const openTickets = userTickets.filter(t => t.status === 'open' || t.status === 'waiting').length;
    const closedTickets = userTickets.filter(t => t.status === 'closed').length;
    const lastVisit = localStorage.getItem(`last_visit_${u.username}`) || 'Mai';
    
    return `
      <tr>
        <td>${u.name}</td>
        <td>${lastVisit !== 'Mai' ? new Date(lastVisit).toLocaleDateString('it-IT') : lastVisit}</td>
        <td><span class="status-badge open">${openTickets}</span></td>
        <td><span class="status-badge closed">${closedTickets}</span></td>
      </tr>
    `;
  }).join('');
}

applyTheme();
updateUserInfo();
renderTickets();
renderDashboardClients();
initCookies();
