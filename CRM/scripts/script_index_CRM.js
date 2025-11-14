// ==============================
// CONFIGURATION ET INITIALISATION
// ==============================

// Constantes
const CURRENT_USER_KEY = "crm_current_user";
const CLIENTS_KEY = "crm_clients";
const PROJECTS_KEY = "crm_projects";

// État global
let currentUser = null;
let clients = [];
let isEditing = false;

// Éléments DOM principaux
const elements = {
    // Authentification
    userName: document.getElementById("userName"),
    userRole: document.getElementById("userRole"),
    logoutBtn: document.getElementById("logoutBtn"),
    
    // Formulaire client
    clientForm: document.getElementById("clientForm"),
    clientId: document.getElementById("clientId"),
    clientName: document.getElementById("clientName"),
    clientEmail: document.getElementById("clientEmail"),
    clientPhone: document.getElementById("clientPhone"),
    clientStatus: document.getElementById("clientStatus"),
    formTitle: document.getElementById("formTitle"),
    submitBtn: document.getElementById("submitBtn"),
    
    // Filtres et recherche
    searchInput: document.getElementById("searchInput"),
    statusFilter: document.getElementById("statusFilter"),
    sortBy: document.getElementById("sortBy"),
    clearSearchBtn: document.getElementById("clearSearchBtn"),
    
    // Boutons d'action
    exportBtn: document.getElementById("exportBtn"),
    addClientBtn: document.getElementById("addClientBtn"),
    addFirstClientBtn: document.getElementById("addFirstClientBtn"),
    
    // Conteneurs
    clientsContainer: document.getElementById("clientsContainer"),
    clientModal: document.getElementById("clientModal"),
    limitInfo: document.getElementById("limitInfo"),
    lastUpdate: document.getElementById("lastUpdate"),
    
    // Statistiques
    totalClients: document.getElementById("totalClients"),
    activePercentage: document.getElementById("activePercentage"),
    activeClients: document.getElementById("activeClients"),
    monthGrowth: document.getElementById("monthGrowth"),
    clientsCount: document.getElementById("clientsCount"),
    activeCount: document.getElementById("activeCount"),
    inactiveCount: document.getElementById("inactiveCount"),
    leadCount: document.getElementById("leadCount")
};

// Variables pour les graphiques
let statusPieChart = null;
let monthlyLineChart = null;

// ==============================
// INITIALISATION DE L'APPLICATION
// ==============================

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Initialisation de l'application CRM");
    initializeApp();
});

function initializeApp() {
    console.log("🔍 Vérification de l'authentification...");
    
    // Vérifier l'authentification AVEC LA BONNE CLÉ
    const storedUser = localStorage.getItem(CURRENT_USER_KEY);
    console.log("📦 Utilisateur stocké:", storedUser);
    
    if (!storedUser) {
        console.log("❌ Aucun utilisateur trouvé, redirection vers login");
        window.location.href = "login.html";
        return;
    }

    try {
        // Parser l'utilisateur
        currentUser = JSON.parse(storedUser);
        console.log("✅ Utilisateur connecté:", currentUser);
        
        // Vérifier la structure de l'utilisateur
        if (!currentUser.username || !currentUser.accountType) {
            console.error("❌ Structure utilisateur invalide");
            throw new Error("Structure utilisateur invalide");
        }

    } catch (error) {
        console.error("❌ Erreur lors du parsing de l'utilisateur:", error);
        localStorage.removeItem(CURRENT_USER_KEY);
        window.location.href = "login.html";
        return;
    }

    // VIDER LE LOCALSTORAGE DES CLIENTS AU PREMIER CONNEXION
    clearClientsOnFirstLogin();

    // Initialiser l'application
    loadClientsData();
    initializeUI();
    setupEventListeners();
    initializeCharts();
    updateDashboard();
    
    console.log("🎉 Application CRM initialisée avec succès");
}

function clearClientsOnFirstLogin() {
    // Vérifier si c'est la première connexion de cet utilisateur
    const lastUser = localStorage.getItem('last_logged_user');
    const currentUsername = currentUser.username;
    
    if (lastUser !== currentUsername) {
        console.log("🆕 Nouvel utilisateur détecté, vidage des clients...");
        localStorage.removeItem(CLIENTS_KEY);
        localStorage.removeItem(PROJECTS_KEY);
        localStorage.setItem('last_logged_user', currentUsername);
    } else {
        console.log("👤 Même utilisateur, conservation des clients");
    }
}

