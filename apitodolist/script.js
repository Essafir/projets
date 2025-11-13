// Éléments DOM
const btn = document.getElementById('load');
const statusEl = document.getElementById('status');
const liste = document.getElementById('liste');
const addTaskBtn = document.getElementById('add-task');
const taskModal = document.getElementById('task-modal');
const cancelTaskBtn = document.getElementById('cancel-task');
const saveTaskBtn = document.getElementById('save-task');
const newTaskInput = document.getElementById('new-task-input');
const searchInput = document.getElementById('search');
const filterBtns = document.querySelectorAll('.filter-btn');
const notification = document.getElementById('notification');

// Statistiques
const totalTasksEl = document.getElementById('total-tasks');
const completedTasksEl = document.getElementById('completed-tasks');
const progressEl = document.getElementById('progress');

// État de l'application
let tasks = [];
let currentFilter = 'all';
let searchTerm = '';

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadTasks(); // Chargement automatique
    setupEventListeners();
});

// Configuration des événements
function setupEventListeners() {
    // Bouton de chargement
    btn.addEventListener('click', loadTasks);
    
    // Gestion des tâches
    addTaskBtn.addEventListener('click', showAddTaskModal);
    cancelTaskBtn.addEventListener('click', hideAddTaskModal);
    saveTaskBtn.addEventListener('click', addNewTask);
    newTaskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addNewTask();
    });
    
    // Filtres et recherche
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderTasks();
    });
    
    // Fermer la modal en cliquant à l'extérieur
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) hideAddTaskModal();
    });
}

// Chargement des tâches depuis l'API
async function loadTasks() {
    setLoadingState(true);
    
    try {
        statusEl.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div class="loading-spinner"></div>
                <span>Chargement de vos tâches...</span>
            </div>
        `;
        
        const response = await fetch('https://jsonplaceholder.typicode.com/todos');
        
        if (!response.ok) throw new Error('Erreur réseau !');
        
        const data = await response.json();
        tasks = data.slice(0, 10).map(task => ({
            ...task,
            id: task.id,
            title: task.title,
            completed: task.completed,
            createdAt: new Date()
        }));
        
        showNotification('🎉 Tâches chargées avec succès !', 'success');
        statusEl.textContent = `✅ ${tasks.length} tâches chargées - Prêt à être productif !`;
        
        renderTasks();
        updateStats();
        
    } catch (erreur) {
        console.error('Erreur:', erreur);
        statusEl.innerHTML = `
            <div style="color: var(--error);">
                ❌ Échec du chargement : ${erreur.message}
            </div>
        `;
        showNotification('⚠️ Impossible de charger les tâches', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Ajout d'une nouvelle tâche
function addNewTask() {
    const title = newTaskInput.value.trim();
    
    if (!title) {
        showNotification('📝 Veuillez saisir une tâche', 'warning');
        return;
    }
    
    const newTask = {
        id: Date.now(), // ID unique
        title: title,
        completed: false,
        createdAt: new Date(),
        userId: 1
    };
    
    tasks.unshift(newTask); // Ajouter au début
    hideAddTaskModal();
    renderTasks();
    updateStats();
    
    showNotification('✅ Tâche ajoutée avec succès !', 'success');
    newTaskInput.value = '';
    
    // Animation de confettis pour la première tâche
    if (tasks.length === 1) {
        createConfetti();
    }
}

// Basculer l'état d'une tâche
function toggleTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        renderTasks();
        updateStats();
        
        if (task.completed) {
            showNotification('🎯 Tâche accomplie !', 'success');
            // Confettis quand toutes les tâches sont terminées
            if (tasks.every(t => t.completed)) {
                createConfetti();
                showNotification('🏆 Félicitations ! Toutes les tâches sont terminées !', 'success');
            }
        }
    }
}

// Supprimer une tâche
function deleteTask(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
    updateStats();
    showNotification('🗑️ Tâche supprimée', 'warning');
}

// Filtrer les tâches
function setFilter(filter) {
    currentFilter = filter;
    
    // Mettre à jour les boutons de filtre
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderTasks();
}

// Rendu des tâches
function renderTasks() {
    let filteredTasks = tasks;
    
    // Appliquer le filtre
    if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    } else if (currentFilter === 'pending') {
        filteredTasks = tasks.filter(t => !t.completed);
    }
    
    // Appliquer la recherche
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(t => 
            t.title.toLowerCase().includes(searchTerm)
        );
    }
    
    // Vider la liste
    liste.innerHTML = '';
    
    // État vide
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="icon">📝</div>
            <h3>Aucune tâche trouvée</h3>
            <p>${tasks.length === 0 ? 'Cliquez sur "Charger les tâches" pour commencer' : 'Aucune tâche ne correspond à votre recherche'}</p>
        `;
        liste.appendChild(emptyState);
        return;
    }
    
    // Ajouter les tâches filtrées
    filteredTasks.forEach(task => {
        const taskItem = createTaskElement(task);
        liste.appendChild(taskItem);
    });
}

// Créer un élément tâche
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
             onclick="toggleTask(${task.id})">
            ${task.completed ? '✓' : ''}
        </div>
        <div class="task-content">
            <div class="task-title">${task.title}</div>
            <div class="task-meta">
                Créé le ${task.createdAt.toLocaleDateString()}
            </div>
        </div>
        <div class="task-actions">
            <button class="task-action-btn" onclick="deleteTask(${task.id})" title="Supprimer">
                🗑️
            </button>
        </div>
    `;
    return li;
}

// Mettre à jour les statistiques
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    progressEl.textContent = `${progress}%`;
    
    // Animation des statistiques
    animateValue(totalTasksEl, parseInt(totalTasksEl.textContent) || 0, total, 500);
    animateValue(completedTasksEl, parseInt(completedTasksEl.textContent) || 0, completed, 500);
}

// Animation des valeurs
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const change = end - start;
    
    function updateValue(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const value = Math.floor(start + change * easeOutQuart);
        
        element.textContent = element === progressEl ? `${value}%` : value;
        
        if (progress < 1) {
            requestAnimationFrame(updateValue);
        }
    }
    
    requestAnimationFrame(updateValue);
}

// Gestion de la modal
function showAddTaskModal() {
    taskModal.classList.add('active');
    newTaskInput.focus();
}

function hideAddTaskModal() {
    taskModal.classList.remove('active');
    newTaskInput.value = '';
}

// États de chargement
function setLoadingState(loading) {
    btn.disabled = loading;
    if (loading) {
        btn.innerHTML = '<span class="btn-icon">⏳</span>Chargement...';
        btn.classList.add('loading');
    } else {
        btn.innerHTML = '<span class="btn-icon">🚀</span>Charger les tâches';
        btn.classList.remove('loading');
    }
}

// Notifications
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Confettis de célébration
function createConfetti() {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = Math.random() * 2 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 5000);
    }
}

// Style pour le spinner de chargement
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid var(--primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .btn-primary.loading {
        animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);