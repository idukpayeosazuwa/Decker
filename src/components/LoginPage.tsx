import React, { useState } from 'react';
import { 
  LogIn, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  BookOpen, 
  Check,
  AlertCircle,
  X
} from 'lucide-react';
import { loginUser, registerUser, loginWithGoogle } from '../lib/firebaseWrapper';

interface LoginPageProps {
  onLogin: (user: { uid: string; email: string; role: 'rep' }) => void;
  onClose?: () => void;
}

export default function LoginPage({ onLogin, onClose }: LoginPageProps) {
  // Check if current URL/hash represents signup to allow it secretly
  const isSecretSignupUrl = typeof window !== 'undefined' && (
    window.location.pathname === '/signup' || 
    window.location.hash === '#signup' || 
    window.location.hash === '#/signup' ||
    window.location.search.includes('signup')
  );

  // Model state: default to Log In (Sign In) not Sign Up as requested
  const [isSignUp, setIsSignUp] = useState<boolean>(isSecretSignupUrl);
  
  // Form input states
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // States
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);

  // Form submission handler using our new real Firebase / Local storage engine
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const user = await registerUser(email, password);
        onLogin(user);
      } else {
        const user = await loginUser(email, password);
        onLogin(user);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign in integration
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setGoogleLoading(true);
    
    try {
      const user = await loginWithGoogle();
      onLogin(user);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Google login error occurred.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-5 py-8 bg-[#FAF9F5] font-sans text-left min-h-screen">
      
      {/* Sleek rounded card container modeled exactly after the provided screenshot */}
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 md:p-9 space-y-6 animate-fade-in relative" id="login-container-card">
        
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-55 transition-colors cursor-pointer"
            title="Close login"
          >
            <X className="h-4.5 w-4.5 stroke-[2.2]" />
          </button>
        )}

        {/* Decker Header Section */}
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-extrabold text-[#2c50cd] tracking-tight leading-none font-sans" id="app-title-main">
            Decker
          </h1>
          <p className="text-sm text-slate-500 font-medium" id="app-subtitle-auth">
            {isSignUp ? 'Start your study deck' : 'Sign in to your study deck'}
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1" id="auth-main-form">
          
          {/* Email field */}
          <div className="space-y-1.5">
            <label htmlFor="email-input" className="block text-[13px] font-bold text-slate-700 tracking-tight">
              Email
            </label>
            <input
              id="email-input"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#2c50cd] focus:ring-1 focus:ring-[#2c50cd]/10 font-sans font-medium"
              required
            />
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label htmlFor="password-input" className="block text-[13px] font-bold text-slate-700 tracking-tight">
              Password
            </label>
            <input
              id="password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-[#2c50cd] focus:ring-1 focus:ring-[#2c50cd]/10 font-sans font-medium"
              required
            />
          </div>

          {/* Error visual message strip */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-700 leading-snug text-xs font-semibold animate-fade-in" id="error-message-strip">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Main Action Button */}
          <button
            type="submit"
            disabled={isLoading || googleLoading}
            id="login-main-btn"
            className="w-full flex items-center justify-center rounded-lg bg-[#2c50cd] hover:bg-[#1e3bb5] py-3.5 text-xs font-bold text-white transition-all shadow-[0_4px_12px_rgba(44,80,205,0.15)] disabled:opacity-50 cursor-pointer text-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </span>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Log In'}</span>
            )}
          </button>
        </form>

        {/* Separator block exactly styled like mockup with beautiful thin line */}
        <div className="flex items-center my-5 select-none" id="separator-block">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider font-sans">or</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Google Authentication button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || googleLoading}
          id="google-signin-btn"
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 py-3.5 text-xs font-semibold text-slate-700 transition-all cursor-pointer relative"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>Connecting Google...</span>
            </span>
          ) : (
            <>
              <LogIn className="h-4 w-4 stroke-[2.2] text-slate-600" />
              <span>{isSignUp ? 'Sign up with Google' : 'Sign in with Google'}</span>
            </>
          )}
        </button>

        {/* State Toggle Footer matching style exactly (only visible on secret signup URL) */}
        {isSecretSignupUrl && (
          <p className="text-xs text-slate-500 font-medium text-center" id="is-signup-toggle-container">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
              }}
              className="text-[#2c50cd] font-bold hover:underline cursor-pointer"
              id="toggle-is-signup-btn"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        )}

      </div>

      {/* Humble and minimal subtext brand credit at the extreme bottom of viewport */}
      <div className="text-center mt-12 text-[10px] text-slate-400 font-medium font-mono uppercase tracking-widest select-none">
        DECKER ACADEMIC BINDER ENGINE
      </div>

    </div>
  );
}
