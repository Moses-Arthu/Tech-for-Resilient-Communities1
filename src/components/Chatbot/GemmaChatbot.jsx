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
// HISTORICAL DATA FOR OLLAMA (OFFLINE MODE)
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
  }
};

// ============================================================
// PROFESSIONAL SYSTEM PROMPTS
// ============================================================

// Cloud Model Prompt (Gemini + Groq) - With Live Weather
const CLOUD_SYSTEM_PROMPT = `You are "ResilientGuard" - a professional travel safety assistant for Ghana.

## YOUR PURPOSE:
Provide expert travel safety assessments using LIVE WEATHER DATA and REAL-TIME conditions.

## DATA SOURCES:
- Live weather data from Open-Meteo API (current precipitation, probability)
- Historical flood records from Ghana Meteorological Agency
- Real mining incident data from Ghana Police Service
- Water pollution data from WACAM/CEIA reports

## RESPONSE STANDARDS:
- Be professional, clear, and authoritative
- Use proper formatting with bold headings and bullet points
- Always include the source of your information
- Provide actionable recommendations based on CURRENT conditions

## RESPONSE FORMAT:
📍 **Location:** [City Name]
🟢🟡🟠🔴 **Risk Level:** [LOW / MODERATE / HIGH / CRITICAL]
📋 **Assessment:** [Clear explanation of the situation]
🌤️ **Weather Context:** [Live weather data summary from Open-Meteo]
⚠️ **Key Concerns:** [Specific risks or incidents]
✅ **Recommendation:** [Clear actionable advice]
🗺️ **Coordinates:** [lat, lng]
📊 **Data Source:** [GMet Live / Police / WACAM]

## PROFESSIONAL GUIDELINES:
- If safe: "Travel is currently recommended with standard precautions."
- If moderate: "Travel is possible but exercise increased caution."
- If high: "Non-essential travel is strongly discouraged."
- If critical: "Travel is not recommended. Emergency protocols advised."

## LOCATION NOT DETECTED:
Ask the user to specify a location.

## GENERAL KNOWLEDGE:
Politely decline and redirect to travel safety.`;

