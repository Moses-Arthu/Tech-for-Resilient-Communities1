# 🛡️ Resilient Ghana: Real-Time Hazard Sentinel Portal

<div align="center">

![Resilient Ghana](https://img.shields.io/badge/Resilient%20Ghana-Hazard%20Sentinel-emerald?style=for-the-badge&logo=shield&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://tech-for-resilient-communities1.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Moses--Arthu-181717?style=for-the-badge&logo=github)](https://github.com/Moses-Arthu/Tech-for-Resilient-Communities1)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com)

**A comprehensive, real-time hazard intelligence platform empowering Ghanaian communities, emergency responders, and national authorities to monitor, report, and respond to illegal mining (galamsey) and urban flood hazards.**

[🚀 Live Demo](https://tech-for-resilient-communities1.vercel.app) · [📋 Report a Bug](https://github.com/Moses-Arthu/Tech-for-Resilient-Communities1/issues) · [💡 Request a Feature](https://github.com/Moses-Arthu/Tech-for-Resilient-Communities1/issues)

</div>

---

## 📋 Table of Contents

- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Testing the Real-Time Network](#-testing-the-real-time-network)
- [API Integrations](#-api-integrations)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Acknowledgments](#-acknowledgments)
- [License](#-license)

---

## ✨ Key Features

### 🔐 Secure Phone & Password Authentication
- Register and sign in using your **mobile number + password** — no SMS OTP required
- Passwords are securely handled via **Firebase Authentication**
- Optional **Recovery Email** stored in Firestore for self-service **Forgot Password** resets
- Session data persisted in `localStorage` for seamless cross-refresh continuity
- Four role levels: **Citizen**, **Emergency Responder**, **National Authority**, **Admin**

---

### 🌐 Cross-Tab Real-Time Presence Network (Multiplayer Sync)
- Instant peer-to-peer tab discovery using the browser's native **BroadcastChannel API** (`resilient_ghana_channel`)
- Each open tab represents a unique active user, broadcasting heartbeats containing name, role, phone, and GPS position every **3 seconds**
- Closed tabs and logout events immediately trigger departure signals, pruning stale users from all dashboards in real time

---

### 📡 Proximity Detection & Haversine Distance Alarms
- Live distance tracking between all logged-in users calculated client-side using the **Haversine formula**
- When a user enters the **5.0 km emergency range** of another:
  - 🔊 Plays a high-fidelity warning beep (synthesized via **Web Audio API** — no external assets required)
  - 🍞 Flashes a toast alert: *"Nearby User Alert: Kwame Mensah (Citizen) is 3.2km away!"*
  - 📋 Logs an SMS dispatch entry in the regional logs

---

### 🗺️ Interactive Live Map (Leaflet)
- Pulsing **"You" marker** with a translucent 5 km range circle showing your alarm boundary
- **Dynamic SOS Map Panning**: When any user triggers an SOS, every active user's map instantly auto-pans to the distress beacon's exact GPS coordinates
- **Click-to-Relocate**: Click anywhere on the map to reposition your GPS coordinate instantly — ideal for testing proximity alarms
- Real-time emoji pins for all online users reflecting their active status
- Interactive layers for:
  - 🚁 Surveillance drone vectors
  - 🌊 River IoT water level sensors
  - 🔴 Flood zone overlays
  - ⛏️ Galamsey incident markers

---

### 💬 Tap-to-Feedback Messaging
- Tap any user's marker on the Live Map or click their name card on the Dashboard to open a **direct feedback input**
- Messages deliver a **real-time bubble notification** with an alert tone to the recipient's screen
- All messages are archived in the dispatch log history

---

### 🚨 Global SOS Distress Beacon
- One-tap **SOS Panic Beacon** broadcasts a high-priority distress signal to all active users
- Connected screens instantly:
  - Lock into an **active red SOS HUD**
  - Display warning prompts
  - Play repeating emergency siren audio
  - Route surveillance drones to the SOS coordinates
- Sender can **Stand Down** to clear the alert across all devices

---

### 🤖 Dynamic AI Assistant (ResilientGuard)
Multi-provider AI with three backend options:

| Provider | Model | Mode |
|---|---|---|
| **Google Gemini API** | Gemma 4 Cloud (31B) | ☁️ Cloud (Recommended) |
| **Groq Cloud** | Llama 3.1 8B | ☁️ Cloud (Fast) |
| **Local Ollama** | Gemma 4 E2B (3.4 GB) | 🔒 Fully Offline |

- Fetches **live precipitation & weather data** from Open-Meteo API for any queried city
- Combines real-time weather with galamsey tracking data for **intelligent flood risk analysis**
- Travel-safety focused with guardrails against off-topic queries

---

### 🌧️ AI Flood Prediction (Ensemble Model)
- **5-Hour Nowcasting** using Lagrangian extrapolation
- **Ensemble AI Models**: Random Forest + XGBoost + LSTM combined for higher accuracy
- Integrates with **GMet** and **Open-Meteo** APIs
- Color-coded risk levels: 🟢 Low → 🟡 Moderate → 🟠 High → 🔴 Critical
- Historical context: Rainfall trends from 85 mm → 172 mm → 333 mm for Accra

---

### 🛰️ Satellite Galamsey Detection (Google Earth Engine)
- **Sentinel-1 SAR Radar**: Cloud-penetrating detection of illegal mining activity
- **NDVI Vegetation Analysis**: Green-to-Red ramp for forest health monitoring
- Real pollution impact data:
  - River Nyam (Obuasi): Arsenic **13.56 mg/L** — *1,356× WHO limit*
  - River Asuakoo (Obuasi): Manganese **22.72 mg/L** — *57× WHO limit*
- **MAAP Peru Validation**: 90% reduction in illegal mining deforestation achieved with this approach

---

### 📝 Community Hazard Reporting
- **Multi-format evidence**: Photo upload, voice note recording, GPS geotagging
- **Hazard classification**: Illegal Mining (Galamsey) or Flood Outbreak
- **Dual-alert dispatch**: Notifies nearby responders and national authorities simultaneously
- Incident markers appear **instantly on the live map** via Firestore real-time sync

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI Framework |
| **Vite** | Latest | Build Tool & Dev Server |
| **Tailwind CSS** | v4 | Styling & Theming |
| **Leaflet / React Leaflet** | Latest | Interactive Map Rendering |
| **Recharts** | Latest | Charting & Data Visualization |
| **Lucide React** | Latest | Icon Library |
| **React Toastify** | Latest | Toast Notifications |
| **Axios** | Latest | HTTP Client |

### AI & Machine Learning

| Technology | Purpose |
|---|---|
| **Google Gemini API** | Gemma 4 Cloud (31B parameters) |
| **Groq API** | Llama 3.1 8B (fast inference) |
| **Ollama (local)** | Gemma 4 E2B (3.4 GB, fully offline) |
| **Open-Meteo API** | Live weather & precipitation data |
| **Google Earth Engine** | Satellite imagery processing |

### Backend & Services

| Service | Purpose |
|---|---|
| **Firebase Firestore** | Real-time database & offline sync |
| **Firebase Authentication** | Secure phone + password auth |
| **Firebase Cloud Messaging** | Push notifications (FCM) |
| **BroadcastChannel API** | Cross-tab peer-to-peer sync |
| **Web Audio API** | Synthesized proximity & SOS alerts |

---

## 🏗️ Project Architecture

```
src/
├── assets/                         # Brand logos and static assets
│
├── components/
│   ├── Chatbot/
│   │   ├── GemmaChatbot.jsx        # AI travel safety assistant UI
│   │   └── RiskMap.jsx             # Interactive flood risk map
│   ├── Flood/
│   │   ├── HistoricalRainfall.jsx  # Rainfall trend charts
│   │   └── RainsatNowcast.jsx      # 5-hour flood prediction widget
│   ├── Map/
│   │   └── SOSBeaconLayer.jsx      # Pulsing SOS beacon on the map
│   └── SOS/
│       ├── AIResponderAssistant.jsx # AI emergency recommendations
│       └── OfflineResponseCard.jsx  # Offline emergency guidance card
│
├── context/
│   └── AppContext.jsx              # BroadcastChannel, presence sync, audio alerts
│
├── data/
│   └── realData.js                 # Real GMet & galamsey raid telemetry datasets
│
├── pages/
│   ├── AdminDashboard.jsx          # Responder administration panel
│   ├── Alerts.jsx                  # Manual regional emergency broadcasts
│   ├── Auth.jsx                    # Registration, sign-in, forgot password
│   ├── ChatbotPage.jsx             # AI travel safety assistant page
│   ├── Dashboard.jsx               # Nearby users feed & telemetry overview
│   ├── DroneManagement.jsx         # Drone battery & path telemetry
│   ├── FloodPrediction.jsx         # AI ensemble rainfall model dashboard
│   ├── MapView.jsx                 # Leaflet live map with click-relocation
│   ├── MiningDetection.jsx         # Satellite galamsey detection interface
│   ├── Profile.jsx                 # User profile management & sign out
│   ├── ReportForm.jsx              # Community hazard reporting form
│   └── SOS.jsx                     # Panic beacon & drone redirect controls
│
├── services/
│   ├── AlertReceiverService.js     # Handle and display incoming alerts
│   ├── FCMService.js               # Firebase Cloud Messaging integration
│   ├── Gemma4Service.js            # AI model orchestration (Gemini/Groq/Ollama)
│   ├── RainsatService.js           # 5-hour flood nowcasting service
│   ├── SOSService.js               # SOS alert broadcast logic
│   ├── UserService.js              # User management helpers
│   └── WebSocketService.js         # Real-time WebSocket communication
│
├── firebase/
│   └── config.js                   # Firebase app initialization
│
├── App.jsx                         # Main routing & authentication gate
├── main.jsx                        # React DOM entry point
└── index.css                       # Global styles & design tokens
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Ollama** *(optional — for local AI)* — [Download from ollama.com](https://ollama.com)

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/Moses-Arthu/Tech-for-Resilient-Communities1.git
cd tech-resilient-communities
```

**2. Install dependencies:**
```bash
npm install
```

**3. Create your environment file:**
```bash
cp .env.example .env
# Then fill in your API keys (see Environment Variables section)
```

**4. Start the development server:**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
# Compile and bundle
npm run build

# Preview the production build locally
npm run preview
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following:

```env
# ─── Firebase (Required) ──────────────────────────────────────────────────────
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
VITE_FIREBASE_VAPID_KEY=your_firebase_vapid_key
VITE_FCM_SERVER_KEY=your_fcm_server_key

# ─── AI API Keys (Optional — Cloud AI) ───────────────────────────────────────
VITE_GEMINI_API_KEY=your_google_gemini_api_key   # For Gemma 4 Cloud
VITE_GROQ_API_KEY=your_groq_api_key              # For Groq Llama 3.1

# ─── WebSocket (Optional) ─────────────────────────────────────────────────────
VITE_SOCKET_URL=http://localhost:3001
```

### Where to get your API keys:

| Service | Where to Get | Free Tier |
|---|---|---|
| **Firebase** | [Firebase Console](https://console.firebase.google.com) | 1,000 devices free |
| **Google Gemini** | [Google AI Studio](https://aistudio.google.com) | 1,500 requests/day |
| **Groq** | [Groq Console](https://console.groq.com) | Free tier available |

> **Firebase setup**: After creating your project, navigate to **Build → Authentication → Sign-in method** and enable the **Email/Password** provider. This is required for user registration and login to work.

---

## 🧪 Testing the Real-Time Network

Since this application uses cross-tab synchronization, you can test all real-time capabilities on a single machine:

### Step 1 — Open Two Tabs
| Tab 1 | Tab 2 (Incognito) |
|---|---|
| Register: **Amina**, `+233 24 111 2222`, Role: Responder | Register: **Kojo**, `+233 20 555 9999`, Role: Citizen |
| Sign in | Sign in |

### Step 2 — Verify Live Presence
On the **Dashboard** of both tabs, confirm the other user appears in the **Active Users Nearby** panel.

### Step 3 — Test Proximity Warnings
1. On **Tab 1 → Live Map**, click somewhere on the map (e.g., Accra coast)
2. On **Tab 2 → Live Map**, click a point within **5 km** of Tab 1's location
3. ✅ Both tabs should play warning beeps and show toast alerts

### Step 4 — Test Tap-to-Feedback
1. On **Tab 1's Live Map**, click Kojo's marker
2. Type *"Heavy rainfall heading north"* and click **Send**
3. ✅ Tab 2 instantly flashes a chat bubble notification

### Step 5 — Test SOS Panic Alarm
1. On **Tab 2 → SOS Beacon**, click the **Panic** button
2. ✅ Tab 1 immediately sounds a dual-tone siren and locks into the red SOS HUD
3. Click **Stand Down** on Tab 2 to clear the alarm

---

## 🔌 API Integrations

| API | Purpose | Documentation |
|---|---|---|
| **Google Gemini** | Gemma 4 Cloud AI | [AI Studio Docs](https://ai.google.dev) |
| **Groq** | Fast LLM inference | [Groq Console Docs](https://console.groq.com/docs) |
| **Open-Meteo** | Live weather data | [Open-Meteo Docs](https://open-meteo.com/en/docs) |
| **Firebase** | Auth, Database, Push | [Firebase Docs](https://firebase.google.com/docs) |
| **OpenStreetMap** | Map tiles & geocoding | [OSM API Docs](https://wiki.openstreetmap.org/wiki/API) |

### AI Model Options

| Option | Model | Size | Internet Required |
|---|---|---|---|
| Gemma 4 Cloud | `gemma-4-31b-it` | Cloud | ✅ Yes |
| Groq | `llama-3.1-8b-instant` | Cloud | ✅ Yes |
| Local Ollama | `batiai/gemma4-e2b:q4` | 3.4 GB | ❌ No |

---

## 🌍 Deployment

The application is deployed on **Vercel** with automatic deployments on every push to `main`.

| | |
|---|---|
| 🌐 **Live Demo** | [tech-for-resilient-communities1.vercel.app](https://tech-for-resilient-communities1.vercel.app) |
| 📦 **Repository** | [github.com/Moses-Arthu/Tech-for-Resilient-Communities1](https://github.com/Moses-Arthu/Tech-for-Resilient-Communities1) |

---

## 🤝 Contributing

Contributions are welcome and appreciated!

1. **Fork** the repository
2. **Create** a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes:
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. **Push** to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open** a Pull Request

---

## 🙏 Acknowledgments

| Organization | Contribution |
|---|---|
| **Ghana Meteorological Agency (GMet)** | Rainfall and weather data |
| **Ghana Police Service** | Galamsey enforcement records (2025) |
| **WACAM** | Water pollution research (2008 CEIA report) |
| **Google** | Gemma 4 AI models & Earth Engine satellite imagery |
| **Open-Meteo** | Free, open-source weather API |
| **OpenStreetMap** | Free map tiles and geocoding |

### Real Data Sources

| Data | Source |
|---|---|
| Rainfall Records | Ghana Meteorological Agency |
| Arrest Records | Ghana Police Service (2025) |
| Pollution Data | WACAM / CEIA Report (2009) |
| Weather Forecast | Open-Meteo API |
| Satellite Imagery | Sentinel-1 SAR & Sentinel-2 (ESA Copernicus) |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for the people of Ghana**

*Project Lead: **Moses Arthur** · GitHub: [@Moses-Arthu](https://github.com/Moses-Arthu)*

[![Live Demo](https://img.shields.io/badge/Try%20It%20Live-Resilient%20Ghana-emerald?style=for-the-badge)](https://tech-for-resilient-communities1.vercel.app)

</div>
