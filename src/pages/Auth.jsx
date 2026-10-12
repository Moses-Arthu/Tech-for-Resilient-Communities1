import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone, User, ShieldCheck, Lock, ArrowRight, Eye, EyeOff,
  Loader2, Mail, KeyRound, CheckCircle2, ChevronLeft,
  Shield, Zap, Users, Crown, AlertTriangle, Sparkles, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';

// ─── Local Storage user helpers for offline/fallback mode ───────────────────
const getLocalUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('resilient_registered_users') || '[]');
  } catch {
    return [];
  }
};

const saveLocalUsers = (users) => {
  try {
    localStorage.setItem('resilient_registered_users', JSON.stringify(users));
  } catch (err) {
    console.warn('[Auth] Failed to write local users:', err);
  }
};

// ─── Normalize phone → consistent Firebase email identifier ──────────────────
const phoneToEmail = (phone) => {
  const cleaned = phone.trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
  // Ensure it starts with + for E.164 format
  const normalized = cleaned.startsWith('+') ? cleaned : cleaned;
  return `${normalized}@resilientghana.app`;
};

// ─── Password strength calculator ─────────────────────────────────────────────
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Very Weak', color: '#ef4444' },
    { score: 2, label: 'Weak', color: '#f97316' },
    { score: 3, label: 'Fair', color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
    { score: 5, label: 'Very Strong', color: '#10b981' },
  ];
  return levels[score] || levels[0];
};

// ─── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'Citizen',
    label: 'Citizen',
    subtitle: 'Report hazards & alerts',
    icon: Users,
    gradient: 'from-sky-500/20 to-blue-600/20',
    border: 'border-sky-500/40',
    activeBorder: 'border-sky-400',
    iconColor: 'text-sky-400',
  },
  {
    value: 'Responder',
    label: 'Responder',
    subtitle: 'Emergency SMS logistics',
    icon: Zap,
    gradient: 'from-amber-500/20 to-orange-600/20',
    border: 'border-amber-500/40',
    activeBorder: 'border-amber-400',
    iconColor: 'text-amber-400',
  },
  {
    value: 'Authority',
    label: 'Authority',
    subtitle: 'Issue national warnings',
    icon: Shield,
    gradient: 'from-violet-500/20 to-purple-600/20',
    border: 'border-violet-500/40',
    activeBorder: 'border-violet-400',
    iconColor: 'text-violet-400',
  },
  {
    value: 'Admin',
    label: 'Admin',
    subtitle: 'GEE radar & full system',
    icon: Crown,
    gradient: 'from-emerald-500/20 to-teal-600/20',
    border: 'border-emerald-500/40',
    activeBorder: 'border-emerald-400',
    iconColor: 'text-emerald-400',
  },
];

