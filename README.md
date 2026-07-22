
Resilient Ghana: Real-Time Hazard Sentinel Portal
A comprehensive, interactive React-based dashboard designed to empower Ghanaian communities, emergency responders, and national authorities in monitoring, reporting, and responding to illegal mining (galamsey) and urban flood hazards in real-time.

Table of Contents
Key Features

Technology Stack

Project Architecture

Getting Started

Environment Variables

Testing the Real-Time Network

API Integrations

Contributing

License

Acknowledgments

Key Features
1. Password-Based Authentication and Registration
Secure registration and login using a phone number and a password.

Passwords are hashed and stored securely using bcrypt on the server-side.

Session data is persisted in localStorage for cross-refresh persistence.

2. Cross-Tab Real-Time Presence Network (Multiplayer Sync)
Instant peer-to-peer tab discovery using the browser's native BroadcastChannel API (resilient_ghana_channel).

Multiple open browser windows/tabs represent unique active users who broadcast heartbeats containing their name, role, phone, and GPS position every 3 seconds.

Closed tabs or logout events immediately trigger departure signals, pruning them from other users' dashboards.

3. Proximity Detection and Haversine Distance Alarms
Live distance tracking between logged-in users calculated on the client side using the Haversine formula.

If an active user steps within the 5.0 km emergency range of another:

Plays a high-fidelity warning beep (synthesized via Web Audio API; no external audio assets needed).

Flashes a Toast warning alert: "Nearby User Alert: Kwame Mensah (Citizen) is 3.2km away!"

Records an SMS log entry in the regional dispatch logs.

4. Interactive Live Map (Leaflet)
Pulsing "You" marker showing your own position with a translucent 5km range circle showing your alarm boundary.

Dynamic SOS Map Panning: When any user triggers an SOS, the map of every active user instantly and smoothly auto-pans to the distress beacon's exact real-life GPS coordinates.

Interactive Relocation: Click anywhere on the map to relocate your GPS coordinate instantly, allowing easy simulation and testing of proximity alarms.

Other online users are plotted in real-time with customized emoji pins reflecting their active status (e.g., standard or emergency).

Interactive layers for surveillance drone vectors, river IoT level sensors, flood zones, and galamsey incidents.

5. Tap-to-Feedback Messaging
Tap on any user's marker on the Live Map or click their name card on the Dashboard to slide open a direct feedback input.

Typing message feedback sends a real-time message bubble notification accompanied by an alert tone directly to their screen and archives it in their dispatches log history.

6. Global SOS Distress Beacon
Pressing the SOS Panic Beacon broadcasts a high-priority distress signal to all active tabs in range.

Connected screens instantly lock into an active red SOS HUD, display warning prompts, play repeating emergency police/siren audio, and route surveillance drones to the target SOS coordinate.

7. Dynamic AI Assistant (ResilientGuard)
Multi-Provider AI Support: Choose between:

Gemma 4 Cloud (Google Gemini API) - Primary recommended option

Groq Cloud (Llama 3.1 8B) - Fast cloud alternative

Local Ollama (Gemma 4 E2B) - Fully offline, privacy-focused

Reaches out to the Open-Meteo API to fetch real-time precipitation and weather probability data for the queried city dynamically.

Combines live dynamic weather data with base platform hazard data (galamsey tracking) to offer real-time intelligent analysis and interactive flood risk mapping.

Strictly travel safety focused with guardrails against general knowledge queries.

8. AI Flood Prediction (Ensemble Model)
5-Hour Nowcasting: Lagrangian extrapolation model for rainfall prediction.

Ensemble AI Models: Random Forest + XGBoost + LSTM combined for higher accuracy.

Real-Time Data: Integrates with GMet and Open-Meteo APIs.

Color-Coded Risk Levels: Green, Yellow, Orange, Red.

Historical Context: Shows rainfall trends (85mm to 172mm to 333mm for Accra).

9. Satellite Galamsey Detection
Sentinel-1 SAR Radar: Cloud-penetrating detection of mining activity.

NDVI Vegetation Analysis: Green-to-Red color ramp for forest health monitoring.

Real Pollution Data:

