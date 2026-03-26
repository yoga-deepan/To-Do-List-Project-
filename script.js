// Task Manager Application
class TaskManager {
    constructor() {
        this.tasks = [];
        this.editingTaskId = null;
        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.renderTasks();
        this.updateDashboard();
        this.loadTheme();
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Form submission
        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Cancel edit
        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.renderTasks(e.target.value);
        });

        // Filters
        document.getElementById('statusFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        document.getElementById('priorityFilter').addEventListener('change', () => {
            this.renderTasks();
        });

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllTasks();
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    // Handle Form Submit
    handleFormSubmit() {
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        const dueDate = document.getElementById('taskDueDate').value;

        if (!title) {
            this.showToast('Please enter a task title', 'error');
            return;
        }

        if (this.editingTaskId) {
            this.updateTask(this.editingTaskId, { title, description, priority, dueDate });
            this.showToast('Task updated successfully!', 'success');
        } else {
            this.addTask({ title, description, priority, dueDate });
            this.showToast('Task added successfully!', 'success');
        }

        this.resetForm();
    }

    // Add Task
    addTask({ title, description, priority, dueDate }) {
        const task = {
            id: Date.now().toString(),
            title,
            description,
            priority,
            dueDate,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.tasks.unshift(task);
        this.saveToLocalStorage();
        this.renderTasks();
        this.updateDashboard();
    }

    // Update Task
    updateTask(id, updates) {
        const taskIndex = this.tasks.findIndex(task => task.id === id);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...updates };
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateDashboard();
        }
    }

    // Delete Task
    deleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== id);
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateDashboard();
            this.showToast('Task deleted successfully!', 'success');
        }
    }

    // Toggle Complete
    toggleComplete(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.status = task.status === 'completed' ? 'pending' : 'completed';
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateDashboard();
            this.showToast(
                task.status === 'completed' ? 'Task completed! 🎉' : 'Task marked as pending',
                'success'
            );
        }
    }

    // Edit Task
    editTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            this.editingTaskId = id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description;
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskDueDate').value = task.dueDate;
            
            document.getElementById('formTitle').textContent = 'Edit Task';
            document.getElementById('submitBtn').textContent = 'Update Task';
            document.getElementById('cancelBtn').style.display = 'block';
            
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Cancel Edit
    cancelEdit() {
        this.resetForm();
    }

    // Reset Form
    resetForm() {
        document.getElementById('taskForm').reset();
        this.editingTaskId = null;
        document.getElementById('formTitle').textContent = 'Add New Task';
        document.getElementById('submitBtn').textContent = 'Add Task';
        document.getElementById('cancelBtn').style.display = 'none';
    }

    // Clear All Tasks
    clearAllTasks() {
        if (this.tasks.length === 0) {
            this.showToast('No tasks to clear', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete all tasks? This cannot be undone.')) {
            this.tasks = [];
            this.saveToLocalStorage();
            this.renderTasks();
            this.updateDashboard();
            this.showToast('All tasks cleared!', 'success');
        }
    }

    // Render Tasks
    renderTasks(searchQuery = '') {
        const container = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;

        // Filter tasks
        let filteredTasks = this.tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                task.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
            
            return matchesSearch && matchesStatus && matchesPriority;
        });

        if (filteredTasks.length === 0) {
            container.innerHTML = '';
            emptyState.classList.add('show');
            return;
        }

        emptyState.classList.remove('show');
        container.innerHTML = filteredTasks.map(task => this.createTaskCard(task)).join('');
    }

    // Create Task Card HTML
    createTaskCard(task) {
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date';
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status === 'pending';
        
        return `
            <div class="task-card priority-${task.priority} ${task.status}" data-id="${task.id}">
                <div class="task-header">
                    <div>
                        <div class="task-title">${this.escapeHtml(task.title)}</div>
                        ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    </div>
                </div>
                
                <div class="task-meta">
                    <span class="task-priority ${task.priority}">
                        ${task.priority.toUpperCase()}
                    </span>
                    <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                        📅 ${dueDate}
                    </span>
                </div>

                <div class="task-actions">
                    <button class="task-btn complete" onclick="taskManager.toggleComplete('${task.id}')">
                        ${task.status === 'completed' ? '↩️ Undo' : '✓ Complete'}
                    </button>
                    <button class="task-btn edit" onclick="taskManager.editTask('${task.id}')">
                        ✏️ Edit
                    </button>
                    <button class="task-btn delete" onclick="taskManager.deleteTask('${task.id}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Update Dashboard
    updateDashboard() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.status === 'completed').length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // LocalStorage Methods
    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('tasks');
        this.tasks = stored ? JSON.parse(stored) : [];
    }

    // Theme Methods
    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        document.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
    }

    loadTheme() {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            document.querySelector('.theme-icon').textContent = '☀️';
        }
    }

    // Show Toast Notification
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app
const taskManager = new TaskManager();
