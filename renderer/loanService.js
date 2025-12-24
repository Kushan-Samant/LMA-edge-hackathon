/**
 * Loan Evaluation Service
 * Integrates with Groq AI API to evaluate loan applications
 */

const LoanService = {
    // Set your Groq API key here or via environment variable
    API_KEY: 'YOUR_GROQ_API_KEY',
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',

    async evaluateLoan(formData) {
        const prompt = this.buildPrompt(formData);

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.API_KEY}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are an AI loan officer evaluating loan applications. Analyze the applicant's financial data and provide a decision.
              
You must respond in valid JSON format only, with this exact structure:
{
  "approved": true or false,
  "reason": "A 1-2 sentence explanation for the decision that is friendly and professional",
  "details": "Additional details about the decision factors considered"
}

Consider these factors when making decisions:
- Debt-to-income ratio (should be under 43% ideally)
- Credit score (650+ for approval, 700+ for better terms)
- Monthly income vs expenses and loan payment
- Employment stability
- Loan amount relative to income
- Purpose of the loan

Be fair but realistic. Approve loans that show reasonable ability to repay.`
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content;

            // Parse JSON response
            try {
                // Extract JSON from response (handle potential markdown code blocks)
                let jsonStr = content;
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[0];
                }
                return JSON.parse(jsonStr);
            } catch (parseError) {
                console.error('Failed to parse AI response:', content);
                // Fallback to simple heuristic if AI response parsing fails
                return this.fallbackEvaluation(formData);
            }

        } catch (error) {
            console.error('Loan evaluation error:', error);
            // Use fallback evaluation if API fails
            return this.fallbackEvaluation(formData);
        }
    },

    buildPrompt(formData) {
        const monthlyPayment = this.calculateMonthlyPayment(formData.loanAmount, 8.5, formData.loanTerm);
        const disposableIncome = formData.monthlyIncome - formData.monthlyExpenses;
        const dti = ((formData.monthlyExpenses + monthlyPayment + (formData.existingDebt * 0.03)) / formData.monthlyIncome * 100).toFixed(1);

        return `
Please evaluate this loan application:

APPLICANT INFORMATION:
- Name: ${formData.fullName}
- Address: ${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}
- Employer: ${formData.employer}
- Years Employed: ${formData.employmentYears}

FINANCIAL DATA:
- Monthly Income: $${formData.monthlyIncome.toLocaleString()}
- Monthly Expenses: $${formData.monthlyExpenses.toLocaleString()}
- Existing Debt: $${formData.existingDebt.toLocaleString()}
- Credit Score: ${formData.creditScore}
- Disposable Income: $${disposableIncome.toLocaleString()}

LOAN REQUEST:
- Amount Requested: $${formData.loanAmount.toLocaleString()}
- Purpose: ${formData.loanPurpose}
- Term: ${formData.loanTerm} months
- Estimated Monthly Payment: $${monthlyPayment.toFixed(2)}
- Estimated DTI Ratio: ${dti}%

Please analyze and provide your decision in JSON format.`;
    },

    calculateMonthlyPayment(principal, annualRate, termMonths) {
        const monthlyRate = annualRate / 100 / 12;
        if (monthlyRate === 0) return principal / termMonths;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    },

    fallbackEvaluation(formData) {
        // Simple heuristic-based evaluation as fallback
        const monthlyPayment = this.calculateMonthlyPayment(formData.loanAmount, 8.5, formData.loanTerm);
        const disposableIncome = formData.monthlyIncome - formData.monthlyExpenses;
        const dti = (formData.monthlyExpenses + monthlyPayment) / formData.monthlyIncome;

        let approved = true;
        let reasons = [];

        // Check credit score
        if (formData.creditScore < 580) {
            approved = false;
            reasons.push('credit score below minimum threshold');
        } else if (formData.creditScore < 650) {
            reasons.push('credit score is fair');
        }

        // Check DTI ratio
        if (dti > 0.50) {
            approved = false;
            reasons.push('debt-to-income ratio exceeds 50%');
        } else if (dti > 0.43) {
            reasons.push('debt-to-income ratio is elevated');
        }

        // Check if payment is affordable
        if (monthlyPayment > disposableIncome * 0.4) {
            approved = false;
            reasons.push('monthly payment exceeds 40% of disposable income');
        }

        // Check loan amount vs annual income
        if (formData.loanAmount > formData.monthlyIncome * 36) {
            approved = false;
            reasons.push('loan amount exceeds 3x annual income');
        }

        if (approved) {
            return {
                approved: true,
                reason: 'Your application meets our lending criteria. You demonstrate good financial responsibility and ability to repay.',
                details: `Based on your credit score of ${formData.creditScore} and stable income, we are pleased to approve your loan request.`
            };
        } else {
            return {
                approved: false,
                reason: `Unfortunately, we cannot approve this application due to: ${reasons.join(', ')}.`,
                details: 'Consider reducing the loan amount, paying down existing debt, or improving your credit score before reapplying.'
            };
        }
    }
};
