class ExpenseTracker {
    constructor() {
        this.expenses = this.loadExpenses();
        this.currentFilterDate = this.getToday();
        this.chart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.updateDisplay();
    }

    setupEventListeners() {
        // Formulaire d'ajout
        document.getElementById('add-expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Filtre par date
        document.getElementById('filter-date').addEventListener('change', (e) => {
            this.currentFilterDate = e.target.value;
            this.updateDisplay();
        });

        // Bouton aujourd'hui
        document.getElementById('today-btn').addEventListener('click', () => {
            this.currentFilterDate = this.getToday();
            document.getElementById('filter-date').value = this.currentFilterDate;
            this.updateDisplay();
        });
    }

    setDefaultDates() {
        const today = this.getToday();
        document.getElementById('expense-date').value = today;
        document.getElementById('filter-date').value = today;
        this.currentFilterDate = today;
    }

    getToday() {
        return new Date().toISOString().split('T')[0];
    }

    addExpense() {
        const title = document.getElementById('expense-title').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const date = document.getElementById('expense-date').value;

        if (!title || isNaN(amount) || amount <= 0 || !date) {
            alert('Veuillez remplir tous les champs correctement');
            return;
        }

        const expense = {
            id: Date.now(),
            title,
            amount,
            date,
            timestamp: new Date().toISOString()
        };

        this.expenses.push(expense);
        this.saveExpenses();
        
        // Réinitialiser le formulaire
        document.getElementById('add-expense-form').reset();
        document.getElementById('expense-date').value = this.getToday();

        // Mettre à jour l'affichage
        this.updateDisplay();

        // Si la dépense ajoutée correspond à la date filtrée, mettre à jour
        if (date === this.currentFilterDate) {
            this.showNotification('Dépense ajoutée avec succès !');
        }
    }

    deleteExpense(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.updateDisplay();
            this.showNotification('Dépense supprimée');
        }
    }

    getExpensesForDate(date) {
        return this.expenses.filter(expense => expense.date === date);
    }

    calculateDailyTotal(date) {
        const dailyExpenses = this.getExpensesForDate(date);
        return dailyExpenses.reduce((total, expense) => total + expense.amount, 0);
    }

    updateDisplay() {
        this.updateDateDisplay();
        this.updateTotalDisplay();
        this.updateExpensesList();
        this.updateChart();
    }

    updateDateDisplay() {
        const dateElement = document.getElementById('current-date');
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = new Date(this.currentFilterDate + 'T00:00:00').toLocaleDateString('fr-FR', options);
        dateElement.textContent = formattedDate;
    }

    updateTotalDisplay() {
        const totalElement = document.getElementById('daily-total');
        const total = this.calculateDailyTotal(this.currentFilterDate);
        totalElement.textContent = `${total.toFixed(2)} FCFA`;
    }

    updateExpensesList() {
        const container = document.getElementById('expenses-container');
        const expenses = this.getExpensesForDate(this.currentFilterDate);

        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Aucune dépense enregistrée pour cette date</p>
                </div>
            `;
            return;
        }

        // Trier par timestamp (plus récent en premier)
        const sortedExpenses = [...expenses].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        );

        container.innerHTML = sortedExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-title">${this.escapeHtml(expense.title)}</div>
                    <div class="expense-date">${this.formatTime(expense.timestamp)}</div>
                </div>
                <div class="expense-amount">${expense.amount.toFixed(2)} FCFA</div>
                <button class="btn-delete" onclick="expenseTracker.deleteExpense(${expense.id})">
                    Supprimer
                </button>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 600;
            transform: translateX(0);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Animation de sortie
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // LocalStorage methods
    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    loadExpenses() {
        const saved = localStorage.getItem('expenses');
        return saved ? JSON.parse(saved) : [];
    }

    // Méthodes bonus pour statistiques
    getWeekExpenses() {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= weekAgo && expenseDate <= today;
        });
    }

    getWeekStats() {
        const weekExpenses = this.getWeekExpenses();
        const dailyStats = {};

        // Initialiser les 7 derniers jours
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyStats[dateStr] = 0;
        }
        weekExpenses.forEach(expense => {
            if (dailyStats.hasOwnProperty(expense.date)) {
                dailyStats[expense.date] += expense.amount;
            }
        });

        // Ajouter un total hebdomadaire
        const weeklyTotal = Object.values(dailyStats).reduce((total, amount) => total + amount, 0);
        dailyStats.weeklyTotal = weeklyTotal;

        return dailyStats;
    }

getMonthlyTotal(year, month) {
        return this.expenses
            .filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate.getFullYear() === year && expenseDate.getMonth() === month - 1;
            })
            .reduce((total, expense) => total + expense.amount, 0);
    }

    updateChart() {
        const ctx = document.getElementById('week-chart').getContext('2d');
        const weekStats = this.getWeekStats();
        
        // Préparer les données pour le graphique
        const labels = [];
        const data = [];
        
        // Trier les dates et formater les labels
        const sortedDates = Object.keys(weekStats).sort();
        sortedDates.forEach(dateStr => {
            const date = new Date(dateStr + 'T00:00:00');
            labels.push(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
            data.push(weekStats[dateStr]);
        });

        // Détruire le graphique existant s'il y en a un
        if (this.chart) {
            this.chart.destroy();
        }

        // Créer le nouveau graphique
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Dépenses quotidiennes (FCFA)',
                    data: data,
                    backgroundColor: 'rgba(102, 126, 234, 0.6)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2,
                    borderRadius: 5,
                    hoverBackgroundColor: 'rgba(102, 126, 234, 0.8)'
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
                                return `Dépenses: ${context.parsed.y.toFixed(2)} FCFA`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(0) + ' FCFA';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Initialiser l'application
const expenseTracker = new ExpenseTracker();
// Exporter pour le debug
window.expenseTracker = expenseTracker;