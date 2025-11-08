
        // Constantes
        const CLIENTS_KEY = 'crm_clients';
        let clients = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]');
        let isEditing = false;

        // Éléments DOM
        const clientForm = document.getElementById('clientForm');
        const clientIdInput = document.getElementById('clientId');
        const clientNameInput = document.getElementById('clientName');
        const clientEmailInput = document.getElementById('clientEmail');
        const clientPhoneInput = document.getElementById('clientPhone');
        const clientStatusSelect = document.getElementById('clientStatus');
        const formTitle = document.getElementById('formTitle');
        const submitBtn = document.getElementById('submitBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const exportBtn = document.getElementById('exportBtn');
        const clientsContainer = document.getElementById('clientsContainer');
        
        // Éléments statistiques
        const totalClientsElement = document.getElementById('totalClients');
        const activeClientsElement = document.getElementById('activeClients');
        const activeCountElement = document.getElementById('activeCount');
        const inactiveCountElement = document.getElementById('inactiveCount');
        const leadCountElement = document.getElementById('leadCount');
        const clientsCountElement = document.getElementById('clientsCount');

        // Initialisation
        document.addEventListener('DOMContentLoaded', function() {
            loadClients();
            updateStatistics();
            setupEventListeners();
        });

        // Événements
        function setupEventListeners() {
            clientForm.addEventListener('submit', handleFormSubmit);
            cancelBtn.addEventListener('click', resetForm);
            searchInput.addEventListener('input', loadClients);
            statusFilter.addEventListener('change', loadClients);
            exportBtn.addEventListener('click', exportToCSV);
        }

        // Soumission du formulaire
        function handleFormSubmit(e) {
            e.preventDefault();
            
            const clientData = {
                name: clientNameInput.value.trim(),
                email: clientEmailInput.value.trim(),
                phone: clientPhoneInput.value.trim(),
                status: clientStatusSelect.value
            };

            if (!clientData.name || !clientData.email) {
                showAlert('Le nom et l\'email sont obligatoires', 'error');
                return;
            }

            if (!isValidEmail(clientData.email)) {
                showAlert('Veuillez entrer une adresse email valide', 'error');
                return;
            }

            if (isEditing) {
                updateClient(clientIdInput.value, clientData);
            } else {
                addClient(clientData);
            }

            resetForm();
            loadClients();
            updateStatistics();
        }

        // Ajouter un client
        function addClient(clientData) {
            const newClient = {
                id: 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                ...clientData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            clients.push(newClient);
            saveClients();
            showAlert('Client ajouté avec succès!', 'success');
        }

        // Modifier un client
        function updateClient(clientId, clientData) {
            const clientIndex = clients.findIndex(c => c.id === clientId);
            
            if (clientIndex !== -1) {
                clients[clientIndex] = {
                    ...clients[clientIndex],
                    ...clientData,
                    updatedAt: new Date().toISOString()
                };
                
                saveClients();
                showAlert('Client modifié avec succès!', 'success');
            }
        }

        // Charger et afficher les clients
        function loadClients() {
            let filteredClients = [...clients];
            
            // Filtre de recherche
            const searchTerm = searchInput.value.toLowerCase();
            if (searchTerm) {
                filteredClients = filteredClients.filter(client =>
                    client.name.toLowerCase().includes(searchTerm) ||
                    client.email.toLowerCase().includes(searchTerm) ||
                    (client.phone && client.phone.includes(searchTerm))
                );
            }
            
            // Filtre par statut
            const statusFilterValue = statusFilter.value;
            if (statusFilterValue) {
                filteredClients = filteredClients.filter(client => client.status === statusFilterValue);
            }
            
            // Mettre à jour le compteur
            clientsCountElement.textContent = filteredClients.length;
            
            // Afficher les résultats
            if (filteredClients.length === 0) {
                clientsContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>Aucun client trouvé</h3>
                        <p>Aucun client ne correspond à vos critères de recherche.</p>
                        <button class="btn btn-primary" onclick="document.getElementById('searchInput').value=''; document.getElementById('statusFilter').value=''; loadClients();">
                            <i class="fas fa-times"></i>
                            Effacer les filtres
                        </button>
                    </div>
                `;
                return;
            }
            
            const table = document.createElement('table');
            table.className = 'clients-table';
            
            // En-tête du tableau
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Statut</th>
                    <th>Date de création</th>
                    <th>Actions</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Corps du tableau
            const tbody = document.createElement('tbody');
            
            filteredClients.forEach(client => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>
                        <div style="font-weight: 600; color: var(--dark);">${escapeHtml(client.name)}</div>
                    </td>
                    <td>
                        <div style="margin-bottom: 4px;">
                            <i class="fas fa-envelope" style="color: var(--gray); width: 16px;"></i>
                            ${escapeHtml(client.email)}
                        </div>
                        ${client.phone ? `
                        <div>
                            <i class="fas fa-phone" style="color: var(--gray); width: 16px;"></i>
                            ${escapeHtml(client.phone)}
                        </div>
                        ` : ''}
                    </td>
                    <td>
                        <span class="status-badge status-${client.status}">
                            ${getStatusText(client.status)}
                        </span>
                    </td>
                    <td>
                        <div style="font-size: 0.9rem; color: var(--gray);">
                            ${formatDate(client.createdAt)}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button onclick="viewProjects('${client.id}')" class="action-btn btn-info">
                                <i class="fas fa-folder"></i>
                                Projets
                            </button>
                            <button onclick="editClient('${client.id}')" class="action-btn btn-warning">
                                <i class="fas fa-edit"></i>
                                Modifier
                            </button>
                            <button onclick="deleteClient('${client.id}')" class="action-btn btn-danger">
                                <i class="fas fa-trash"></i>
                                Supprimer
                            </button>
                        </div>
                    </td>
                `;
                
                tbody.appendChild(row);
            });
            
            table.appendChild(tbody);
            clientsContainer.innerHTML = '';
            clientsContainer.appendChild(table);
        }

        // Mettre à jour les statistiques
        function updateStatistics() {
            const total = clients.length;
            const active = clients.filter(c => c.status === 'actif').length;
            const inactive = clients.filter(c => c.status === 'inactif').length;
            const lead = clients.filter(c => c.status === 'lead').length;
            
            totalClientsElement.textContent = total;
            activeClientsElement.textContent = active;
            activeCountElement.textContent = active;
            inactiveCountElement.textContent = inactive;
            leadCountElement.textContent = lead;
            clientsCountElement.textContent = total;
        }

        // Voir les projets d'un client
        function viewProjects(clientId) {
            window.location.href = `projets.html?clientId=${clientId}`;
        }

        // Éditer un client
        function editClient(clientId) {
            const client = clients.find(c => c.id === clientId);
            
            if (client) {
                isEditing = true;
                formTitle.textContent = 'Modifier le Client';
                submitBtn.innerHTML = '<i class="fas fa-edit"></i> Modifier';
                cancelBtn.style.display = 'inline-flex';
                
                clientIdInput.value = client.id;
                clientNameInput.value = client.name;
                clientEmailInput.value = client.email;
                clientPhoneInput.value = client.phone || '';
                clientStatusSelect.value = client.status;
                
                // Scroll vers le formulaire
                clientForm.scrollIntoView({ behavior: 'smooth' });
                clientNameInput.focus();
            }
        }

        // Supprimer un client
        function deleteClient(clientId) {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce client ? Tous ses projets seront également supprimés.')) {
                // Supprimer le client
                clients = clients.filter(c => c.id !== clientId);
                
                // Supprimer ses projets
                const projects = JSON.parse(localStorage.getItem('crm_projects') || '[]');
                const updatedProjects = projects.filter(p => p.clientId !== clientId);
                localStorage.setItem('crm_projects', JSON.stringify(updatedProjects));
                
                saveClients();
                loadClients();
                updateStatistics();
                showAlert('Client supprimé avec succès!', 'success');
            }
        }

        // Réinitialiser le formulaire
        function resetForm() {
            isEditing = false;
            formTitle.textContent = 'Ajouter un Client';
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Enregistrer';
            cancelBtn.style.display = 'none';
            clientForm.reset();
            clientStatusSelect.value = 'actif';
        }

        // Exporter en CSV
        function exportToCSV() {
            if (clients.length === 0) {
                showAlert('Aucun client à exporter', 'warning');
                return;
            }

            const headers = ['Nom', 'Email', 'Téléphone', 'Statut', 'Date création'];
            let csvContent = headers.join(',') + '\n';
            
            clients.forEach(client => {
                const row = [
                    `"${client.name}"`,
                    `"${client.email}"`,
                    `"${client.phone || ''}"`,
                    `"${getStatusText(client.status)}"`,
                    `"${formatDate(client.createdAt)}"`
                ];
                csvContent += row.join(',') + '\n';
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `clients_${formatDate(new Date().toISOString())}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showAlert('Export CSV terminé!', 'success');
        }

        // Sauvegarder les clients
        function saveClients() {
            localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
        }

        // Fonctions utilitaires
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function getStatusText(status) {
            const statusMap = {
                'actif': 'Actif',
                'inactif': 'Inactif', 
                'lead': 'Lead'
            };
            return statusMap[status] || status;
        }

        function formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR');
        }

        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
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
        window.viewProjects = viewProjects;
        window.editClient = editClient;
        window.deleteClient = deleteClient;
    