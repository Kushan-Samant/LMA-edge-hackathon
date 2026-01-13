const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const dns = require('dns').promises;
require('dotenv').config();
require('./keepalive'); // Start self-ping mechanism

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Groq API Config
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-120b';

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Valid US State Codes for residency validation
 */
const US_STATES = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'];

/**
 * Validate US Phone Number Format
 * Accepts: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXXXXXXXXX, XXX.XXX.XXXX
 * Returns: { valid: boolean, formatted: string, reason: string }
 */
function validateUSPhone(phone, state) {
    if (!phone) return { valid: false, formatted: null, reason: 'Phone number is missing' };

    // Strip all non-numeric characters
    const digits = phone.replace(/\D/g, '');

    // Check length (10 digits for US, or 11 if starts with 1)
    if (digits.length === 11 && digits.startsWith('1')) {
        // Remove country code
        const localDigits = digits.substring(1);
        return validateUSPhone(localDigits, state);
    }

    if (digits.length !== 10) {
        return {
            valid: false,
            formatted: null,
            reason: `Invalid length: ${digits.length} digits (expected 10 for US)`
        };
    }

    // Check for invalid area codes (000, 911, etc.)
    const areaCode = digits.substring(0, 3);
    const invalidAreaCodes = ['000', '111', '911', '555'];
    if (invalidAreaCodes.includes(areaCode)) {
        return { valid: false, formatted: null, reason: `Invalid area code: ${areaCode}` };
    }

    // Area code cannot start with 0 or 1
    if (areaCode.startsWith('0') || areaCode.startsWith('1')) {
        return { valid: false, formatted: null, reason: `Area code cannot start with 0 or 1` };
    }

    // Exchange code (next 3 digits) cannot start with 0 or 1
    const exchange = digits.substring(3, 6);
    if (exchange.startsWith('0') || exchange.startsWith('1')) {
        return { valid: false, formatted: null, reason: `Exchange code cannot start with 0 or 1` };
    }

    // Format nicely
    const formatted = `(${areaCode}) ${exchange}-${digits.substring(6)}`;

    return { valid: true, formatted, reason: 'Valid US phone number format' };
}

/**
 * Validate Email - Full Verification
 * Uses Abstract API to check if email actually exists (not just domain)
 * Requires EMAIL_VALIDATION_API_KEY in .env
 * Returns: { valid: boolean, reason: string, deliverable: boolean, details: object }
 */
async function validateEmail(email) {
    if (!email) return { valid: false, reason: 'Email is missing', deliverable: false, details: null };

    // Basic format check first
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, reason: 'Invalid email format', deliverable: false, details: null };
    }

    const domain = email.split('@')[1];

    // Block obvious fake/placeholder domains
    const fakeDomains = ['example.com', 'test.com', 'fake.com', 'asdf.com', 'null.com', 'undefined.com', 'localhost'];
    if (fakeDomains.includes(domain.toLowerCase())) {
        return { valid: false, reason: `Placeholder/test domain: ${domain}`, deliverable: false, details: null };
    }

    // Try Abstract API for full email verification
    const apiKey = process.env.EMAIL_VALIDATION_API_KEY;

    if (apiKey) {
        try {
            console.log(`[Email Validation] Checking ${email} via Abstract API...`);
            const response = await fetch(
                `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${encodeURIComponent(email)}`
            );

            if (response.ok) {
                const data = await response.json();
                console.log('[Email Validation] Abstract API Response:', data);

                // Abstract API response fields:
                // deliverability: "DELIVERABLE", "UNDELIVERABLE", "RISKY", "UNKNOWN"
                // is_valid_format: { value: boolean }
                // is_disposable_email: { value: boolean }
                // is_smtp_valid: { value: boolean } - THIS tells us if mailbox exists
                // is_catchall_email: { value: boolean }

                const isDeliverable = data.deliverability === 'DELIVERABLE';
                const isSmtpValid = data.is_smtp_valid?.value === true;
                const isDisposable = data.is_disposable_email?.value === true;
                const isCatchAll = data.is_catchall_email?.value === true;

                if (isDisposable) {
                    return {
                        valid: false,
                        reason: 'Disposable/temporary email addresses are not accepted',
                        deliverable: false,
                        details: data
                    };
                }

                if (!isSmtpValid && data.deliverability === 'UNDELIVERABLE') {
                    return {
                        valid: false,
                        reason: `Email address does not exist: mailbox "${email.split('@')[0]}" not found on server`,
                        deliverable: false,
                        details: data
                    };
                }

                if (data.deliverability === 'RISKY') {
                    return {
                        valid: true,
                        reason: isCatchAll
                            ? 'Email is on a catch-all server (risky - will accept any address)'
                            : 'Email verification returned risky status',
                        deliverable: 'risky',
                        details: data
                    };
                }

                if (isDeliverable && isSmtpValid) {
                    return {
                        valid: true,
                        reason: 'Email verified: address exists and can receive mail',
                        deliverable: true,
                        details: data
                    };
                }

                // Unknown status - be cautious
                return {
                    valid: true,
                    reason: `Email status: ${data.deliverability || 'UNKNOWN'}`,
                    deliverable: data.deliverability === 'DELIVERABLE',
                    details: data
                };
            }
        } catch (err) {
            console.error('[Email Validation] API error:', err.message);
            // Fall through to MX-only check
        }
    } else {
        console.log('[Email Validation] No API key found, falling back to MX-only check');
    }

    // Fallback: MX record check only (domain-level, not mailbox-level)
    try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
            return {
                valid: true,
                reason: 'Domain can receive email (mailbox existence not verified - add EMAIL_VALIDATION_API_KEY for full check)',
                deliverable: 'unknown',
                details: { mxRecords: mxRecords.map(r => r.exchange) }
            };
        } else {
            return { valid: false, reason: `Domain ${domain} cannot receive email`, deliverable: false, details: null };
        }
    } catch (err) {
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
            return { valid: false, reason: `Domain ${domain} does not exist`, deliverable: false, details: null };
        }
        return { valid: true, reason: 'Email format valid (verification skipped)', deliverable: 'unknown', details: null };
    }
}

