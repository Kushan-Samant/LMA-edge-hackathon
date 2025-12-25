/**
 * Loan Service - AI-Powered Loan Evaluation
 * Uses Groq API with llama model for real-time loan decisions
 */

const LoanService = {
    // Groq API configuration
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    API_KEY: 'YOUR_GROQ_API_KEY', // Replace with your Groq API key (avoid hardcoding in production)
    MODEL: 'llama-3.1-8b-instant',

    /**
     * Comprehensive system prompt for realistic loan evaluation
     * Based on real banking and lending industry standards
     */
    getSystemPrompt() {
        return `You are an expert loan underwriter AI system for a financial institution. Your role is to evaluate loan applications using standard lending industry criteria and provide fair, well-reasoned decisions.

## YOUR EVALUATION FRAMEWORK

### 1. DEBT-TO-INCOME RATIO (DTI) - Weight: 35%
Calculate: (Monthly Debt Payments + Proposed Loan Payment) / Gross Monthly Income × 100

DTI Thresholds:
- EXCELLENT: ≤ 20% - Very low risk, strong approval candidate
- GOOD: 21-35% - Acceptable risk, likely approval
- FAIR: 36-43% - Moderate risk, conditional approval possible
- POOR: 44-50% - High risk, requires exceptional factors for approval
- REJECT: > 50% - Automatic decline unless extraordinary circumstances

### 2. CREDIT SCORE ANALYSIS - Weight: 30%
Score Ranges and Risk Assessment:
- EXCELLENT (750-850): Premium rates, automatic approval consideration
- GOOD (700-749): Standard rates, favorable approval odds
- FAIR (650-699): Higher rates, requires strong income/employment
- POOR (580-649): Subprime consideration, high rates, strict terms
- VERY POOR (300-579): High rejection probability, requires substantial collateral or co-signer

### 3. EMPLOYMENT STABILITY - Weight: 15%
- 5+ years: Excellent stability, positive factor
- 3-5 years: Good stability
- 1-3 years: Acceptable, but higher scrutiny
- 0.5-1 year: Concerning, requires strong other factors
- < 6 months: Red flag, typically requires denial or co-signer

### 4. LOAN-TO-INCOME RATIO - Weight: 10%
Calculate: Total Loan Amount / Annual Gross Income

Thresholds:
- ≤ 0.5: Very conservative, easily manageable
- 0.5-1.0: Standard personal loan range
- 1.0-2.0: Requires good credit and low existing debt
- > 2.0: Generally too high for unsecured personal loans

### 5. DISPOSABLE INCOME ASSESSMENT - Weight: 10%
Monthly Disposable = Monthly Income - Monthly Expenses - Existing Debt Payments
Must have sufficient cushion after proposed loan payment (minimum 15-20% of income)

## LOAN PURPOSE RISK FACTORS

Different loan purposes carry different risk profiles:
- **Home Improvement**: Lower risk - adds equity to property
- **Debt Consolidation**: Medium-low risk - if it improves DTI
- **Vehicle Purchase**: Medium risk - asset-backed consideration
- **Education**: Medium risk - investment in earning potential
- **Medical Expenses**: Medium risk - necessity-based
- **Business**: Higher risk - uncertain returns
- **Other/Unspecified**: Higher scrutiny required

## APPROVAL DECISION MATRIX

**APPROVE if:**
- DTI < 43% AND Credit Score ≥ 650 AND Employment ≥ 1 year
- OR DTI < 36% AND Credit Score ≥ 600 AND Employment ≥ 2 years
- OR Credit Score ≥ 750 AND DTI < 50% AND Employment ≥ 1 year (premium applicant exception)
- AND Loan-to-Income Ratio ≤ 2.0
- AND Sufficient disposable income post-loan

**CONDITIONALLY APPROVE if:**
- Borderline factors with strong compensating factors
- May require reduced loan amount, shorter term, or higher rate

**DENY if:**
- DTI > 50% (hard limit)
- Credit Score < 550 with no compensating factors
- Employment < 6 months with no stable income history
- Insufficient disposable income for loan payment
- Loan amount is grossly disproportionate to income
- Signs of financial overextension

## RESPONSE FORMAT

You MUST respond with a valid JSON object in this exact structure:
{
    "approved": boolean,
    "reason": "Clear 1-2 sentence explanation of the primary decision factor",
    "details": "Detailed analysis covering: DTI calculation, credit assessment, employment evaluation, and key factors influencing the decision. Include specific numbers and percentages.",
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "suggestedRate": number (APR as decimal, e.g., 8.5 for 8.5%),
    "monthlyPayment": number (estimated monthly payment),
    "conditions": ["Array of conditions if conditionally approved, empty if clean approval or denial"]
}

## IMPORTANT GUIDELINES

1. Be FAIR and BALANCED - not too lenient, not too harsh
2. Use REAL CALCULATIONS - show your math in the details
3. Consider the FULL PICTURE - one weak area can be offset by strengths
4. Be SPECIFIC - avoid vague generalizations
5. Calculate the monthly payment using: P × (r(1+r)^n) / ((1+r)^n - 1) where P=principal, r=monthly rate, n=months
6. Suggest appropriate interest rates based on risk (typically 6-24% APR for personal loans)

Remember: Your goal is to make sound lending decisions that protect both the lender from excessive risk AND give fair opportunities to creditworthy borrowers.`;
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

    /**
     * Build the user prompt with all application data
     */
    buildUserPrompt(formData) {
        // Calculate key metrics to include
        const annualIncome = formData.monthlyIncome * 12;
        const monthlyDebtPayments = formData.existingDebt > 0 ? formData.existingDebt * 0.03 : 0; // Estimate 3% minimum payment
        const loanToIncomeRatio = formData.loanAmount / annualIncome;
        const disposableIncome = formData.monthlyIncome - formData.monthlyExpenses - monthlyDebtPayments;

        // Estimate monthly payment at 12% APR for DTI calculation
        const estimatedPayment = this.calculateMonthlyPayment(formData.loanAmount, 12, formData.loanTerm);
        const estimatedDTI = ((monthlyDebtPayments + estimatedPayment) / formData.monthlyIncome) * 100;

        return `## LOAN APPLICATION FOR EVALUATION

### APPLICANT INFORMATION
- **Full Legal Name:** ${formData.fullName}
- **Email:** ${formData.email}
- **Phone:** ${formData.phone}
- **Address:** ${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}
- **Date of Birth:** ${formData.dateOfBirth || 'Not provided'}
- **SSN Last 4:** ${formData.ssnLast4 || 'Not provided'}

### EMPLOYMENT & INCOME
- **Current Employer:** ${formData.employer}
- **Job Title:** ${formData.jobTitle || 'Not specified'}
- **Employment Type:** ${formData.employmentType || 'Full-time'}
- **Years at Current Employer:** ${formData.employmentYears} years
- **Gross Monthly Income:** $${formData.monthlyIncome.toLocaleString()}
- **Annual Income:** $${annualIncome.toLocaleString()}
- **Additional Income:** $${(formData.additionalIncome || 0).toLocaleString()}/month
- **Income Source (Additional):** ${formData.additionalIncomeSource || 'N/A'}

### MONTHLY EXPENSES & OBLIGATIONS
- **Total Monthly Expenses:** $${formData.monthlyExpenses.toLocaleString()}
- **Housing Payment (Rent/Mortgage):** $${(formData.housingPayment || 0).toLocaleString()}
- **Current Total Debt:** $${formData.existingDebt.toLocaleString()}
- **Monthly Debt Payments (estimated):** $${Math.round(monthlyDebtPayments).toLocaleString()}
- **Disposable Income:** $${Math.round(disposableIncome).toLocaleString()}

### CREDIT PROFILE
- **Reported Credit Score:** ${formData.creditScore}
- **Bankruptcy History:** ${formData.bankruptcyHistory || 'None reported'}
- **Foreclosure History:** ${formData.foreclosureHistory || 'None reported'}

### LOAN REQUEST DETAILS
- **Loan Amount Requested:** $${formData.loanAmount.toLocaleString()}
- **Loan Purpose:** ${formData.loanPurpose}
- **Loan Purpose Details:** ${formData.loanPurposeDetails || 'Not provided'}
- **Requested Term:** ${formData.loanTerm} months
- **Preferred Payment Date:** ${formData.preferredPaymentDate || '1st of month'}

### ASSETS & COLLATERAL
- **Bank Account Type:** ${formData.bankAccountType || 'Checking'}
- **Savings/Investments:** $${(formData.savingsAmount || 0).toLocaleString()}
- **Property Ownership:** ${formData.propertyOwnership || 'Not specified'}
- **Vehicle Ownership:** ${formData.vehicleOwnership || 'Not specified'}

### PRE-CALCULATED METRICS (for reference)
- **Loan-to-Income Ratio:** ${(loanToIncomeRatio * 100).toFixed(1)}%
- **Estimated Monthly Payment (at 12% APR):** $${estimatedPayment.toLocaleString()}
- **Preliminary DTI (with new loan):** ${estimatedDTI.toFixed(1)}%

### DECLARATIONS
- **US Citizen/Resident:** ${formData.usCitizen ? 'Yes' : 'No/Not specified'}
- **Active Military:** ${formData.activeMilitary ? 'Yes' : 'No'}
- **Co-applicant:** ${formData.hasCoApplicant ? 'Yes' : 'No'}

Please evaluate this loan application and provide your decision in the required JSON format.`;
    },

    /**
     * Evaluate a loan application using AI
     */
    async evaluateLoan(formData) {
        try {
            console.log('Evaluating loan application:', formData);

            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify({
                    model: this.MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: this.getSystemPrompt()
                        },
                        {
                            role: 'user',
                            content: this.buildUserPrompt(formData)
                        }
                    ],
                    temperature: 0.3, // Lower temperature for more consistent decisions
                    max_tokens: 1000,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error:', response.status, errorData);
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            // Parse the AI response
            const aiResponse = data.choices[0].message.content;
            let decision;

            try {
                decision = JSON.parse(aiResponse);
            } catch (parseError) {
                console.error('Failed to parse AI response:', aiResponse);
                // Try to extract JSON from the response
                const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    decision = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('Invalid AI response format');
                }
            }

            // Ensure required fields exist
            return {
                approved: Boolean(decision.approved),
                reason: decision.reason || (decision.approved ? 'Loan approved based on creditworthiness assessment.' : 'Unable to approve based on current application.'),
                details: decision.details || '',
                riskLevel: decision.riskLevel || 'MEDIUM',
                suggestedRate: decision.suggestedRate || 12,
                monthlyPayment: decision.monthlyPayment || this.calculateMonthlyPayment(formData.loanAmount, 12, formData.loanTerm),
                conditions: decision.conditions || []
            };

        } catch (error) {
            console.error('Loan evaluation error:', error);

            // Fallback to basic algorithmic evaluation if AI fails
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
                : reasons[0] || 'Application does not meet current lending requirements.',
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
