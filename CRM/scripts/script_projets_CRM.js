// Constantes
const PROJECTS_KEY = "crm_projects";
const CLIENTS_KEY = "crm_clients";

// Variables globales (initialisées plus tard)
let projects = [];
let currentClientId = null;
let filteredProjects = [];

// Déclaration des éléments DOM (valeurs attribuées après chargement)
let clientNameElement,
    projectsContainer,
    addProjectBtn,
    projectModal,
    modalTitle,
    projectForm,
    searchInput,
    statusFilter,
    paymentFilter,
    totalProjectsElement,
    activeProjectsElement,
    completedProjectsElement,
    overdueProjectsElement,
    monthlyRevenueElement,
    totalRevenueElement;

// Initialisation après chargement du DOM
document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Initialisation de la page Projets");

    // 🔥 Récupérer les éléments DOM maintenant que la page est chargée
    clientNameElement = document.getElementById("clientName");
    projectsContainer = document.getElementById("projectsContainer");
    addProjectBtn = document.getElementById("addProjectBtn");
    projectModal = document.getElementById("projectModal");
    modalTitle = document.getElementById("modalTitle");
    projectForm = document.getElementById("projectForm");
    searchInput = document.getElementById("searchInput");
    statusFilter = document.getElementById("statusFilter");
    paymentFilter = document.getElementById("paymentFilter");
    totalProjectsElement = document.getElementById("totalProjects");
    activeProjectsElement = document.getElementById("activeProjects");
    completedProjectsElement = document.getElementById("completedProjects");
    overdueProjectsElement = document.getElementById("overdueProjects");
    monthlyRevenueElement = document.getElementById("monthlyRevenue");
    totalRevenueElement = document.getElementById("totalRevenue");

    // Récupérer l'ID du client depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    currentClientId = urlParams.get("clientId");

    if (!currentClientId) {
        alert("Client non spécifié");
        window.location.href = "index.html";
        return;
    }

    // Charger les données
    projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || "[]");
    
    // Charger l'interface
    loadClientData();
    loadProjects();
    updateStatistics();
    setupEventListeners();
});

// Charger les données du client
function loadClientData() {
    const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || "[]");
    const client = clients.find((c) => c.id === currentClientId);
    if (client && clientNameElement) {
        clientNameElement.textContent = `Projets de ${client.name}`;
    } else if (clientNameElement) {
        clientNameElement.textContent = "Projets du Client";
    }
}

// Charger et afficher les projets
function loadProjects() {
    const clientProjects = projects.filter((p) => p.clientId === currentClientId);
    filteredProjects = clientProjects;
    displayProjects(filteredProjects);
}

// Appliquer les filtres
function applyFilters() {
    const clientProjects = projects.filter((p) => p.clientId === currentClientId);
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    const paymentValue = paymentFilter ? paymentFilter.value : '';

    filteredProjects = clientProjects.filter((project) => {
        const displayStatus = getDisplayStatus(project);
        const isPaid = (project.paidAmount || 0) >= (project.amount || 0);

        const matchesSearch =
            !searchTerm ||
            project.title.toLowerCase().includes(searchTerm) ||
            (project.description && project.description.toLowerCase().includes(searchTerm));

        const matchesStatus = !statusValue || project.status === statusValue;

        const matchesPayment = !paymentValue ||
            (paymentValue === "paid" && isPaid) ||
            (paymentValue === "unpaid" && !isPaid);

        return matchesSearch && matchesStatus && matchesPayment;
    });

    displayProjects(filteredProjects);
}

// Fonction pour obtenir le statut affiché (avec détection "en retard")
function getDisplayStatus(project) {
    if (project.status === "terminé") return "terminé";
    if (project.dueDate && new Date(project.dueDate) < new Date()) return "en_retard";
    return project.status;
}