/**
 * AI Loan Underwriter System Prompt
 */
const SYSTEM_PROMPT = `You are an AI-powered Loan Underwriting Assistant. Your role is to evaluate loan applications thoroughly and fairly while detecting potential fraud or data quality issues.

## PRIMARY OBJECTIVES:
1. Assess the applicant's financial stability and ability to repay the loan
2. Identify legitimate red flags and fraud indicators
3. Provide clear, actionable feedback
4. Maintain a balanced approach - neither overly strict nor overly lenient

## EVALUATION CRITERIA:

### 1. Data Quality & Fraud Detection
Evaluate the application for these warning signs:
- **Placeholder/Repetitive Data**: Same values repeated across multiple fields (e.g., "Test", "N/A", "Unknown")
- **Invalid Contact Information**: Check phoneValidation and emailValidation objects for validity
- **Suspicious Address**: If addressExistsOnMap is false, the address may be fabricated
- **Inconsistent Information**: Job title doesn't reasonably align with stated income
- **Impossible Values**: Credit scores outside 300-850 range, negative values, unrealistic figures

### 2. Financial Assessment
- **Debt-to-Income (DTI) Ratio**: Calculate as (Monthly Debt Payments + Proposed Loan Payment) / Gross Monthly Income
  - DTI < 36%: Excellent
  - DTI 36-43%: Good
  - DTI 43-50%: Fair (may require stronger credit/savings)
  - DTI > 50%: High risk (typically requires explanation or decline)
- **Credit Score Impact**:
  - 750+: Excellent
  - 700-749: Good
  - 650-699: Fair
  - 600-649: Subprime (higher rates)
  - <600: High risk
- **Savings Buffer**: Liquid assets relative to loan amount and monthly obligations
- **Employment Stability**: Length of employment and job type

### 3. Risk Level Classification
- **LOW RISK**: Strong credit (700+), DTI <36%, stable employment (2+ years), adequate savings
- **MEDIUM RISK**: Fair credit (650-699), DTI 36-43%, moderate employment history
- **HIGH RISK**: Weak credit (<650), DTI >43%, short employment, limited savings, or data quality concerns

## DECISION FRAMEWORK:
- **APPROVE**: Strong financials, verified data, manageable risk
- **CONDITIONAL APPROVAL**: Decent profile but requires verification or additional documentation
- **DECLINE**: Significant fraud indicators, inability to repay, or severe data quality issues

## RESPONSE FORMAT (JSON ONLY):
{
    "approved": boolean,
    "reason": "Brief 1-2 sentence summary of the decision",
    "rejectionReasons": ["Specific issues if declined, empty array if approved"],
    "details": "Comprehensive analysis including DTI calculation, credit assessment, and key factors",
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "suggestedRate": number (annual percentage rate based on risk),
    "monthlyPayment": number (calculated payment amount),
    "conditions": ["Any stipulations or next steps - e.g., 'Verify employment', 'Provide proof of income'"]
}

## IMPORTANT NOTES:
- Be fair and objective - not all applications are fraudulent
- High income earners do exist; verify alignment with job title and other factors
- Focus on the totality of the application, not single data points
- Provide constructive feedback for declined applications
- Consider that some validation checks may fail due to API limitations, not necessarily fraud`;

app.post('/evaluate-loan', async (req, res) => {
    try {
        const formData = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Server configuration error: Missing API Key" });
        }

        // 1. Phone Number Validation
        const phoneValidation = validateUSPhone(formData.phone, formData.state);
        console.log('[Validation] Phone:', phoneValidation);

        // 2. Email Validation (format + MX records)
        const emailValidation = await validateEmail(formData.email);
        console.log('[Validation] Email:', emailValidation);

        // 3. External Address Verification (Free Nominatim API)
        let addressVerified = false;
        try {
            const addressString = `${formData.address}, ${formData.city}, ${formData.state}`;
            const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`, {
                headers: { 'User-Agent': 'LoanAI-Verification-System' }
            });
            const geoData = await geoResponse.json();
            addressVerified = geoData.length > 0;
        } catch (e) {
            console.error('Geo verification failed, skipping...', e);
            addressVerified = true; // Fallback to AI if service is down
        }

        // 4. Enrich form data with all validation results
        const enrichedFormData = {
            ...formData,
            phoneValidation,
            emailValidation,
            addressExistsOnMap: addressVerified
        };

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: JSON.stringify(enrichedFormData) }
                ],
                temperature: 0.3,
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Groq API error');
        }

        res.json(JSON.parse(data.choices[0].message.content));

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => res.send('LoanAI Backend is Live!'));

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
