/**
 * Interactive Onboarding Tutorial
 * Guides users through the main features with spotlight and tooltips
 */

const Onboarding = {
    currentStep: 0,

    steps: [
        {
            target: null,
            title: 'Welcome to LoanAI! 👋',
            description: 'Get instant AI-powered loan decisions in minutes. Let us show you around!',
            position: 'center'
        },
        {
            target: '#nav-dashboard',
            title: 'Dashboard Overview',
            description: 'View your loan applications summary, statistics, and recent activity here.',
            position: 'right'
        },
        {
            target: '#nav-apply',
            title: 'Apply for a Loan',
            description: 'Start a new loan application. Fill in your details and get an instant AI decision.',
            position: 'right'
        },
        {
            target: '#stats-overview',
            title: 'Track Your Progress',
            description: 'See your total applications, approval rate, and the total value of approved loans.',
            position: 'bottom'
        },
        {
            target: '#btn-new-application',
            title: 'Quick Apply',
            description: 'Click here to quickly start a new loan application from anywhere.',
            position: 'left'
        },
        {
            target: null,
            title: "You're All Set! 🎉",
            description: 'Start by applying for a loan. Our AI will analyze your application instantly!',
            position: 'center'
        }
    ],

    start() {
        this.currentStep = 0;
        this.showOverlay();
        this.renderStep();
    },

    showOverlay() {
        const overlay = document.getElementById('onboarding-overlay');
        overlay.classList.add('active');
    },

    hideOverlay() {
        const overlay = document.getElementById('onboarding-overlay');
        overlay.classList.remove('active');
    },

    renderStep() {
        const step = this.steps[this.currentStep];
        const tooltip = document.getElementById('onboarding-tooltip');
        const spotlight = document.getElementById('onboarding-spotlight');
        const arrow = document.getElementById('tooltip-arrow');

        // Update step indicator
        this.renderStepIndicator();

        // Update tooltip content
        document.getElementById('tooltip-title').textContent = step.title;
        document.getElementById('tooltip-description').textContent = step.description;

        // Update button text
        const nextBtn = document.getElementById('btn-next');
        nextBtn.textContent = this.currentStep === this.steps.length - 1 ? 'Get Started' : 'Next';

        // Position spotlight and tooltip
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

                // Position spotlight (fixed positioning, so use viewport coords)
                spotlight.style.display = 'block';
                spotlight.style.top = `${rect.top - 8}px`;
                spotlight.style.left = `${rect.left - 8}px`;
                spotlight.style.width = `${rect.width + 16}px`;
                spotlight.style.height = `${rect.height + 16}px`;

                // Position tooltip based on position
                this.positionTooltip(tooltip, arrow, rect, step.position);

                // Ensure tooltip stays in viewport
                this.ensureTooltipInViewport(tooltip);
            }
        } else {
            // Center position (no target)
            spotlight.style.display = 'none';
            tooltip.style.top = '50%';
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translate(-50%, -50%)';
            arrow.style.display = 'none';
        }

        // Add animation
        tooltip.style.animation = 'none';
        tooltip.offsetHeight; // Trigger reflow
        tooltip.style.animation = 'fadeSlideIn 0.4s ease';
    },

    ensureTooltipInViewport(tooltip) {
        const rect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const padding = 20;

        // Fix if off-screen top
        if (rect.top < padding) {
            tooltip.style.top = `${padding}px`;
            tooltip.style.transform = tooltip.style.transform.replace(/translateY\([^)]+\)/, '');
        }

        // Fix if off-screen bottom
        if (rect.bottom > viewportHeight - padding) {
            tooltip.style.top = `${viewportHeight - rect.height - padding}px`;
            tooltip.style.transform = tooltip.style.transform.replace(/translateY\([^)]+\)/, '');
        }

        // Fix if off-screen left
        if (rect.left < padding) {
            tooltip.style.left = `${padding}px`;
            tooltip.style.transform = tooltip.style.transform.replace(/translateX\([^)]+\)/, '');
        }

        // Fix if off-screen right
        if (rect.right > viewportWidth - padding) {
            tooltip.style.left = `${viewportWidth - rect.width - padding}px`;
            tooltip.style.transform = tooltip.style.transform.replace(/translateX\([^)]+\)/, '');
        }
    },

    positionTooltip(tooltip, arrow, rect, position) {
        const gap = 20;
        arrow.style.display = 'block';
        arrow.className = 'onboarding-arrow';
        tooltip.style.transform = 'none';

        switch (position) {
            case 'right':
                tooltip.style.top = `${rect.top + rect.height / 2}px`;
                tooltip.style.left = `${rect.right + gap}px`;
                tooltip.style.transform = 'translateY(-50%)';
                arrow.classList.add('left');
                break;
            case 'left':
                tooltip.style.top = `${rect.top + rect.height / 2}px`;
                tooltip.style.left = `${rect.left - gap}px`;
                tooltip.style.transform = 'translate(-100%, -50%)';
                arrow.classList.add('right');
                break;
            case 'bottom':
                tooltip.style.top = `${rect.bottom + gap}px`;
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                tooltip.style.transform = 'translateX(-50%)';
                arrow.classList.add('top');
                break;
            case 'top':
                tooltip.style.top = `${rect.top - gap}px`;
                tooltip.style.left = `${rect.left + rect.width / 2}px`;
                tooltip.style.transform = 'translate(-50%, -100%)';
                arrow.classList.add('bottom');
                break;
        }
    },

    renderStepIndicator() {
        const container = document.getElementById('step-indicator');
        container.innerHTML = this.steps.map((_, index) => {
            let className = 'onboarding-step-dot';
            if (index < this.currentStep) className += ' completed';
            if (index === this.currentStep) className += ' active';
            return `<div class="${className}"></div>`;
        }).join('');
    },

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.renderStep();
        } else {
            this.complete();
        }
    },

    skip() {
        this.complete();
    },

    complete() {
        this.hideOverlay();
        App.markOnboardingComplete();

        // Navigate to apply view after tutorial
        setTimeout(() => {
            App.navigateTo('apply');
        }, 300);
    }
};

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-next')?.addEventListener('click', () => Onboarding.next());
    document.getElementById('btn-skip')?.addEventListener('click', () => Onboarding.skip());
});
