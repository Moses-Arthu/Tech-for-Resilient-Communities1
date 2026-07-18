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

const GemmaChatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState(null);
  
  // Settings state
  const [apiMode, setApiMode] = useState('groq'); // 'groq' or 'local'
  const [apiKey, setApiKey] = useState(localStorage.getItem('groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || '');
  const [showSettings, setShowSettings] = useState(!localStorage.getItem('groq_api_key') && !import.meta.env.VITE_GROQ_API_KEY);

  const chatEndRef = useRef(null);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('groq_api_key', key);
    if (key.trim() !== '') {
      setShowSettings(false);
    }
  };

  const SYSTEM_PROMPT = `You are "ResilientGuard" - a travel safety assistant for Ghana powered by the Gemma AI model.

## REAL BASE DATA YOU HAVE ACCESS TO:
### Mining Incident Data (Ghana Police Service):
- Huniso (near Tarkwa): 13 suspects arrested - ACTIVE
- Akrokerri (near Obuasi): 9 suspects arrested, 200m from school - ACTIVE
- Dunkwa-On-Offin: 2 suspects on River Offin - ACTIVE
- Total: 30 suspects arrested across 3 regions

### Pollution Data (WACAM/CEIA Report):
- River Nyam (Obuasi): Arsenic 13.56 mg/L (WHO: 0.01 mg/L) - 1,356x OVER LIMIT

### Coordinates Dictionary:
- Accra: 5.6037, -0.1870
- Takoradi: 4.8916, -1.7748
- Tarkwa: 5.3063, -1.9839
- Obuasi: 6.2012, -1.6813

## RESPONSE GUIDELINES:
1. ALWAYS use the real data (and the LIVE WEATHER DATA provided in context).
2. Provide CLEAR color-coded recommendations based on LIVE weather or mining risk:
   - 🟢 GREEN: Safe to travel
   - 🟡 YELLOW: Moderate risk, travel with caution
   - 🟠 ORANGE: High risk, avoid non-essential travel
   - 🔴 RED: DO NOT TRAVEL
3. ALWAYS include exact coordinates for the location so the map can render it (format: lat, lng).
4. Explain WHY using the specific live data. Keep it concise but highly informative.`;

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

  const sendMessage = async (userMessage) => {
    setLoading(true);
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      // 1. Fetch live data
      const weatherData = await fetchLiveWeather(userMessage);
      let liveContext = '';
      if (weatherData) {
        liveContext = `\n\n### 📡 LIVE WEATHER DATA (JUST FETCHED FROM OPEN-METEO API):\n- Target Location: ${weatherData.name} (${weatherData.lat}, ${weatherData.lng})\n- Current Precipitation: ${weatherData.currentPrecip}mm\n- Precipitation Probability: ${weatherData.prob}%\n\nINSTRUCTION: Analyze this live weather data to determine flood risk! If precipitation > 0 or probability > 50%, increase the risk to YELLOW/ORANGE/RED accordingly.`;
      } else {
        liveContext = `\n\n### 📡 LIVE WEATHER DATA:\nNo specific location detected to fetch live weather, rely on base data or ask the user to clarify the city.`;
      }

      const fullSystemPrompt = SYSTEM_PROMPT + liveContext;

      let assistantReply = '';

      if (apiMode === 'groq') {
        if (!apiKey) {
          throw new Error("No API Key provided. Please enter your Groq API Key.");
        }
        
        // Use Groq API with Llama 3.1 8B model (Gemma was deprecated)
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: fullSystemPrompt },
            ...newMessages
          ],
          temperature: 0.7,
          max_tokens: 800
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        assistantReply = response.data.choices[0].message.content.replace(/\*/g, '');

      } else {
        // Fallback to local Ollama API
        const response = await axios.post('http://localhost:11434/api/chat', {
          model: 'gemma4:12b',
          messages: [
            { role: 'system', content: fullSystemPrompt },
            ...newMessages
          ],
          stream: false,
          options: { temperature: 0.7, max_tokens: 800 }
        });
        
        assistantReply = response.data.message.content.replace(/\*/g, '');
      }
      
      const mapDataExtracted = extractMapData(assistantReply);
      if (mapDataExtracted) {
        setMapData(mapDataExtracted);
        setShowMap(true);
      }
      setMessages([...newMessages, { role: 'assistant', content: assistantReply }]);
    } catch (error) {
      let errorMsg = error.response?.data?.error?.message || error.message || "An unknown error occurred.";
      if (error.code === 'ERR_NETWORK' && apiMode === 'local') {
        errorMsg = "Could not connect to Local Ollama. Is the server running? You can switch to Cloud AI (Groq API) in settings.";
      }
      
      const fallbackReply = `❌ **Error Connecting to AI**\n\n${errorMsg}\n\n*Please check your settings or API key.*`;
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

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden relative">
      
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center">
            <span className="text-2xl mr-3 shrink-0">🤖</span>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white leading-tight">Gemma AI Travel Safety Assistant</h2>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Powered by Live Data & Google Gemma AI</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] md:text-xs px-2.5 py-1 md:px-3 md:py-1.5 rounded-full flex items-center ${apiMode === 'groq' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'}`}>
              <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full mr-1.5 animate-pulse ${apiMode === 'groq' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
              {apiMode === 'groq' ? 'Cloud AI (Groq)' : 'Local AI (Ollama)'}
            </span>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg text-xs md:text-sm transition-colors"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-inner">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">AI Connection Settings</h3>
          <div className="flex flex-col space-y-4 max-w-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="groq" checked={apiMode === 'groq'} onChange={() => setApiMode('groq')} className="text-blue-600" />
                <span className="text-sm font-medium dark:text-gray-300">Cloud AI (Groq API - llama-3.1-8b)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="radio" value="local" checked={apiMode === 'local'} onChange={() => setApiMode('local')} className="text-green-600" />
                <span className="text-sm font-medium dark:text-gray-300">Local AI (Ollama)</span>
              </label>
            </div>
            
            {apiMode === 'groq' && (
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Get a free API key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">console.groq.com</a> to use the cloud Gemma AI instantly.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <input
                    type="password"
                    placeholder="Enter Groq API Key starting with gsk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white"
                  />
                  <button onClick={() => saveApiKey(apiKey)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 whitespace-nowrap font-medium">Save Key</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            <p className="text-4xl mb-4">🌍</p>
            <p className="text-lg font-medium">Welcome to the Dynamic Travel Safety Assistant</p>
            <p className="text-sm mt-2 max-w-md mx-auto">
              I now fetch <strong>live weather data</strong> from Open-Meteo in real-time before answering, making flood predictions dynamic!
            </p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-xl mx-auto text-left text-sm">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="font-medium">Example:</span>
                <p className="text-gray-600 dark:text-gray-300">"What is the live flood risk in Accra right now?"</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="font-medium">Example:</span>
                <p className="text-gray-600 dark:text-gray-300">"Is it safe to travel to Kumasi?"</p>
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
                <span className="text-sm text-gray-500 dark:text-gray-400">Fetching live data & thinking...</span>
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
              <span className="mr-2">🗺️</span> Dynamic Risk Map
              <span className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${
                mapData.risk === 'RED' ? 'bg-red-100 text-red-700' :
                mapData.risk === 'ORANGE' ? 'bg-orange-100 text-orange-700' :
                mapData.risk === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {mapData.risk === 'RED' ? '🔴 DO NOT TRAVEL' :
                 mapData.risk === 'ORANGE' ? '🟠 HIGH RISK' :
                 mapData.risk === 'YELLOW' ? '🟡 MODERATE RISK' : '🟢 SAFE'}
              </span>
            </h3>
            <button onClick={() => setShowMap(false)} className="text-sm text-gray-500 hover:text-gray-700 font-medium">✕ Close Map</button>
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
            placeholder="Ask about live travel safety (e.g. Accra, Kumasi)..."
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-3 text-sm md:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-sm"
            disabled={loading || (apiMode === 'groq' && !apiKey)}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || (apiMode === 'groq' && !apiKey)}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-sm flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Processing...' : 'Send'}</span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <span className="mr-1">📡</span> Includes Live API Data (Open-Meteo)
          </p>
          <span className="text-xs font-mono text-blue-600 dark:text-blue-400 flex items-center bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
            {apiMode === 'groq' ? 'Groq: llama-3.1-8b' : 'Local: gemma4:12b'}
          </span>
        </div>
      </form>
    </div>
  );
};

export default GemmaChatbot;
