// === SYSTÈME D'AUTHENTIFICATION ===
const CURRENT_USER_KEY = "crm_current_user";
let currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY));

if (!currentUser) {
  window.location.href = "login.html";
}

// === GESTION DES CLIENTS ===
const CLIENTS_KEY = "crm_clients";
let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
let isEditing = false;

// Éléments DOM
const clientForm = document.getElementById("clientForm");
const clientIdInput = document.getElementById("clientId");
const clientNameInput = document.getElementById("clientName");
const clientEmailInput = document.getElementById("clientEmail");
const clientPhoneInput = document.getElementById("clientPhone");
const clientStatusSelect = document.getElementById("clientStatus");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const exportBtn = document.getElementById("exportBtn");
const clientsContainer = document.getElementById("clientsContainer");
const addClientBtn = document.getElementById("addClientBtn");
const clientModal = document.getElementById("clientModal");

// Éléments statistiques
const totalClientsElement = document.getElementById("totalClients");
const activeClientsElement = document.getElementById("activeClients");
const activeCountElement = document.getElementById("activeCount");
const inactiveCountElement = document.getElementById("inactiveCount");
const leadCountElement = document.getElementById("leadCount");
const clientsCountElement = document.getElementById("clientsCount");

// Initialisation
document.addEventListener("DOMContentLoaded", function () {
  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  loadClients();
  updateStatistics();
  showLimitInfo();
  setupEventListeners();
});

// Configuration des événements
function setupEventListeners() {
  clientForm.addEventListener("submit", handleFormSubmit);
  searchInput.addEventListener("input", loadClients);
  statusFilter.addEventListener("change", loadClients);
  exportBtn.addEventListener("click", exportToCSV);
  addClientBtn.addEventListener("click", openClientModal);
}

// === FONCTIONS PRINCIPALES ===

function handleFormSubmit(e) {
  e.preventDefault();

  const clientData = {
    name: clientNameInput.value.trim(),
    email: clientEmailInput.value.trim(),
    phone: clientPhoneInput.value.trim(),
    status: clientStatusSelect.value,
  };

  // Validations de base
  if (!clientData.name || !clientData.email) {
    showAlert("Le nom et l'email sont obligatoires", "error");
    return;
  }

  if (!isValidEmail(clientData.email)) {
    showAlert("Email invalide", "error");
    return;
  }

  if (isEditing) {
    updateClient(clientIdInput.value, clientData);
  } else {
    addClient(clientData);
  }

  closeClientModal();
  loadClients();
  updateStatistics();
}

function addClient(clientData) {
  // Vérifier la limite
  if (!canAddClient()) {
    showAlert(
      `Limite atteinte (${currentUser.clientLimit} clients maximum)`,
      "error"
    );
    return;
  }

  // Vérifier les doublons
  if (isEmailExists(clientData.email)) {
    showAlert("Email déjà utilisé", "error");
    return;
  }

  if (clientData.phone && isPhoneExists(clientData.phone)) {
    showAlert("Téléphone déjà utilisé", "error");
    return;
  }

  // Créer le client
  const newClient = {
    id: generateClientId(),
    name: clientData.name,
    email: clientData.email,
    phone: clientData.phone,
    status: clientData.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  clients.push(newClient);
  saveClients();
  showAlert("Client ajouté", "success");
  showLimitInfo();
}

function updateClient(clientId, clientData) {
  const clientIndex = clients.findIndex((c) => c.id === clientId);

  if (clientIndex === -1) return;

  // Vérifier les doublons pour la modification
  const otherClients = clients.filter((client) => client.id !== clientId);
  const emailExists = otherClients.some(
    (client) => client.email.toLowerCase() === clientData.email.toLowerCase()
  );
  const phoneExists =
    clientData.phone &&
    otherClients.some((client) => client.phone === clientData.phone);

  if (emailExists) {
    showAlert("Email déjà utilisé par un autre client", "error");
    return;
  }

  if (phoneExists) {
    showAlert("Téléphone déjà utilisé par un autre client", "error");
    return;
  }

  // Mettre à jour
  clients[clientIndex] = {
    ...clients[clientIndex],
    name: clientData.name,
    email: clientData.email,
    phone: clientData.phone,
    status: clientData.status,
    updatedAt: new Date().toISOString(),
  };

  saveClients();
  showAlert("Client modifié", "success");
}

function loadClients() {
  let filteredClients = [...clients];
  const searchTerm = searchInput.value.toLowerCase();
  const statusFilterValue = statusFilter.value;

  // Appliquer les filtres
  if (searchTerm) {
    filteredClients = filteredClients.filter(
      (client) =>
        client.name.toLowerCase().includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm) ||
        (client.phone && client.phone.includes(searchTerm))
    );
  }

  if (statusFilterValue) {
    filteredClients = filteredClients.filter(
      (client) => client.status === statusFilterValue
    );
  }

  // Mettre à jour l'interface
  clientsCountElement.textContent = filteredClients.length;

  if (filteredClients.length === 0) {
    showEmptyState();
    return;
  }

  showClientsTable(filteredClients);
}