function loadClientsData() {
    const storedClients = localStorage.getItem(CLIENTS_KEY);
    clients = storedClients ? JSON.parse(storedClients) : [];
    console.log(`📊 ${clients.length} clients chargés`);
}

function initializeUI() {
    console.log("🎨 Initialisation de l'interface utilisateur");
    displayUserInfo();
    showLimitInfo();
    updateLastUpdateTime();
    // FORCER LE CHARGEMENT DES CLIENTS
    loadClients();
}

// ==============================
// GESTION DE L'INTERFACE UTILISATEUR
// ==============================

function displayUserInfo() {
    console.log("👤 Affichage des informations utilisateur");
    
    if (!currentUser) {
        console.error("❌ currentUser est null");
        return;
    }
    
    if (elements.userName && elements.userRole) {
        // Utiliser firstName + lastName ou username
        let displayName;
        if (currentUser.firstName && currentUser.lastName) {
            displayName = `${currentUser.firstName} ${currentUser.lastName}`;
        } else {
            displayName = currentUser.username || "Utilisateur";
        }
        
        elements.userName.textContent = displayName;
        
        // accountType au lieu de type
        const roleText = currentUser.accountType === 'premium' ? 'Compte Premium' : 'Compte Gratuit';
        elements.userRole.textContent = roleText;
        
        // Ajouter une classe pour le style premium
        if (currentUser.accountType === 'premium') {
            elements.userRole.classList.add('premium-badge');
        }
        
        console.log("✅ Informations utilisateur affichées:", displayName, roleText);
    } else {
        console.error("❌ Éléments user non trouvés dans le DOM");
    }
}

