import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, User, ShieldCheck, Lock, ArrowRight, MessageSquare } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Auth() {
  const { login } = useApp();
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [step, setStep] = useState('input'); // 'input' or 'verify'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Citizen');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [smsNotification, setSmsNotification] = useState(null);

  // Clear SMS notification after 10 seconds
  useEffect(() => {
    if (smsNotification) {
      const timer = setTimeout(() => {
        setSmsNotification(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [smsNotification]);

  const getRegisteredUsers = () => {
    return JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (!phone) return;

    const users = getRegisteredUsers();
    const formattedPhone = phone.trim();

    if (mode === 'login') {
      // Find if user exists
      const existingUser = users.find(u => u.phone === formattedPhone);
      if (!existingUser) {
        toast.error("Phone number not registered. Please sign up first.");
        return;
      }
      setName(existingUser.name);
      setRole(existingUser.role);
    } else {
      // Register mode
      if (!name) {
        toast.error("Please enter your name.");
        return;
      }
      const existingUser = users.find(u => u.phone === formattedPhone);
      if (existingUser) {
        toast.error("Phone number already registered. Please log in instead.");
        return;
      }
    }

    setIsSending(true);

    // Simulate sending OTP via SMS
    setTimeout(() => {
      // Generate 6 digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setIsSending(false);
      setStep('verify');

      // Trigger standard toast AND custom simulated slide-down SMS alert
      toast.info(`SMS code sent to ${formattedPhone}`);
      setSmsNotification({
        phone: formattedPhone,
        message: `Your Resilient Ghana verification code is: ${code}. Do not share this code.`
      });
    }, 1200);
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (otp !== generatedOtp) {
      toast.error("Invalid verification code. Please check your SMS or resend.");
      return;
    }

    const formattedPhone = phone.trim();

    if (mode === 'register') {
      const users = getRegisteredUsers();
      users.push({ phone: formattedPhone, name, role });
      localStorage.setItem('resilient_registered_users', JSON.stringify(users));
      toast.success("Registration successful!");
    } else {
      toast.success(`Welcome back, ${name}!`);
    }

    // Complete login in AppContext
    login(formattedPhone, role, name);
  };

  const triggerResendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    toast.info("New verification code dispatched.");
    setSmsNotification({
      phone: phone.trim(),
      message: `Your Resilient Ghana verification code is: ${code}. Do not share this code.`
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden font-sans">
      {/* Background decorations for rich aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />

      {/* Simulated Premium SMS Notification HUD */}
      {smsNotification && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-bounce">
          <div className="bg-slate-950/95 border-2 border-emerald-500/30 text-white rounded-xl p-4 shadow-2xl backdrop-blur-md flex gap-3 items-start">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
              <MessageSquare size={18} />
            </div>
            <div className="flex-1 text-xs">
              <div className="flex justify-between items-center mb-1">
                <span className="font-extrabold text-emerald-400 tracking-wider uppercase text-[10px]">Message Received</span>
                <span className="text-slate-500 font-semibold">Just now</span>
              </div>
              <div className="font-black text-slate-200">ResilientGhana:</div>
              <p className="text-slate-300 font-semibold leading-relaxed mt-0.5">{smsNotification.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white uppercase">Resilient Ghana</h2>
            <p className="text-xs text-slate-500 font-semibold tracking-wider uppercase mt-0.5">Hazard & Mining Sentinel Portal</p>
          </div>
        </div>

        {/* Tab Selection */}
        {step === 'input' && (
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg mb-6 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => { setMode('login'); setPhone(''); setName(''); }}
              className={`flex-1 py-2 rounded-md transition-all ${
                mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setPhone(''); setName(''); }}
              className={`flex-1 py-2 rounded-md transition-all ${
                mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleInputSubmit} className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {mode === 'login' ? 'Access Your Account' : 'Create Community Account'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {mode === 'login' 
                  ? 'Sign in using your registered mobile phone. An OTP verification code will be dispatched.'
                  : 'Register your mobile phone, name, and authority role. Verification OTP will be sent.'
                }</p>
            </div>

            <div className="space-y-4">
              {/* Name (Register Mode Only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={14} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Kwame Mensah" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold placeholder-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Phone Number (with Country Code)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    type="tel" 
                    required
                    placeholder="e.g., +233 24 555 1234" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Role Select (Register Mode Only) */}
              {mode === 'register' && (
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Access Authorization Level</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  >
                    <option value="Citizen">Citizen (Report Hazards)</option>
                    <option value="Responder">Emergency Responder (SMS Logistics)</option>
                    <option value="Authority">National Authority (Issue Warnings)</option>
                    <option value="Admin">System Administrator (GEE Radar Scans)</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSending ? 'Sending OTP Code...' : 'Initialize Verification'}
              <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Enter OTP Verification Code</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                A 6-digit confirmation code was sent via SMS to <span className="font-mono text-slate-300 font-bold">{phone}</span>.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">SMS Verification Code</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  maxLength={6}
                  required
                  placeholder="Enter 6-digit code" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold tracking-widest text-center"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setStep('input'); setOtp(''); }}
                className="flex-1 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-900 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-all cursor-pointer"
              >
                Confirm Code
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={triggerResendOtp}
                className="text-[10px] text-indigo-400 hover:underline font-bold uppercase tracking-wider bg-transparent border-0 cursor-pointer"
              >
                Resend SMS Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
