export const REAL_DATA = {
  floodStats: {
    rainfall: [
      { year: '2024', value: 85, label: 'June' },
      { year: '2025', value: 172, label: 'June' },
      { year: '2026', value: 333, label: 'June' },
    ],
    peaks: { 
      '2025': { value: 56, date: 'June 2025' },
      '2026': { value: 140, date: 'June 15, 2026' }
    },
    description: "June 2026 flooding described as one of the worst the capital has experienced in recent years"
  },
  miningIncidents: [
    { 
      id: 1, 
      location: 'Huniso', 
      region: 'Western', 
      detail: '13 suspects arrested and remanded by the Tarkwa Circuit Court during anti-galamsey sweeps.', 
      status: 'Active', 
      color: 'red', 
      coords: [5.28, -1.98] 
    },
    { 
      id: 2, 
      location: 'Akrokerri', 
      region: 'Ashanti', 
      detail: '9 suspects arrested at illegal mining site 200m from Asare Bediako SHS; site blasting with explosives caused severe damage to school property.', 
      status: 'Active', 
      color: 'red', 
      coords: [6.19, -1.68] 
    },
    { 
      id: 3, 
      location: 'Dunkwa-On-Offin', 
      region: 'Central', 
      detail: '2 suspects arrested operating heavy excavators directly along the River Offin bed.', 
      status: 'Active', 
      color: 'red', 
      coords: [5.97, -1.78] 
    },
    { 
      id: 4, 
      location: 'Wassa Dadieso', 
      region: 'Western', 
      detail: 'Detection of multiple illegal mining pits dug inside residential compounds, posing severe cave-in risks.', 
      status: 'Warning', 
      color: 'orange', 
      coords: [5.44, -2.04] 
    },
    { 
      id: 5, 
      location: 'Wassa Gyapa', 
      region: 'Western', 
      detail: '135+ chanfan illegal mining machines destroyed and set ablaze, 6 suspects arrested in a coordinated raid.', 
      status: 'Resolved', 
      color: 'green', 
      coords: [5.41, -2.02] 
    },
    {
      id: 6,
      location: 'Western Region Operations',
      region: 'Western',
      detail: 'Large-scale sweep led by Chief Superintendent William Jabialu with 73 officers and 9 senior police personnel.',
      status: 'Resolved',
      color: 'green',
      coords: [5.3063, -1.9839] // Plotted in Tarkwa area
    }
  ],
  pollution: {
    riverNyam: { arsenic: '13.56 mg/L', limit: '0.01 mg/L', ratio: '1,356x' },
    riverAsuakoo: { manganese: '22.72 mg/L', limit: '0.4 mg/L', ratio: '57x' },
    totalSamples: 400,
    samplesBreakdown: { obuasi: 200, tarkwa: 200 },
    metals: ['Arsenic', 'Manganese', 'Cadmium', 'Iron', 'Copper', 'Mercury', 'Zinc', 'Lead'],
    citation: "WACAM/CEIA Environmental Assessment Report (2009)"
  },
  budget: {
    amount: "GH¢150 million",
    recipient: "National Anti-Illegal Mining Operations Secretariat (NAIMOS)",
    purpose: "Funding joint security taskforce operations, satellite monitoring, and river rehabilitation."
  },
  locations: {
    accra: [5.6037, -0.1870],
    takoradi: [4.8916, -1.7748],
    tarkwa: [5.3063, -1.9839],
    obuasi: [6.2012, -1.6813],
    odawRiver: [5.55, -0.20],
    kwameNkrumahCircle: [5.55, -0.21],
    adabraka: [5.55, -0.22],
    riverOffin: [6.08, -1.62],
    riverNyam: [6.20, -1.68],
    riverAsuakoo: [6.19, -1.67]
  },
  regionRecommendations: {
    accra: "Immediate: Clear debris and desilt the Odaw River basin. Medium-term: Clear blocked natural runoff streams flowing from the Akwapim Range to the Atlantic Ocean. Long-term: Relocate vulnerable settlements and improve stormwater drainage networks.",
    takoradi: "Immediate: Expand sandbag flood walls and clear roadside gutters. Medium-term: Construct deep concrete drainage channels in lower-lying city centers. Long-term: Construct sea walls and storm-surge protection barriers.",
    tarkwa: "Immediate: Fill abandoned mining pits near roads. Medium-term: Run reforestation and land reclamation drives on cleared zones. Long-term: Strict enforcement of buffer zones around rivers and heavy satellite/drone patrol.",
    obuasi: "Immediate: Shut down active chemical discharge pipelines. Medium-term: Deploy localized manganese and arsenic filters. Long-term: Inter-agency collaboration (Minerals Commission, Water Resources Commission) to audit mineral tailings."
  },
  regionChecklists: {
    accra: [
      { id: 'ac-1', task: 'Odaw River Basin Desilting', status: 'Done' },
      { id: 'ac-2', task: 'Akwapim Range Water Path Auditing', status: 'In Progress' },
      { id: 'ac-3', task: 'Circle & Adabraka Warning Sirens Activating', status: 'Done' },
      { id: 'ac-4', task: 'Urban Resettlement Plans Drafting', status: 'In Progress' }
    ],
    takoradi: [
      { id: 'tk-1', task: 'Low-Lying Drainage Upgrading', status: 'In Progress' },
      { id: 'tk-2', task: 'Sea Wall Structure Inspection', status: 'Not Started' },
      { id: 'tk-3', task: 'Local Radio Warning Broadcast Setup', status: 'In Progress' },
      { id: 'tk-4', task: 'Tidal Storm-Surge Shelters Designation', status: 'Not Started' }
    ],
    tarkwa: [
      { id: 'tr-1', task: 'Galamsey Pits Reclamation Campaign', status: 'Not Started' },
      { id: 'tr-2', task: 'River Offin Buffer Zone Surveys', status: 'Not Started' },
      { id: 'tr-3', task: 'Local Mining Taskforce GPS Tracking', status: 'Not Started' },
      { id: 'tr-4', task: 'Community Reforestation Mapping', status: 'Not Started' }
    ],
    obuasi: [
      { id: 'ob-1', task: 'River Nyam Arsenic Filtration System Deploying', status: 'In Progress' },
      { id: 'ob-2', task: 'School Zone Buffer Enforcement (Asare Bediako SHS)', status: 'In Progress' },
      { id: 'ob-3', task: 'UNESCO Water Sensor Network Calibration', status: 'In Progress' },
      { id: 'ob-4', task: 'Tailings Dam Structural Integrity Testing', status: 'Not Started' }
    ]
  },
  techComparison: [
    {
      approach: "Mining Detection",
      current: "Manual reports, physical taskforces, intelligence tips",
      solution: "Sentinel-1 SAR radar imagery, NDVI vegetation index, drone surveillance"
    },
    {
      approach: "Response Speed",
      current: "Reactionary, weeks after environmental damage has occurred",
      solution: "Real-time dual-alerts (SMS to Responders + push to Authorities dashboard)"
    },
    {
      approach: "Flood Prediction",
      current: "Sparse weather station logs, limited coverage",
      solution: "AI Ensemble models (RF, XGBoost, LSTM) + Rainsat nowcasts"
    },
    {
      approach: "Surveillance Cost",
      current: "High expense, risky field operations in dense forests",
      solution: "Automated drone paths, GEE-based satellite audits, IoT GPS sensors"
    }
  ]
};