// ─── Floating Label Input ─────────────────────────────────────────────────────
function FloatingInput({ id, type, label, value, onChange, icon: Icon, required, placeholder, minLength, rightSlot }) {
  const [focused, setFocused] = useState(false);
  const isActive = focused || value;

  return (
    <div className="relative group">
      {/* Icon */}
      <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-all duration-200 ${isActive ? 'text-emerald-400' : 'text-slate-600'}`}>
        <Icon size={15} />
      </div>

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        minLength={minLength}
        placeholder=""
        autoComplete="off"
        className={`
          peer w-full pt-5 pb-2 pl-10 ${rightSlot ? 'pr-11' : 'pr-4'}
          bg-slate-900/80 border rounded-xl text-white text-sm font-medium
          focus:outline-none transition-all duration-200
          placeholder-transparent
          ${focused
            ? 'border-emerald-500/70 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]'
            : 'border-slate-700/70 hover:border-slate-600'
          }
        `}
      />

      {/* Floating label */}
      <label
        htmlFor={id}
        className={`
          absolute left-10 transition-all duration-200 pointer-events-none font-semibold
          ${isActive
            ? 'top-2 text-[10px] text-emerald-400 tracking-wider uppercase'
            : 'top-1/2 -translate-y-1/2 text-sm text-slate-500'
          }
        `}
      >
        {label}
      </label>

      {/* Right slot (eye toggle) */}
      {rightSlot && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}

// ─── Welcome Modal (shown to new users after sign-up) ─────────────────────────
function WelcomeModal({ user, onClose }) {
  const roleConfig = ROLES.find(r => r.value === user?.role) || ROLES[0];
  const Icon = roleConfig.icon;

  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl auth-welcome-modal"
        style={{ background: 'linear-gradient(145deg, #0a1628 0%, #0f172a 60%, #0a1628 100%)' }}
      >
        {/* Top glow bar */}
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        {/* Sparkle confetti top-right */}
        <div className="absolute top-4 right-4 text-emerald-400 opacity-60">
          <Sparkles size={20} />
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-600 hover:text-slate-300 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="px-8 py-10 flex flex-col items-center text-center space-y-5">
          {/* Animated role icon */}
          <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${roleConfig.gradient} border ${roleConfig.activeBorder} flex items-center justify-center shadow-2xl`}>
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${roleConfig.gradient} animate-ping opacity-40`} style={{ animationDuration: '2s' }} />
            <Icon size={36} className={roleConfig.iconColor} />
          </div>

          {/* Greeting text */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">
              Welcome, {user?.name?.split(' ')[0]}! 🎉
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your account has been created successfully. You're now part of the{' '}
              <span className="text-emerald-400 font-bold">Resilient Ghana</span> community.
            </p>
          </div>

          {/* Role badge */}
          <div className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${roleConfig.gradient} border ${roleConfig.border} flex items-center gap-2.5`}>
            <Icon size={14} className={roleConfig.iconColor} />
            <span className={`text-xs font-black uppercase tracking-wider ${roleConfig.iconColor}`}>
              {user?.role} Access Granted
            </span>
          </div>

          {/* Info bullets */}
          <div className="w-full text-left space-y-2.5 bg-slate-900/60 rounded-xl p-4">
            {[
              'Report hazards & monitor real-time alerts',
              'Track floods, mining, and environmental risks',
              'Send emergency SOS beacons to responders',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-xs text-slate-400 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-black text-sm text-white uppercase tracking-wider transition-all duration-200 auth-btn-primary"
          >
            Enter Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── Main Auth Component ───────────────────────────────────────────────────────
export default function Auth() {
  const { login } = useApp();

  // 'login' | 'register' | 'forgot' | 'forgot-sent'
  const [mode, setMode] = useState('login');

  // Form fields
  const [phone, setPhone]                     = useState('');
  const [name, setName]                       = useState('');
  const [role, setRole]                       = useState('Citizen');
  const [recoveryEmail, setRecoveryEmail]     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  // Forgot password
  const [resetPhone, setResetPhone] = useState('');
  const [sentTo, setSentTo]         = useState('');

  // UI state
  const [isLoading, setIsLoading]   = useState(false);
  const [welcomeUser, setWelcomeUser] = useState(null); // triggers welcome modal
  const [formKey, setFormKey]       = useState(0);     // force re-mount for animations
  const prevMode                    = useRef(mode);

  // Re-trigger entrance animation on mode change
  useEffect(() => {
    if (prevMode.current !== mode) {
      setFormKey(k => k + 1);
      prevMode.current = mode;
    }
  }, [mode]);

  const resetAll = (newMode) => {
    setMode(newMode);
    setPhone(''); setName(''); setPassword(''); setConfirmPassword('');
    setRecoveryEmail(''); setShowPassword(false); setShowConfirm(false);
    setResetPhone(''); setSentTo('');
  };

  const pwStrength = getPasswordStrength(password);

  // ─── Sign In / Register ─────────────────────────────────────────────────────
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) return;

    const formattedPhone = phone.trim();
    const email = phoneToEmail(formattedPhone);

    if (mode === 'register') {
      if (!name.trim())                { toast.error('Please enter your full name.'); return; }
      if (password.length < 6)         { toast.error('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }
      if (recoveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
        toast.error('Please enter a valid recovery email address.'); return;
      }
    }

    setIsLoading(true);

    // ── Local / Offline Authentication Fallback Handler ──
    const executeLocalAuth = () => {
      const users = getLocalUsers();
      if (mode === 'register') {
        const existing = users.find(u => u.phone === formattedPhone);
        if (existing) {
          toast.error('This phone number is already registered. Please sign in instead.');
          return false;
        }

        const newUser = {
          uid: `local_${Date.now()}`,
          phone: formattedPhone,
          name: name.trim(),
          role,
          recoveryEmail: recoveryEmail.trim() || null,
          password,
          createdAt: new Date().toISOString(),
        };

        saveLocalUsers([...users, newUser]);
        setWelcomeUser(newUser);
        login(formattedPhone, role, name.trim());
        toast.success('Account created successfully!');
        return true;
      } else {
        const match = users.find(u => u.phone === formattedPhone);
        if (!match) {
          // If no local record exists yet, check if there's an active or cached session
          const cached = JSON.parse(localStorage.getItem('resilient_logged_in_user') || 'null');
          if (cached && cached.phone === formattedPhone) {
            toast.success(`Welcome back, ${cached.name || 'User'}! 👋`, { autoClose: 3000 });
            login(cached.phone, cached.role || 'Citizen', cached.name || 'User');
            return true;
          }
          toast.error('No account found for this phone number. Please register first.');
          return false;
        }

        if (match.password && match.password !== password) {
          toast.error('Incorrect password. Please try again.');
          return false;
        }

        toast.success(`Welcome back, ${match.name}! 👋`, { autoClose: 3000 });
        login(match.phone, match.role, match.name);
        return true;
      }
    };

    // If Firebase is not configured or auth/db is missing, use local storage auth
    if (!isFirebaseConfigured || !auth || !db) {
      executeLocalAuth();
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        try {
          await updateProfile(credential.user, { displayName: name.trim() });
        } catch (profErr) {
          console.warn('[Auth] updateProfile note:', profErr);
        }

        // Try to persist user document in Firestore (catch permission errors if rules are locked)
        try {
          await setDoc(doc(db, 'users', uid), {
            uid,
            phone: formattedPhone,
            name: name.trim(),
            role,
            recoveryEmail: recoveryEmail.trim() || null,
            createdAt: new Date().toISOString(),
          });
        } catch (fsErr) {
          console.warn('[Auth] Firestore setDoc note (check security rules):', fsErr.message);
        }

        // Also save to local registry for offline resilience and fast session fallback
        const users = getLocalUsers().filter(u => u.phone !== formattedPhone);
        saveLocalUsers([...users, { uid, phone: formattedPhone, name: name.trim(), role, password, recoveryEmail: recoveryEmail.trim() || null }]);

        // Show welcome modal for new users
        const newUserData = { phone: formattedPhone, role, name: name.trim() };
        setWelcomeUser(newUserData);
        login(formattedPhone, role, name.trim());

      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        let userData = null;
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            userData = userDoc.data();
          }
        } catch (fsErr) {
          console.warn('[Auth] Firestore getDoc note (check security rules):', fsErr.message);
        }

        // If Firestore reading is restricted, reconstruct profile from Firebase Auth and local storage
        if (!userData) {
          const localMatch = getLocalUsers().find(u => u.phone === formattedPhone);
          const cachedUser = JSON.parse(localStorage.getItem('resilient_logged_in_user') || 'null');
          userData = {
            phone: formattedPhone,
            name: credential.user.displayName || localMatch?.name || cachedUser?.name || 'User',
            role: localMatch?.role || cachedUser?.role || 'Citizen',
          };
        }

        toast.success(`Welcome back, ${userData.name}! 👋`, { autoClose: 3000 });
        login(userData.phone, userData.role, userData.name);
      }
    } catch (err) {
      console.error('[Auth] Firebase error:', err);
      // If API key is invalid or network failed, fall back to local auth so the user can proceed
      if (err.code === 'auth/invalid-api-key' || err.code === 'auth/api-key-not-valid') {
        toast.info('Firebase API key not set or invalid; using local account storage.');
        executeLocalAuth();
        return;
      }

      switch (err.code) {
        case 'auth/operation-not-allowed':
          toast.error('Authentication unavailable. Please contact support.'); break;
        case 'auth/email-already-in-use':
          toast.error('This phone number is already registered. Please sign in.'); break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          toast.error(
            mode === 'login'
              ? 'Incorrect phone number or password. Please try again.'
              : 'Invalid credentials. Please check your details.'
          ); break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later.'); break;
        case 'auth/network-request-failed':
          // Network failure fallback
          toast.info('Network unreachable; authenticating from local storage.');
          executeLocalAuth();
          break;
        case 'auth/weak-password':
          toast.error('Password is too weak. Please use at least 6 characters.'); break;
        default:
          toast.error(`Authentication failed: ${err.message || 'Please try again.'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetPhone.trim()) return;

    setIsLoading(true);

    if (!isFirebaseConfigured || !auth || !db) {
      const users = getLocalUsers();
      const match = users.find(u => u.phone === resetPhone.trim());
      if (!match) {
        toast.error('No account found for this phone number.');
      } else if (!match.recoveryEmail) {
        toast.error('No recovery email was saved for this account. Please register a new account.');
      } else {
        setSentTo(match.recoveryEmail);
        setMode('forgot-sent');
        toast.success(`Password reset simulation sent to ${match.recoveryEmail}!`);
      }
      setIsLoading(false);
      return;
    }

    try {
      const q = query(collection(db, 'users'), where('phone', '==', resetPhone.trim()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error('No account found for this phone number.');
        setIsLoading(false);
        return;
      }

      const userData = snapshot.docs[0].data();
      const email = userData.recoveryEmail;

      if (!email) {
        toast.error(
          'No recovery email linked to this account. ' +
          'Please contact support or register a new account.'
        );
        setIsLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setSentTo(email);
      setMode('forgot-sent');
      toast.success('Password reset email sent! Check your inbox.');
    } catch (err) {
      console.error('[Auth] Reset error:', err);
      // Fallback to local check if Firebase failed
      const users = getLocalUsers();
      const match = users.find(u => u.phone === resetPhone.trim());
      if (match && match.recoveryEmail) {
        setSentTo(match.recoveryEmail);
        setMode('forgot-sent');
        toast.success(`Password reset simulated for ${match.recoveryEmail}`);
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render: Forgot-sent confirmation ────────────────────────────────────────
  const renderForgotSent = () => (
    <div key={formKey} className="auth-form-enter space-y-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 size={30} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-black text-white">Reset Email Sent!</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            We sent a password reset link to:
          </p>
          <p className="text-sm font-bold text-indigo-400 mt-1 break-all">{sentTo}</p>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl p-5 text-left space-y-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Next Steps</p>
        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400">
          <li>Open the email in your inbox (check spam too)</li>
          <li>Click the <strong className="text-white">"Reset Password"</strong> link</li>
          <li>Choose a new secure password</li>
          <li>Come back and sign in with your new password</li>
        </ol>
      </div>

      <button
        type="button"
        onClick={() => resetAll('login')}
        className="w-full py-3.5 auth-btn-secondary rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200"
      >
        <ChevronLeft size={15} /> Back to Sign In
      </button>
    </div>
  );

  // ─── Render: Forgot password form ────────────────────────────────────────────
  const renderForgotForm = () => (
    <form key={formKey} onSubmit={handleForgotPassword} className="auth-form-enter space-y-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => resetAll('login')}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-lg font-black text-white">Reset Password</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pl-9">
          Enter your registered phone number. We'll send a reset link to your linked recovery email.
        </p>
      </div>

      <FloatingInput
        id="resetPhone"
        type="tel"
        label="Phone Number (with Country Code)"
        value={resetPhone}
        onChange={e => setResetPhone(e.target.value)}
        icon={Phone}
        required
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3.5 auth-btn-primary rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <><Loader2 size={15} className="animate-spin" /> Sending Reset Link…</>
        ) : (
          <><KeyRound size={15} /> Send Reset Link</>
        )}
      </button>

      <p className="text-center text-xs text-slate-600">
        Remembered it?{' '}
        <button type="button" onClick={() => resetAll('login')}
          className="text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 transition-colors">
          Sign in
        </button>
      </p>
    </form>
  );

  // ─── Render: Main auth form (login or register) ───────────────────────────
  const renderAuthForm = () => (
    <form key={formKey} onSubmit={handleAuthSubmit} className="auth-form-enter space-y-5">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-black text-white">
          {mode === 'login' ? 'Welcome Back 👋' : 'Create Account ✨'}
        </h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {mode === 'login'
            ? 'Sign in with your registered mobile number and password.'
            : 'Join the Resilient Ghana community — it only takes a minute.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Full Name — Register Only */}
        {mode === 'register' && (
          <FloatingInput
            id="fullName"
            type="text"
            label="Full Name"
            value={name}
            onChange={e => setName(e.target.value)}
            icon={User}
            required
          />
        )}

        {/* Phone Number */}
        <FloatingInput
          id="phone"
          type="tel"
          label="Phone Number (with Country Code)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          icon={Phone}
          required
        />

        {/* Role Card Picker — Register Only */}
        {mode === 'register' && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2.5">
              Access Level
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => {
                const Icon = r.icon;
                const isActive = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`
                      relative p-3 rounded-xl border text-left transition-all duration-200
                      bg-gradient-to-br ${r.gradient}
                      ${isActive
                        ? `${r.activeBorder} shadow-lg`
                        : `${r.border} opacity-60 hover:opacity-90`
                      }
                    `}
                  >
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 size={10} className="text-white" />
                      </div>
                    )}
                    <Icon size={16} className={`${r.iconColor} mb-1.5`} />
                    <div className="text-[11px] font-black text-white">{r.label}</div>
                    <div className="text-[9px] text-slate-400 leading-tight mt-0.5">{r.subtitle}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <FloatingInput
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            icon={Lock}
            required
            minLength={6}
            rightSlot={
              <button type="button" tabIndex={-1}
                onClick={() => setShowPassword(p => !p)}
                className="text-slate-500 hover:text-slate-300 transition-colors">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          {/* Password strength bar — Register only */}
          {mode === 'register' && password && (
            <div className="space-y-1 px-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor: i <= pwStrength.score ? pwStrength.color : '#1e293b'
                    }}
                  />
                ))}
              </div>
              {pwStrength.label && (
                <p className="text-[10px] font-bold" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </p>
              )}
            </div>
          )}

          {/* Forgot password link — Login only */}
          {mode === 'login' && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => resetAll('forgot')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {/* Confirm Password — Register Only */}
        {mode === 'register' && (
          <div className="space-y-1">
            <FloatingInput
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              label="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              icon={Lock}
              required
              rightSlot={
                <button type="button" tabIndex={-1}
                  onClick={() => setShowConfirm(p => !p)}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            {confirmPassword && password !== confirmPassword && (
              <div className="flex items-center gap-1.5 px-1">
                <AlertTriangle size={11} className="text-red-400" />
                <p className="text-[10px] text-red-400 font-bold">Passwords do not match</p>
              </div>
            )}
          </div>
        )}

        {/* Recovery Email — Register Only */}
        {mode === 'register' && (
          <div className="space-y-1">
            <FloatingInput
              id="recoveryEmail"
              type="email"
              label="Recovery Email (optional — for password reset)"
              value={recoveryEmail}
              onChange={e => setRecoveryEmail(e.target.value)}
              icon={Mail}
            />
            <p className="text-[10px] text-slate-600 font-medium px-1">
              Only used to send you a reset link if you forget your password.
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || (mode === 'register' && confirmPassword && password !== confirmPassword)}
        className="w-full py-3.5 auth-btn-primary rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
      >
        {isLoading ? (
          <><Loader2 size={15} className="animate-spin" />{mode === 'login' ? 'Signing In…' : 'Creating Account…'}</>
        ) : (
          <>{mode === 'login' ? 'Sign In' : 'Create Account'}<ArrowRight size={15} /></>
        )}
      </button>

      {/* Footer switch */}
      <p className="text-center text-xs text-slate-600 pt-1">
        {mode === 'login' ? (
          <>Don&apos;t have an account?{' '}
            <button type="button" onClick={() => resetAll('register')}
              className="text-indigo-400 hover:text-indigo-300 font-black underline underline-offset-2 transition-colors">
              Register here
            </button>
          </>
        ) : (
          <>Already registered?{' '}
            <button type="button" onClick={() => resetAll('login')}
              className="text-indigo-400 hover:text-indigo-300 font-black underline underline-offset-2 transition-colors">
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* Welcome modal for new sign-ups */}
      {welcomeUser && (
        <WelcomeModal user={welcomeUser} onClose={() => setWelcomeUser(null)} />
      )}

      <div className="min-h-screen flex bg-slate-950 relative overflow-hidden font-sans">
        {/* ── Ambient background orbs ── */}
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        {/* ── Left Hero Panel (desktop only) ── */}
        <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
          {/* Hero gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-slate-950/60 to-indigo-950/80 z-10" />

          {/* Hero background image effect */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cdefs%3E%3CradialGradient id='g1' cx='30%25' cy='40%25' r='60%25'%3E%3Cstop offset='0%25' stop-color='%2310b981' stop-opacity='0.3'/%3E%3Cstop offset='100%25' stop-color='%230f172a' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g2' cx='70%25' cy='60%25' r='50%25'%3E%3Cstop offset='0%25' stop-color='%236366f1' stop-opacity='0.2'/%3E%3Cstop offset='100%25' stop-color='%230f172a' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='800' height='600' fill='%230f172a'/%3E%3Cellipse cx='240' cy='240' rx='280' ry='220' fill='url(%23g1)'/%3E%3Cellipse cx='560' cy='360' rx='240' ry='200' fill='url(%23g2)'/%3E%3C/svg%3E")`
            }}
          />

          {/* Animated grid lines */}
          <div className="absolute inset-0 auth-grid-bg z-[5] opacity-30" />

          {/* Top: Logo */}
          <div className="relative z-20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-white font-black text-sm tracking-wider uppercase">Resilient Ghana</div>
              <div className="text-emerald-500/70 text-[10px] font-semibold tracking-widest uppercase">Hazard Sentinel Portal</div>
            </div>
          </div>

          {/* Center: Hero text */}
          <div className="relative z-20 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Sparkles size={12} className="text-emerald-400" />
                <span className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">Live Monitoring Active</span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
                Protecting<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Communities
                </span><br />
                Together
              </h1>

              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Real-time flood prediction, illegal mining detection, and emergency response coordination for a safer Ghana.
              </p>
            </div>

            {/* Stats row */}
            <div className="flex gap-6">
              {[
                { value: '24/7', label: 'Monitoring' },
                { value: '10+', label: 'Regions' },
                { value: '500+', label: 'Citizens' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-2xl font-black text-white">{stat.value}</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Feature pills */}
          <div className="relative z-20 flex flex-wrap gap-2">
            {['Flood Prediction', 'Mining Sentinel', 'SOS Beacon', 'Drone Fleet', 'AI Assistant'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[11px] font-semibold">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right Form Panel ── */}
        <div className="flex-1 lg:w-[48%] xl:w-[45%] flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-[400px]">

            {/* Mobile: Logo */}
            <div className="lg:hidden flex flex-col items-center text-center mb-8 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center relative">
                  <ShieldCheck size={28} className="text-emerald-400" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-wider text-white uppercase">Resilient Ghana</h1>
                <p className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">
                  Hazard &amp; Mining Sentinel
                </p>
              </div>
            </div>

            {/* Form Card */}
            <div className="auth-card rounded-3xl p-7 lg:p-8">
              {/* Local mode indicator if Firebase credentials not set */}
              {!isFirebaseConfigured && (
                <div className="mb-5 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center gap-2 text-[11px] text-indigo-300">
                  <Zap size={13} className="text-indigo-400 shrink-0" />
                  <span className="flex-1 font-medium leading-tight">
                    <strong className="text-indigo-200">Local Mode</strong>: Register & sign in locally without cloud setup.
                  </span>
                </div>
              )}

              {/* Tab Toggle — only for login/register */}
              {(mode === 'login' || mode === 'register') && (
                <div className="flex gap-1.5 p-1 bg-slate-900/80 border border-slate-800/60 rounded-2xl mb-7">
                  {[
                    { key: 'login',    label: 'Sign In' },
                    { key: 'register', label: 'Register' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => resetAll(tab.key)}
                      className={`
                        flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200
                        ${mode === tab.key
                          ? 'auth-tab-active text-white'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Form content */}
              {mode === 'forgot'      && renderForgotForm()}
              {mode === 'forgot-sent' && renderForgotSent()}
              {(mode === 'login' || mode === 'register') && renderAuthForm()}
            </div>

            {/* Footer */}
            <p className="text-center text-[10px] text-slate-700 mt-6 font-medium">
              Protected by Firebase Authentication &nbsp;·&nbsp; Resilient Ghana © 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
