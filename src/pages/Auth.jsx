import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone, User, ShieldCheck, Lock, ArrowRight, Eye, EyeOff, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Convert phone number to a valid Firebase email-style identifier
const phoneToEmail = (phone) => {
  const cleaned = phone.trim().replace(/\s+/g, '').replace(/[^+\d]/g, '');
  return `${cleaned}@resilientghana.app`;
};

export default function Auth() {
  const { login } = useApp();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Citizen');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  // --- Standard Password Auth ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) return;

    const formattedPhone = phone.trim();
    const email = phoneToEmail(formattedPhone);

    if (mode === 'register') {
      if (!name.trim()) { toast.error('Please enter your full name.'); return; }
      if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        // --- SIGN UP ---
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        // Set display name in Firebase Auth
        await updateProfile(credential.user, { displayName: name.trim() });

        // Store user profile in Firestore
        await setDoc(doc(db, 'users', uid), {
          uid,
          phone: formattedPhone,
          name: name.trim(),
          role,
          createdAt: new Date().toISOString(),
        });

        toast.success('✅ Account created successfully!');
        login(formattedPhone, role, name.trim());

      } else {
        // --- SIGN IN ---
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
          toast.error('User profile not found. Please sign up first.');
          setIsLoading(false);
          return;
        }

        const userData = userDoc.data();
        toast.success(`Welcome back, ${userData.name}! 👋`);
        login(userData.phone, userData.role, userData.name);
      }
    } catch (err) {
      console.error('[Auth] Firebase error:', err);
      switch (err.code) {
        case 'auth/operation-not-allowed':
          toast.error('Authentication is currently unavailable. Please contact support.');
          break;
        case 'auth/email-already-in-use':
          toast.error('This phone number is already registered. Please sign in.');
          break;
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          toast.error('Phone number or password is incorrect.');
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password. Please try again.');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          toast.error('Network error. Check your connection and try again.');
          break;
        default:
          toast.error('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setPhone('');
    setName('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden font-sans">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-950/85 border border-slate-800/70 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <ShieldCheck size={30} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">Resilient Ghana</h1>
            <p className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase mt-1">Hazard &amp; Mining Sentinel Portal</p>
          </div>
        </div>

        {/* Tab Toggle (Login vs Register) */}
        <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-7 text-xs font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">
              {mode === 'login' ? 'Access Your Account' : 'Create Community Account'}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {mode === 'login'
                ? 'Sign in with your registered mobile number and password.'
                : 'Register with your mobile number, name, role, and a secure password.'}
            </p>
          </div>

          <div className="space-y-4">
            {/* Full Name — Register Only */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Kwame Mensah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 text-xs font-semibold placeholder-slate-600 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Phone Number */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Phone Number (with Country Code)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="tel"
                  required
                  placeholder="e.g., +233 24 555 1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 text-xs font-semibold placeholder-slate-650 transition-all"
                />
              </div>
            </div>

            {/* Role — Register Only */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Access Authorization Level
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 text-xs font-semibold transition-all"
                >
                  <option value="Citizen">Citizen (Report Hazards)</option>
                  <option value="Responder">Emergency Responder (SMS Logistics)</option>
                  <option value="Authority">National Authority (Issue Warnings)</option>
                  <option value="Admin">System Administrator (GEE Radar Scans)</option>
                </select>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 text-xs font-semibold placeholder-slate-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Confirm Password — Register Only */}
            {mode === 'register' && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-9 pr-10 py-2.5 rounded-lg border bg-slate-900 text-white focus:outline-none focus:ring-2 text-xs font-semibold placeholder-slate-600 transition-all ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-500/60 focus:ring-red-500/40'
                        : 'border-slate-800 focus:ring-emerald-500/60 focus:border-emerald-500/40'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[10px] text-red-400 font-semibold mt-1 pl-1">Passwords do not match</p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-505 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={14} />
              </>
            )}
          </button>


          {/* Footer note */}
          <p className="text-center text-[10px] text-slate-600 font-semibold pt-1">
            {mode === 'login' ? (
              <>Don&apos;t have an account?{' '}
                <button type="button" onClick={() => switchMode('register')} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-0 font-bold">
                  Register here
                </button>
              </>
            ) : (
              <>Already registered?{' '}
                <button type="button" onClick={() => switchMode('login')} className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-0 font-bold">
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
