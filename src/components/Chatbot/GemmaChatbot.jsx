import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import RiskMap from './RiskMap';

const LOCATIONS = {
  'accra': { lat: 5.6037, lng: -0.1870 },
  'takoradi': { lat: 4.8916, lng: -1.7748 },
  'tarkwa': { lat: 5.3063, lng: -1.9839 },
  'obuasi': { lat: 6.2012, lng: -1.6813 },
  'huniso': { lat: 5.28, lng: -1.98 },
  'akrokerri': { lat: 6.19, lng: -1.68 },
  'dunkwa': { lat: 5.97, lng: -1.78 },
  'kumasi': { lat: 6.6885, lng: -1.6244 }
};

// Model configurations
const AI_MODELS = {
  gemini: {
    label: 'Gemma 4 Cloud (Google)',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: ['gemma-4-31b-it', 'gemma-4-26b-a4b-it'],
    defaultModel: 'gemma-4-31b-it',
    requiresKey: 'VITE_GEMINI_API_KEY',
    color: 'purple'
  },
  groq: {
    label: 'Groq Cloud (Llama)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    models: ['llama-3.1-8b-instant', 'llama-3.2-3b-preview'],
    defaultModel: 'llama-3.1-8b-instant',
    requiresKey: 'VITE_GROQ_API_KEY',
    color: 'blue'
  },
  local: {
    label: 'Ollama (Local)',
    endpoint: 'http://localhost:11434/api/chat',
    models: ['batiai/gemma4-e2b:q4', 'gemma4:12b', 'gemma4:e2b'],
    defaultModel: 'batiai/gemma4-e2b:q4',
    requiresKey: null,
    color: 'green'
  }
};

