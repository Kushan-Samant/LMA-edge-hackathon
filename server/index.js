const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Groq API Config
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.1-8b-instant';

/**
 * Enhanced System Prompt (Moved from Frontend to Backend for security)
 */
const SYSTEM_PROMPT = `You are an expert loan underwriter AI system. 
Evaluate loan applications based on:
1. DTI Ratio (target < 43%)
2. Credit Score (300-850)
3. Employment Stability (min 6 months)
4. Disposable Income calculation.

Respond strictly in JSON format:
{
    "approved": boolean,
    "reason": "1-2 sentence explanation",
    "details": "Detailed analysis with numbers",
    "riskLevel": "LOW" | "MEDIUM" | "HIGH",
    "suggestedRate": number (APR),
    "monthlyPayment": number,
    "conditions": ["string"]
}`;

app.post('/evaluate-loan', async (req, res) => {
    try {
        const formData = req.body;
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: "Server configuration error: Missing API Key" });
        }

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
                    { role: 'user', content: JSON.stringify(formData) }
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
