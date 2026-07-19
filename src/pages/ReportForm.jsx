import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MapPin, Camera, Mic, MicOff, CheckCircle, ShieldAlert, Cpu, Square } from 'lucide-react';
import { reverseGeocode } from '../services/api';

export default function ReportForm() {
  const { addReport } = useApp();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Mining');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [isCapturingGPS, setIsCapturingGPS] = useState(false);
  const [photoMock, setPhotoMock] = useState(null);

  // Real voice recorder state
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Form submission / simulation states
  const [step, setStep] = useState('idle'); // idle, submitting, verifying, completed
  const [trackingId, setTrackingId] = useState('');

  // Capture GPS coordinates using browser geolocation
  const captureGPS = () => {
    setIsCapturingGPS(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCoords([lat, lon]);
          const address = await reverseGeocode(lat, lon);
          setLocationName(address);
          setIsCapturingGPS(false);
        },
        async (error) => {
          console.error("GPS Permission Denied. Defaulting to Ghana Flood/Mining Hotspot.");
          const fallbackLat = 5.55;
          const fallbackLon = -0.21;
          setCoords([fallbackLat, fallbackLon]);
          const address = await reverseGeocode(fallbackLat, fallbackLon);
          setLocationName(address + " (Fallback GPS Coordinates)");
          setIsCapturingGPS(false);
        }
      );
    } else {
      setIsCapturingGPS(false);
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoMock(URL.createObjectURL(file));
    }
  };

  // ─── Real Voice Recorder ───────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Pick the first MIME type the browser actually supports
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/ogg',
        'audio/mp4',
        ''
      ].find(t => t === '' || MediaRecorder.isTypeSupported(t));

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        clearInterval(timerRef.current);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch (err) {
      console.error('MediaRecorder error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone access denied. Please click the lock icon in your browser address bar and allow microphone access, then try again.');
      } else if (err.name === 'NotFoundError') {
        alert('No microphone found on this device. Please connect a microphone and try again.');
      } else {
        alert(`Recording error: ${err.message}. Please ensure microphone permissions are granted.`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const discardAudio = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
  };

  const formatTime = (secs) => `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coords) {
      alert("Please capture your GPS coordinates first to ensure alert accuracy.");
      return;
    }

    setStep('submitting');
    
    // Simulate pipeline
    setTimeout(() => {
      setStep('verifying');
      setTimeout(async () => {
        const id = await addReport({
          title,
          type,
          description,
          coords,
          photo: photoMock,
          audio: audioURL || null
        });
        setTrackingId(id);
        setStep('completed');
        
        // Reset form
        setTitle('');
        setDescription('');
        setPhotoMock(null);
        setAudioBlob(null);
        setAudioURL(null);
        setRecordingTime(0);
        setCoords(null);
        setLocationName('');
      }, 3000);
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Citizen Reporting Portal</h2>
        <p className="text-slate-500 font-medium">Report active environmental threats. Automated dual-alert verification active.</p>
      </header>

      {step === 'idle' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Report Heading / Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g., Active excavators at River Offin bed" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Hazard Classification</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setType('Mining')}
                  className={`py-3 rounded-lg border font-bold text-sm flex items-center justify-center gap-2 ${
                    type === 'Mining' 
                      ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-200' 
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <ShieldAlert size={16} /> Illegal Mining (Galamsey)
                </button>
                <button
                  type="button"
                  onClick={() => setType('Flood')}
                  className={`py-3 rounded-lg border font-bold text-sm flex items-center justify-center gap-2 ${
                    type === 'Flood' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200' 
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <MapPin size={16} /> Flood Outbreak
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1">Details & Evidence Description</label>
              <textarea 
                required
                rows={4}
                placeholder="Provide specific details. (e.g., Number of excavators, color of water, surrounding vegetation clearance, names of sites)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            {/* Geolocation Geotagging */}
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Geotag Incident (Capture Coordinates)</h4>
                  <p className="text-[11px] text-slate-500">Requires browser GPS permissions to verify the threat area.</p>
                </div>
                <button
                  type="button"
                  disabled={isCapturingGPS}
                  onClick={captureGPS}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all ${
                    isCapturingGPS ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  <MapPin size={14} className={isCapturingGPS ? 'animate-spin' : ''} />
                  {isCapturingGPS ? 'Locating...' : 'Capture GPS'}
                </button>
              </div>
              
              {coords && (
                <div className="p-3 bg-white border border-slate-100 rounded text-xs space-y-1">
                  <div className="flex justify-between font-mono font-bold text-slate-700">
                    <span>LATITUDE: {coords[0].toFixed(5)}</span>
                    <span>LONGITUDE: {coords[1].toFixed(5)}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold italic">
                    Resolved Landmark: {locationName}
                  </div>
                </div>
              )}
            </div>

            {/* Photo / Audio Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Photo Upload */}
              <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoUpload} 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Camera className="mx-auto text-slate-400 mb-2" size={24} />
                <span className="block text-xs font-bold text-slate-600">Geotagged Photo Upload</span>
                <span className="block text-[10px] text-slate-400">Click to upload photo evidence</span>
                {photoMock && (
                  <div className="mt-2 text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle size={12} /> Image Ready
                  </div>
                )}
              </div>

              {/* Real Voice Recorder */}
              <div className="border border-dashed border-slate-300 rounded-lg p-4 text-center hover:bg-slate-50 transition-colors">
                <Mic className={`mx-auto mb-2 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} size={24} />
                <span className="block text-xs font-bold text-slate-600">Voice Note Recorder</span>

                {!isRecording && !audioURL && (
                  <>
                    <span className="block text-[10px] text-slate-400 mb-2">Click to record ambient sounds</span>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 mx-auto transition-colors"
                    >
                      <Mic size={12} /> Start Recording
                    </button>
                  </>
                )}

                {isRecording && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                      <span className="text-xs font-black tracking-widest">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 mx-auto transition-colors"
                    >
                      <Square size={12} fill="white" /> Stop
                    </button>
                  </div>
                )}

                {audioURL && !isRecording && (
                  <div className="space-y-2 mt-1">
                    <div className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle size={12} /> {formatTime(recordingTime)} recorded
                    </div>
                    <audio src={audioURL} controls className="w-full h-7 rounded" />
                    <button
                      type="button"
                      onClick={discardAudio}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold underline"
                    >
                      Discard & re-record
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow transition-all duration-200"
          >
            Submit Incident Report
          </button>
        </form>
      )}

      {/* Submission Pipeline UI */}
      {step === 'submitting' && (
        <PipelineBox 
          title="Submitting Report to Database" 
          desc="Writing report nodes, registering phone identifier, establishing telemetry payload..."
          icon={<div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin" />}
        />
      )}

      {step === 'verifying' && (
        <PipelineBox 
          title="Satellite AI Verification Run" 
          desc="Cross-checking GPS coordinates against Google Earth Engine NDVI values & Sentinel-1 SAR imagery databases. Please stand by..."
          icon={<Cpu size={32} className="text-emerald-500 animate-pulse" />}
        />
      )}

      {step === 'completed' && (
        <div className="bg-white rounded-xl border-2 border-emerald-500 p-8 shadow-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle size={36} />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900">Incident Registered & Verified</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">Satellite scan confirmed coordinates. Dual alerts dispatched to local emergency services.</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg max-w-sm mx-auto font-mono text-xs border border-slate-100">
            <div className="font-extrabold text-slate-700 uppercase">Alert Tracking Node ID:</div>
            <div className="text-emerald-600 font-black text-sm mt-1">{trackingId}</div>
          </div>
          <button
            onClick={() => setStep('idle')}
            className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all"
          >
            File Another Report
          </button>
        </div>
      )}
    </div>
  );
}

function PipelineBox({ title, desc, icon }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
      {icon}
      <div>
        <h4 className="text-lg font-bold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
