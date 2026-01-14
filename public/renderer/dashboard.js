/**
 * Dashboard Controller
 * Additional dashboard-specific functionality
 */

const Dashboard = {
    init() {
        this.setupChartUpdates();
    },

    setupChartUpdates() {
        // Future: Add chart visualizations
        // For now, stats are updated via App.updateDashboard()
    },

    getApprovalRate() {
        if (App.loanHistory.length === 0) return 0;
        const approved = App.loanHistory.filter(l => l.status === 'approved').length;
        return Math.round((approved / App.loanHistory.length) * 100);
    },

    getAverageLoanAmount() {
        if (App.loanHistory.length === 0) return 0;
        const total = App.loanHistory.reduce((sum, l) => sum + l.loanAmount, 0);
        return Math.round(total / App.loanHistory.length);
    },

    exportHistory() {
        const csv = this.convertToCSV(App.loanHistory);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'loan_history.csv';
        a.click();
        URL.revokeObjectURL(url);
    },

    convertToCSV(data) {
        if (data.length === 0) return '';
        const headers = ['Date', 'Name', 'Amount', 'Purpose', 'Term', 'Status'];
        const rows = data.map(app => [
            new Date(app.date).toLocaleDateString(),
            app.fullName,
            app.loanAmount,
            app.loanPurpose,
            app.loanTerm,
            app.status
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
};

document.addEventListener('DOMContentLoaded', () => Dashboard.init());
