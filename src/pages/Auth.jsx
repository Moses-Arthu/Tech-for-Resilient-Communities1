import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, User, ShieldCheck, Lock, ArrowRight } from 'lucide-react';

export default function Auth() {
  const { login } = useApp();
  const [step, setStep] = useState('register'); // register, verify
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Citizen');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!phone || !name) return;
    
    setIsSending(true);
    // Simulate sending real OTP verification via SMS
    setTimeout(() => {
      setIsSending(false);
      setStep('verify');
    }, 1500);
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert("Please enter a valid 6-digit OTP code.");
      return;
    }

    // Persist registered user locally
    const users = JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
    const userExists = users.some(u => u.phone === phone);
    if (!userExists) {
      users.push({ phone, name, role });
      localStorage.setItem('resilient_registered_users', JSON.stringify(users));
    }

    // Complete login
    login(phone, role, name);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden font-sans">
      {/* Background decorations for rich aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />

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

        {step === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Create Account or Log In</h3>
              <p className="text-xs text-slate-500">Sign up using your mobile phone. OTP dispatch will be initialized.</p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    type="text" 
                    required
                    placeholder="Kwame Mensah" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold placeholder-slate-600"
                  />
                </div>
              </div>

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

              {/* Role Select */}
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
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
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
                A 6-digit confirmation code was simulated/sent via SMS to <span className="font-mono text-slate-300 font-bold">{phone}</span>.
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
                  placeholder="e.g., 123456" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold tracking-widest text-center"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('register')}
                className="flex-1 py-2.5 border border-slate-800 text-slate-400 hover:bg-slate-900 text-xs font-bold rounded-lg transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition-all"
              >
                Confirm Code
              </button>
            </div>

            <p className="text-[10px] text-slate-600 text-center font-semibold">
              Enter any 6 digits (e.g., <span className="font-mono text-slate-500 font-bold">123456</span>) to proceed.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
