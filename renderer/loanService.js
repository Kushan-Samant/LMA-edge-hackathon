/**
 * Loan Service - AI-Powered Loan Evaluation
 * Uses Groq API with llama model for real-time loan decisions
 */

const LoanService = {
    // Backend Configuration (Local for Dev, Render for Prod)
    BACKEND_URL: 'http://localhost:3000',

    /**
     * Comprehensive system prompt for realistic loan evaluation
     * Based on real banking and lending industry standards
     */
    getSystemPrompt() {
        return `You are an expert loan underwriter AI system with advanced fraud detection capabilities. 

## CORE UNDERWRITING CRITERIA
1. **DTI Ratio**: Target < 43%. Max 50%.
2. **Credit Score**: 300-850 scale. < 550 is usually an auto-decline.
3. **Employment**: Min 2 years for stability. < 6 months is high risk.

## LOGICAL CONSISTENCY & FRAUD PROTOCOLS (PRE-FILTER)
You MUST reject applications that contain nonsense, offensive, or impossible data:
1. **Gibberish & Offense**: If Name, Employer, or Address are random strings or contain slurs/insults, REJECT immediately.
2. **Job-Income Alignment**: Does the salary make sense for the title? (e.g., A "Cashier" making $5M/yr is FRAUD).
3. **Financial Insanity**: Monthly income of $1B for a $500 loan is FRAUD. 
4. **Temporal Logic**: Age - Years at Job < 16 is impossible. Birth date in future is impossible.
5. **Real-world Cushion**: If income is $10k/mo but expenses are $0, it's fake. Real people have bills.

## RESPONSE FORMAT (JSON ONLY)
{
    "approved": boolean,
    "reason": "If approved: 1-2 sentence logic summary. If REJECTED: Bullet points of EVERY issue found.",
    "rejectionReasons": ["Array of specific reasons for rejection"],
    "details": "Calculations: DTI, Age check, Disposable Income cushion",
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "suggestedRate": number (APR),
    "monthlyPayment": number (Math: P * (r(1+r)^n) / ((1+r)^n - 1)),
    "conditions": ["Array of next steps"]
}`;
    },

    /**
     * Calculate estimated monthly payment
     */
    calculateMonthlyPayment(principal, annualRate, termMonths) {
        const monthlyRate = annualRate / 100 / 12;
        if (monthlyRate === 0) return principal / termMonths;
        const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
            (Math.pow(1 + monthlyRate, termMonths) - 1);
        return Math.round(payment * 100) / 100;
    },

    buildUserPrompt(formData) {
        const annualIncome = formData.monthlyIncome * 12;
        const monthlyDebtPayments = formData.existingDebt > 0 ? formData.existingDebt * 0.03 : 0;
        const loanToIncomeRatio = formData.loanAmount / annualIncome;
        const disposableIncome = formData.monthlyIncome - formData.monthlyExpenses - monthlyDebtPayments;
        const age = formData.dateOfBirth ? Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown';

        return `## LOAN APPLICATION FOR EVALUATION

### APPLICANT
- **Name:** ${formData.fullName}
- **Email:** ${formData.email}
- **Phone:** ${formData.phone}
- **DOB:** ${formData.dateOfBirth} (Calculated Age: ${age})
- **Address:** ${formData.address}, ${formData.city}, ${formData.state}
- **SSN Last 4:** ${formData.ssnLast4}

### EMPLOYMENT & INCOME
- **Employer:** ${formData.employer}
- **Job Title:** ${formData.jobTitle}
- **Years at Job:** ${formData.employmentYears}
- **Monthly Income:** $${formData.monthlyIncome}
- **Monthly Expenses:** $${formData.monthlyExpenses}
- **Existing Debt:** $${formData.existingDebt}
- **Disposable Income:** $${disposableIncome}

### REQUEST
- **Amount:** $${formData.loanAmount}
- **Purpose:** ${formData.loanPurpose}
- **Term:** ${formData.loanTerm} months
- **Credit Score:** ${formData.creditScore}

### ASSETS
- **Savings:** $${formData.savingsAmount}

Please evaluate for logic, realism, and financial risk.`;
    },

    /**
     * Helper to detect repetitive placeholder strings
     */
    isRepetitive(data) {
        const values = [
            data.fullName,
            data.address,
            data.city,
            data.employer,
            data.jobTitle
        ].filter(v => v && v.length > 3);

        const counts = {};
        for (const v of values) {
            const low = v.toLowerCase();
            counts[low] = (counts[low] || 0) + 1;
            if (counts[low] >= 3) return true;
        }
        return false;
    },

    /**
     * Evaluate a loan application using AI
     */
    async evaluateLoan(formData) {
        try {
            console.log('Evaluating loan application via Backend:', formData);

            const response = await fetch(`${this.BACKEND_URL}/evaluate-loan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Server error');
            }

            const decision = await response.json();
            console.log('Backend Decision Result:', decision);

            // Ensure required fields exist in the response
            return {
                approved: Boolean(decision.approved),
                reason: decision.reason || (decision.approved ? 'Loan approved.' : 'Application declined.'),
                rejectionReasons: decision.rejectionReasons || [],
                details: decision.details || '',
                riskLevel: decision.riskLevel || 'MEDIUM',
                suggestedRate: decision.suggestedRate || 12,
                monthlyPayment: decision.monthlyPayment || this.calculateMonthlyPayment(formData.loanAmount, 12, formData.loanTerm),
                conditions: decision.conditions || []
            };

        } catch (error) {
            console.error('Backend communication error:', error);
            // Fallback to local logic if server is down
            return this.fallbackEvaluation(formData);
        }
    },

    /**
     * Fallback evaluation if AI is unavailable
     * Uses standard lending criteria
     */
    fallbackEvaluation(formData) {
        const annualIncome = formData.monthlyIncome * 12;
        const monthlyDebtPayment = formData.existingDebt * 0.03;
        const estimatedPayment = this.calculateMonthlyPayment(formData.loanAmount, 12, formData.loanTerm);
        const dti = ((monthlyDebtPayment + estimatedPayment) / formData.monthlyIncome) * 100;
        const loanToIncome = formData.loanAmount / annualIncome;
        const disposable = formData.monthlyIncome - formData.monthlyExpenses - monthlyDebtPayment;

        let approved = true;
        let reasons = [];
        let riskLevel = 'LOW';

        // 1. SANITY CHECKS (Local Fallback)
        const age = formData.dateOfBirth ? Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

        if (age < 18) {
            approved = false;
            reasons.push(age <= 0 ? "Logically impossible date of birth." : "Applicant must be at least 18 years old.");
        }

        if (formData.monthlyIncome > 10000000) { // $10M/mo is suspicious for a simple app
            approved = false;
            reasons.push("Income level exceeds verifiable individual limits for online processing.");
        }

        if (formData.employmentYears > age - 16) {
            approved = false;
            reasons.push("Employment duration is logically inconsistent with applicant age.");
        }

        // 2. REPETITIVE DATA CHECK
        if (this.isRepetitive(formData)) {
            approved = false;
            reasons.push("Multiple fields contain repetitive placeholder information (e.g. 'Google User').");
        }

        // 3. FINANCIAL REALISM
        if (formData.monthlyIncome > 50000 && (formData.housingPayment < 100 || formData.savingsAmount < 100)) {
            approved = false;
            reasons.push("Reported income vs expenses/savings ratio is statistically impossible.");
        }

        if (formData.phone && (formData.phone.length < 10 || formData.phone.length > 11)) {
            approved = false;
            reasons.push("Invalid phone number format provided.");
        }

        // Check DTI
        if (dti > 50) {
            approved = false;
            reasons.push(`Debt-to-income ratio of ${dti.toFixed(1)}% exceeds maximum 50% threshold`);
            riskLevel = 'HIGH';
        } else if (dti > 43) {
            riskLevel = 'HIGH';
            reasons.push(`Elevated DTI of ${dti.toFixed(1)}%`);
        } else if (dti > 36) {
            riskLevel = 'MEDIUM';
        }

        // Check credit score
        if (formData.creditScore < 550) {
            approved = false;
            reasons.push(`Credit score of ${formData.creditScore} is below minimum requirements`);
        } else if (formData.creditScore < 650) {
            riskLevel = 'HIGH';
            if (dti > 40) {
                approved = false;
                reasons.push(`Combination of low credit score (${formData.creditScore}) and high DTI presents excessive risk`);
            }
        }

        // Check employment
        if (formData.employmentYears < 0.5) {
            if (formData.creditScore < 700) {
                approved = false;
                reasons.push(`Employment history of ${formData.employmentYears} years is insufficient without strong credit`);
            }
            riskLevel = 'HIGH';
        }

        // Check loan-to-income ratio
        if (loanToIncome > 2) {
            approved = false;
            reasons.push(`Loan amount of $${formData.loanAmount.toLocaleString()} is disproportionate to annual income of $${annualIncome.toLocaleString()}`);
        }

        // Check disposable income
        if (disposable - estimatedPayment < formData.monthlyIncome * 0.1) {
            approved = false;
            reasons.push(`Insufficient disposable income after loan payment`);
        }

        // Determine rate based on risk
        let suggestedRate = 9;
        if (formData.creditScore >= 750) suggestedRate = 6.5;
        else if (formData.creditScore >= 700) suggestedRate = 8;
        else if (formData.creditScore >= 650) suggestedRate = 11;
        else if (formData.creditScore >= 600) suggestedRate = 15;
        else suggestedRate = 20;

        if (riskLevel === 'HIGH') suggestedRate += 3;
        else if (riskLevel === 'MEDIUM') suggestedRate += 1.5;

        const monthlyPayment = this.calculateMonthlyPayment(formData.loanAmount, suggestedRate, formData.loanTerm);

        return {
            approved,
            reason: approved
                ? `Your application meets our lending criteria with a credit score of ${formData.creditScore} and DTI of ${dti.toFixed(1)}%.`
                : "Your application was declined due to multiple risk factors.",
            rejectionReasons: !approved ? reasons : [],
            details: `DTI: ${dti.toFixed(1)}% | Credit Score: ${formData.creditScore} | Employment: ${formData.employmentYears} years | Loan-to-Income: ${(loanToIncome * 100).toFixed(1)}% | Disposable Income: $${Math.round(disposable).toLocaleString()}/month`,
            riskLevel,
            suggestedRate,
            monthlyPayment,
            conditions: approved && riskLevel !== 'LOW' ? ['Verification of employment required', 'Proof of income documentation needed'] : []
        };
    }
};

// Make available globally
window.LoanService = LoanService;