// Ollama Model Prompt (Local) - Historical Data Only
const OLLAMA_SYSTEM_PROMPT = `You are "ResilientGuard" - a professional travel safety assistant for Ghana using historical data only.

## YOUR PURPOSE:
Provide expert travel safety assessments based on historical flood, mining, and pollution data.

## DATA SOURCES (Historical Only):
- Historical flood records from Ghana Meteorological Agency (2024-2026)
- Mining incident data from Ghana Police Service (2025)
- Water pollution data from WACAM/CEIA reports (2008)

## IMPORTANT:
You do NOT have access to live weather data. You can only use the historical data provided.

## RESPONSE STANDARDS:
- Be professional, clear, and authoritative
- Use proper formatting with bold headings
- Always cite the data source
- Provide actionable recommendations

## RESPONSE FORMAT:
📍 **Location:** [City Name]
🟢🟡🟠🔴 **Risk Level:** [LOW / MODERATE / HIGH / CRITICAL]
📋 **Assessment:** [Clear explanation based on historical data]
📜 **Historical Context:** [Relevant historical data points]
🔀 **Safe Alternative:** [Nearest safer location with reason]
🗺️ **Coordinates:** [lat, lng]
📊 **Data Source:** [GMet Historical / Police / WACAM]

## PROFESSIONAL GUIDELINES:
- If safe: "Based on historical data, travel is generally safe."
- If moderate: "Historical data suggests caution is advised."
- If high: "Historical data indicates significant risks."
- If critical: "Historical data shows severe risks."

If the user asks for something not in the data, say:
"I don't have that information in my offline historical database."

## LIVE WEATHER QUERIES:
If the user asks for current weather or live conditions, say:
"I am offline and can only provide historical data. Please select a cloud AI model (Gemini or Groq) for live weather information."`;

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

  // Check if user is asking a general knowledge question
  const isGeneralKnowledgeQuery = (query) => {
    const generalKeywords = [
      'president', 'history', 'capital', 'population', 'celebrity', 
      'song', 'movie', 'actor', 'actress', 'sport', 'team', 'player',
      'politician', 'minister', 'mp', 'parliament', 'election', 'vote',
      'currency', 'money', 'economy', 'gdp', 'inflation', 'interest',
      'climate', 'weather general', 'temperature', 'season', 'rainfall general',
      'language', 'tribe', 'ethnic', 'culture', 'tradition', 'festival',
      'independence', 'founder', 'foundation', 'established', 'year',
      'famous', 'popular', 'best', 'worst', 'biggest', 'smallest'
    ];
    const lowerQuery = query.toLowerCase();
    return generalKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  // Check if user mentioned a location
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

      const res = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${targetLoc.lat}&longitude=${targetLoc.lng}&current=precipitation,rain,showers&hourly=precipitation_probability&timezone=Africa%2FAccra`);
      
      return {
        name: targetName.charAt(0).toUpperCase() + targetName.slice(1),
        currentPrecip: res.data.current.precipitation || 0,
        prob: res.data.hourly.precipitation_probability[0] || 0,
        lat: targetLoc.lat,
        lng: targetLoc.lng
      };
    } catch(e) {
      console.error("Weather fetch failed", e);
      return null;
    }
  }

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

  // ============================================================
  // OLLAMA HELPER FUNCTIONS
  // ============================================================
  
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
      safeAlternatives: HISTORICAL_DATA.safeAlternatives
    };
    context += `\n\n### 📊 HISTORICAL DATA + SAFE ALTERNATIVES:\n${JSON.stringify(historicalContext, null, 2)}`;

    return context;
  };

  const sendMessage = async (userMessage) => {
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      // --- FRONTEND GUARDRAIL: Check for general knowledge ---
      if (isGeneralKnowledgeQuery(userMessage)) {
        const fallbackReply = `❌ **ResilientGuard**\n\nI am a travel safety assistant for Ghana. I can only provide travel safety information, flood risk alerts, and mining incident warnings.\n\nPlease ask about a specific location (e.g., Accra, Tarkwa, Obuasi, Kumasi).`;
        setMessages([...newMessages, { role: 'assistant', content: fallbackReply }]);
        setLoading(false);
        return;
      }

      // --- FRONTEND GUARDRAIL: Check if location is mentioned (for cloud models) ---
      if (selectedProvider !== 'local' && !hasLocation(userMessage)) {
        const fallbackReply = `📍 **Location Required**\n\nPlease specify a location in Ghana (e.g., Accra, Tarkwa, Obuasi, Kumasi) so I can provide a professional travel safety assessment.`;
        setMessages([...newMessages, { role: 'assistant', content: fallbackReply }]);
        setLoading(false);
        return;
      }

      const providerConfig = AI_MODELS[selectedProvider];
      let assistantReply = '';

      // ---------- GEMINI API (Cloud - With Live Weather) ----------
      if (selectedProvider === 'gemini') {
        if (!geminiApiKey) throw new Error("No Gemini API Key found.");
        
        const weatherData = await fetchLiveWeather(userMessage);
        let liveContext = '';
        if (weatherData) {
          liveContext = `\n\n### 📡 LIVE WEATHER DATA (JUST FETCHED FROM OPEN-METEO):\n- Target Location: ${weatherData.name} (${weatherData.lat}, ${weatherData.lng})\n- Current Precipitation: ${weatherData.currentPrecip}mm\n- Precipitation Probability: ${weatherData.prob}%\n\nINSTRUCTION: Use this live weather data to make your travel safety assessment. This is REAL-TIME data.`;
        } else {
          liveContext = `\n\n### 📡 LIVE WEATHER DATA:\nNo specific location detected. Rely on base data or ask the user to clarify the city.`;
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
            max_tokens: 600
          },
          { headers: { 'Authorization': `Bearer ${geminiApiKey}`, 'Content-Type': 'application/json' } }
        );
        assistantReply = response.data.choices[0].message.content.replace(/\*/g, '');

      // ---------- GROQ API (Cloud - With Live Weather) ----------
      } else if (selectedProvider === 'groq') {
        if (!groqApiKey) throw new Error("No Groq API Key found.");
        
        const weatherData = await fetchLiveWeather(userMessage);
        let liveContext = '';
        if (weatherData) {
          liveContext = `\n\n### 📡 LIVE WEATHER DATA (JUST FETCHED FROM OPEN-METEO):\n- Target Location: ${weatherData.name} (${weatherData.lat}, ${weatherData.lng})\n- Current Precipitation: ${weatherData.currentPrecip}mm\n- Precipitation Probability: ${weatherData.prob}%\n\nINSTRUCTION: Use this live weather data to make your travel safety assessment. This is REAL-TIME data.`;
        } else {
          liveContext = `\n\n### 📡 LIVE WEATHER DATA:\nNo specific location detected. Rely on base data or ask the user to clarify the city.`;
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
            max_tokens: 600
          },
          { headers: { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' } }
        );
        assistantReply = response.data.choices[0].message.content.replace(/\*/g, '');

      // ---------- OLLAMA (Local - Offline, NO Weather) ----------
      } else {
        // Check if Ollama is reachable
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
            options: { temperature: 0.7, num_predict: 600 }
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex h-[calc(100vh-6rem)] flex-col bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden relative">
      
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center">
            <span className="text-2xl mr-3 shrink-0">🛡️</span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">ResilientGuard AI</h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Professional Travel Safety • Ghana • Live Data</p>
            </div>
          </div>
          
          {/* Model Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setSelectedModel(AI_MODELS[e.target.value].defaultModel);
                }}
                className="text-xs md:text-sm px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="text-xs md:text-sm px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AI_MODELS[selectedProvider].models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            
            <span className={`text-[10px] md:text-xs px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center ${getProviderColor()}`}>
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1.5 animate-pulse ${getDotColor()}`}></span>
              {AI_MODELS[selectedProvider].label.split('(')[0].trim()}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p className="text-4xl mb-4">🛡️</p>
            <p className="text-lg font-medium">ResilientGuard</p>
            <p className="text-sm mt-2 max-w-md mx-auto">
              <strong>Professional travel safety assessments</strong> for Ghana. Real-time risk analysis based on live weather data and official records.
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl mx-auto text-left text-sm">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="font-medium">📍 Example:</span>
                <p className="text-gray-600 dark:text-gray-300">"Is Accra safe right now?"</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="font-medium">📍 Example:</span>
                <p className="text-gray-600 dark:text-gray-300">"Travel risk in Tarkwa?"</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-lg px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedProvider === 'gemini' ? 'Fetching live weather data...' :
                   selectedProvider === 'groq' ? 'Fetching live weather data...' : 
                   'Analyzing historical data...'}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {showMap && mapData && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">🗺️</span> Risk Map
              <span className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${
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
            <button onClick={() => setShowMap(false)} className="text-sm text-gray-500 hover:text-gray-700 font-medium">✕ Close</button>
          </div>
          <div className="h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <RiskMap locations={[{ ...mapData, name: 'Target Location', radius: 1500 }]} riskLevel={mapData.risk} />
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-gray-700 p-3 md:p-4 bg-white dark:bg-gray-800 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about travel safety in Ghana..."
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processing...' : 'Send'}</span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-1">🛡️</span> Professional Travel Safety
          </p>
          <span className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
            {selectedProvider === 'gemini' ? 'Gemma 4 Cloud' :
             selectedProvider === 'groq' ? 'Groq: ' + selectedModel : 'Local: ' + selectedModel}
          </span>
        </div>
      </form>
    </div>
  );
};

export default GemmaChatbot;