// ============================================================
// COMPLETE HISTORICAL DATA (Flood, Mining, Pollution, Crime, Traffic)
// ============================================================
const HISTORICAL_DATA = {
  flood: {
    accra: {
      '2024': 85,
      '2025': 172,
      '2026': 333,
      singleDayPeak: { '2025': 56, '2026': 140 },
      riskLevel: 'HIGH',
      reason: 'Accra experienced severe flooding with 333mm rainfall in June 2026, the worst in recent years.'
    },
    takoradi: {
      riskLevel: 'MODERATE',
      reason: 'Takoradi has 12% of its metropolis in very high flood zones and 24% in high flood zones.'
    }
  },
  mining: {
    incidents: [
      { location: 'Huniso (near Tarkwa)', arrests: 13, status: 'Active', riskLevel: 'HIGH', reason: 'Active illegal mining with 13 arrests. 41% forest loss in the region.' },
      { location: 'Akrokerri (near Obuasi)', arrests: 9, status: 'Active', note: '200m from school', riskLevel: 'HIGH', reason: 'Illegal mining dangerously close to a school. Explosives caused property damage.' },
      { location: 'Dunkwa-On-Offin', arrests: 2, status: 'Active', riskLevel: 'MODERATE', reason: 'Illegal mining on River Offin with active enforcement ongoing.' },
      { location: 'Wassa Gyapa', arrests: 6, machinesDestroyed: 135, status: 'Resolved', riskLevel: 'LOW', reason: 'Enforcement completed. 135+ machines destroyed.' }
    ],
    totalArrests: 30,
    regions: ['Western', 'Ashanti', 'Central']
  },
  pollution: [
    { river: 'River Nyam (Obuasi)', contaminant: 'Arsenic', level: '13.56 mg/L', wholimit: '0.01 mg/L', timesOver: 1356, riskLevel: 'CRITICAL', reason: 'Arsenic levels 1,356x over WHO limits. Water is NOT safe for consumption.' },
    { river: 'River Asuakoo (Obuasi)', contaminant: 'Manganese', level: '22.72 mg/L', wholimit: '0.4 mg/L', timesOver: 57, riskLevel: 'CRITICAL', reason: 'Manganese levels 57x over WHO limits. Heavy metal poisoning confirmed.' }
  ],
  government: { naimosBudget: 'GH¢150 million', source: '2026 Budget Statement' },
  safeAlternatives: {
    accra: { alternatives: ['Kumasi', 'Takoradi', 'Cape Coast'], reason: 'Accra has severe flood risk. Consider Kumasi or Cape Coast with lower flood risk.' },
    tarkwa: { alternatives: ['Takoradi', 'Sekondi', 'Cape Coast'], reason: 'Tarkwa has active mining operations. Consider coastal cities like Takoradi or Cape Coast.' },
    obuasi: { alternatives: ['Kumasi', 'Mampong', 'Ejisu'], reason: 'Obuasi has severe water contamination. Consider Kumasi for safer travel.' }
  },
  methodology: {
    waterPollution: {
      title: 'Water Pollution Testing Methodology (WACAM/CEIA 2008)',
      conductedBy: 'Centre for Environmental Impact Analysis (CEIA)',
      commissionedBy: 'WACAM NGO',
      period: 'May - September 2008',
      samples: '400 water samples (200 from Obuasi, 200 from Tarkwa)',
      method: 'Atomic Absorption Spectrophotometry (AAS)',
      contaminants: ['Arsenic', 'Manganese', 'Cadmium', 'Iron', 'Copper', 'Mercury', 'Zinc', 'Lead'],
      purpose: 'Assess heavy metal contamination in water bodies near mining areas'
    },
    rainfall: {
      title: 'Rainfall Data Collection Methodology (GMet)',
      source: 'Ghana Meteorological Agency',
      instruments: ['Automatic Weather Stations (AWS)', 'Rain gauges'],
      location: 'Accra Airport AWS station',
      collection: 'Daily and monthly rainfall totals',
      validation: 'Cross-referenced with historical records',
      period: '2024-2026'
    },
    miningArrests: {
      title: 'Anti-Galamsey Operation Methodology (Police)',
      source: 'Ghana Police Service',
      operations: 'Anti-galamsey raids and enforcement operations',
      leadership: 'Chief Superintendent William Jabialu',
      personnel: '73 officers + 9 senior personnel',
      methods: ['Raids', 'Intelligence gathering', 'Site inspections'],
      period: 'May-June 2025',
      regions: ['Western', 'Ashanti', 'Central']
    },
    satelliteDetection: {
      title: 'Satellite Mining Detection Methodology (GEE)',
      satellite: ['Sentinel-1 SAR', 'Sentinel-2'],
      platform: 'Google Earth Engine (GEE)',
      vegetationIndex: 'Normalized Difference Vegetation Index (NDVI)',
      detectionLogic: 'Green → Red transition indicates mining activity',
      validation: 'MAAP Peru model (90% reduction in illegal mining deforestation)',
      method: 'Radar (SAR) + multi-spectral vegetation indices'
    }
  },
  
  // ─── Crime & Safety Data ──────────────────────────────────────────────────
  crime: {
    accra: {
      overall: 'MODERATE',
      theft: 'HIGH',
      robbery: 'MODERATE',
      pickpocketing: 'HIGH',
      nightSafety: 'MODERATE',
      daySafety: 'GOOD',
      safeAreas: ['Airport Residential', 'Cantonments', 'Labone', 'East Legon'],
      unsafeAreas: ['Agbogbloshie', 'Nima', 'Mamobi', 'Sodom and Gomorrah'],
      advice: 'Avoid walking alone at night. Keep valuables hidden. Use registered taxis.',
      commonCrimes: ['Pickpocketing', 'Bag snatching', 'Mobile phone theft'],
      emergencyNumber: '191 (Police), 192 (Ambulance)'
    },
    takoradi: {
      overall: 'LOW',
      theft: 'LOW',
      robbery: 'LOW',
      pickpocketing: 'MODERATE',
      nightSafety: 'GOOD',
      daySafety: 'GOOD',
      safeAreas: ['Airport Ridge', 'Anaji', 'Adiembra'],
      unsafeAreas: ['Market areas at night'],
      advice: 'Generally safe. Exercise normal precautions.',
      commonCrimes: ['Petty theft', 'Pickpocketing in markets'],
      emergencyNumber: '191 (Police), 192 (Ambulance)'
    },
    kumasi: {
      overall: 'MODERATE',
      theft: 'HIGH',
      robbery: 'MODERATE',
      pickpocketing: 'HIGH',
      nightSafety: 'MODERATE',
      daySafety: 'GOOD',
      safeAreas: ['Ahodwo', 'Danyame', 'Santasi'],
      unsafeAreas: ['Central Market', 'Kejetia', 'Asafo'],
      advice: 'Avoid crowded areas. Keep belongings secure.',
      commonCrimes: ['Pickpocketing', 'Mobile phone theft', 'Bag snatching'],
      emergencyNumber: '191 (Police), 192 (Ambulance)'
    },
    tarkwa: {
      overall: 'HIGH',
      theft: 'HIGH',
      robbery: 'MODERATE',
      pickpocketing: 'HIGH',
      nightSafety: 'POOR',
      daySafety: 'MODERATE',
      safeAreas: ['Residential areas near police station'],
      unsafeAreas: ['Mining sites', 'Remote areas', 'Abandoned pits'],
      advice: 'Avoid mining areas. Travel in groups. Stay in well-lit areas.',
      commonCrimes: ['Theft from mining sites', 'Robbery', 'Assault'],
      emergencyNumber: '191 (Police), 192 (Ambulance)'
    },
    obuasi: {
      overall: 'HIGH',
      theft: 'HIGH',
      robbery: 'HIGH',
      pickpocketing: 'HIGH',
      nightSafety: 'POOR',
      daySafety: 'MODERATE',
      safeAreas: ['AngloGold compound', 'Police barracks area'],
      unsafeAreas: ['Mining communities', 'Nkawkaw road', 'Sites near River Nyam'],
      advice: 'Avoid isolated areas. Do not drink tap water. Stay in groups.',
      commonCrimes: ['Theft', 'Robbery', 'Illegal mining related violence'],
      emergencyNumber: '191 (Police), 192 (Ambulance)'
    }
  },
  
  // ─── Traffic & Road Safety Data ────────────────────────────────────────────
  traffic: {
    accra: {
      congestion: 'SEVERE',
      peakHours: ['6:00-9:00 AM', '4:00-7:00 PM'],
      worstRoads: ['Kwame Nkrumah Avenue', 'Ring Road', 'Liberation Road', 'Awudome'],
      safeRoads: ['Motorway', 'Spintex Road (off-peak)'],
      accidentZones: ['Kwame Nkrumah Circle', 'Tema Motorway interchange', 'La'],
      advice: 'Avoid peak hour travel. Use alternative routes. Be cautious at roundabouts.',
      publicTransport: 'Tro-tros are available but often overcrowded. Use Uber/Bolt for safety.',
      emergency: 'Call 191 for Police, 192 for Ambulance'
    },
    takoradi: {
      congestion: 'MODERATE',
      peakHours: ['6:30-8:30 AM', '4:30-6:30 PM'],
      worstRoads: ['Takoradi-Tarkwa Road', 'Market Circle', 'Kwame Nkrumah Avenue'],
      safeRoads: ['Beach Road', 'Nkroful Avenue'],
      accidentZones: ['Market Circle', 'Nkroful Junction'],
      advice: 'Avoid Market Circle during peak hours. Use bypass routes.',
      publicTransport: 'Tro-tros and taxis available. Use registered taxis at night.',
      emergency: 'Call 191 for Police, 192 for Ambulance'
    },
    kumasi: {
      congestion: 'SEVERE',
      peakHours: ['6:00-9:00 AM', '4:00-7:00 PM'],
      worstRoads: ['Tafo Road', 'Bekwai Road', 'Kejetia Road'],
      safeRoads: ['Sofoline Road (off-peak)', 'Lake Road'],
      accidentZones: ['Sofoline Interchange', 'Kejetia Roundabout'],
      advice: 'Avoid Sofoline Interchange during peak hours. Use alternative routes.',
      publicTransport: 'Tro-tros and taxis available. Use registered taxis.',
      emergency: 'Call 191 for Police, 192 for Ambulance'
    },
    tarkwa: {
      congestion: 'LOW',
      peakHours: ['7:00-8:30 AM', '4:30-6:00 PM'],
      worstRoads: ['Tarkwa-Huniso Road', 'Tarkwa-Obuasi Road'],
      safeRoads: ['Main town roads'],
      accidentZones: ['Tarkwa-Huniso Road (mining trucks)'],
      advice: 'Watch out for heavy mining trucks. Avoid night driving.',
      publicTransport: 'Limited public transport. Use private taxis.',
      emergency: 'Call 191 for Police, 192 for Ambulance'
    },
    obuasi: {
      congestion: 'MODERATE',
      peakHours: ['6:30-8:30 AM', '3:30-6:00 PM'],
      worstRoads: ['Obuasi-Kumasi Road', 'Obuasi-Tarkwa Road'],
      safeRoads: ['Town roads'],
      accidentZones: ['Obuasi-Kumasi Road (bends)'],
      advice: 'Avoid night travel. Watch for mining trucks.',
      publicTransport: 'Limited public transport.',
      emergency: 'Call 191 for Police, 192 for Ambulance'
    }
  }
};

