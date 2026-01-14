/**
 * Test Data Generator
 * Generates loan application data ranging from authentic to "complete bullshit"
 */

class TestDataGenerator {
    constructor() {
        this.faker = {
            firstNames: ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara'],
            lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
            cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'],
            states: ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA'],
            streets: ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Park Blvd', 'Washington St', 'Lake View', 'Highland Ave'],
            jobs: ['Software Engineer', 'Nurse', 'Teacher', 'Project Manager', 'Accountant', 'Sales Manager', 'Operations Manager'],
            companies: ['TechCorp', 'HealthPlus', 'EduSystem', 'Global Finance', 'SalesForce', 'BuildIt Inc', 'ServiceOne'],

            // "Bullshit" data
            bsNames: ['Hacker Man', 'Money Plz', 'asdf asdf', 'L33t Coder', 'Not A Real Person', 'Gimme Loan', 'Scammer 9000', 'Test Test'],
            bsJobs: ['Professional Breather', 'King of World', 'Money Waster', 'Space Ninja', 'Full Time Gamer', 'Nothing'],
            bsCompanies: ['My Bedroom', 'Nowhere', 'Fake Inc', 'Scam LLC', 'Evil Corp', 'Illuminati'],
            gibberish: ['sdflkjsdf', '23423432', '$$$$$$', '???', 'null', 'undefined', '[object Object]']
        };
    }

    generate(bullshitLevel) { // 0 to 100
        const isBullshit = (threshold) => Math.random() * 100 < (bullshitLevel - threshold);
        // Level 0-30: Mostly Legit
        // Level 31-70: Sketchy / Risky
        // Level 71-100: Total Garbage

        const data = {};

        // 1. Personal Info
        if (bullshitLevel > 80 && Math.random() > 0.3) {
            data.fullName = this.getRandom(this.faker.bsNames);
        } else if (bullshitLevel > 50 && Math.random() > 0.5) {
            data.fullName = "Test User " + Math.floor(Math.random() * 1000);
        } else {
            data.fullName = `${this.getRandom(this.faker.firstNames)} ${this.getRandom(this.faker.lastNames)}`;
        }

        // 2. Dates (Age)
        const currentYear = new Date().getFullYear();
        if (bullshitLevel > 90) {
            // Future date or absurdly old/young
            data.dateOfBirth = `${currentYear + 1}-01-01`;
        } else if (bullshitLevel > 60) {
            // Under 18
            const year = currentYear - 10;
            data.dateOfBirth = `${year}-05-15`;
        } else {
            // Normal adult
            const year = currentYear - (20 + Math.floor(Math.random() * 40));
            data.dateOfBirth = `${year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
        }

        // 3. Contact
        if (bullshitLevel > 70) {
            data.email = "not-an-email";
            data.phone = "123";
        } else {
            data.email = `${data.fullName.toLowerCase().replace(/ /g, '.')}@example.com`;
            data.phone = `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
        }

        // 4. Identity
        if (bullshitLevel > 85) {
            data.ssnLast4 = "123456"; // Too long
        } else {
            data.ssnLast4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        }

        // 5. Address
        if (bullshitLevel > 75) {
            data.address = this.getRandom(this.faker.gibberish);
            data.city = "Mars";
            data.state = "XX";
        } else {
            data.address = `${Math.floor(Math.random() * 9999) + 1} ${this.getRandom(this.faker.streets)}`;
            data.city = this.getRandom(this.faker.cities);
            data.state = this.getRandom(this.faker.states);
        }

        // 6. Employment
        if (bullshitLevel > 60) {
            data.employer = this.getRandom(this.faker.bsCompanies);
            data.jobTitle = this.getRandom(this.faker.bsJobs);
            data.employmentYears = Math.floor(Math.random() * 100); // Impossible years
        } else {
            data.employer = this.getRandom(this.faker.companies);
            data.jobTitle = this.getRandom(this.faker.jobs);
            data.employmentYears = (Math.random() * 10 + 1).toFixed(1);
        }

        // 7. Finances (The fun part)
        if (bullshitLevel > 80) {
            // Absurd wealth or poverty
            data.monthlyIncome = Math.random() > 0.5 ? 999999999 : 0;
            data.housingPayment = 10;
            data.monthlyExpenses = 0;
            data.existingDebt = 10000000;
            data.savingsAmount = 5;
        } else if (bullshitLevel > 40) {
            // High Risk profile
            data.monthlyIncome = 2000;
            data.housingPayment = 1500;
            data.monthlyExpenses = 1000; // Deficit
            data.existingDebt = 50000;
            data.savingsAmount = 100;
        } else {
            // Healthy profile
            data.monthlyIncome = 5000 + Math.floor(Math.random() * 5000); // 5k-10k
            data.housingPayment = 1500 + Math.floor(Math.random() * 1000);
            data.monthlyExpenses = 1000 + Math.floor(Math.random() * 1000);
            data.existingDebt = Math.floor(Math.random() * 10000);
            data.savingsAmount = 10000 + Math.floor(Math.random() * 40000);
        }

        // 8. Credit Score
        if (bullshitLevel > 90) data.creditScore = 900; // Impossible > 850
        else if (bullshitLevel > 50) data.creditScore = 450; // Terrible
        else data.creditScore = 700 + Math.floor(Math.random() * 100);

        // 9. Loan Request
        if (bullshitLevel > 70) {
            data.loanAmount = 1000000000;
            data.purpose = 'other';
        } else {
            data.loanAmount = 10000 + Math.floor(Math.random() * 20000);
            data.purpose = ['home', 'car', 'business', 'education', 'debt'][Math.floor(Math.random() * 5)];
        }

        data.loanTerm = "36";
        data.signature = data.fullName;

        return data;
    }

    getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    fillForm(level) {
        const data = this.generate(level);

        // Helper to set value safely
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val;
        };

        setVal('fullName', data.fullName);
        setVal('dateOfBirth', data.dateOfBirth);
        setVal('ssnLast4', data.ssnLast4);
        setVal('email', data.email);
        setVal('phone', data.phone);
        setVal('address', data.address);
        setVal('city', data.city);
        setVal('state', data.state);
        setVal('employer', data.employer);
        setVal('jobTitle', data.jobTitle);
        setVal('employmentYears', data.employmentYears);
        setVal('monthlyIncome', data.monthlyIncome);
        setVal('housingPayment', data.housingPayment);
        setVal('monthlyExpenses', data.monthlyExpenses);
        setVal('existingDebt', data.existingDebt);
        setVal('creditScore', data.creditScore);
        setVal('savingsAmount', data.savingsAmount);
        setVal('loanAmount', data.loanAmount);
        setVal('loanPurpose', data.purpose);
        setVal('loanTerm', data.loanTerm);
        setVal('signature', data.signature);

        const terms = document.getElementById('agreeTerms');
        if (terms) terms.checked = true;

        console.log(`Auto-filled form with Authenticity Level: ${100 - level}%`);
    }
}

// Init when DOM is ready
window.testDataGenerator = new TestDataGenerator();

document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('bs-slider');
    const btn = document.getElementById('btn-autofill');

    if (slider && btn) {
        btn.addEventListener('click', () => {
            // Visual feedback
            btn.innerHTML = 'Generating...';
            setTimeout(() => {
                window.testDataGenerator.fillForm(Number(slider.value));
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                      <polyline points="9 11 12 14 22 4" />
                    </svg> Auto-Fill`;
            }, 300);
        });

        // Dynamic slider color or tooltip could go here
        slider.addEventListener('input', (e) => {
            const val = e.target.value;
            // Maybe update a label dynamically if we had one
        });
    }
});
