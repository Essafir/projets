
        // Constantes
        const PROJECTS_KEY = 'crm_projects';
        const CLIENTS_KEY = 'crm_clients';
        let projects = JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
        let currentClientId = null;

        // Éléments DOM
        const clientNameElement = document.getElementById('clientName');
        const projectsContainer = document.getElementById('projectsContainer');
        const addProjectBtn = document.getElementById('addProjectBtn');
        const projectModal = document.getElementById('projectModal');
        const modalTitle = document.getElementById('modalTitle');
        const projectForm = document.getElementById('projectForm');
        
        // Éléments statistiques
        const totalProjectsElement = document.getElementById('totalProjects');
        const activeProjectsElement = document.getElementById('activeProjects');
        const completedProjectsElement = document.getElementById('completedProjects');
        const overdueProjectsElement = document.getElementById('overdueProjects');

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            currentClientId = urlParams.get('clientId');
            
            if (!currentClientId) {
                alert('Client non spécifié');
                window.location.href = 'index.html';
                return;
            }

            loadClientData();
            loadProjects();
            updateStatistics();
            setupEventListeners();
        });

        // Événements
        function setupEventListeners() {
            addProjectBtn.addEventListener('click', openAddModal);
            projectForm.addEventListener('submit', handleFormSubmit);
        }

        // Charger les données du client
        function loadClientData() {
            const clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
            const client = clients.find(c => c.id === currentClientId);
            
            if (client) {
                clientNameElement.textContent = `Projets de ${client.name}`;
            } else {
                clientNameElement.textContent = 'Projets du Client';
                console.warn('Client non trouvé');
            }
        }

        // Charger et afficher les projets
        function loadProjects() {
            const clientProjects = projects.filter(p => p.clientId === currentClientId);
            
            if (clientProjects.length === 0) {
                projectsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <h3>Aucun projet trouvé</h3>
                        <p>Commencez par créer votre premier projet pour ce client.</p>
                        <button class="btn btn-primary" onclick="document.getElementById('addProjectBtn').click()">
                            <i class="fas fa-plus"></i>
                            Créer un projet
                        </button>
                    </div>
                `;
                return;
            }
            
            const table = document.createElement('table');
            table.className = 'projects-table';
            
            // En-tête du tableau
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Projet</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Échéance</th>
                    <th>Date création</th>
                    <th>Actions</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Corps du tableau
            const tbody = document.createElement('tbody');
            
            clientProjects.forEach(project => {
                const row = document.createElement('tr');
                const isOverdue = project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'terminé';
                const dueDateClass = isOverdue ? 'style="color: var(--danger); font-weight: 600;"' : '';
                
                row.innerHTML = `
                    <td>
                        <div style="font-weight: 600; color: var(--dark); margin-bottom: 4px;">${escapeHtml(project.title)}</div>
                    </td>
                    <td>
                        <div style="color: var(--gray); line-height: 1.4;">
                            ${escapeHtml(project.description || 'Aucune description')}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${project.status}">
                            ${getStatusText(project.status)}
                        </span>
                    </td>
                    <td ${dueDateClass}>
                        ${project.dueDate ? formatDate(project.dueDate) : 'Non définie'}
                        ${isOverdue ? ' ⚠️' : ''}
                    </td>
                    <td>
                        <div style="font-size: 0.9rem; color: var(--gray);">
                            ${formatDate(project.createdAt)}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="editProject('${project.id}')" class="action-btn btn-warning">
                                <i class="fas fa-edit"></i>
                                Modifier
                            </button>
                            <button onclick="deleteProject('${project.id}')" class="action-btn btn-danger">
                                <i class="fas fa-trash"></i>
                                Supprimer
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            projectsContainer.innerHTML = '';
            projectsContainer.appendChild(table);
        }

        // Mettre à jour les statistiques
        function updateStatistics() {
            const clientProjects = projects.filter(p => p.clientId === currentClientId);
            const total = clientProjects.length;
            const active = clientProjects.filter(p => p.status === 'en_cours').length;
            const completed = clientProjects.filter(p => p.status === 'terminé').length;
            const overdue = clientProjects.filter(p => 
                p.dueDate && new Date(p.dueDate) < new Date() && p.status !== 'terminé'
            ).length;
            
            totalProjectsElement.textContent = total;
            activeProjectsElement.textContent = active;
            completedProjectsElement.textContent = completed;
            overdueProjectsElement.textContent = overdue;
        }

        // Ouvrir le modal d'ajout
        function openAddModal() {
            modalTitle.innerHTML = '<i class="fas fa-plus"></i> Nouveau Projet';
            projectForm.reset();
            document.getElementById('projectId').value = '';
            document.getElementById('projectStatus').value = 'en_cours';
            
            // Définir la date minimale à aujourd'hui
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('projectDueDate').min = today;
            
            projectModal.style.display = 'block';
        }

        // Fermer le modal
        function closeModal() {
            projectModal.style.display = 'none';
        }

        // Soumission du formulaire
        function handleFormSubmit(e) {
            e.preventDefault();
            
            const projectId = document.getElementById('projectId').value;
            const title = document.getElementById('projectTitle').value.trim();
            const description = document.getElementById('projectDescription').value.trim();
            const status = document.getElementById('projectStatus').value;
            const dueDate = document.getElementById('projectDueDate').value;
            
            if (!title) {
                alert('Le titre est obligatoire');
                return;
            }
            
            if (projectId) {
                updateProject(projectId, { title, description, status, dueDate });
            } else {
                addProject({ title, description, status, dueDate });
            }
            
            closeModal();
            loadProjects();
            updateStatistics();
        }

        // Ajouter un projet
        function addProject(projectData) {
            const newProject = {
                id: 'project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                clientId: currentClientId,
                title: projectData.title,
                description: projectData.description,
                status: projectData.status,
                dueDate: projectData.dueDate,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            projects.push(newProject);
            saveProjects();
            showAlert('Projet ajouté avec succès!', 'success');
        }

        // Modifier un projet
        function updateProject(projectId, projectData) {
            const projectIndex = projects.findIndex(p => p.id === projectId);
            
            if (projectIndex !== -1) {
                projects[projectIndex] = {
                    ...projects[projectIndex],
                    ...projectData,
                    updatedAt: new Date().toISOString()
                };
                
                saveProjects();
                showAlert('Projet modifié avec succès!', 'success');
            }
        }

        // Éditer un projet
        function editProject(projectId) {
            const project = projects.find(p => p.id === projectId);
            
            if (project) {
                modalTitle.innerHTML = '<i class="fas fa-edit"></i> Modifier le Projet';
                document.getElementById('projectId').value = project.id;
                document.getElementById('projectTitle').value = project.title;
                document.getElementById('projectDescription').value = project.description || '';
                document.getElementById('projectStatus').value = project.status;
                document.getElementById('projectDueDate').value = project.dueDate || '';
                
                projectModal.style.display = 'block';
            }
        }

        // Supprimer un projet
        function deleteProject(projectId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
                projects = projects.filter(p => p.id !== projectId);
                saveProjects();
                loadProjects();
                updateStatistics();
                showAlert('Projet supprimé avec succès!', 'success');
            }
        }

        // Sauvegarder les projets
        function saveProjects() {
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
        }

        // Fonctions utilitaires
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getStatusText(status) {
            const statusMap = {
                'en_cours': 'En cours',
                'terminé': 'Terminé',
                'en_retard': 'En retard'
            };
            return statusMap[status] || status;
        }

        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        }

        function showAlert(message, type) {
            // Créer une alerte temporaire
            const alert = document.createElement('div');
            alert.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                animation: slideInRight 0.3s ease;
                box-shadow: var(--shadow-lg);
            `;
            
            if (type === 'success') {
                alert.style.background = 'var(--success)';
            } else if (type === 'error') {
                alert.style.background = 'var(--danger)';
            } else if (type === 'warning') {
                alert.style.background = 'var(--warning)';
            }
            
            alert.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
                ${message}
            `;
            
            document.body.appendChild(alert);
            
            setTimeout(() => {
                alert.remove();
            }, 3000);
        }

        // Exposer les fonctions globalement
        window.editProject = editProject;
        window.deleteProject = deleteProject;
        window.closeModal = closeModal;
    