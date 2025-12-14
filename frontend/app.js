class TaskManager {
    constructor() {
        this.tasks = [];
        this.categories = [];
        this.currentView = 'dashboard';
        this.editingTask = null;
        this.draggedTask = null;
        this.baseURL = window.location.origin; // Use current origin
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadCategories();
        this.loadTasks();
        this.loadDashboardStats();
    }
    
    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.dataset.view);
            });
        });
        
        // Modal
        document.getElementById('add-task-btn').addEventListener('click', () => this.openTaskModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeTaskModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeTaskModal());
        
        // Forms
        document.getElementById('task-form').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('add-category-btn').addEventListener('click', () => this.addCategory());

        
        // Filters
        document.getElementById('category-filter').addEventListener('change', () => this.filterTasks());
        document.getElementById('priority-filter').addEventListener('change', () => this.filterTasks());
        document.getElementById('status-filter').addEventListener('change', () => this.filterTasks());
        
        // Modal backdrop
        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') this.closeTaskModal();
        });
    }
    
    switchView(view) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${view}-view`).classList.add('active');
        
        const titles = {
            dashboard: 'Dashboard',
            tasks: 'Tasks',
            categories: 'Categories'
        };
        
        document.getElementById('page-title').textContent = titles[view];
        this.currentView = view;
        
        if (view === 'dashboard') this.loadDashboardStats();
    }
    
    async loadTasks() {
        try {
            const response = await fetch(`${this.baseURL}/tasks`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.tasks = await response.json();
            this.renderTasks();
            this.updateCategoryFilter();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }
    
    async loadCategories() {
        try {
            const response = await fetch(`${this.baseURL}/categories`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.categories = await response.json();
            this.updateCategorySelects();
            this.renderCategories();
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }
    
    async loadDashboardStats() {
        try {
            const url = `${this.baseURL}/dashboard/stats`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const stats = await response.json();
            
            document.getElementById('due-today').textContent = stats.due_today;
            document.getElementById('overdue').textContent = stats.overdue;
            document.getElementById('completed').textContent = stats.completed;
            document.getElementById('pending').textContent = stats.pending;
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }
    
    renderTasks() {
        const container = document.getElementById('tasks-container');
        const filteredTasks = this.getFilteredTasks();
        
        container.innerHTML = filteredTasks.map(task => `
            <div class="task-card priority-${task.priority.toLowerCase()}" 
                 draggable="true" 
                 data-task-id="${task.id}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="btn btn-secondary" onclick="taskManager.editTask(${task.id})">Edit</button>
                        <button class="btn btn-secondary" onclick="taskManager.deleteTask(${task.id})">Delete</button>
                    </div>
                </div>
                <div class="task-meta">
                    <span class="task-badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                    ${task.category ? `<span class="task-badge category-badge">${task.category}</span>` : ''}
                    ${task.status === 'completed' ? '<span class="task-badge priority-low">✓ Completed</span>' : ''}
                    ${task.due_date ? `<span class="due-date">Due: ${new Date(task.due_date).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `).join('');
        
        this.bindDragEvents();
    }
    
    bindDragEvents() {
        const taskCards = document.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                this.draggedTask = card;
                card.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                this.draggedTask = null;
            });
            
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                if (this.draggedTask && this.draggedTask !== card) {
                    this.reorderTasks(this.draggedTask, card);
                }
            });
        });
    }
    
    async reorderTasks(draggedCard, targetCard) {
        const container = document.getElementById('tasks-container');
        const cards = Array.from(container.children);
        
        const draggedIndex = cards.indexOf(draggedCard);
        const targetIndex = cards.indexOf(targetCard);
        
        if (draggedIndex < targetIndex) {
            container.insertBefore(draggedCard, targetCard.nextSibling);
        } else {
            container.insertBefore(draggedCard, targetCard);
        }
        
        const reorderedCards = Array.from(container.children);
        const taskOrders = {};
        
        reorderedCards.forEach((card, index) => {
            const taskId = card.dataset.taskId;
            taskOrders[taskId] = index;
        });
        
        try {
            const url = `${this.baseURL}/tasks/reorder`;
            await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskOrders)
            });
        } catch (error) {
            console.error('Error reordering tasks:', error);
            this.renderTasks(); // Revert on error
        }
    }
    
    getFilteredTasks() {
        const categoryFilter = document.getElementById('category-filter').value;
        const priorityFilter = document.getElementById('priority-filter').value;
        const statusFilter = document.getElementById('status-filter').value;
        
        return this.tasks.filter(task => {
            return (!categoryFilter || task.category === categoryFilter) &&
                   (!priorityFilter || task.priority === priorityFilter) &&
                   (!statusFilter || task.status === statusFilter);
        });
    }
    
    filterTasks() {
        this.renderTasks();
    }
    
    updateCategoryFilter() {
        const filter = document.getElementById('category-filter');
        const currentValue = filter.value;
        
        filter.innerHTML = '<option value="">All Categories</option>';
        
        const uniqueCategories = [...new Set(this.tasks.map(task => task.category).filter(Boolean))];
        uniqueCategories.forEach(category => {
            filter.innerHTML += `<option value="${category}">${category}</option>`;
        });
        
        filter.value = currentValue;
    }
    
    updateCategorySelects() {
        const selects = [document.getElementById('task-category')];
        
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select Category</option>';
            
            this.categories.forEach(category => {
                select.innerHTML += `<option value="${category.name}">${category.name}</option>`;
            });
            
            select.value = currentValue;
        });
    }
    
    renderCategories() {
        const container = document.getElementById('categories-list');
        container.innerHTML = this.categories.map(category => `
            <div class="category-item">
                <h4>${category.name}</h4>
            </div>
        `).join('');
    }
    
    openTaskModal(task = null) {
        this.editingTask = task;
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        
        document.getElementById('modal-title').textContent = task ? 'Edit Task' : 'Add Task';
        
        if (task) {
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-category').value = task.category || '';
            document.getElementById('task-due-date').value = task.due_date || '';
            document.getElementById('task-status').value = task.status;
        } else {
            form.reset();
        }
        
        modal.classList.add('active');
    }
    
    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
        this.editingTask = null;
    }
    
    async handleTaskSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value,
            due_date: document.getElementById('task-due-date').value || '',
            status: document.getElementById('task-status').value
        };
        
        try {
            const url = this.editingTask ? `${this.baseURL}/tasks/${this.editingTask.id}` : `${this.baseURL}/tasks`;
            const method = this.editingTask ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                this.closeTaskModal();
                this.loadTasks();
                this.loadDashboardStats();
            } else {
                const result = await response.json();
                alert('Error saving task: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error saving task:', error);
        }
    }
    
    editTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            this.openTaskModal(task);
        }
    }
    
    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            const url = `${this.baseURL}/tasks/${taskId}`;
            const response = await fetch(url, { method: 'DELETE' });
            if (response.ok) {
                this.loadTasks();
                this.loadDashboardStats();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }
    
    async addCategory() {
        const name = document.getElementById('new-category').value.trim();
        if (!name) {
            alert('Please enter a category name');
            return;
        }
        
        try {
            const response = await fetch(`${this.baseURL}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            if (response.ok) {
                document.getElementById('new-category').value = '';
                this.loadCategories();
            }
        } catch (error) {
            console.error('Error adding category:', error);
        }
    }
    

}

const taskManager = new TaskManager();