function showLimitInfo() {
    if (!elements.limitInfo) return;

    if (!currentUser) {
        console.error("❌ currentUser est null dans showLimitInfo");
        return;
    }

    // Utiliser accountType au lieu de type
    if (currentUser.accountType === "free") {
        const clientLimit = currentUser.clientLimit || 10; // Valeur par défaut
        const remaining = clientLimit - clients.length;
        const percentage = Math.round((clients.length / clientLimit) * 100);
        
        elements.limitInfo.innerHTML = `
            <div class="limit-display free">
                <i class="fas fa-chart-line"></i>
                <div class="limit-content">
                    <strong>Compte Gratuit</strong>
                    <div class="limit-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${percentage}%"></div>
                        </div>
                        <span>${clients.length}/${clientLimit} clients (${remaining} restant(s))</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        elements.limitInfo.innerHTML = `
            <div class="limit-display premium">
                <i class="fas fa-crown"></i>
                <div class="limit-content">
                    <strong>Compte Premium</strong>
                    <span>Clients illimités • Fonctionnalités avancées</span>
                </div>
            </div>
        `;
    }
}

function updateLastUpdateTime() {
    if (elements.lastUpdate) {
        const now = new Date();
        elements.lastUpdate.textContent = `Dernière mise à jour: ${now.toLocaleTimeString('fr-FR')}`;
    }
}

// ==============================
// GESTION DES ÉVÉNEMENTS
// ==============================

function setupEventListeners() {
    console.log("🎯 Configuration des événements");
    
    // Formulaire client
    if (elements.clientForm) {
        elements.clientForm.addEventListener("submit", handleFormSubmit);
    }
    
    // Recherche et filtres
    if (elements.searchInput) {
        elements.searchInput.addEventListener("input", debounce(loadClients, 300));
    }
    
    if (elements.statusFilter) {
        elements.statusFilter.addEventListener("change", loadClients);
    }
    
    if (elements.sortBy) {
        elements.sortBy.addEventListener("change", loadClients);
    }
    
    if (elements.clearSearchBtn) {
        elements.clearSearchBtn.addEventListener("click", clearSearch);
    }
    
    // Boutons d'action
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener("click", exportToCSV);
    }
    
    if (elements.addClientBtn) {
        elements.addClientBtn.addEventListener("click", openClientModal);
    }
    
    if (elements.addFirstClientBtn) {
        elements.addFirstClientBtn.addEventListener("click", openClientModal);
    }
    
    // Authentification
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", handleLogout);
    }
    
    // Fermer le modal en cliquant à l'extérieur
    if (elements.clientModal) {
        elements.clientModal.addEventListener("click", function(e) {
            if (e.target === elements.clientModal) {
                closeClientModal();
            }
        });
    }
}

// ==============================
// GESTION DES CLIENTS
// ==============================

function handleFormSubmit(e) {
    e.preventDefault();

    const clientData = {
        name: elements.clientName.value.trim(),
        email: elements.clientEmail.value.trim(),
        phone: elements.clientPhone.value.trim(),
        status: elements.clientStatus.value
    };

    // Validation
    if (!validateClientData(clientData)) {
        return;
    }

    if (isEditing) {
        updateClient(elements.clientId.value, clientData);
    } else {
        addClient(clientData);
    }

    closeClientModal();
    // FORCER LE RECHARGEMENT DES DONNÉES
    loadClientsData();
    loadClients();
    updateDashboard();
}

function addClient(clientData) {
    // Vérifier la limite - utiliser accountType
    if (!canAddClient()) {
        const clientLimit = currentUser.clientLimit || 10;
        showAlert(`Limite atteinte (${clientLimit} clients maximum)`, "error");
        return;
    }

    // Vérifier les doublons
    if (isEmailExists(clientData.email)) {
        showAlert("Un client avec cet email existe déjà", "error");
        return;
    }

    // Créer le client
    const newClient = {
        id: generateClientId(),
        ...clientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    clients.push(newClient);
    saveClients();
    showAlert("Client ajouté avec succès", "success");
    showLimitInfo();
}

function updateClient(clientId, clientData) {
    const clientIndex = clients.findIndex((c) => c.id === clientId);

    if (clientIndex === -1) {
        showAlert("Client non trouvé", "error");
        return;
    }

    // Vérifier les doublons pour la modification
    const otherClients = clients.filter((client) => client.id !== clientId);
    const emailExists = otherClients.some(
        (client) => client.email.toLowerCase() === clientData.email.toLowerCase()
    );

    if (emailExists) {
        showAlert("Cet email est déjà utilisé par un autre client", "error");
        return;
    }

    // Mettre à jour
    clients[clientIndex] = {
        ...clients[clientIndex],
        ...clientData,
        updatedAt: new Date().toISOString(),
    };

    saveClients();
    showAlert("Client modifié avec succès", "success");
}

function loadClients() {
    console.log("🔄 Chargement des clients dans l'interface");
    
    let filteredClients = [...clients];
    const searchTerm = elements.searchInput ? elements.searchInput.value.toLowerCase() : '';
    const statusFilterValue = elements.statusFilter ? elements.statusFilter.value : '';
    const sortByValue = elements.sortBy ? elements.sortBy.value : 'name';

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

    // Appliquer le tri
    filteredClients.sort((a, b) => {
        switch (sortByValue) {
            case 'date':
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'status':
                return a.status.localeCompare(b.status);
            case 'name':
            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Mettre à jour l'interface
    if (elements.clientsCount) {
        elements.clientsCount.textContent = filteredClients.length;
    }

    if (filteredClients.length === 0) {
        showEmptyState();
    } else {
        showClientsTable(filteredClients);
    }
    
    console.log(`📋 ${filteredClients.length} clients affichés`);
}

// ==============================
// FONCTIONS D'INTERACTION
// ==============================

function openClientModal() {
    isEditing = false;
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Ajouter un Client';
    }
    if (elements.formTitle) elements.formTitle.textContent = "Ajouter un Client";
    if (elements.submitBtn) elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    
    if (elements.clientForm) elements.clientForm.reset();
    if (elements.clientId) elements.clientId.value = "";
    if (elements.clientStatus) elements.clientStatus.value = "actif";
    if (elements.clientModal) elements.clientModal.style.display = "block";
    
    // Focus sur le premier champ
    setTimeout(() => {
        if (elements.clientName) elements.clientName.focus();
    }, 100);
}

function editClient(clientId) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    isEditing = true;
    const modalTitle = document.getElementById("modalTitle");
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Modifier le Client';
    }
    if (elements.formTitle) elements.formTitle.textContent = "Modifier le Client";
    if (elements.submitBtn) elements.submitBtn.innerHTML = '<i class="fas fa-edit"></i> Modifier';

    if (elements.clientId) elements.clientId.value = client.id;
    if (elements.clientName) elements.clientName.value = client.name;
    if (elements.clientEmail) elements.clientEmail.value = client.email;
    if (elements.clientPhone) elements.clientPhone.value = client.phone || "";
    if (elements.clientStatus) elements.clientStatus.value = client.status;

    if (elements.clientModal) elements.clientModal.style.display = "block";
}

function deleteClient(clientId) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.")) {
        return;
    }

    clients = clients.filter((c) => c.id !== clientId);
    saveClients();
    // FORCER LE RECHARGEMENT
    loadClientsData();
    loadClients();
    updateDashboard();
    showLimitInfo();
    showAlert("Client supprimé avec succès", "success");
}

function viewProjects(clientId) {
    // Sauvegarder l'ID du client pour la page projets
    localStorage.setItem('current_client_id', clientId);
    // Redirection vers la page des projets avec l'ID du client
    window.location.href = `projets.html?clientId=${clientId}`;
}

function closeClientModal() {
    if (elements.clientModal) {
        elements.clientModal.style.display = "none";
    }
    resetForm();
}

// ==============================
// FONCTIONS UTILITAIRES
// ==============================

function canAddClient() {
    if (!currentUser) {
        console.error("❌ currentUser est null dans canAddClient");
        return false;
    }
    // Utiliser accountType et clientLimit
    return currentUser.accountType === "premium" || 
           clients.length < (currentUser.clientLimit || 10);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validateClientData(clientData) {
    if (!clientData.name || !clientData.email) {
        showAlert("Le nom et l'email sont obligatoires", "error");
        return false;
    }

    if (!isValidEmail(clientData.email)) {
        showAlert("Format d'email invalide", "error");
        return false;
    }

    return true;
}

function isEmailExists(email) {
    return clients.some(
        (client) => client.email.toLowerCase() === email.toLowerCase()
    );
}

function generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function saveClients() {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
    console.log("💾 Clients sauvegardés dans le localStorage");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function getStatusText(status) {
    const statusMap = { 
        actif: "Actif", 
        inactif: "Inactif", 
        lead: "Lead" 
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString("fr-FR");
}

function showAlert(message, type = "info") {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${getAlertIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    document.body.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: "check-circle",
        error: "exclamation-circle",
        warning: "exclamation-triangle",
        info: "info-circle"
    };
    return icons[type] || "info-circle";
}

function resetForm() {
    isEditing = false;
    if (elements.formTitle) elements.formTitle.textContent = "Ajouter un Client";
    if (elements.submitBtn) elements.submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    if (elements.clientForm) elements.clientForm.reset();
}

function clearSearch() {
    if (elements.searchInput) {
        elements.searchInput.value = "";
        loadClients();
    }
}

function clearFilters() {
    if (elements.searchInput) elements.searchInput.value = "";
    if (elements.statusFilter) elements.statusFilter.value = "";
    if (elements.sortBy) elements.sortBy.value = "name";
    loadClients();
}

// ==============================
// TABLEAU DE BORD ET STATISTIQUES
// ==============================

function updateDashboard() {
    updateStatistics();
    updateCharts();
    updateLastUpdateTime();
}

function updateStatistics() {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'actif').length;
    const inactive = clients.filter(c => c.status === 'inactif').length;
    const lead = clients.filter(c => c.status === 'lead').length;

    // Calculer les pourcentages
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;
    
    // Calculer les nouveaux clients ce mois-ci
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthGrowth = clients.filter(client => {
        const clientDate = new Date(client.createdAt);
        return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
    }).length;

    // Mettre à jour les éléments
    if (elements.totalClients) elements.totalClients.textContent = total;
    if (elements.activePercentage) elements.activePercentage.textContent = activePercentage + "%";
    if (elements.activeClients) elements.activeClients.textContent = active;
    if (elements.monthGrowth) elements.monthGrowth.textContent = "+" + monthGrowth;
    
    if (elements.activeCount) elements.activeCount.textContent = active;
    if (elements.inactiveCount) elements.inactiveCount.textContent = inactive;
    if (elements.leadCount) elements.leadCount.textContent = lead;
}

// ==============================
// GRAPHIQUES - CORRIGÉS
// ==============================

function initializeCharts() {
    console.log("📈 Initialisation des graphiques");
    createStatusPieChart();
    createMonthlyLineChart();
}

function createStatusPieChart() {
    const ctx = document.getElementById('statusPieChart');
    if (!ctx) {
        console.error("❌ Canvas statusPieChart non trouvé");
        return;
    }

    // Détruire le graphique existant
    if (statusPieChart) {
        statusPieChart.destroy();
    }

    const statusCounts = {
        actif: clients.filter(c => c.status === 'actif').length,
        inactif: clients.filter(c => c.status === 'inactif').length,
        lead: clients.filter(c => c.status === 'lead').length
    };

    statusPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Actifs', 'Inactifs', 'Leads'],
            datasets: [{
                data: [statusCounts.actif, statusCounts.inactif, statusCounts.lead],
                backgroundColor: [
                    '#4cc9f0', // Actif
                    '#6c757d', // Inactif
                    '#f8961e'  // Lead
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

function createMonthlyLineChart() {
    const ctx = document.getElementById('monthlyLineChart');
    if (!ctx) {
        console.error("❌ Canvas monthlyLineChart non trouvé");
        return;
    }

    // Détruire le graphique existant
    if (monthlyLineChart) {
        monthlyLineChart.destroy();
    }

    const monthlyData = generateMonthlyData();
    
    monthlyLineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
            datasets: [{
                label: 'Nouveaux clients',
                data: monthlyData,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function generateMonthlyData() {
    const monthlyCounts = new Array(12).fill(0);
    
    clients.forEach(client => {
        const month = new Date(client.createdAt).getMonth();
        monthlyCounts[month]++;
    });
    
    return monthlyCounts;
}

function updateCharts() {
    console.log("🔄 Mise à jour des graphiques");
    createStatusPieChart();
    createMonthlyLineChart();
}

// ==============================
// AUTHENTIFICATION - CORRIGÉE
// ==============================

function handleLogout() {
    if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
        // VIDER TOUTES LES DONNÉES SAUF L'UTILISATEUR COURANT (pour la redirection)
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(CLIENTS_KEY);
        localStorage.removeItem(PROJECTS_KEY);
        localStorage.removeItem('last_logged_user');
        localStorage.removeItem('current_client_id');
        
        window.location.href = "login.html";
    }
}

// ==============================
// EXPORT CSV AMÉLIORÉ
// ==============================

function exportToCSV() {
    if (clients.length === 0) {
        showAlert("Aucun client à exporter", "warning");
        return;
    }

    const projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
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

// ==============================
// FONCTIONS GLOBALES
// ==============================

window.editClient = editClient;
window.deleteClient = deleteClient;
window.viewProjects = viewProjects;
window.closeClientModal = closeClientModal;
window.clearFilters = clearFilters;
window.clearSearch = clearSearch;
window.openClientModal = openClientModal;

// Fonction pour afficher le tableau des clients
function showClientsTable(filteredClients) {
    let tableHTML = `
        <div class="table-responsive">
            <table class="clients-table">
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Contact</th>
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
                <td data-label="Client">
                    <div class="client-info">
                        <strong>${escapeHtml(client.name)}</strong>
                    </div>
                </td>
                <td data-label="Contact">
                    <div class="contact-info">
                        <div><i class="fas fa-envelope"></i> ${escapeHtml(client.email)}</div>
                        ${client.phone ? `<div><i class="fas fa-phone"></i> ${escapeHtml(client.phone)}</div>` : '<div><i class="fas fa-phone"></i> Non renseigné</div>'}
                    </div>
                </td>
                <td data-label="Statut">
                    <span class="status-badge status-${client.status}">
                        ${getStatusText(client.status)}
                    </span>
                </td>
                <td data-label="Date création">
                    <small>${formatDate(client.createdAt)}</small>
                </td>
                <td data-label="Actions">
                    <div class="action-buttons">
                        <button onclick="viewProjects('${client.id}')" class="action-btn btn-info" title="Voir les projets">
                            <i class="fas fa-folder"></i>
                        </button>
                        <button onclick="editClient('${client.id}')" class="action-btn btn-warning" title="Modifier">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteClient('${client.id}')" class="action-btn btn-danger" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += "</tbody></table></div>";
    
    if (elements.clientsContainer) {
        elements.clientsContainer.innerHTML = tableHTML;
    }
}

function showEmptyState() {
    const searchTerm = elements.searchInput ? elements.searchInput.value : '';
    const statusFilterValue = elements.statusFilter ? elements.statusFilter.value : '';
    
    let message = "Aucun client trouvé";
    let description = "Commencez par ajouter votre premier client à votre base de données.";
    
    if (searchTerm || statusFilterValue) {
        message = "Aucun client ne correspond à vos critères";
        description = "Essayez de modifier vos filtres ou votre recherche.";
    }

    if (elements.clientsContainer) {
        elements.clientsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>${message}</h3>
                <p>${description}</p>
                ${(searchTerm || statusFilterValue) ? `
                    <button class="btn btn-outline" onclick="clearFilters()">
                        <i class="fas fa-times"></i>
                        Effacer les filtres
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="openClientModal()">
                        <i class="fas fa-user-plus"></i>
                        Ajouter votre premier client
                    </button>
                `}
            </div>
        `;
    }
}