const TICKETS_KEY = 'clienti_itpro_tickets';
const CHAT_KEY = 'clienti_itpro_chat';

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
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
  throw new Error('Not authenticated');
}

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

function getTickets() {
  const tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
  console.log('Loaded tickets:', tickets.length);
  return tickets;
}

function saveTickets(tickets) {
  console.log('Saving tickets:', tickets.length);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
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
  return user.isAdmin === true;
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
}

function getStatusLabel(status) {
  const labels = { open: 'Aperto', in_progress: 'In Lavorazione', waiting: 'In Attesa', closed: 'Chiuso' };
  return labels[status] || status;
}

let currentFilter = 'all';
let currentChatTicket = null;
let searchQuery = '';
let currentEditStatus = 'open';
let currentPriorityFilter = '';
let currentDateFilter = '';

function renderTickets() {
  const tickets = getTickets();
  const user = getCurrentUser();
  const admin = isAdmin();
  
  let filteredTickets = tickets;
  if (!admin) {
    filteredTickets = tickets.filter(t => t.client === user.name);
  }
  
  if (currentFilter !== 'all') {
    filteredTickets = filteredTickets.filter(t => t.status === currentFilter);
  }
  
  if (currentPriorityFilter) {
    filteredTickets = filteredTickets.filter(t => t.priority === currentPriorityFilter);
  }
  
  if (currentDateFilter) {
    filteredTickets = filteredTickets.filter(t => {
      if (!t.createdAt) return false;
      const ticketDate = new Date(t.createdAt).toISOString().split('T')[0];
      return ticketDate === currentDateFilter;
    });
  }
  
  if (searchQuery) {
    filteredTickets = filteredTickets.filter(t => t.id.includes(searchQuery));
  }
  
  // Use card layout
  const container = document.getElementById('ticketsCardsContainer');
  if (!container) return;
  
  if (filteredTickets.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding: 24px; grid-column: 1/-1;">Nessun ticket</div>`;
    return;
  }
  
  container.innerHTML = filteredTickets.map(ticket => {
    const adminMsgCount = !admin ? getAdminMessageCount(ticket.id) : 0;
    return `
    <div class="ticket-card" onclick="${admin ? `openTicketEdit('${ticket.id}')` : `openChat('${ticket.id}')`}" style="${!admin ? 'cursor: pointer;' : ''}">
      <div class="ticket-card-header">
        <span class="ticket-card-id">#${ticket.id}</span>
        <span class="status-badge ${ticket.status}">${getStatusLabel(ticket.status)}</span>
        ${!admin && adminMsgCount > 0 ? `<span class="admin-msg-badge" title="Messaggi dall'Admin">💬 ${adminMsgCount}</span>` : ''}
      </div>
      <div class="ticket-card-client">${ticket.client}</div>
      ${ticket.assignedTo ? `<div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Preso in carico da: ${ticket.assignedTo}</div>` : ''}
      <div class="ticket-card-problem">${ticket.problem || ticket.category || '-'}</div>
      <div class="ticket-card-footer">
        <span class="ticket-card-date">${ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('it-IT') : '-'}</span>
        <div style="display: flex; gap: 8px; align-items: center;">
          ${admin ? `<button class="action-btn" onclick="event.stopPropagation(); deleteTicket('${ticket.id}')" title="Elimina">🗑️</button>` : ''}
          ${admin && ticket.status !== 'in_progress' ? `<button class="action-btn" onclick="event.stopPropagation(); takeCharge('${ticket.id}')" title="Prendi in carico">📥</button>` : ''}
          <button class="action-btn" onclick="event.stopPropagation(); openChat('${ticket.id}')" title="Chat">💬</button>
          <span class="ticket-card-priority ${ticket.priority || 'medium'}">${getPriorityLabel(ticket.priority)}</span>
        </div>
      </div>
    </div>
  `; }).join('');
}

function getAdminMessageCount(ticketId) {
  const chats = JSON.parse(localStorage.getItem(CHAT_KEY) || '{}');
  const chatKey = `ticket_${ticketId}`;
  const messages = chats[chatKey] || [];
  return messages.filter(m => m.isAdmin === true).length;
}

function getPriorityLabel(priority) {
  const labels = { low: 'Bassa', medium: 'Media', high: 'Alta', urgent: 'Urgente' };
  return labels[priority] || 'Media';
}

function openTicketEdit(ticketId) {
  const tickets = getTickets();
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  
  document.getElementById('editTicketId').textContent = ticket.id;
  document.getElementById('editTicketIdInput').value = ticket.id;
  document.getElementById('editTicketClient').value = ticket.client;
  document.getElementById('editTicketPriority').value = ticket.priority || 'medium';
  
  currentEditStatus = ticket.status || 'open';
  updateEditStatusButtons();
  
  document.getElementById('ticketEditModal').style.display = 'flex';
}

function updateEditStatusButtons() {
  const buttons = document.querySelectorAll('#editStatusButtons button');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.status === currentEditStatus);
  });
  
  const warning = document.getElementById('closeWarning');
  if (warning) {
    warning.style.display = currentEditStatus === 'closed' ? 'block' : 'none';
  }
}

function setEditStatus(status) {
  currentEditStatus = status;
  updateEditStatusButtons();
}

function closeTicketEdit() {
  document.getElementById('ticketEditModal').style.display = 'none';
}

async function saveTicketEdit() {
  const ticketId = document.getElementById('editTicketIdInput').value;
  const tickets = getTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  
  if (ticketIndex > -1) {
    if (currentEditStatus === 'closed') {
      tickets.splice(ticketIndex, 1);
      showToast('Ticket chiuso ed eliminato', 'success');
    } else {
      tickets[ticketIndex].status = currentEditStatus;
      tickets[ticketIndex].priority = document.getElementById('editTicketPriority').value;
      showToast('Ticket aggiornato', 'success');
    }
    
    saveTickets(tickets);
    localStorage.setItem('stats_needs_refresh', Date.now().toString());
    
    renderTickets();
    closeTicketEdit();
  }
}