River Nyam (Obuasi): Arsenic 13.56 mg/L (1,356 times WHO limit)

River Asuakoo (Obuasi): Manganese 22.72 mg/L (57 times WHO limit)

MAAP Peru Validation: 90 percent reduction in illegal mining deforestation achieved.

10. Community Reporting
Multi-Format Evidence: Photo upload, voice note recording, GPS geotagging.

Hazard Classification: Illegal Mining (Galamsey) or Flood Outbreak.

Real-Time Alerts: Dual-alert system to nearby responders and authorities.

Map Integration: Incident markers appear instantly on the live map.

Technology Stack
Frontend
Technology	Version	Purpose
React	19	UI Framework
Vite	Latest	Build Tool and Dev Server
Tailwind CSS	v4	Styling and Theme
Leaflet	Latest	Map Rendering
React Leaflet	Latest	React Map Bindings
Recharts	Latest	Charting Engine
Lucide React	Latest	Icon Library
React Toastify	Latest	Notifications
Axios	Latest	HTTP Client
AI and ML
Technology	Purpose
Google Gemini API	Gemma 4 Cloud (31B parameters)
Groq API	Llama 3.1 8B (fast inference)
Ollama	Local Gemma 4 E2B (3.4 GB, offline)
Open-Meteo API	Live weather data
Google Earth Engine	Satellite imagery processing
Backend and Services
Service	Purpose
Firebase Firestore	Real-time database
Firebase Authentication	OTP login
Firebase Cloud Messaging	Push notifications
BroadcastChannel API	Cross-tab sync
Web Audio API	Synthesized alerts
Project Architecture
text
src/
├── assets/                 # Brand logos and assets
├── components/
│   ├── Chatbot/
│   │   ├── GemmaChatbot.jsx    # AI travel safety assistant
│   │   └── RiskMap.jsx         # Interactive risk map
│   ├── Flood/
│   │   ├── HistoricalRainfall.jsx  # Rainfall trend charts
│   │   └── RainsatNowcast.jsx      # 5-hour flood prediction
│   ├── Map/
│   │   └── SOSBeaconLayer.jsx      # Red beacon on map
│   └── SOS/
│       ├── AIResponderAssistant.jsx  # AI recommendations
│       └── OfflineResponseCard.jsx   # Offline emergency card
├── context/
│   └── AppContext.jsx        # BroadcastChannel, presence sync, audio alerts
├── data/
│   └── realData.js           # Real GMet and galamsey raid telemetry datasets
├── pages/
│   ├── AdminDashboard.jsx    # Responder administration
│   ├── Alerts.jsx            # Manual emergency regional broadcasts
│   ├── Auth.jsx              # Registration, phone login, OTP HUD
│   ├── ChatbotPage.jsx       # AI travel safety assistant
│   ├── Dashboard.jsx         # Nearby users feed, telemetry
│   ├── DroneManagement.jsx   # Drone battery and path telemetry
│   ├── FloodPrediction.jsx   # AI Ensemble rainfall models
│   ├── MapView.jsx           # Leaflet live map, click-relocation
│   ├── MiningDetection.jsx   # Satellite galamsey detection
│   ├── Profile.jsx           # Active name/phone edits and sign out
│   ├── ReportPage.jsx        # Community reporting form
│   └── SOSPage.jsx           # Panic beacons and drone redirect
├── services/
│   ├── AlertReceiverService.js   # Handle incoming alerts
│   ├── FCMService.js             # Push notifications
│   ├── Gemma4Service.js          # AI model orchestration
│   ├── RainsatService.js         # 5-hour flood prediction
│   ├── SOSService.js             # SOS alert logic
│   ├── UserService.js            # User management
│   └── WebSocketService.js       # Real-time communication
├── firebase/
│   └── config.js             # Firebase initialization
├── App.jsx                   # Main routing and auth gate wrapper
├── main.jsx                  # DOM entrypoint
└── index.css                 # Global styles
Getting Started
Prerequisites
Node.js (v18.0.0 or higher recommended)

npm (v9.0.0 or higher)

Ollama (optional - for local AI) - Download from ollama.com

Installation
Clone the repository:

