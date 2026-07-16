# Resilient Ghana: Real-Time Hazard Sentinel Portal

A comprehensive, interactive React-based dashboard designed to empower Ghanaian communities, emergency responders, and national authorities in monitoring, reporting, and responding to **illegal mining (galamsey)** and **urban flood hazards** in real-time.

---

## 🚀 Key Features

### 1. Unified Authentication Gate & Registration Enforcer
- True unauthenticated lock: access to the portal is gated until registration or login is completed.
- **Simulated SMS OTP HUD**: Submitting registered phone credentials launches an animated, overlay slide-down SMS message HUD containing a random 6-digit verification code.
- Credentials and session data are persisted securely inside `localStorage` for cross-refresh persistence.

### 2. Cross-Tab Real-Time Presence Network (Multiplayer Sync)
- Instant peer-to-peer tab discovery using the browser's native **`BroadcastChannel` API** (`resilient_ghana_channel`).
- Multiple open browser windows/tabs represent unique active users who broadcast heartbeats containing their name, role, phone, and GPS position every 3 seconds.
- Closed tabs or logout events immediately trigger departure signals, pruning them from other users' dashboards.

### 3. Proximity Detection & Haversine Distance Alarms
- Live distance tracking between logged-in users calculated on the client side using the **Haversine formula**.
- If an active user steps within the **5.0 km emergency range** of another:
  - Plays a high-fidelity warning beep (synthesized via **Web Audio API**; no external audio assets needed).
  - Flashes a Toast warning alert: `"Nearby User Alert: Kwame Mensah (Citizen) is 3.2km away!"`
  - Records an SMS log entry in the regional dispatch logs.

### 4. Interactive Live Map (Leaflet)
- pulsing **"You" marker** showing your own position with a translucent **5km range circle** showing your alarm boundary.
- **Interactive Relocation**: Click anywhere on the map to relocate your GPS coordinate instantly, allowing easy simulation and testing of proximity alarms.
- Other online users are plotted in real-time with customized emoji pins reflecting their active status (e.g. standard `👤` or emergency `🚨`).
- Interactive layers for surveillance drone vectors, river IoT level sensors, flood zones, and galamsey incidents.

### 5. Tap-to-Feedback messaging
- Tap on any user's marker on the **Live Map** or click their name card on the **Dashboard** to slide open a direct feedback input.
- Typing message feedback sends a real-time message bubble notification accompanied by an alert tone directly to their screen and archives it in their dispatches log history.

### 6. Global SOS Distress Beacon
- Pressing the **SOS Panic Beacon** broadcasts a high-priority distress signal to all active tabs in range.
- Connected screens instantly lock into an **active red SOS HUD**, display warning prompts, play repeating emergency police/siren audio, and route surveillance drones to the target SOS coordinate.

---

## 🛠️ Technology Stack

- **Frontend Library**: React 19 (scaffolded via Vite)
- **Styling & Theme**: Tailwind CSS v4 + Custom PostCSS configuration
- **Map Rendering**: Leaflet + React Leaflet (using OpenStreetMap tiles)
- **Charting Engine**: Recharts (for rainfall nowcasting trends)
- **Icons**: Lucide React
- **Notifications**: React Toastify
- **State Management**: React Context (`AppContext.jsx`) + BroadcastChannel + LocalStorage Event syncing
- **Linter**: Oxlint (ultra-fast JS/React rules enforcement)

---

## 📂 Project Architecture

```
src/
├── assets/             # Brand logos and assets
├── context/
│   └── AppContext.jsx  # BroadcastChannel, presence sync, audio alerts, and local db
├── data/
│   └── realData.js     # Real Ghana Meteorological Agency & galamsey raid telemetry datasets
├── pages/
│   ├── AdminDashboard  # Responder administration
│   ├── Alerts          # Manual emergency regional broadcasts
│   ├── Auth            # Registration, phone login, and SMS OTP HUD
│   ├── Dashboard       # Nearby active users feed, telemetry, & comparison framework
│   ├── DroneManagement # Drone battery & path telemetry
│   ├── FloodPrediction # AI Ensemble rainfall models & nowcasting
│   ├── MapView         # Leaflet live map, click-relocation, and PeerMarker forms
│   ├── Profile         # Active name/phone edits & sign out
│   └── SOS             # Panic beacons & drone redirect dispatchers
├── services/
│   └── api.js          # OSM Geocoding, Twilio SMS mocks, & meteorological integrations
├── App.jsx             # Main routing and auth gate wrapper
└── main.jsx            # DOM entrypoint
```

---

## ⚙️ Getting Started

### 📋 Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)

### 🔧 Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Moses-Arthu/Tech-for-Resilient-Communities1.git
   cd tech-resilient-communities
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### 💻 Running Locally
- Start the development server:
  ```bash
  npm run dev
  ```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

### 🏗️ Building for Production
- Compile and bundle:
  ```bash
  npm run build
  ```
- Preview the production build:
  ```bash
  npm run preview
  ```

---

## 🧪 Testing the Real-Time Proximity & Alarm Network

Since this application utilizes cross-tab synchronization, you can easily test all real-time capabilities on a single machine:

1. **Open Tab 1**:
   - Register a new account: Name: `"Amina"`, Phone: `+233 24 111 2222`, Role: `Responder`.
   - Submit, watch the simulated SMS notification slide down, enter the 6-digit OTP code, and enter.
2. **Open Tab 2 (Incognito or side-by-side window)**:
   - Register another account: Name: `"Kojo"`, Phone: `+233 20 555 9999`, Role: `Citizen`.
   - Complete OTP verification.
3. **Verify Presence**:
   - On the **Dashboard** sidebar of both tabs, observe that the other user appears in the **Active Users Nearby** panel showing connection statuses.
4. **Test Proximity Warnings**:
   - Go to **Live Map** on **Tab 1**. Click somewhere on the map (e.g. Accra coast).
   - Go to **Live Map** on **Tab 2**. Click a point very close to Tab 1 (within 5km range).
   - Observe both tabs play warning beeps and show Toast popups announcing they are in range.
5. **Test Tap-to-Feedback**:
   - On **Tab 1**'s Live Map, click Kojo's marker.
   - Type `"Heavy rainfall heading north"` in the feedback input and click **Send**.
   - Observe **Tab 2** instantly flashes a chat bubble toast notification with Amina's message.
6. **Test SOS Panic Alarm**:
   - On **Tab 2**, navigate to **SOS Beacon** and click the panic button.
   - Observe **Tab 1** instantly sounds a continuous dual-tone emergency siren and turns the interface red with warning overlays. Click Stand Down on Tab 2 to clear.