function takeCharge(ticketId) {
  const tickets = getTickets();
  const user = getCurrentUser();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  
  if (ticketIndex > -1) {
    tickets[ticketIndex].status = 'in_progress';
    tickets[ticketIndex].assignedTo = user.name;
    tickets[ticketIndex].assignedAt = new Date().toISOString();
    saveTickets(tickets);
    localStorage.setItem('stats_needs_refresh', Date.now().toString());
    showToast('Ticket preso in carico', 'success');
    renderTickets();
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

function openChat(ticketId) {
  const tickets = getTickets();
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;
  
  currentChatTicket = ticket;
  
  document.getElementById('chatTitle').textContent = `Chat con ${ticket.client}`;
  document.getElementById('chatModal').style.display = 'flex';
  
  renderChat(ticketId);
}

function closeChat() {
  document.getElementById('chatModal').style.display = 'none';
  currentChatTicket = null;
}

function renderChat(ticketId) {
  const chats = JSON.parse(localStorage.getItem(CHAT_KEY) || '{}');
  const chatKey = `ticket_${ticketId}`;
  const messages = chats[chatKey] || [];
  const user = getCurrentUser();
  
  const container = document.getElementById('chatMessages');
  
  if (messages.length === 0) {
    container.innerHTML = '<div class="empty-state">Nessun messaggio. Inizia la conversazione!</div>';
    return;
  }
  
  container.innerHTML = messages.map(msg => {
    const isFromMe = msg.from === user.name;
    const actionText = isFromMe ? 'ha inviato' : 'ha ricevuto';
    return `
    <div class="chat-message ${isFromMe ? 'sent' : 'received'}">
      <div class="chat-bubble">${msg.text}</div>
      <div class="chat-time">${msg.from} ${actionText}</div>
    </div>
  `}).join('');
  
  container.scrollTop = container.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !currentChatTicket) return;
  
  const user = getCurrentUser();
  const chats = JSON.parse(localStorage.getItem(CHAT_KEY) || '{}');
  const chatKey = `ticket_${currentChatTicket.id}`;
  
  if (!chats[chatKey]) chats[chatKey] = [];
  
  chats[chatKey].push({
    from: user.name,
    isAdmin: user.isAdmin === true,
    text: text,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  localStorage.setItem(CHAT_KEY, JSON.stringify(chats));
  
  input.value = '';
  renderChat(currentChatTicket.id);
}

document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderTickets();
  });
});

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

function openTicketModal() {
  document.getElementById('ticketModalTitle').textContent = 'Nuovo Ticket';
  document.getElementById('ticketForm').reset();
  document.getElementById('ticketModal').style.display = 'flex';
}

function closeTicketModal() {
  document.getElementById('ticketModal').style.display = 'none';
}

let isSubmitting = false;

function saveTicket(e) {
  e.preventDefault();
  if (isSubmitting) return;
  isSubmitting = true;
  
  const user = getCurrentUser();
  
  // Generate random 4-digit unique ID (0001-9999)
  const existingTickets = getTickets();
  let newId;
  const existingIds = new Set(existingTickets.map(t => t.id));
  do {
    newId = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  } while (existingIds.has(newId));

  const ticket = {
    id: newId,
    client: user.name,
    problem: document.getElementById('ticketProblem').value,
    category: document.getElementById('ticketCategory').value,
    priority: document.getElementById('ticketPriority').value,
    status: 'waiting',
    createdAt: new Date().toISOString()
  };
  
  const tickets = getTickets();
  tickets.push(ticket);
  saveTickets(tickets);
  
  localStorage.setItem('stats_needs_refresh', Date.now().toString());
  
  closeTicketModal();
  showToast('Ticket creato con successo', 'success');
  renderTickets();
  
  isSubmitting = false;
}

document.getElementById('logoIcon')?.addEventListener('click', function() {
  this.style.transform = 'rotate(180deg)';
  setTimeout(() => { this.style.transform = ''; }, 500);
});
document.getElementById('newTicketBtn')?.addEventListener('click', openTicketModal);
document.getElementById('closeTicketModal')?.addEventListener('click', closeTicketModal);
document.getElementById('cancelTicketBtn')?.addEventListener('click', closeTicketModal);
document.getElementById('ticketForm')?.addEventListener('submit', saveTicket);
document.getElementById('searchInput')?.addEventListener('input', (e) => {
  searchQuery = e.target.value.trim();
  renderTickets();
});
document.getElementById('filterPriority')?.addEventListener('change', (e) => {
  currentPriorityFilter = e.target.value;
  renderTickets();
});
document.getElementById('filterDate')?.addEventListener('change', (e) => {
  currentDateFilter = e.target.value;
  renderTickets();
});

document.getElementById('filterStatus')?.addEventListener('change', (e) => {
  currentFilter = e.target.value;
  renderTickets();
});

document.getElementById('filterPriority')?.addEventListener('change', (e) => {
  currentPriorityFilter = e.target.value;
  renderTickets();
});

document.getElementById('filterDate')?.addEventListener('change', (e) => {
  currentDateFilter = e.target.value;
  renderTickets();
});

function clearFilters() {
  currentFilter = 'all';
  currentPriorityFilter = '';
  currentDateFilter = '';
  document.getElementById('filterStatus').value = 'all';
  document.getElementById('filterPriority').value = '';
  document.getElementById('filterDate').value = '';
  renderTickets();
}

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

updateUserInfo();
applyTheme();
renderTickets();
