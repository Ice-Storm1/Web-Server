const TICKETS_KEY = "clienti_itpro_tickets";
const CLIENTS_KEY = "clienti_itpro_clients";

function checkAuth() {
  const user = localStorage.getItem("clienti_itpro_user");
  if (!user) {
    window.location.href = "index.html";
    return false;
  }
  return true;
}

if (!checkAuth()) {
  throw new Error("Not authenticated");
}

function getTickets() {
  return JSON.parse(localStorage.getItem(TICKETS_KEY) || "[]");
}

function getClients() {
  return JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
}

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function getSettings() {
  return JSON.parse(localStorage.getItem("clienti_itpro_settings") || "{}");
}

function applyTheme() {
  const settings = getSettings();
  const theme = settings.theme || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("clienti_itpro_user") || "{}");
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
  document
    .querySelectorAll(".user-name")
    .forEach((el) => (el.textContent = name));
  
  const isUserAdmin = (user.isAdmin === true || user.isAdmin === 'true');
  document
    .querySelectorAll(".user-role")
    .forEach((el) => (el.textContent = isUserAdmin ? "Admin" : "Utente"));

  const logoText = settings.appName || "DevBridge";

  const adminPanel = document.getElementById("adminPanelLink");
  if (adminPanel) adminPanel.style.display = isUserAdmin ? "flex" : "none";

  const clientiLink = document.getElementById("clientiLink");
  if (clientiLink) clientiLink.style.display = isUserAdmin ? "flex" : "none";
  
  const exportBtn = document.getElementById('exportPdfBtn');
  if (exportBtn) exportBtn.style.display = isUserAdmin ? 'inline-flex' : 'none';
}

let statusChart = null;
let servicesChart = null;
let timelineChart = null;
let usersChart = null;
let currentRange = "all";
let currentChartFilter = "all";

function filterTicketsByRange(tickets, range) {
  if (range === "all") return tickets;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return tickets.filter((t) => {
    if (!t.createdAt) return false;
    const ticketDate = new Date(t.createdAt);

    if (range === "today" || range === "7") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return ticketDate >= weekAgo;
    } else if (range === "30") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return ticketDate >= monthAgo;
    } else if (range === "90") {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return ticketDate >= threeMonthsAgo;
    }
    return true;
  });
}

function renderStats() {
  if (statusChart) {
    statusChart.destroy();
    statusChart = null;
  }
  if (servicesChart) {
    servicesChart.destroy();
    servicesChart = null;
  }
  if (timelineChart) {
    timelineChart.destroy();
    timelineChart = null;
  }
  if (usersChart) {
    usersChart.destroy();
    usersChart = null;
  }

  const allTickets = getTickets();
  const clients = getClients();
  const users = getUsers();

  const tickets = filterTicketsByRange(allTickets, currentRange);

  document.getElementById("totalTickets").textContent = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const waitingCount = tickets.filter((t) => t.status === "waiting" || t.status === "pending").length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;
  
  document.getElementById("openTickets").textContent = openCount;
  document.getElementById("waitingTickets").textContent = waitingCount;
  document.getElementById("closedTickets").textContent = closedCount;
  document.getElementById("totalUsers").textContent = users.length;

  // Progress bars
  const total = tickets.length || 1;
  document.getElementById("totalProgress").style.width = "100%";
  document.getElementById("openProgress").style.width = `${(openCount / total) * 100}%`;
  document.getElementById("closedProgress").style.width = `${(closedCount / total) * 100}%`;

  // Advanced KPIs
  const today = new Date().toISOString().split('T')[0];
  const todayTickets = allTickets.filter(t => t.createdAt && t.createdAt.startsWith(today));
  const todayResolved = allTickets.filter(t => t.status === "closed" && t.updatedAt && t.updatedAt.startsWith(today));
  
  document.getElementById("ticketsToday").textContent = todayTickets.length;
  document.getElementById("resolvedToday").textContent = todayResolved.length;

  if (tickets.length > 0 || users.length > 0) {
    createStatusChart(tickets);
    createPriorityChart(tickets);
    createServicesChart(tickets);
    createTimelineChart(tickets);
    createUsersChart(users);
  }
}

