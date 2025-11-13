// Gestionnaire de tâches asynchrone avec bonnes pratiques
class TaskManager {
    constructor() {
        this.tasks = [];
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.isLoading = false;
        
        this.initializeElements();
        this.setupEventListeners();
        this.showWelcomeMessage();
    }

    // Initialisation des éléments DOM
    initializeElements() {
        this.elements = {
            loadBtn: document.getElementById('load'),
            statusEl: document.getElementById('status'),
            tasksList: document.getElementById('liste'),
            addTaskBtn: document.getElementById('add-task'),
            taskModal: document.getElementById('task-modal'),
            cancelTaskBtn: document.getElementById('cancel-task'),
            cancelBtn: document.getElementById('cancel-btn'),
            saveTaskBtn: document.getElementById('save-task'),
            newTaskInput: document.getElementById('new-task-input'),
            searchInput: document.getElementById('search'),
            filterBtns: document.querySelectorAll('.filter-btn'),
            notification: document.getElementById('notification'),
            totalTasksEl: document.getElementById('total-tasks'),
            completedTasksEl: document.getElementById('completed-tasks')
        };
    }

    // Configuration des écouteurs d'événements
    setupEventListeners() {
        // Chargement des tâches
        this.elements.loadBtn.addEventListener('click', () => this.loadTasks());
        
        // Gestion des tâches
        this.elements.addTaskBtn.addEventListener('click', () => this.showTaskModal());
        this.elements.cancelTaskBtn.addEventListener('click', () => this.hideTaskModal());
        this.elements.cancelBtn.addEventListener('click', () => this.hideTaskModal());
        this.elements.saveTaskBtn.addEventListener('click', () => this.handleAddTask());
        this.elements.newTaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });
        
        // Filtrage et recherche
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterChange(e.target.dataset.filter));
        });
        this.elements.searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.debounce(() => this.renderTasks(), 300)();
        });
        
        // Fermeture modale
        this.elements.taskModal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) this.hideTaskModal();
        });
    }

    // Debounce pour la recherche
    debounce(func, wait) {
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

    // Message de bienvenue
    showWelcomeMessage() {
        this.elements.statusEl.innerHTML = `
            <div class="welcome-message">
                <h3>Bienvenue dans TaskFlow</h3>
                <p>Cliquez sur "Charger les tâches" pour commencer</p>
            </div>
        `;
    }

    // Chargement asynchrone des tâches avec gestion d'erreur
    async loadTasks() {
        if (this.isLoading) return;
        
        this.setLoadingState(true);
        
        try {
            await this.showLoadingState('Chargement des tâches...');
            
            // Simulation de délai réseau
            await this.delay(1000);
            
            const data = await this.fetchTasksFromAPI();
            this.tasks = data.slice(0, 10).map(task => this.transformTaskData(task));
            
            await this.showSuccessState(`${this.tasks.length} tâches chargées avec succès`);
            this.renderTasks();
            this.updateStatistics();
            
        } catch (error) {
            await this.handleError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Récupération des tâches depuis l'API
    async fetchTasksFromAPI() {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    }

    // Transformation des données de tâche
    transformTaskData(task) {
        return {
            ...task,
            createdAt: new Date(),
            localId: `local_${Date.now()}_${task.id}`
        };
    }

    // Gestion de l'ajout de tâche
    async handleAddTask() {
        const title = this.elements.newTaskInput.value.trim();
        
        if (!title) {
            this.showNotification('Veuillez saisir une description pour la tâche', 'warning');
            return;
        }

        try {
            const newTask = await this.createNewTask(title);
            this.tasks.unshift(newTask);
            this.hideTaskModal();
            this.renderTasks();
            this.updateStatistics();
            
            this.showNotification('Tâche ajoutée avec succès', 'success');
            this.elements.newTaskInput.value = '';
            
        } catch (error) {
            this.showNotification('Erreur lors de la création de la tâche', 'error');
        }
    }

    // Création d'une nouvelle tâche
    async createNewTask(title) {
        // Simulation d'une opération asynchrone
        await this.delay(200);
        
        return {
            id: Date.now(),
            title: title,
            completed: false,
            createdAt: new Date(),
            userId: 1,
            localId: `local_${Date.now()}`
        };
    }

    // Basculer l'état d'une tâche
    async toggleTask(taskId) {
        const task = this.tasks.find(t => t.localId === taskId);
        if (!task) return;

        try {
            // Simulation d'une opération asynchrone
            await this.delay(300);
            
            task.completed = !task.completed;
            this.renderTasks();
            this.updateStatistics();
            
            const message = task.completed ? 'Tâche marquée comme terminée' : 'Tâche remise en cours';
            this.showNotification(message, 'success');
            
        } catch (error) {
            this.showNotification('Erreur lors de la modification', 'error');
        }
    }

    // Supprimer une tâche
    async deleteTask(taskId) {
        try {
            // Simulation d'une opération asynchrone
            await this.delay(300);
            
            this.tasks = this.tasks.filter(t => t.localId !== taskId);
            this.renderTasks();
            this.updateStatistics();
            
            this.showNotification('Tâche supprimée', 'warning');
            
        } catch (error) {
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    // Filtrage des tâches
    handleFilterChange(filter) {
        this.currentFilter = filter;
        
        // Mise à jour des boutons de filtre
        this.elements.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        this.renderTasks();
    }

    // Rendu des tâches
    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        this.elements.tasksList.innerHTML = '';

        if (filteredTasks.length === 0) {
            this.renderEmptyState();
            return;
        }

        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            this.elements.tasksList.appendChild(taskElement);
        });
    }

    // Obtention des tâches filtrées
    getFilteredTasks() {
        let filtered = this.tasks;

        // Application du filtre
        if (this.currentFilter === 'completed') {
            filtered = filtered.filter(t => t.completed);
        } else if (this.currentFilter === 'pending') {
            filtered = filtered.filter(t => !t.completed);
        }

        // Application de la recherche
        if (this.searchTerm) {
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(this.searchTerm)
            );
        }

        return filtered;
    }

    // État vide
    renderEmptyState() {
        let message, icon;
        
        if (this.tasks.length === 0) {
            message = 'Aucune tâche chargée';
            icon = '📋';
        } else if (this.searchTerm) {
            message = 'Aucune tâche ne correspond à votre recherche';
            icon = '🔍';
        } else {
            message = 'Aucune tâche dans cette catégorie';
            icon = '📁';
        }

        this.elements.tasksList.innerHTML = `
            <div class="empty-state">
                <div class="icon">${icon}</div>
                <h3>${message}</h3>
                ${this.tasks.length === 0 ? '<p>Utilisez le bouton "Charger les tâches" pour commencer</p>' : ''}
            </div>
        `;
    }

    // Création d'un élément tâche
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                 onclick="taskManager.toggleTask('${task.localId}')">
                ${task.completed ? '✓' : ''}
            </div>
            <div class="task-content">
                <div class="task-title">${this.escapeHtml(task.title)}</div>
                <div class="task-meta">
                    Créé le ${task.createdAt.toLocaleDateString('fr-FR')}
                </div>
            </div>
            <button class="btn btn-outline" onclick="taskManager.deleteTask('${task.localId}')" 
                    title="Supprimer la tâche">
                🗑️
            </button>
        `;
        return li;
    }

    // Échappement HTML pour la sécurité
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Mise à jour des statistiques
    updateStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        
        this.elements.totalTasksEl.textContent = `${total} tâche${total > 1 ? 's' : ''}`;
        this.elements.completedTasksEl.textContent = `${completed} terminée${completed > 1 ? 's' : ''}`;
    }

    // Gestion de la modale
    showTaskModal() {
        this.elements.taskModal.classList.add('active');
        this.elements.newTaskInput.focus();
    }

    hideTaskModal() {
        this.elements.taskModal.classList.remove('active');
        this.elements.newTaskInput.value = '';
    }

    // États de chargement
    setLoadingState(loading) {
        this.isLoading = loading;
        this.elements.loadBtn.disabled = loading;
        
        if (loading) {
            this.elements.loadBtn.innerHTML = '<span class="btn-icon"><div class="loading-spinner"></div></span>Chargement...';
        } else {
            this.elements.loadBtn.innerHTML = '<span class="btn-icon">⏳</span>Charger les tâches';
        }
    }

    async showLoadingState(message) {
        this.elements.statusEl.innerHTML = `
            <div class="status-loading">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `;
    }

    async showSuccessState(message) {
        this.elements.statusEl.innerHTML = `
            <div class="status-success">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;
    }

    // Gestion des erreurs
    async handleError(error) {
        console.error('Erreur:', error);
        
        this.elements.statusEl.innerHTML = `
            <div class="status-error">
                <span>❌</span>
                <span>Erreur: ${error.message}</span>
            </div>
        `;
        
        this.showNotification('Erreur lors du chargement des tâches', 'error');
    }

    // Notification
    showNotification(message, type = 'success') {
        this.elements.notification.textContent = message;
        this.elements.notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, 3000);
    }

    // Utilitaire de délai
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialisation de l'application
const taskManager = new TaskManager();

// Export pour l'utilisation globale (pour les onclick dans le HTML)
window.taskManager = taskManager;