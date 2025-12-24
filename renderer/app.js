/**
 * Main Application Controller
 * Handles navigation, state management, and local storage
 */

const App = {
    currentView: 'dashboard',
    loanHistory: [],

    init() {
        this.loadHistory();
        this.setupNavigation();
        this.setupFormSubmission();
        this.updateDashboard();

        // Check for first launch and start tutorial
        setTimeout(() => {
            if (this.isFirstLaunch()) {
                Onboarding.start();
            }
        }, 500);
    },

    isFirstLaunch() {
        return !localStorage.getItem('onboardingComplete');
    },

    markOnboardingComplete() {
        localStorage.setItem('onboardingComplete', 'true');
    },

    setupNavigation() {
        // Navigation links
        document.querySelectorAll('[data-view]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                this.navigateTo(view);
            });
        });

        // Restart tutorial button
        document.getElementById('btn-restart-tutorial')?.addEventListener('click', () => {
            Onboarding.start();
        });
    },

    navigateTo(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });

        // Show target view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.remove('hidden');
            this.currentView = viewName;
        }

        // Update nav active state
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        // Update dashboard when navigating to it
        if (viewName === 'dashboard' || viewName === 'history') {
            this.updateDashboard();
        }
    },

    setupFormSubmission() {
        const form = document.getElementById('loan-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                zipCode: document.getElementById('zipCode').value,
                employer: document.getElementById('employer').value,
                employmentYears: parseFloat(document.getElementById('employmentYears').value) || 0,
                monthlyIncome: parseFloat(document.getElementById('monthlyIncome').value),
                monthlyExpenses: parseFloat(document.getElementById('monthlyExpenses').value),
                existingDebt: parseFloat(document.getElementById('existingDebt').value) || 0,
                creditScore: parseInt(document.getElementById('creditScore').value),
                loanAmount: parseFloat(document.getElementById('loanAmount').value),
                loanPurpose: document.getElementById('loanPurpose').value,
                loanTerm: parseInt(document.getElementById('loanTerm').value),
                signature: document.getElementById('signature').value,
                agreedToTerms: document.getElementById('agreeTerms').checked
            };

            // Validate
            if (!formData.agreedToTerms) {
                alert('Please agree to the terms and conditions');
                return;
            }

            if (formData.signature.toLowerCase() !== formData.fullName.toLowerCase()) {
                alert('Signature must match your full name');
                return;
            }

            await this.submitLoanApplication(formData);
        });
    },

    async submitLoanApplication(formData) {
        // Show loading
        this.showLoading('Analyzing your application with AI...');

        try {
            const decision = await LoanService.evaluateLoan(formData);

            // Store application
            const application = {
                id: Date.now(),
                date: new Date().toISOString(),
                ...formData,
                status: decision.approved ? 'approved' : 'rejected',
                reason: decision.reason,
                details: decision.details
            };

            this.loanHistory.unshift(application);
            this.saveHistory();

            // Hide loading and show result
            this.hideLoading();
            this.showDecisionResult(decision);

        } catch (error) {
            console.error('Error submitting loan:', error);
            this.hideLoading();
            this.showDecisionResult({
                approved: false,
                reason: 'An error occurred while processing your application. Please try again.',
                details: error.message
            });
        }
    },

    showLoading(message) {
        const overlay = document.getElementById('loading-overlay');
        const text = document.getElementById('loading-text');
        if (overlay) {
            text.textContent = message;
            overlay.classList.remove('hidden');
        }
    },

    hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    },

    showDecisionResult(decision) {
        const resultDiv = document.getElementById('decision-result');
        if (!resultDiv) return;

        const iconSvg = decision.approved
            ? `<svg class="decision-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="10"/>
           <path d="M9 12l2 2 4-4"/>
         </svg>`
            : `<svg class="decision-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="12" cy="12" r="10"/>
           <path d="M15 9l-6 6M9 9l6 6"/>
         </svg>`;

        resultDiv.innerHTML = `
      <div class="decision-result ${decision.approved ? 'approved' : 'rejected'}">
        ${iconSvg}
        <h2 class="decision-title">${decision.approved ? 'Congratulations! Loan Approved' : 'Application Not Approved'}</h2>
        <p class="decision-reason">${decision.reason}</p>
        ${decision.details ? `<p class="text-sm text-gray mt-4">${decision.details}</p>` : ''}
        <div class="mt-6">
          <button class="btn btn-primary" onclick="App.navigateTo('dashboard')">View Dashboard</button>
          <button class="btn btn-outline" onclick="App.resetForm()" style="margin-left: var(--space-2);">New Application</button>
        </div>
      </div>
    `;
        resultDiv.classList.remove('hidden');

        // Scroll to result
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    },

    resetForm() {
        document.getElementById('loan-form').reset();
        document.getElementById('decision-result').classList.add('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    loadHistory() {
        try {
            const saved = localStorage.getItem('loanHistory');
            this.loanHistory = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.loanHistory = [];
        }
    },

    saveHistory() {
        localStorage.setItem('loanHistory', JSON.stringify(this.loanHistory));
        this.updateDashboard();
    },

    updateDashboard() {
        // Update stats
        const total = this.loanHistory.length;
        const approved = this.loanHistory.filter(l => l.status === 'approved').length;
        const rejected = this.loanHistory.filter(l => l.status === 'rejected').length;
        const totalValue = this.loanHistory
            .filter(l => l.status === 'approved')
            .reduce((sum, l) => sum + l.loanAmount, 0);

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-approved').textContent = approved;
        document.getElementById('stat-rejected').textContent = rejected;
        document.getElementById('stat-value').textContent = `$${totalValue.toLocaleString()}`;

        // Update recent applications table
        this.updateRecentApplications();

        // Update history table
        this.updateHistoryTable();
    },

    updateRecentApplications() {
        const tbody = document.getElementById('recent-applications-body');
        if (!tbody) return;

        if (this.loanHistory.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-gray" style="padding: var(--space-8);">
            No applications yet. Start by applying for a loan!
          </td>
        </tr>
      `;
            return;
        }

        const recent = this.loanHistory.slice(0, 5);
        tbody.innerHTML = recent.map(app => `
      <tr>
        <td>${new Date(app.date).toLocaleDateString()}</td>
        <td>$${app.loanAmount.toLocaleString()}</td>
        <td>${this.formatPurpose(app.loanPurpose)}</td>
        <td><span class="badge badge-${app.status === 'approved' ? 'success' : 'error'}">${app.status}</span></td>
      </tr>
    `).join('');
    },

    updateHistoryTable() {
        const tbody = document.getElementById('history-table-body');
        if (!tbody) return;

        if (this.loanHistory.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-gray" style="padding: var(--space-8);">
            No application history yet.
          </td>
        </tr>
      `;
            return;
        }

        tbody.innerHTML = this.loanHistory.map(app => `
      <tr>
        <td>${new Date(app.date).toLocaleDateString()}</td>
        <td>${app.fullName}</td>
        <td>$${app.loanAmount.toLocaleString()}</td>
        <td>${this.formatPurpose(app.loanPurpose)}</td>
        <td>${app.loanTerm} months</td>
        <td><span class="badge badge-${app.status === 'approved' ? 'success' : 'error'}">${app.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="App.showApplicationDetails('${app.id}')">
            View
          </button>
        </td>
      </tr>
    `).join('');
    },

    showApplicationDetails(id) {
        const app = this.loanHistory.find(a => a.id == id);
        if (!app) return;

        alert(`Application Details:\n\nName: ${app.fullName}\nAmount: $${app.loanAmount.toLocaleString()}\nStatus: ${app.status}\nReason: ${app.reason}`);
    },

    formatPurpose(purpose) {
        const purposes = {
            home: 'Home Improvement',
            car: 'Vehicle Purchase',
            business: 'Business',
            education: 'Education',
            medical: 'Medical Expenses',
            debt: 'Debt Consolidation',
            other: 'Other'
        };
        return purposes[purpose] || purpose;
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
