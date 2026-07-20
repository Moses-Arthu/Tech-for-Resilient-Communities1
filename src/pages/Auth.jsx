import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Phone, User, ShieldCheck, Lock, ArrowRight, Eye, EyeOff,
  Loader2, Mail, KeyRound, CheckCircle2, ChevronLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

// Convert phone number to a Firebase-compatible email identifier
const phoneToEmail = (phone) => {
  const cleaned = phone.trim().replace(/\s+/g, '').replace(/[^+\d]/g, '');
  return `${cleaned}@resilientghana.app`;
};

// ─── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  'w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 ' +
  'text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ' +
  'focus:border-emerald-500/40 text-xs font-semibold placeholder-slate-600 transition-all';

const labelCls =
  'block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5';

export default function Auth() {
  const { login } = useApp();

  // 'login' | 'register' | 'forgot' | 'forgot-sent'
  const [mode, setMode] = useState('login');

  // Login / Register fields
  const [phone, setPhone]               = useState('');
  const [name, setName]                 = useState('');
  const [role, setRole]                 = useState('Citizen');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  // Forgot password fields
  const [resetPhone, setResetPhone]     = useState('');
  const [sentTo, setSentTo]             = useState('');   // email reset was sent to

  const [isLoading, setIsLoading]       = useState(false);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const resetAll = (newMode) => {
    setMode(newMode);
    setPhone(''); setName(''); setPassword(''); setConfirmPassword('');
    setRecoveryEmail(''); setShowPassword(false); setShowConfirm(false);
    setResetPhone(''); setSentTo('');
  };

  // ─── Sign In / Register ───────────────────────────────────────────────────
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !password) return;

    const formattedPhone = phone.trim();
    const email = phoneToEmail(formattedPhone);

    if (mode === 'register') {
      if (!name.trim())               { toast.error('Please enter your full name.'); return; }
      if (password.length < 6)        { toast.error('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword){ toast.error('Passwords do not match.'); return; }
      if (recoveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recoveryEmail)) {
        toast.error('Please enter a valid recovery email address.'); return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

        await updateProfile(credential.user, { displayName: name.trim() });

        await setDoc(doc(db, 'users', uid), {
          uid,
          phone: formattedPhone,
          name: name.trim(),
          role,
          recoveryEmail: recoveryEmail.trim() || null,
          createdAt: new Date().toISOString(),
        });

        toast.success('✅ Account created successfully!');
        login(formattedPhone, role, name.trim());

      } else {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const uid = credential.user.uid;

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
          toast.error('Authentication unavailable. Please contact support.'); break;
        case 'auth/email-already-in-use':
          toast.error('This phone number is already registered. Please sign in.'); break;
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
          toast.error(
            mode === 'login'
              ? 'No account found for this phone number. Please register first.'
              : 'Invalid credentials. Please check your details.'
          ); break;
        case 'auth/wrong-password':
          toast.error('Incorrect password. Please try again.'); break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later.'); break;
        case 'auth/network-request-failed':
          toast.error('Network error. Check your connection and try again.'); break;
        default:
          toast.error('Authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Forgot Password ──────────────────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetPhone.trim()) return;

    setIsLoading(true);
    try {
      // Look up user in Firestore by phone number
      const q = query(
        collection(db, 'users'),
        where('phone', '==', resetPhone.trim())
      );
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
          'No recovery email is linked to this account. ' +
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
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const renderForgotSent = () => (
    <div className="space-y-5 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 size={28} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white">Reset Email Sent!</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            We sent a password reset link to:
          </p>
          <p className="text-xs font-bold text-indigo-400 mt-1 break-all">{sentTo}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Next steps</p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-400">
          <li>Open the email in your inbox (check spam too)</li>
          <li>Click the <strong className="text-white">"Reset Password"</strong> link</li>
          <li>Choose a new secure password</li>
          <li>Come back here and sign in with your new password</li>
        </ol>
      </div>

      <button
        type="button"
        onClick={() => resetAll('login')}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
      >
        <ChevronLeft size={14} /> Back to Sign In
      </button>
    </div>
  );

  const renderForgotForm = () => (
    <form onSubmit={handleForgotPassword} className="space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <button
            type="button"
            onClick={() => resetAll('login')}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-white">Forgot Password</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pl-6">
          Enter your registered phone number. We'll send a reset link to your linked recovery email.
        </p>
      </div>

      <div>
        <label className={labelCls}>Phone Number (with Country Code)</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="tel"
            required
            placeholder="e.g., +233 24 555 1234"
            value={resetPhone}
            onChange={(e) => setResetPhone(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
      >
        {isLoading ? (
          <><Loader2 size={14} className="animate-spin" /> Sending Reset Link...</>
        ) : (
          <><KeyRound size={14} /> Send Reset Link</>
        )}
      </button>

      <p className="text-center text-[10px] text-slate-600 font-semibold">
        Remembered it?{' '}
        <button
          type="button"
          onClick={() => resetAll('login')}
          className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-0 font-bold"
        >
          Sign in
        </button>
      </p>
    </form>
  );

  const renderAuthForm = () => (
    <form onSubmit={handleAuthSubmit} className="space-y-5">
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
            <label className={labelCls}>Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text" required placeholder="e.g., Kwame Mensah"
                value={name} onChange={(e) => setName(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Phone Number */}
        <div>
          <label className={labelCls}>Phone Number (with Country Code)</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="tel" required placeholder="e.g., +233 24 555 1234"
              value={phone} onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Role — Register Only */}
        {mode === 'register' && (
          <div>
            <label className={labelCls}>Access Authorization Level</label>
            <select
              value={role} onChange={(e) => setRole(e.target.value)}
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
          <label className={labelCls}>Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type={showPassword ? 'text' : 'password'}
              required minLength={6}
              placeholder={mode === 'register' ? 'Min. 6 characters' : 'Enter your password'}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60 focus:border-emerald-500/40 text-xs font-semibold placeholder-slate-600 transition-all"
            />
            <button
              type="button" tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Forgot password link — Login Only */}
          {mode === 'login' && (
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => resetAll('forgot')}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline underline-offset-2 cursor-pointer bg-transparent border-0 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
        </div>

        {/* Confirm Password — Register Only */}
        {mode === 'register' && (
          <div>
            <label className={labelCls}>Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type={showConfirm ? 'text' : 'password'}
                required placeholder="Re-enter your password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-9 pr-10 py-2.5 rounded-lg border bg-slate-900 text-white focus:outline-none focus:ring-2 text-xs font-semibold placeholder-slate-600 transition-all ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-500/60 focus:ring-red-500/40'
                    : 'border-slate-800 focus:ring-emerald-500/60 focus:border-emerald-500/40'
                }`}
              />
              <button
                type="button" tabIndex={-1}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-[10px] text-red-400 font-semibold mt-1 pl-1">Passwords do not match</p>
            )}
          </div>
        )}

        {/* Recovery Email — Register Only */}
        {mode === 'register' && (
          <div>
            <label className={labelCls}>
              Recovery Email{' '}
              <span className="normal-case font-semibold text-slate-600">(for password reset)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="email"
                placeholder="e.g., kwame@gmail.com  (optional)"
                value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)}
                className={inputCls}
              />
            </div>
            <p className="text-[10px] text-slate-600 font-medium mt-1 pl-1">
              We only use this to send you a password reset link if you ever forget your password.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit" disabled={isLoading}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer mt-2"
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

      {/* Footer switch */}
      <p className="text-center text-[10px] text-slate-600 font-semibold pt-1">
        {mode === 'login' ? (
          <>Don&apos;t have an account?{' '}
            <button type="button" onClick={() => resetAll('register')}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-0 font-bold">
              Register here
            </button>
          </>
        ) : (
          <>Already registered?{' '}
            <button type="button" onClick={() => resetAll('login')}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 cursor-pointer bg-transparent border-0 font-bold">
              Sign in
            </button>
          </>
        )}
      </p>
    </form>
  );

  // ─── Main render ──────────────────────────────────────────────────────────
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
            <p className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase mt-1">
              Hazard &amp; Mining Sentinel Portal
            </p>
          </div>
        </div>

        {/* Tab Toggle — only show for login/register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl mb-7 text-xs font-bold uppercase tracking-wider">
            <button
              type="button" onClick={() => resetAll('login')}
              className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >Sign In</button>
            <button
              type="button" onClick={() => resetAll('register')}
              className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >Register</button>
          </div>
        )}

        {/* Content */}
        {mode === 'forgot'      && renderForgotForm()}
        {mode === 'forgot-sent' && renderForgotSent()}
        {(mode === 'login' || mode === 'register') && renderAuthForm()}
      </div>
    </div>
  );
}