document.querySelectorAll(".filter-btn:not(.chart-filter)").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn:not(.chart-filter)")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentRange = btn.dataset.range;
    renderStats();
  });
});

document.querySelectorAll(".chart-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".chart-filter")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentChartFilter = btn.dataset.chart;
    renderStats();
  });
});

function generateTestData() {
  const now = new Date();
  const testUsers = [
    {
      username: "mario",
      password: "mario123",
      name: "Mario Rossi",
      company: "TechCorp",
      createdAt: "2025-01-15",
    },
    {
      username: "laura",
      password: "laura123",
      name: "Laura Bianchi",
      company: "DigitalPro",
      createdAt: "2025-02-20",
    },
    {
      username: "giuseppe",
      password: "giuseppe123",
      name: "Giuseppe Verdi",
      company: "WebSite",
      createdAt: "2025-03-10",
    },
    {
      username: "anna",
      password: "anna123",
      name: "Anna Neri",
      company: "CityShop",
      createdAt: "2025-03-15",
    },
    {
      username: "luca",
      password: "luca123",
      name: "Luca Blu",
      company: "TechCorp",
      createdAt: "2025-03-20",
    },
  ];

  localStorage.setItem("clienti_itpro_users", JSON.stringify(testUsers));

  const testTickets = [
    {
      id: "0001",
      client: "Mario Rossi",
      problem: "PC non si accende",
      category: "Hardware",
      status: "closed",
      priority: "high",
      createdAt: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0002",
      client: "Laura Bianchi",
      problem: "Errore software Excel",
      category: "Software",
      status: "in_progress",
      priority: "medium",
      createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0003",
      client: "Mario Rossi",
      problem: "Problema connessione rete",
      category: "Rete",
      status: "closed",
      priority: "low",
      createdAt: new Date(now - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0004",
      client: "Giuseppe Verdi",
      problem: "Stampante non stampa",
      category: "Hardware",
      status: "pending",
      priority: "medium",
      createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0005",
      client: "Anna Neri",
      problem: "Account bloccato",
      category: "Account",
      status: "open",
      priority: "urgent",
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0006",
      client: "Luca Blu",
      problem: "Email non ricevuta",
      category: "Email",
      status: "open",
      priority: "medium",
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0007",
      client: "Laura Bianchi",
      problem: "Stampante inceppata",
      category: "Stampa",
      status: "closed",
      priority: "low",
      createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0008",
      client: "Giuseppe Verdi",
      problem: "Virus sospetto",
      category: "Sicurezza",
      status: "in_progress",
      priority: "high",
      createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "0009",
      client: "Mario Rossi",
      problem: "Nuovo utente da creare",
      category: "Account",
      status: "open",
      priority: "medium",
      createdAt: now.toISOString(),
    },
    {
      id: "0010",
      client: "Anna Neri",
      problem: "Monitor che sfarfalla",
      category: "Hardware",
      status: "pending",
      priority: "low",
      createdAt: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  localStorage.setItem("clienti_itpro_tickets", JSON.stringify(testTickets));

  renderStats();
  showToast("Dati test generati! Ticket: " + testTickets.length + ", Utenti: " + testUsers.length, 'success');
}

function createStatusChart(tickets) {
  const ctx = document.getElementById("statusChart")?.getContext("2d");
  if (!ctx) return;

  const statusData = [
    { label: "Aperti", value: tickets.filter((t) => t.status === "open").length, color: "#f97316" },
    { label: "In Lavorazione", value: tickets.filter((t) => t.status === "in_progress").length, color: "#7c5cfc" },
    { label: "In Attesa", value: tickets.filter((t) => t.status === "pending" || t.status === "waiting").length, color: "#a855f7" },
    { label: "Chiusi", value: tickets.filter((t) => t.status === "closed").length, color: "#10b981" }
  ].filter(s => s.value > 0);

  if (statusData.length === 0) return;

  statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: statusData.map(s => s.label),
      datasets: [
        {
          data: statusData.map(s => s.value),
          backgroundColor: statusData.map(s => s.color),
          borderWidth: 0,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#71717a",
            padding: 16,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
      },
    },
  });
}

function createPriorityChart(tickets) {
  const ctx = document.getElementById("priorityChart")?.getContext("2d");
  if (!ctx) return;

  const priorityData = [
    { label: "Basso", value: tickets.filter((t) => t.priority === "low").length, color: "#3b82f6" },
    { label: "Medio", value: tickets.filter((t) => t.priority === "medium").length, color: "#f59e0b" },
    { label: "Alto", value: tickets.filter((t) => t.priority === "high").length, color: "#f97316" },
    { label: "Urgente", value: tickets.filter((t) => t.priority === "urgent").length, color: "#ef4444" }
  ].filter(s => s.value > 0);

  if (priorityData.length === 0) return;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: priorityData.map(s => s.label),
      datasets: [{
        data: priorityData.map(s => s.value),
        backgroundColor: priorityData.map(s => s.color),
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#71717a",
            padding: 12,
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
      },
    },
  });
}