function deleteClient(clientId) {
  if (!confirm("Supprimer ce client ?")) return;

  clients = clients.filter((c) => c.id !== clientId);

  // Supprimer les projets associés
  const projects = JSON.parse(localStorage.getItem("crm_projects") || "[]");
  const updatedProjects = projects.filter((p) => p.clientId !== clientId);
  localStorage.setItem("crm_projects", JSON.stringify(updatedProjects));

  saveClients();
  loadClients();
  updateStatistics();
  showLimitInfo();
  showAlert("Client supprimé", "success");
}

function editClient(clientId) {
  const client = clients.find((c) => c.id === clientId);
  if (!client) return;

  isEditing = true;
  const modalTitle = document.getElementById("modalTitle");
  modalTitle.innerHTML = '<i class="fas fa-edit"></i> Modifier le Client';
  formTitle.textContent = "Modifier le Client";
  submitBtn.innerHTML = '<i class="fas fa-edit"></i> Modifier';

  clientIdInput.value = client.id;
  clientNameInput.value = client.name;
  clientEmailInput.value = client.email;
  clientPhoneInput.value = client.phone || "";
  clientStatusSelect.value = client.status;

  clientModal.style.display = "block";
}

function viewProjects(clientId) {
  window.location.href = `projets.html?clientId=${clientId}`;
}

// === FONCTIONS UTILITAIRES ===

function canAddClient() {
  return (
    currentUser.type === "premium" || clients.length < currentUser.clientLimit
  );
}

function showLimitInfo() {
  const limitInfo = document.getElementById("limitInfo");
  if (!limitInfo) return;

  if (currentUser.type === "free") {
    const remaining = currentUser.clientLimit - clients.length;
    limitInfo.innerHTML = `
            <div class="limit-display free">
                <i class="fas fa-chart-line"></i>
                <strong>Compte Gratuit</strong><br>
                ${remaining} client(s) restant(s)
            </div>
        `;
  } else {
    limitInfo.innerHTML = `
            <div class="limit-display premium">
                <i class="fas fa-crown"></i>
                <strong>Compte Premium</strong><br>
                Clients illimités ✅
            </div>
        `;
  }
}

function isEmailExists(email) {
  return clients.some(
    (client) => client.email.toLowerCase() === email.toLowerCase()
  );
}

function isPhoneExists(phone) {
  return clients.some((client) => client.phone === phone);
}

function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function openClientModal() {
  isEditing = false;
  const modalTitle = document.getElementById("modalTitle");
  modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Ajouter un Client';
  formTitle.textContent = "Ajouter un Client";
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
  clientForm.reset();
  clientIdInput.value = "";
  clientStatusSelect.value = "actif";
  clientModal.style.display = "block";
}

function closeClientModal() {
  clientModal.style.display = "none";
  resetForm();
}

function resetForm() {
  isEditing = false;
  formTitle.textContent = "Ajouter un Client";
  submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
  clientForm.reset();
}

function updateStatistics() {
  const total = clients.length;
  const active = clients.filter((c) => c.status === "actif").length;
  const inactive = clients.filter((c) => c.status === "inactif").length;
  const lead = clients.filter((c) => c.status === "lead").length;

  // Calculer le pourcentage de clients actifs
  const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

  totalClientsElement.textContent = total;
  activeClientsElement.textContent = activePercentage + "%";
  activeCountElement.textContent = active;
  inactiveCountElement.textContent = inactive;
  leadCountElement.textContent = lead;
  clientsCountElement.textContent = total;
}