// ============================================================
// PROFESSIONAL SYSTEM PROMPTS
// ============================================================

const CLOUD_SYSTEM_PROMPT = `You are "ResilientGuard" - a professional travel safety assistant for Ghana.

## YOUR PURPOSE:
Provide expert travel safety assessments using LIVE WEATHER DATA, REAL-TIME conditions, CRIME DATA, and TRAFFIC DATA.

## RESPONSE FORMAT:
📍 **Location:** [City Name]
🔴🟠🟡🟢 **Overall Risk Level:** [CRITICAL / HIGH / MODERATE / LOW]

**WEATHER:** [Temperature, Humidity, Precipitation]
**FLOOD RISK:** [LOW / MODERATE / HIGH / CRITICAL]
**CRIME & SAFETY:** [Theft, Robbery, Pickpocketing, Night Safety]
**TRAFFIC:** [Congestion, Peak Hours, Accident Zones]

📋 **Assessment:** [Clear explanation combining all data]
⚠️ **Key Concerns:** [Specific risks]
✅ **Recommendation:** [Clear actionable advice]
🗺️ **Coordinates:** [lat, lng]`;

const OLLAMA_SYSTEM_PROMPT = `You are "ResilientGuard" - a professional travel safety assistant for Ghana using historical data only.

## RESPONSE FORMAT:
📍 **Location:** [City Name]
🔴🟠🟡🟢 **Overall Risk Level:** [CRITICAL / HIGH / MODERATE / LOW]

**FLOOD RISK:** [LOW / MODERATE / HIGH / CRITICAL]
**CRIME & SAFETY:** [Theft, Robbery, Pickpocketing, Night Safety]
**TRAFFIC:** [Congestion, Peak Hours, Accident Zones]

📋 **Assessment:** [Clear explanation]
⚠️ **Key Concerns:** [Specific risks]
✅ **Recommendation:** [Clear actionable advice]
🗺️ **Coordinates:** [lat, lng]`;

const GemmaChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState(null);
  
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
  
  const getAvailableModels = () => {
    const available = [];
    if (geminiApiKey) available.push('gemini');
    if (groqApiKey) available.push('groq');
    available.push('local');
    return available;
  };

  const [selectedProvider, setSelectedProvider] = useState(() => {
    if (geminiApiKey) return 'gemini';
    if (groqApiKey) return 'groq';
    return 'local';
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    const provider = geminiApiKey ? 'gemini' : (groqApiKey ? 'groq' : 'local');
    return AI_MODELS[provider].defaultModel;
  });

  const availableProviders = getAvailableModels();
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isGeneralKnowledgeQuery = (query) => {
    const generalKeywords = [
      'president', 'history', 'capital', 'population', 'celebrity', 
      'song', 'movie', 'actor', 'actress', 'sport', 'team', 'player',
      'politician', 'minister', 'mp', 'parliament', 'election', 'vote',
      'currency', 'money', 'economy', 'gdp', 'inflation', 'interest',
      'language', 'tribe', 'ethnic', 'culture', 'tradition', 'festival',
      'independence', 'founder', 'foundation', 'established', 'year',
      'famous', 'popular', 'best', 'worst', 'biggest', 'smallest'
    ];
    const lowerQuery = query.toLowerCase();
    return generalKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  const hasLocation = (query) => {
    const lowerQuery = query.toLowerCase();
    return Object.keys(LOCATIONS).some(name => lowerQuery.includes(name));
  };

  const fetchLiveWeather = async (query) => {
    try {
      const lowerQuery = query.toLowerCase();
      let targetLoc = null;
      let targetName = '';
      for (const [name, coords] of Object.entries(LOCATIONS)) {
        if (lowerQuery.includes(name)) {
          targetLoc = coords;
          targetName = name;
          break;
        }
      }
      
      if (!targetLoc) return null;

      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${targetLoc.lat}&longitude=${targetLoc.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,showers&hourly=precipitation_probability&timezone=Africa%2FAccra`
      );
      
      return {
        name: targetName.charAt(0).toUpperCase() + targetName.slice(1),
        temperature: res.data.current.temperature_2m || 0,
        humidity: res.data.current.relative_humidity_2m || 0,
        currentPrecip: res.data.current.precipitation || 0,
        prob: res.data.hourly?.precipitation_probability?.[0] || 0,
        lat: targetLoc.lat,
        lng: targetLoc.lng,
        timestamp: new Date().toISOString()
      };
    } catch(e) {
      console.error("Weather fetch failed", e);
      return null;
    }
  };

  const extractMapData = (text) => {
    const coordMatch = text.match(/(\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
        risk: text.includes('🔴') ? 'RED' : 
               text.includes('🟠') ? 'ORANGE' : 
               text.includes('🟡') ? 'YELLOW' : 'GREEN'
      };
    }
    return null;
  };

  const cleanAndFormatResponse = (reply) => {
    if (reply.includes('📍') && reply.includes('**')) {
      return reply;
    }
    return reply.trim();
  };

  const isMethodologyQuery = (query) => {
    const keywords = [
      'methodology', 'how was', 'how did', 'how is', 'how are',
      'what method', 'what methods', 'research', 'study', 'conducted',
      'collected', 'validation', 'validated',
      'samples', 'testing', 'analysis', 'experiment',
      'who conducted', 'who commissioned', 'when was'
    ];
    const lowerQuery = query.toLowerCase();
    return keywords.some(keyword => lowerQuery.includes(keyword));
  };

  const getMethodologyContext = (query) => {
    const lowerQuery = query.toLowerCase();
    const methodology = HISTORICAL_DATA.methodology;
    
    if (lowerQuery.includes('water') || lowerQuery.includes('pollution') || 
        lowerQuery.includes('arsenic') || lowerQuery.includes('manganese')) {
      return methodology.waterPollution;
    }
    if (lowerQuery.includes('rainfall') || lowerQuery.includes('rain') || 
        lowerQuery.includes('weather') || lowerQuery.includes('gmet')) {
      return methodology.rainfall;
    }
    if (lowerQuery.includes('arrest') || lowerQuery.includes('police') || 
        lowerQuery.includes('galamsey') || lowerQuery.includes('mining operation')) {
      return methodology.miningArrests;
    }
    if (lowerQuery.includes('satellite') || lowerQuery.includes('ndvi') || 
        lowerQuery.includes('sentinel') || lowerQuery.includes('detection')) {
      return methodology.satelliteDetection;
    }
    return null;
  };

  const buildOllamaContext = (userMessage) => {
    let context = '';
    const methodology = HISTORICAL_DATA.methodology;

    if (isMethodologyQuery(userMessage)) {
      const methodologyData = getMethodologyContext(userMessage);
      if (methodologyData) {
        context = `\n\n### 📋 METHODOLOGY DATA:\n${JSON.stringify(methodologyData, null, 2)}`;
      } else {
        context = `\n\n### 📋 ALL METHODOLOGY DATA:\n${JSON.stringify(methodology, null, 2)}`;
      }
    }

    const historicalContext = {
      flood: HISTORICAL_DATA.flood,
      mining: HISTORICAL_DATA.mining,
      pollution: HISTORICAL_DATA.pollution,
      government: HISTORICAL_DATA.government,
      safeAlternatives: HISTORICAL_DATA.safeAlternatives,
      crime: HISTORICAL_DATA.crime,
      traffic: HISTORICAL_DATA.traffic
    };
    context += `\n\n### 📊 HISTORICAL DATA + SAFE ALTERNATIVES + CRIME + TRAFFIC:\n${JSON.stringify(historicalContext, null, 2)}`;

    return context;
  };

  const sendMessage = async (userMessage) => {
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      if (isGeneralKnowledgeQuery(userMessage)) {
        const fallbackReply = `❌ **ResilientGuard**\n\nI am a travel safety assistant for Ghana. I can only provide travel safety information, flood risk alerts, mining incident warnings, crime and safety data, and traffic updates.\n\nPlease ask about a specific location (e.g., Accra, Tarkwa, Obuasi, Kumasi).`;
        setMessages([...newMessages, { role: 'assistant', content: fallbackReply }]);
        setLoading(false);
        return;
      }

      if (selectedProvider !== 'local' && !hasLocation(userMessage)) {
        const fallbackReply = `📍 **Location Required**\n\nPlease specify a location in Ghana (e.g., Accra, Tarkwa, Obuasi, Kumasi) so I can provide a professional travel safety assessment.`;
        setMessages([...newMessages, { role: 'assistant', content: fallbackReply }]);
        setLoading(false);
        return;
      }

      const providerConfig = AI_MODELS[selectedProvider];
      let assistantReply = '';

      if (selectedProvider === 'gemini') {
        if (!geminiApiKey) throw new Error("No Gemini API Key found.");
        
        const weatherData = await fetchLiveWeather(userMessage);
        let liveContext = '';
        if (weatherData) {
          liveContext = `\n\n### 📡 LIVE WEATHER DATA:\n- Target Location: ${weatherData.name} (${weatherData.lat}, ${weatherData.lng})\n- Temperature: ${weatherData.temperature}°C\n- Humidity: ${weatherData.humidity}%\n- Precipitation: ${weatherData.currentPrecip}mm\n- Probability: ${weatherData.prob}%\n\n### 📊 ADDITIONAL DATA AVAILABLE:\n- Crime data: Theft, Robbery, Pickpocketing, Night Safety\n- Traffic data: Congestion, Peak Hours, Accident Zones\n- Historical flood records\n- Mining incident data`;
        }

        const fullSystemPrompt = CLOUD_SYSTEM_PROMPT + liveContext;

        const response = await axios.post(
          providerConfig.endpoint,
          {
            model: selectedModel,
            messages: [
              { role: 'system', content: fullSystemPrompt },
              ...newMessages
            ],
            temperature: 0.7,
            max_tokens: 900
          },
          { headers: { 'Authorization': `Bearer ${geminiApiKey}`, 'Content-Type': 'application/json' } }
        );
        assistantReply = response.data.choices[0].message.content.replace(/\*/g, '');

      } else if (selectedProvider === 'groq') {
        if (!groqApiKey) throw new Error("No Groq API Key found.");
        
        const weatherData = await fetchLiveWeather(userMessage);
        let liveContext = '';
        if (weatherData) {
          liveContext = `\n\n### 📡 LIVE WEATHER DATA:\n- Target Location: ${weatherData.name} (${weatherData.lat}, ${weatherData.lng})\n- Temperature: ${weatherData.temperature}°C\n- Humidity: ${weatherData.humidity}%\n- Precipitation: ${weatherData.currentPrecip}mm\n- Probability: ${weatherData.prob}%\n\n### 📊 ADDITIONAL DATA AVAILABLE:\n- Crime data: Theft, Robbery, Pickpocketing, Night Safety\n- Traffic data: Congestion, Peak Hours, Accident Zones\n- Historical flood records\n- Mining incident data`;
        }

        const fullSystemPrompt = CLOUD_SYSTEM_PROMPT + liveContext;

        const response = await axios.post(
          providerConfig.endpoint,
          {
            model: selectedModel,
            messages: [
              { role: 'system', content: fullSystemPrompt },
              ...newMessages
            ],
            temperature: 0.7,
            max_tokens: 900
          },
          { headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' } }
        );
        assistantReply = response.data.choices[0].message.content.replace(/\*/g, '');

      } else {
        try {
          await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
        } catch {
          throw new Error('Ollama is not running. Start it with: ollama serve');
        }

        const ollamaContext = buildOllamaContext(userMessage);
        const fullSystemPrompt = OLLAMA_SYSTEM_PROMPT + ollamaContext;

        const response = await axios.post(
          providerConfig.endpoint,
          {
            model: selectedModel,
            messages: [
              { role: 'system', content: fullSystemPrompt },
              ...newMessages
            ],
            stream: false,
            options: { temperature: 0.7, num_predict: 900 }
          },
          { timeout: 30000 }
        );
        assistantReply = response.data.message.content.replace(/\*/g, '');
      }
      
      const finalReply = cleanAndFormatResponse(assistantReply);
      
      const mapDataExtracted = extractMapData(finalReply);
      if (mapDataExtracted) {
        setMapData(mapDataExtracted);
        setShowMap(true);
      }
      setMessages([...newMessages, { role: 'assistant', content: finalReply }]);
    } catch (error) {
      let errorMsg = error.response?.data?.error?.message || error.message || "An unknown error occurred.";
      if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        if (selectedProvider === 'local') {
          errorMsg = "❌ Could not connect to Local Ollama. Is the server running?\n\nRun these commands:\n1. ollama serve\n2. ollama run batiai/gemma4-e2b:q4";
        } else if (selectedProvider === 'gemini') {
          errorMsg = "❌ Could not connect to Gemini API. Check your internet connection and API key.";
        } else {
          errorMsg = "❌ Could not connect to Groq API. Check your internet connection and API key.";
        }
      }
      const fallbackReply = `⚠️ **Connection Error**\n\n${errorMsg}\n\nPlease check your network or try a different AI provider.`;
      setMessages([...newMessages, { role: 'assistant', content: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const getProviderColor = () => {
    switch(selectedProvider) {
      case 'gemini': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      case 'groq': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default: return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
  };

  const getDotColor = () => {
    switch(selectedProvider) {
      case 'gemini': return 'bg-purple-500';
      case 'groq': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden relative" style={{ height: '500px' }}>
      
      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="border-b bg-white dark:bg-gray-800 p-3 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center">
            <span className="text-xl mr-2 shrink-0">🛡️</span>
            <div>
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight">ResilientGuard AI</h2>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Travel Safety • Weather • Crime • Traffic</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setSelectedModel(AI_MODELS[e.target.value].defaultModel);
                }}
                className="text-[10px] md:text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {AI_MODELS[provider].label}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-[10px] md:text-xs px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AI_MODELS[selectedProvider].models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            
            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center ${getProviderColor()}`}>
              <span className={`w-1.5 h-1.5 rounded-full mr-1 animate-pulse ${getDotColor()}`}></span>
              {AI_MODELS[selectedProvider].label.split('(')[0].trim()}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Chat Container ──────────────────────────────────────────────────── */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-3xl mb-2">🛡️</p>
            <p className="text-base font-medium">ResilientGuard</p>
            <p className="text-xs mt-1 max-w-md mx-auto">
              <strong>Comprehensive travel safety assessments</strong> for Ghana.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5 max-w-sm mx-auto text-left text-[10px]">
              <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🌤️ Weather</div>
              <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🚨 Crime</div>
              <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🚗 Traffic</div>
              <div className="bg-gray-100 dark:bg-gray-800 p-1.5 rounded-lg border border-gray-200 dark:border-gray-700">🌊 Flood</div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5 max-w-sm mx-auto text-left text-xs">
              <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="font-medium">📍 Example:</span>
                <p className="text-gray-600 dark:text-gray-300">"Is Accra safe right now?"</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedProvider === 'gemini' ? 'Fetching live data...' :
                   selectedProvider === 'groq' ? 'Fetching live data...' : 
                   'Analyzing data...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {showMap && mapData && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 shrink-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center text-xs">
              <span className="mr-1">🗺️</span> Risk Map
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                mapData.risk === 'RED' ? 'bg-red-100 text-red-700' :
                mapData.risk === 'ORANGE' ? 'bg-orange-100 text-orange-700' :
                mapData.risk === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {mapData.risk === 'RED' ? '🔴 CRITICAL' :
                 mapData.risk === 'ORANGE' ? '🟠 HIGH' :
                 mapData.risk === 'YELLOW' ? '🟡 MODERATE' : '🟢 SAFE'}
              </span>
            </h3>
            <button onClick={() => setShowMap(false)} className="text-xs text-gray-500 hover:text-gray-700 font-medium">✕</button>
          </div>
          <div className="h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <RiskMap locations={[{ ...mapData, name: 'Target Location', radius: 1500 }]} riskLevel={mapData.risk} />
          </div>
        </div>
      )}

      {/* ─── INPUT AREA ────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about travel safety..."
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-4 py-2 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md whitespace-nowrap text-sm"
          >
            <span>{loading ? '...' : 'Send'}</span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-0.5">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-1">🛡️</span> Weather • Crime • Traffic • Flood
          </p>
          <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 flex items-center bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
            {selectedProvider === 'gemini' ? 'Gemma 4 Cloud' :
             selectedProvider === 'groq' ? 'Groq' : 'Local'}
          </span>
        </div>
      </form>
    </div>
  );
};

export default GemmaChatbot;