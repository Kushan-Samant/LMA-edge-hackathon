# 🏦 LoanAI - AI-Powered Loan Approval Desktop App

> **Built for LTM Hackathon 2026** - An intelligent, professional desktop application for instant loan evaluation using AI.

![LoanAI](build/icon.png)

## ✨ Features

- 🤖 **AI-Powered Evaluation** - Leverages Groq's GPT model for intelligent loan assessment
- 🔐 **Real Data Validation** - Validates phone numbers, emails, and addresses against external APIs
- 🎨 **Clean, Professional UI** - Minimal blue theme with smooth animations
- 🔧 **Developer Tools** - Built-in test data generator with authenticity slider
- 📊 **Fraud Detection** - Advanced validation checks for data quality and fraud indicators
- 🖥️ **Desktop Application** - Built with Electron for cross-platform support
- 🚀 **Standalone Distribution** - No installation required, fully portable

## 🛠️ Tech Stack

### Frontend
- **Electron** (v28.0.0) - Desktop application framework
- **HTML5 + CSS3** - Structure and styling with custom properties
- **Vanilla JavaScript** - All frontend logic
- **Three.js** (r134) - 3D graphics for login screen
- **GSAP** (v3.12.2) - Smooth animations
- **Firebase** (v9.23.0) - Authentication

### Backend
- **Node.js + Express** - API server
- **Groq API** - AI model (`openai/gpt-oss-120b`)
- **Abstract API** - Email validation (optional)
- **OpenStreetMap Nominatim** - Address verification

### Design
- **Color Scheme**: Professional Blue (#3b82f6)
- **Typography**: Cormorant Garamond (headings), Inter (body)
- **Minimal, clean aesthetic** - No flashy gradients or excessive animations

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Groq API key (get it from [console.groq.com](https://console.groq.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kushan-Samant/LMA-edge-hackathon.git
   cd LMA-edge-hackathon
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server
   npm install
   cd ..
   ```

3. **Set up environment variables**
   
   Create `server/.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   EMAIL_VALIDATION_API_KEY=your_abstract_api_key_optional
   PORT=3000
   ```

4. **Run the application**
   
   In one terminal (backend):
   ```bash
   cd server
   npm start
   ```
   
   In another terminal (frontend):
   ```bash
   npm start
   ```

   Or simply:
   ```bash
   npm start
   ```
   *(The Electron app will auto-start the backend server)*

## 📦 Building for Distribution

### Windows
```bash
npm run build:win
```
or
```bash
npx electron-packager . LoanAI --platform=win32 --arch=x64 --out=dist --overwrite
```

### macOS
```bash
npm run build:mac
```

### Linux
```bash
npm run build:linux
```

### Distribution Package

After building, share the entire `dist/LoanAI-win32-x64/` folder with:
- `SETUP_README.txt` - Setup instructions
- `START_LOANAI.bat` - Helper startup script
- **Important**: Recipients need to create their own `server/.env` file with their API keys!

## 🎯 How It Works

1. **User fills out loan application** with personal, employment, and financial information
2. **Real-time validation** checks phone numbers, emails, and addresses
3. **Data sent to backend** which enriches it with validation results
4. **AI evaluation** using Groq's GPT model with a balanced, fair system prompt
5. **Decision displayed** with detailed reasoning, risk assessment, and suggested terms

### AI System Prompt Highlights

The AI evaluates applications based on:
- **Data Quality & Fraud Detection** - Identifies placeholder/fake data
- **Financial Assessment** - DTI ratio, credit score, savings buffer
- **Risk Classification** - Low, Medium, or High risk categorization
- **Fair Decision Framework** - Balanced approach, not overly strict

## 🧪 Developer Tools

The app includes built-in testing tools:
- **Authenticity Slider**: Generate test data from "Authentic" to "Invalid"
- **Auto-Fill Button**: Quickly populate forms with test data
- **Validation Notice**: Reminds that real contact info is required

## 📁 Project Structure

```
LMA-edge-hackathon/
├── main.js                 # Electron main process (auto-starts backend)
├── index.html             # Main application UI
├── renderer/              # Frontend JavaScript modules
│   ├── app.js             # Main app logic
│   ├── auth.js            # Firebase authentication
│   ├── loanService.js     # API communication
│   ├── test-generator.js  # Test data generator
│   └── ...
├── server/                # Backend Express server
│   ├── index.js           # API routes + validation
│   ├── keepalive.js       # Self-ping mechanism
│   └── .env.example       # Environment template
├── styles/
│   └── main.css           # Clean blue theme styling
├── build/
│   └── icon.png           # App icon
└── package.json           # Dependencies and scripts
```

## 🔐 Security & Privacy

- ✅ API keys stored in `.env` (gitignored)
- ✅ Backend handles all API calls (no exposed keys in frontend)
- ✅ Real validation against external services
- ✅ No data persistence beyond session
- ⚠️ **Important**: Never commit `.env` files or share API keys!

## 🎨 UI/UX Features

- **Minimal Design**: Clean professional aesthetic
- **Validation Warnings**: Clear notices about required real data
- **Responsive Layout**: Works on different screen sizes
- **Smooth Animations**: Subtle transitions without excessive effects
- **Professional Color Scheme**: Blue accents (#3b82f6) instead of gradients

## 🐛 Known Issues & Limitations

- Email validation requires Abstract API key (optional but recommended)
- Address validation uses free OpenStreetMap Nominatim (rate-limited)
- Windows Defender may flag first run (normal for unsigned apps)
- Backend must be running for loan evaluation to work

## 📝 License

MIT License - see LICENSE file for details

## 👥 Contributors

Built by **Kushan Samant** for LTM Hackathon 2026

## 🙏 Acknowledgments

- Groq for the amazing AI API
- Electron team for the desktop framework
- Firebase for authentication services
- OpenStreetMap for address validation

---

**⭐ Star this repo if you found it helpful!**

**🐛 Issues?** Please open an issue on GitHub

**💡 Contributions?** Pull requests welcome!