document.querySelectorAll(".has-submenu > .nav-link").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    link.parentElement.classList.toggle("open");
  });
});

function createServicesChart(tickets) {
  const ctx = document.getElementById("servicesChart")?.getContext("2d");
  if (!ctx) return;

  const services = {};
  tickets.forEach((t) => {
    const cat = t.service || t.category || "Altro";
    services[cat] = (services[cat] || 0) + 1;
  });

  const sorted = Object.entries(services)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  if (sorted.length === 0) sorted.push(["Nessun dato", 1]);

  const chartColors = [
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#ec4899",
  ];

  servicesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map(([p]) =>
        p.length > 15 ? p.substring(0, 15) + "..." : p,
      ),
      datasets: [
        {
          data: sorted.map(([, c]) => c),
          backgroundColor: chartColors.slice(0, sorted.length),
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "#2a2a32" }, ticks: { color: "#71717a" } },
        y: { grid: { display: false }, ticks: { color: "#71717a" } },
      },
    },
  });
}

function createTimelineChart(tickets) {
  const ctx = document.getElementById("timelineChart")?.getContext("2d");
  if (!ctx) return;

  let filteredTickets = tickets;
  if (currentChartFilter === "open") {
    filteredTickets = tickets.filter((t) => t.status === "open");
  } else if (currentChartFilter === "closed") {
    filteredTickets = tickets.filter((t) => t.status === "closed");
  } else if (currentChartFilter === "waiting") {
    filteredTickets = tickets.filter((t) => t.status === "waiting" || t.status === "pending");
  } else if (currentChartFilter === "in_progress") {
    filteredTickets = tickets.filter((t) => t.status === "in_progress");
  }

  const dateCounts = {};
  filteredTickets.forEach((t) => {
    if (!t.createdAt) return;
    const date = new Date(t.createdAt).toLocaleDateString("it-IT", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });

  const sorted = Object.entries(dateCounts).sort(
    (a, b) => new Date(a[0]) - new Date(b[0]),
  );

  const labels = sorted.map(([date]) => date);
  const counts = sorted.map(([, count], idx) => {
    return sorted.slice(0, idx + 1).reduce((sum, [, c]) => sum + c, 0);
  });

  if (labels.length === 0) {
    labels.push("Oggi");
    counts.push(0);
  }

  const filterLabels = {
    all: "Ticket Totali",
    open: "Ticket Aperti",
    closed: "Ticket Chiusi",
    waiting: "In Attesa",
    in_progress: "In Lavorazione"
  };
  
  const colors = {
    all: { border: "#8b5cf6", bg: "rgba(139, 92, 246, 0.2)" },
    open: { border: "#3b82f6", bg: "rgba(59, 130, 246, 0.2)" },
    closed: { border: "#10b981", bg: "rgba(16, 185, 129, 0.2)" },
    waiting: { border: "#a855f7", bg: "rgba(168, 85, 247, 0.2)" },
    in_progress: { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" },
  };
  const color = colors[currentChartFilter] || colors.all;

  timelineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: filterLabels[currentChartFilter] || "Ticket Totali",
          data: counts,
          borderColor: color.border,
          backgroundColor: color.bg,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: color.border,
          pointBorderColor: color.border,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            color: "#71717a",
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
      },
      scales: {
        x: { grid: { color: "#2a2a32" }, ticks: { color: "#71717a" } },
        y: {
          grid: { color: "#2a2a32" },
          ticks: { color: "#71717a", stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}

function createUsersChart(users) {
  const ctx = document.getElementById("usersChart")?.getContext("2d");
  if (!ctx) return;

  const dateCounts = {};
  users.forEach((u) => {
    if (!u.createdAt) return;
    const date = new Date(u.createdAt).toLocaleDateString("it-IT", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });

  const sorted = Object.entries(dateCounts).sort(
    (a, b) => new Date(a[0]) - new Date(b[0]),
  );

  const labels = sorted.map(([date]) => date);
  const counts = sorted.map(([, count], idx) => {
    return sorted.slice(0, idx + 1).reduce((sum, [, c]) => sum + c, 0);
  });

  if (labels.length === 0) {
    labels.push("Oggi");
    counts.push(0);
  }

  usersChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Utenti Registrati",
          data: counts,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#10b981",
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            color: "#71717a",
            usePointStyle: true,
            pointStyle: "circle",
          },
        },
      },
      scales: {
        x: { grid: { color: "#2a2a32" }, ticks: { color: "#71717a" } },
        y: {
          grid: { color: "#2a2a32" },
          ticks: { color: "#71717a", stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}

updateUserInfo();
applyTheme();
renderStats();

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    renderStats();
  }
});

// Handle profile click to open settings
document.querySelectorAll(".user-profile").forEach((el) => {
  el.addEventListener("click", () => {
    openSettings();
  });
});

function logout() {
  localStorage.removeItem("clienti_itpro_user");
  window.location.href = "index.html";
}

function refreshStats() {
  renderStats();
  showToast('Statistiche aggiornate', 'success');
}

window.refreshStats = refreshStats;

function changePassword() {
  const oldPw = document.getElementById('settingOldPassword')?.value;
  const newPw = document.getElementById('settingNewPassword')?.value;
  if (!oldPw || !newPw) { showToast('Compila entrambi i campi password', 'error'); return; }
  if (newPw.length < 4) { showToast('La password deve avere almeno 4 caratteri', 'error'); return; }

  const user = getCurrentUser();
  if (user.isAdmin === true || user.isAdmin === 'true') {
    const admins = window.getAdmins();
    const admin = admins.find(a => a.username === user.username);
    if (!admin || admin.password !== oldPw) { showToast('Password attuale errata', 'error'); return; }
    admin.password = newPw;
    window.saveAdmins(admins);
  } else {
    const users = getUsers();
    const u = users.find(x => x.username === user.username);
    if (!u || u.password !== oldPw) { showToast('Password attuale errata', 'error'); return; }
    u.password = newPw;
    localStorage.setItem('clienti_itpro_users', JSON.stringify(users));
  }
  document.getElementById('settingOldPassword').value = '';
  document.getElementById('settingNewPassword').value = '';
  showToast('Password aggiornata', 'success');
}

async function deleteAccount() {
  if (
    !await customConfirm(
      "Elimina Account",
      "Sei sicuro di voler eliminare il tuo account? Questa azione non può essere annullata.",
    )
  ) {
    const user = getCurrentUser();
    const users = getUsers();
    const updatedUsers = users.filter((u) => u.username !== user.username);
    localStorage.setItem("clienti_itpro_users", JSON.stringify(updatedUsers));
    localStorage.removeItem("clienti_itpro_user");
    showToast("Account eliminato con successo.", "success");
    setTimeout(() => window.location.href = "index.html", 1000);
  }
}

function openSettings() {
  const settings = getSettings();
  document.getElementById("settingTheme").value = settings.theme || "dark";
  document.getElementById("settingsModal").style.display = "flex";
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

function saveSettings() {
  const settings = {
    theme: document.getElementById("settingTheme").value,
  };
  localStorage.setItem("clienti_itpro_settings", JSON.stringify(settings));

  applyTheme();

  updateUserInfo();
  closeSettings();
  showToast("Impostazioni salvate", "success");
}

document.getElementById("logoIcon")?.addEventListener("click", function() {
  this.style.transform = 'rotate(180deg)';
  setTimeout(() => { this.style.transform = ''; }, 500);
});
document
  .getElementById("closeSettings")
  ?.addEventListener("click", closeSettings);
document
  .getElementById("saveSettingsBtn")
  ?.addEventListener("click", saveSettings);
document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);

function checkAdminForExport() {
  const userStr = localStorage.getItem('clienti_itpro_user');
  const user = userStr ? JSON.parse(userStr) : {};
  const isUserAdmin = (user.isAdmin === true || user.isAdmin === 'true');
  const exportBtn = document.getElementById('exportPdfBtn');
  if (exportBtn) {
    exportBtn.style.display = isUserAdmin ? 'inline-flex' : 'none';
  }
}

async function exportToPDF() {
  openExportModal();
}
window.exportToPDF = exportToPDF;

async function generateTextPDF() {
  const tickets = getTickets();
  const users = getUsers();
  
  if (tickets.length === 0 && users.length === 0) {
    showToast('Nessun dato da esportare', 'error');
    return;
  }
  
  try {
    const jsPDFClass = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDFClass) {
      showToast('Errore: libreria PDF non caricata', 'error');
      return;
    }
    
    const pdf = new jsPDFClass();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;
    
    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(124, 92, 252);
    pdf.text('DEVBRIDGE - REPORT STATISTICO', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Data generazione: ${new Date().toLocaleString('it-IT')}`, margin, y);
    y += 15;
    
    // Summary
    pdf.setFontSize(14);
    pdf.setTextColor(0);
    pdf.text('RIEPILOGO', margin, y);
    y += 10;
    
    pdf.setFontSize(11);
    pdf.text(`Ticket Totali: ${tickets.length}`, margin, y);
    y += 7;
    pdf.text(`Utenti Registrati: ${users.length}`, margin, y);
    y += 15;
    
    // Status breakdown
    const statusCounts = { open: 0, in_progress: 0, waiting: 0, closed: 0 };
    tickets.forEach(t => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    });
    
    pdf.setFontSize(14);
    pdf.text('STATO TICKET', margin, y);
    y += 10;
    
    pdf.setFontSize(11);
    pdf.text(`Aperti: ${statusCounts.open}`, margin + 5, y);
    y += 6;
    pdf.text(`In Lavorazione: ${statusCounts.in_progress}`, margin + 5, y);
    y += 6;
    pdf.text(`In Attesa: ${statusCounts.waiting}`, margin + 5, y);
    y += 6;
    pdf.text(`Chiusi: ${statusCounts.closed}`, margin + 5, y);
    y += 15;
    
    // Priority breakdown
    const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
    tickets.forEach(t => {
      if (priorityCounts[t.priority] !== undefined) priorityCounts[t.priority]++;
    });
    
    pdf.setFontSize(14);
    pdf.text('PRIORITA TICKET', margin, y);
    y += 10;
    
    pdf.setFontSize(11);
    pdf.text(`Bassa: ${priorityCounts.low}`, margin + 5, y);
    y += 6;
    pdf.text(`Media: ${priorityCounts.medium}`, margin + 5, y);
    y += 6;
    pdf.text(`Alta: ${priorityCounts.high}`, margin + 5, y);
    y += 6;
    pdf.text(`Urgente: ${priorityCounts.urgent}`, margin + 5, y);
    y += 15;
    
    // Ticket list
    pdf.setFontSize(14);
    pdf.text('ELENCO TICKET', margin, y);
    y += 10;
    
    pdf.setFontSize(10);
    tickets.forEach(t => {
      if (y > 270) {
        pdf.addPage();
        y = 20;
      }
      pdf.setTextColor(124, 92, 252);
      pdf.text(`#${t.id}`, margin, y);
      pdf.setTextColor(0);
      y += 5;
      pdf.text(`Cliente: ${t.client}`, margin + 5, y);
      y += 5;
      pdf.text(`Stato: ${t.status} | Priorità: ${t.priority}`, margin + 5, y);
      y += 5;
      pdf.text(`Data: ${t.createdAt ? new Date(t.createdAt).toLocaleDateString('it-IT') : '-'}`, margin + 5, y);
      y += 10;
    });
    
    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text('DevBridge - Client Management System', pageWidth / 2, 290, { align: 'center' });
    
    pdf.save(`DevBridge_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    
    showToast('Report esportato con successo', 'success');
  } catch (e) {
    console.error('Export error:', e);
    showToast('Errore durante l\'esportazione', 'error');
  }
}

// Export PDF Modal Functions
let selectedColorMode = 'dark';
let selectedOrientation = 'vertical';
let selectedContentType = 'chart';

function handleContentTypeSelection(type) {
  selectedContentType = type;
  updateContentTypeButtons();
  updateModalSections();
}
window.handleContentTypeSelection = handleContentTypeSelection;

function updateContentTypeButtons() {
  document.querySelectorAll('[data-content-type]').forEach(btn => {
    const isActive = btn.dataset.contentType === selectedContentType;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive);
  });
}

function updateModalSections() {
  const colorSection = document.getElementById('colorSection');
  const orientationSection = document.getElementById('orientationSection');
  if (colorSection) colorSection.style.display = selectedContentType === 'chart' ? 'block' : 'none';
  if (orientationSection) orientationSection.style.display = selectedContentType === 'chart' ? 'block' : 'none';
}

function openExportModal() {
  const allTickets = getTickets();
  const users = getUsers();
  const hasData = allTickets.length > 0 || users.length > 0;
  
  const modal = document.getElementById('exportPdfModal');
  const emptyState = document.getElementById('exportEmptyState');
  const options = document.getElementById('exportModalOptions');
  
  if (!hasData) {
    emptyState.style.display = 'block';
    options.style.display = 'none';
  } else {
    emptyState.style.display = 'none';
    options.style.display = 'flex';
    
    // Reset to defaults
    selectedContentType = 'chart';
    selectedColorMode = 'dark';
    selectedOrientation = 'vertical';
    updateContentTypeButtons();
    updateToggleButtons();
    updateModalSections();
  }
  
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  
  // Focus trap for accessibility
  setTimeout(() => {
    modal.querySelector('.export-modal-close').focus();
  }, 100);
}

function closeExportModal() {
  const modal = document.getElementById('exportPdfModal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  
  // Return focus to export button
  const exportBtn = document.getElementById('exportPdfBtn');
  if (exportBtn) exportBtn.focus();
}
window.closeExportModal = closeExportModal;

function updateToggleButtons() {
  // Color mode buttons
  document.querySelectorAll('[data-color-mode]').forEach(btn => {
    const isActive = btn.dataset.colorMode === selectedColorMode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive);
  });
  
  // Orientation buttons
  document.querySelectorAll('[data-orientation]').forEach(btn => {
    const isActive = btn.dataset.orientation === selectedOrientation;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', isActive);
  });
}

function handleColorModeSelection(mode) {
  selectedColorMode = mode;
  updateToggleButtons();
}
window.handleColorModeSelection = handleColorModeSelection;

function handleOrientationSelection(orientation) {
  selectedOrientation = orientation;
  updateToggleButtons();
}
window.handleOrientationSelection = handleOrientationSelection;

function confirmExport() {
  closeExportModal();
  
  // Small delay to allow modal to close
  setTimeout(() => {
    if (selectedContentType === 'text') {
      generateTextPDF();
    } else {
      generatePDFWithOptions(selectedColorMode, selectedOrientation);
    }
  }, 300);
}
window.confirmExport = confirmExport;

function hidePdfErrorBanner() {
  const errorBanner = document.getElementById('pdfErrorBanner');
  if (errorBanner) {
    errorBanner.classList.add('hidden');
  }
}

// New PDF generation function with options
function generatePDFWithOptions(colorMode, orientation) {
  try {
    const jsPDFClass = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDFClass) {
      showToast('Errore: libreria PDF non caricata', 'error');
      return;
    }
    const isLandscape = orientation === 'horizontal';
    const pdf = new jsPDFClass({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    
    // Colors based on mode - use RGB string format
    const bgColor = colorMode === 'dark' ? '#141419' : '#FFFFFF';
    const textColor = colorMode === 'dark' ? '#F0F0F5' : '#282C30';
    const mutedColor = colorMode === 'dark' ? '#8C8C91' : '#787C81';
    const primaryColor = colorMode === 'dark' ? '#7C5cfc' : '#6D4DE8';
    const cardColor = colorMode === 'dark' ? '#1E1E23' : '#FAFAFC';
    const borderColor = colorMode === 'dark' ? '#32323C' : '#DCDCE1';
    
    const c = { bg: bgColor, text: textColor, muted: mutedColor, primary: primaryColor, card: cardColor, border: borderColor };
    
    // Header background
    pdf.setFillColor(bgColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');
    
    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(c.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DevBridge', margin, 25);
    
    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(c.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date().toLocaleDateString('it-IT'), pageWidth - margin, 25, { align: 'right' });
    
    // User
    pdf.setFontSize(11);
    pdf.setTextColor(c.muted);
    const userName = getCurrentUser().name || 'Admin';
    pdf.text(`Report di ${userName}`, margin, 35);
    
    // Stats row
    const totalTickets = document.getElementById('totalTickets')?.textContent || '0';
    const openTickets = document.getElementById('openTickets')?.textContent || '0';
    const closedTickets = document.getElementById('closedTickets')?.textContent || '0';
    const totalUsers = document.getElementById('totalUsers')?.textContent || '0';
    
    const stats = [
      { label: 'Totale Ticket', value: totalTickets },
      { label: 'Aperti', value: openTickets },
      { label: 'Chiusi', value: closedTickets },
      { label: 'Utenti', value: totalUsers }
    ];
  
  const statsPerRow = isLandscape ? 4 : 4;
  const statWidth = (pageWidth - margin * 2 - (statsPerRow - 1) * 8) / statsPerRow;
  const statHeight = 30;
  const statY = 55;
  
  stats.forEach((stat, i) => {
    const x = margin + i * (statWidth + 8);
    
    pdf.setFillColor(c.card);
    pdf.roundedRect(x, statY, statWidth, statHeight, 3, 3, 'F');
    
    pdf.setDrawColor(borderColor);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, statY, statWidth, statHeight, 3, 3, 'S');
    
    pdf.setFontSize(18);
    pdf.setTextColor(c.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(stat.value, x + statWidth / 2, statY + 18, { align: 'center' });
    
    pdf.setFontSize(8);
    pdf.setTextColor(c.muted);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, x + statWidth / 2, statY + 25, { align: 'center' });
  });
  
  // Charts section
  const chartY = statY + statHeight + 20;
  pdf.setFontSize(14);
  pdf.setTextColor(c.text);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Panoramica', margin, chartY);
  
  // Chart dimensions
  const chartGap = 10;
  const chartW = isLandscape 
    ? (pageWidth - margin * 2 - chartGap * 2) / 2
    : (pageWidth - margin * 2 - chartGap * 2) / 2;
  const chartH = 55;
  
  const charts = [
    { id: 'statusChart', title: 'Stato Ticket' },
    { id: 'priorityChart', title: 'Priorità' },
    { id: 'servicesChart', title: 'Servizi' },
    { id: 'timelineChart', title: 'Timeline' },
    { id: 'usersChart', title: 'Utenti' }
  ];
  
  const chartsPerRow = 2;
  
  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];
    const row = Math.floor(i / chartsPerRow);
    const col = i % chartsPerRow;
    const x = margin + col * (chartW + chartGap);
    const y = chartY + 10 + row * (chartH + chartGap);
    
    const canvas = document.getElementById(chart.id);
    let chartInstance = null;
    if (canvas) {
      chartInstance = Chart.getChart(canvas);
    }
    
    if (chartInstance) {
      try {
        const imgData = chartInstance.toBase64Image();
        
        pdf.setFillColor(c.card);
        pdf.roundedRect(x, y, chartW, chartH, 2, 2, 'F');
        
        pdf.setFontSize(9);
        pdf.setTextColor(c.muted);
        pdf.setFont('helvetica', 'normal');
        pdf.text(chart.title, x + 4, y + 5);
        
        pdf.addImage(imgData, 'PNG', x + 2, y + 7, chartW - 4, chartH - 10);
      } catch (e) {
        console.error(`Error adding chart ${chart.id}:`, e);
        showToast(`Errore durante l'aggiunta del grafico: ${chart.title}`, 'error');
        const errorBanner = document.getElementById('pdfErrorBanner');
        if (errorBanner) {
          errorBanner.classList.remove('hidden');
        }
      }
    }
  }
  
  // Footer
  pdf.setDrawColor(borderColor);
  pdf.setLineWidth(0.3);
  pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
  
  pdf.setFontSize(8);
  pdf.setTextColor(c.muted);
  pdf.text('DevBridge', margin, pageHeight - 10);
  pdf.text('Generato automaticamente', pageWidth - margin, pageHeight - 10, { align: 'right' });
  
  const filename = `DevBridge_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
  showToast('PDF esportato con successo', 'success');
  } catch (error) {
    console.error('Error generating PDF:', error);
    showToast('Errore PDF: ' + error.message, 'error');
  }
}

// Event Listeners for Export Modal - Attach immediately and on DOMContentLoaded
function attachExportEventListeners() {
  // Close modal on overlay click
  const exportModal = document.getElementById('exportPdfModal');
  if (exportModal) {
    exportModal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeExportModal();
      }
    });
  }
  
  // Close button
  const closeBtn = document.getElementById('closeExportPdf');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeExportModal);
  }
  
  // Confirm export button
  const confirmBtn = document.getElementById('confirmExportPdf');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', confirmExport);
  }
}

// Attach listeners immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachExportEventListeners);
} else {
  attachExportEventListeners();
}  

// Also need to attach color mode and orientation toggles
function attachExportToggles() {
  // Color mode toggles
  document.querySelectorAll('[data-color-mode]').forEach(btn => {
    btn.addEventListener('click', function() {
      handleColorModeSelection(this.dataset.colorMode);
    });
    
    // Keyboard support
    btn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleColorModeSelection(this.dataset.colorMode);
      }
    });
  });
  
  // Orientation toggles
  document.querySelectorAll('[data-orientation]').forEach(btn => {
    btn.addEventListener('click', function() {
      handleOrientationSelection(this.dataset.orientation);
    });
    
    // Keyboard support
    btn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOrientationSelection(this.dataset.orientation);
      }
    });
  });
  
  // Keyboard support for modal
  const exportModal = document.getElementById('exportPdfModal');
  if (exportModal) {
    exportModal.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeExportModal();
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachExportToggles);
} else {
  attachExportToggles();
}