bash
git clone https://github.com/Moses-Arthu/Tech-for-Resilient-Communities1.git
cd tech-resilient-communities
Install dependencies:

bash
npm install
Create a .env file in the root directory (see Environment Variables section).

Running Locally
Start the development server:

bash
npm run dev
Open http://localhost:5173 in your browser.

Building for Production
Compile and bundle:

bash
npm run build
Preview the production build:

bash
npm run preview
Environment Variables
Create a .env file in the root directory with the following variables:

Firebase Configuration (Required for Auth and Database)
env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
VITE_FIREBASE_VAPID_KEY=your_firebase_vapid_key
VITE_FCM_SERVER_KEY=your_fcm_server_key
AI API Keys (Optional - Cloud AI)
env
VITE_GEMINI_API_KEY=your_google_gemini_api_key    # For Gemma 4 Cloud
VITE_GROQ_API_KEY=your_groq_api_key               # For Groq Llama 3.1
WebSocket (Optional)
env
VITE_SOCKET_URL=http://localhost:3001              # Socket server URL
Getting Your API Keys:
Service	Where to Get	Free Tier
Firebase	Firebase Console	1,000 devices free
Google Gemini	Google AI Studio	1,500 requests/day
Groq	Groq Console	Free tier available
Testing the Real-Time Proximity and Alarm Network
Since this application utilizes cross-tab synchronization, you can easily test all real-time capabilities on a single machine:

Open Tab 1:

Register a new account: Name: "Amina", Phone: +233 24 111 2222, Role: Responder, Password: your_password.

Log in with the phone number and password.

Open Tab 2 (Incognito or side-by-side window):

Register another account: Name: "Kojo", Phone: +233 20 555 9999, Role: Citizen, Password: your_password.

Log in with the phone number and password.

Verify Presence:

On the Dashboard sidebar of both tabs, observe that the other user appears in the Active Users Nearby panel showing connection statuses.

Test Proximity Warnings:

Go to Live Map on Tab 1. Click somewhere on the map (e.g., Accra coast).

Go to Live Map on Tab 2. Click a point very close to Tab 1 (within 5km range).

Observe both tabs play warning beeps and show Toast popups announcing they are in range.

Test Tap-to-Feedback:

On Tab 1's Live Map, click Kojo's marker.

Type "Heavy rainfall heading north" in the feedback input and click Send.

Observe Tab 2 instantly flashes a chat bubble toast notification with Amina's message.

Test SOS Panic Alarm:

On Tab 2, navigate to SOS Beacon and click the panic button.

Observe Tab 1 instantly sounds a continuous dual-tone emergency siren and turns the interface red with warning overlays. Click Stand Down on Tab 2 to clear.

API Integrations
API	Purpose	Documentation
Google Gemini	Gemma 4 Cloud AI	Google AI Studio
Groq	Fast LLM inference	Groq Console Docs
Open-Meteo	Live weather data	Open-Meteo API Docs
Firebase	Auth, Database, Push	Firebase Documentation
OpenStreetMap	Map tiles and geocoding	OSM API
AI Model Options
Option	Model	Size	Internet Required
Gemma 4 Cloud	gemma-4-31b-it	Cloud	Yes
Groq	llama-3.1-8b-instant	Cloud	Yes
Local Ollama	batiai/gemma4-e2b:q4	3.4 GB	No
Contributing
Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments
Ghana Meteorological Agency (GMet) - Rainfall and weather data

Ghana Police Service - Galamsey enforcement records

WACAM - Water pollution research (2008 CEIA report)

Google - Gemma 4 AI models

Open-Meteo - Free weather API

OpenStreetMap - Free map tiles

Real Data Sources
Data	Source
Rainfall Records	Ghana Meteorological Agency
Arrest Records	Ghana Police Service (2025)
Pollution Data	WACAM/CEIA Report (2009)
Weather Forecast	Open-Meteo API
Satellite Imagery	Sentinel-1 SAR, Sentinel-2
Deployment
The application is deployed on Vercel:

Live Demo: https://tech-for-resilient-communities1.vercel.app

Contact
Project Lead: Moses Arthur

GitHub: @Moses-Arthu

Live Demo: Resilient Ghana

Built for the people of Ghana

