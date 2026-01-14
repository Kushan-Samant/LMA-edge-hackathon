# LoanAI

LoanAI is an AI-powered desktop application built for the LTM Hackathon 2026. It provides instant loan evaluation by combining real data validation with intelligent assessment through Groq's language model. The application is designed to feel professional and approachable, giving users clear feedback on their loan applications while detecting potential fraud.

## What It Does

The application guides users through a loan application process. As users fill out their personal, employment, and financial information, the system validates phone numbers, emails, and addresses in real time against external services. Once submitted, the backend enriches the data with validation results and sends it to an AI model for evaluation. The AI then returns a decision with detailed reasoning, a risk assessment, and suggested loan terms if approved.

The evaluation model considers data quality, financial metrics like debt-to-income ratio and credit score, and overall risk classification. It follows a balanced decision framework that is firm but fair.

## Tech Stack

The frontend is built with Electron for cross-platform desktop support, using plain HTML, CSS, and JavaScript. Three.js handles 3D graphics on the login screen, and GSAP provides smooth animations throughout. Firebase manages user authentication.

The backend runs on Node.js with Express. It communicates with Groq's API for AI evaluation, Abstract API for email validation (optional), and OpenStreetMap Nominatim for address verification.

The design uses a professional blue color scheme with Cormorant Garamond for headings and Inter for body text. The aesthetic is minimal and clean without flashy gradients or excessive animation.

## Getting Started

You will need Node.js 16 or higher and a Groq API key, which you can get from console.groq.com.

Clone the repository and navigate into the project folder. Run npm install to get the main dependencies, then change into the server directory and run npm install again for the backend dependencies.

Create a file called .env inside the server folder. Add your Groq API key, optionally your Abstract API key for email validation, and set the port to 3000.

To run the application, you can start the backend server in one terminal with npm start from the server directory, then start the Electron frontend with npm start from the root directory. Alternatively, just running npm start from the root will auto-launch the backend server along with the Electron app.

## Building for Distribution

For Windows, run npm run build:win or use electron-packager directly. Similar commands exist for macOS and Linux builds.

After building, you can share the entire output folder with users. Include the SETUP_README.txt and START_LOANAI.bat helper files. Recipients will need to create their own server/.env file with their API keys.

## Developer Tools

The application includes built-in testing utilities. An authenticity slider lets you generate test data ranging from completely authentic to obviously invalid. The auto-fill button quickly populates forms for testing purposes. A validation notice reminds developers that real contact information is required for proper validation.

## Project Structure

The main Electron process lives in main.js, which also handles auto-starting the backend. The index.html file contains the main application UI. Frontend JavaScript modules are organized in the renderer folder, including app.js for core logic, auth.js for Firebase authentication, loanService.js for API communication, and test-generator.js for generating test data.

The backend Express server lives in the server folder, with index.js containing API routes and validation logic, keepalive.js providing a self-ping mechanism, and .env.example serving as an environment template.

Styling is handled by main.css in the styles folder. The build folder contains the app icon.

## Security and Privacy

API keys are stored in .env files which are excluded from version control. The backend handles all API calls so no keys are exposed in the frontend. Validation happens against real external services, and no data persists beyond the current session. Never commit .env files or share API keys publicly.

## Known Limitations

Email validation requires an Abstract API key, which is optional but recommended for full functionality. Address validation uses the free OpenStreetMap Nominatim service, which has rate limits. Windows Defender may flag the first run since the application is unsigned. The backend server must be running for loan evaluation to work.

## License

This project is released under the MIT License.

## Contributors

Built by Kushan Samant for LTM Hackathon 2026.

## Acknowledgments

Thanks to Groq for the AI API, the Electron team for the desktop framework, Firebase for authentication services, and OpenStreetMap for address validation.