function saveClients() {
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
}

function showEmptyState() {
  clientsContainer.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>Aucun client trouvé</h3>
            <p>Aucun client ne correspond à vos critères.</p>
            <button class="btn btn-primary" onclick="clearFilters()">
                <i class="fas fa-times"></i>
                Effacer les filtres
            </button>
        </div>
    `;
}

function showClientsTable(filteredClients) {
  let tableHTML = `
      <table class="clients-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Email</th>
            <th>Téléphone</th>
            <th>Statut</th>
            <th>Date création</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

  filteredClients.forEach((client) => {
    tableHTML += `
            <tr>
                <td data-label="Client"><strong>${escapeHtml(
                  client.name
                )}</strong></td>
                <td data-label="Email"><i class="fas fa-envelope"></i> ${escapeHtml(
                  client.email
                )}</td>
                <td data-label="Téléphone">${
                  client.phone
                    ? `<i class="fas fa-phone"></i> ${escapeHtml(client.phone)}`
                    : ""
                }</td>
                <td data-label="Statut"><span class="status-badge status-${
                  client.status
                }">${getStatusText(client.status)}</span></td>
                <td data-label="Date création"><small>${formatDate(
                  client.createdAt
                )}</small></td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button onclick="viewProjects('${
                          client.id
                        }')" class="action-btn btn-info">
                            <i class="fas fa-folder"></i> Projets
                        </button>
                        <button onclick="editClient('${
                          client.id
                        }')" class="action-btn btn-warning">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button onclick="deleteClient('${
                          client.id
                        }')" class="action-btn btn-danger">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </td>
            </tr>
        `;
  });

  tableHTML += "</tbody></table>";
  clientsContainer.innerHTML = tableHTML;
}

function clearFilters() {
  searchInput.value = "";
  statusFilter.value = "";
  loadClients();
}

function exportToCSV() {
  if (clients.length === 0) {
    showAlert("Aucun client à exporter", "warning");
    return;
  }

  const projects = JSON.parse(localStorage.getItem("crm_projects") || "[]");
  const BOM = "\uFEFF";

  const headers = [
    "ID Client",
    "Nom",
    "Email",
    "Téléphone",
    "Statut",
    "Projets totaux",
    "Projets en cours",
    "Projets terminés",
    "Date création",
  ];
  let csvContent = BOM + headers.join(";") + "\n";

  clients.forEach((client) => {
    const clientProjects = projects.filter(
      (project) => project.clientId === client.id
    );
    const totalProjects = clientProjects.length;
    const activeProjects = clientProjects.filter(
      (p) => p.status === "en_cours"
    ).length;
    const completedProjects = clientProjects.filter(
      (p) => p.status === "terminé"
    ).length;

    const row = [
      `"${client.id}"`,
      `"${client.name}"`,
      `"${client.email}"`,
      `"${client.phone || ""}"`,
      `"${getStatusText(client.status)}"`,
      `"${totalProjects}"`,
      `"${activeProjects}"`,
      `"${completedProjects}"`,
      `"${formatDate(client.createdAt)}"`,
    ];
    csvContent += row.join(";") + "\n";
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `clients_detailed_${
    new Date().toISOString().split("T")[0]
  }.csv`;
  link.click();

  showAlert("Export CSV détaillé réussi", "success");
}

// === FONCTIONS GÉNÉRIQUES ===

function escapeHtml(text) {
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getStatusText(status) {
  const statusMap = { actif: "Actif", inactif: "Inactif", lead: "Lead" };
  return statusMap[status] || status;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("fr-FR");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAlert(message, type) {
  const alert = document.createElement("div");
  alert.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
    `;

  const colors = {
    success: "#28a745",
    error: "#dc3545",
    warning: "#ffc107",
  };

  alert.style.background = colors[type] || colors.success;
  alert.innerHTML = `<i class="fas fa-${
    type === "success" ? "check" : "exclamation-triangle"
  }"></i> ${message}`;

  document.body.appendChild(alert);

  setTimeout(() => alert.remove(), 3000);
}

// Exposer les fonctions globalement
window.editClient = editClient;
window.deleteClient = deleteClient;
window.viewProjects = viewProjects;
window.clearFilters = clearFilters;
window.closeClientModal = closeClientModal;