// Afficher les projets
function displayProjects(projectsToDisplay) {
    if (!projectsContainer) return;

    if (projectsToDisplay.length === 0) {
        projectsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Aucun projet trouvé</h3>
                <p>Ajustez vos filtres ou créez un nouveau projet.</p>
                <button class="btn btn-primary" onclick="triggerAddProject()">
                    <i class="fas fa-plus"></i> Créer un projet
                </button>
            </div>
        `;
        return;
    }

    const table = document.createElement("table");
    table.className = "projects-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Projet</th>
            <th>Description</th>
            <th>Statut</th>
            <th>Échéance</th>
            <th>Montant (MAD)</th>
            <th>Date création</th>
            <th>Actions</th>
        </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    projectsToDisplay.forEach((project) => {
        const displayStatus = getDisplayStatus(project);
        const isOverdue = displayStatus === "en_retard";
        const paidAmount = project.paidAmount || 0;
        const totalAmount = project.amount || 0;
        const remaining = totalAmount - paidAmount;
        const isFullyPaid = paidAmount >= totalAmount;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="Projet">
                <div style="font-weight: 600; color: var(--dark); margin-bottom: 4px;">${escapeHtml(project.title)}</div>
            </td>
            <td data-label="Description">
                <div style="color: var(--gray); line-height: 1.4;">${escapeHtml(project.description || "Aucune description")}</div>
            </td>
            <td data-label="Statut">
                <span class="status-badge status-${displayStatus}">${getStatusText(displayStatus)}</span>
            </td>
            <td data-label="Échéance" ${isOverdue ? 'style="color: var(--danger); font-weight: 600;"' : ""}>
                ${project.dueDate ? formatDate(project.dueDate) : "Non définie"}
                ${isOverdue ? ' <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>' : ""}
            </td>
            <td data-label="Montant (MAD)">
                <div style="font-weight: 600; color: var(--dark);">
                    ${totalAmount ? totalAmount.toLocaleString('fr-FR') + ' MAD' : '—'}
                </div>
                <div style="font-size: 0.85rem; color: var(--gray);">
                    Payé: ${paidAmount.toLocaleString('fr-FR')} MAD
                </div>
                <div style="font-size: 0.85rem; ${isFullyPaid ? 'color: var(--success); font-weight: 600;' : 'color: var(--danger);'}">
                    Reste: ${remaining.toLocaleString('fr-FR')} MAD
                </div>
            </td>
            <td data-label="Date création">
                <div style="font-size: 0.9rem; color: var(--gray);">${formatDate(project.createdAt)}</div>
            </td>
            <td data-label="Actions">
                <div class="action-buttons">
                    <button onclick="editProject('${project.id}')" class="action-btn btn-warning">
                        <i class="fas fa-edit"></i> Modifier
                    </button>
                    <button onclick="deleteProject('${project.id}')" class="action-btn btn-danger">
                        <i class="fas fa-trash"></i> Supprimer
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    projectsContainer.innerHTML = "";
    projectsContainer.appendChild(table);
}

// Mettre à jour les statistiques
function updateStatistics() {
    const clientProjects = projects.filter((p) => p.clientId === currentClientId);
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const total = clientProjects.length;
    const active = clientProjects.filter(p => p.status === "en_cours").length;
    const completed = clientProjects.filter(p => p.status === "terminé").length;
    const overdue = clientProjects.filter(p => 
        p.status !== "terminé" && p.dueDate && new Date(p.dueDate) < now
    ).length;

    // 🔥 Calcul basé sur paidAmount
    const monthlyRevenue = clientProjects
        .filter(p => {
            const created = new Date(p.createdAt);
            return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
        })
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    const totalRevenue = clientProjects
        .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

    if (totalProjectsElement) totalProjectsElement.textContent = total;
    if (activeProjectsElement) activeProjectsElement.textContent = active;
    if (completedProjectsElement) completedProjectsElement.textContent = completed;
    if (overdueProjectsElement) overdueProjectsElement.textContent = overdue;
    if (monthlyRevenueElement) monthlyRevenueElement.textContent = monthlyRevenue.toLocaleString('fr-FR') + ' MAD';
    if (totalRevenueElement) totalRevenueElement.textContent = totalRevenue.toLocaleString('fr-FR') + ' MAD';
}

// Configurer les écouteurs d'événements
function setupEventListeners() {
    if (addProjectBtn) {
        addProjectBtn.addEventListener("click", openAddModal);
    }
    if (projectForm) {
        projectForm.addEventListener("submit", handleFormSubmit);
    }
    if (searchInput) {
        searchInput.addEventListener("input", debounce(applyFilters, 300));
    }
    if (statusFilter) {
        statusFilter.addEventListener("change", applyFilters);
    }
    if (paymentFilter) {
        paymentFilter.addEventListener("change", applyFilters);
    }
    if (projectModal) {
        projectModal.addEventListener("click", function(e) {
            if (e.target === projectModal) closeModal();
        });
    }
}

// Ouvrir le modal d'ajout
function openAddModal() {
    if (!modalTitle || !projectForm || !projectModal) return;

    modalTitle.innerHTML = '<i class="fas fa-plus"></i> Nouveau Projet';
    projectForm.reset();
    document.getElementById("projectId").value = "";
    document.getElementById("projectStatus").value = "en_cours";
    // Valeur par défaut pour paidAmount
    document.getElementById("projectPaidAmount").value = "0";
    
    const today = new Date().toISOString().split("T")[0];
    const dueDateInput = document.getElementById("projectDueDate");
    if (dueDateInput) dueDateInput.min = today;

    projectModal.style.display = "block";
}

// Fonction utilitaire pour le bouton dans l'état vide
function triggerAddProject() {
    if (addProjectBtn) addProjectBtn.click();
}

// Fermer le modal
function closeModal() {
    if (projectModal) projectModal.style.display = "none";
}

// Gérer la soumission du formulaire
function handleFormSubmit(e) {
    e.preventDefault();

    const projectId = document.getElementById("projectId").value;
    const title = document.getElementById("projectTitle").value.trim();
    const description = document.getElementById("projectDescription").value.trim();
    const status = document.getElementById("projectStatus").value;
    const dueDate = document.getElementById("projectDueDate").value;
    const amount = parseFloat(document.getElementById("projectAmount").value) || 0;
    const paidAmount = parseFloat(document.getElementById("projectPaidAmount").value) || 0;

    if (!title || amount <= 0) {
        showAlert("Le titre et un montant total > 0 sont obligatoires", "error");
        return;
    }

    if (paidAmount > amount) {
        showAlert("Le montant payé ne peut pas être supérieur au montant total", "error");
        return;
    }

    if (projectId) {
        updateProject(projectId, { title, description, status, dueDate, amount, paidAmount });
    } else {
        addProject({ title, description, status, dueDate, amount, paidAmount });
    }

    closeModal();
    loadProjects();
    updateStatistics();
}

// Ajouter un projet
function addProject(projectData) {
    const newProject = {
        id: "project_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
        clientId: currentClientId,
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        dueDate: projectData.dueDate,
        amount: projectData.amount,
        paidAmount: projectData.paidAmount || 0, // 🔥
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    projects.push(newProject);
    saveProjects();
    showAlert("Projet ajouté avec succès!", "success");
}

// Modifier un projet
function updateProject(projectId, projectData) {
    const projectIndex = projects.findIndex((p) => p.id === projectId);
    if (projectIndex !== -1) {
        projects[projectIndex] = { ...projects[projectIndex], ...projectData, updatedAt: new Date().toISOString() };
        saveProjects();
        showAlert("Projet modifié avec succès!", "success");
    }
}

// Éditer un projet
function editProject(projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (project && modalTitle && projectModal) {
        modalTitle.innerHTML = '<i class="fas fa-edit"></i> Modifier le Projet';
        document.getElementById("projectId").value = project.id;
        document.getElementById("projectTitle").value = project.title;
        document.getElementById("projectDescription").value = project.description || "";
        document.getElementById("projectStatus").value = project.status;
        document.getElementById("projectDueDate").value = project.dueDate || "";
        document.getElementById("projectAmount").value = project.amount || "";
        document.getElementById("projectPaidAmount").value = project.paidAmount || 0; // 🔥
        projectModal.style.display = "block";
    }
}

// Supprimer un projet
function deleteProject(projectId) {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce projet ?")) {
        projects = projects.filter((p) => p.id !== projectId);
        saveProjects();
        applyFilters();
        updateStatistics();
        showAlert("Projet supprimé avec succès!", "success");
    }
}

// Sauvegarder les projets
function saveProjects() {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// Fonctions utilitaires
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function getStatusText(status) {
    const map = { en_cours: "En cours", terminé: "Terminé", en_retard: "En retard" };
    return map[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("fr-FR");
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

function showAlert(message, type) {
    const alert = document.createElement("div");
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === "success" ? "check" : "exclamation-triangle"}"></i>
        ${message}
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.body.appendChild(alert);
    setTimeout(() => {
        if (alert.parentElement) alert.remove();
    }, 5000);
}

// Exposer les fonctions globalement
window.editProject = editProject;
window.deleteProject = deleteProject;
window.closeModal = closeModal;
window.triggerAddProject = triggerAddProject;