import { useState } from 'react'
import { Mail, Lock, ArrowRight, Loader2, AlertCircle, X, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useLanguage } from '../contexts/LanguageContext.jsx'
import GreenVistaMark from './GreenVistaMark.jsx'

export default function AuthModal({ initialMode = 'signin', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, register } = useAuth()
  const { t } = useLanguage()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!email || !password || (mode === 'signup' && !confirmPassword)) {
      setError(t('auth.fillFields') || 'Please fill in all fields')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('auth.passwordMismatch') || 'Passwords do not match')
      return
    }

    try {
      setError('')
      setLoading(true)
      
      if (mode === 'signin') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      
      onSuccess({ newAccount: mode === 'signup' })
    } catch (err) {
      const messageKey = err.status === 409
        ? 'auth.userExists'
        : err.status === 401
          ? 'auth.invalidCredentials'
          : err.status === 422 && String(err.message).toLowerCase().includes('email')
            ? 'auth.emailInvalid'
          : err.status === 422 && (
            String(err.message).toLowerCase().includes('password') ||
            String(err.message).toLowerCase().includes('at least 8')
          )
              ? 'auth.passwordTooShort'
              : null
      setError(messageKey ? t(messageKey) : err.message)
    } finally {
      setLoading(false)
    }
  }

  const changeMode = (nextMode) => {
    setError('')
    setMode(nextMode)
  }

  return (
    <div 
      className="fixed inset-0 z-[100] grid place-items-center bg-myanglow-navy/45 p-4 backdrop-blur-md" 
      onMouseDown={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 p-6 shadow-[0_30px_100px_rgba(12,46,61,0.3)] backdrop-blur-xl sm:p-8"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-myanglow-lime/20 blur-2xl" />
        
        <button 
          type="button" 
          onClick={onClose} 
          aria-label="Close authentication dialog"
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-myanglow-sage/40 hover:text-myanglow-navy"
        >
          <X size={19} />
        </button>

        <div className="relative">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-myanglow-forest text-white shadow-lg shadow-myanglow-forest/20">
            <GreenVistaMark className="h-8 w-8" />
          </div>
          
          <h2 className="mt-5 text-3xl font-semibold text-myanglow-navy">
            {mode === 'signin' 
              ? (t('auth.welcomeBack') || 'Welcome Back') 
              : (t('auth.createAccount') || 'Create Account')}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {mode === 'signin' 
              ? (t('auth.loginSubtitle') || 'Sign in to access your GreenVista dashboard')
              : (t('auth.registerSubtitle') || 'Join GreenVista and start managing your farm')}
          </p>

          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-myanglow-sage/35 p-1">
            <button 
              type="button" 
              onClick={() => changeMode('signin')} 
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'signin' ? 'bg-white text-myanglow-forest shadow-sm' : 'text-slate-500 hover:text-myanglow-navy'}`}
            >
              {t('auth.loginBtn') || 'Sign In'}
            </button>
            <button 
              type="button" 
              onClick={() => changeMode('signup')} 
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-myanglow-forest shadow-sm' : 'text-slate-500 hover:text-myanglow-navy'}`}
            >
              {t('auth.registerBtn') || 'Sign Up'}
            </button>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-myanglow-navy">
              {t('auth.email') || 'Email Address'}
              <span className="relative mt-2 flex h-14 items-center rounded-2xl border border-myanglow-sage bg-white px-4 focus-within:border-myanglow-medium focus-within:ring-4 focus-within:ring-myanglow-sage/30">
                <Mail size={17} className="pointer-events-none absolute left-4 text-myanglow-medium" />
                <input 
                  required 
                  type="email" 
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@greenvista.com" 
                  className="h-full min-w-0 w-full appearance-none border-0 bg-transparent pl-8 text-sm font-normal outline-none"
                  disabled={loading}
                />
              </span>
            </label>

            <label className="block text-sm font-semibold text-myanglow-navy">
              {t('auth.password') || 'Password'}
              <span className="relative mt-2 flex h-14 items-center rounded-2xl border border-myanglow-sage bg-white px-4 focus-within:border-myanglow-medium focus-within:ring-4 focus-within:ring-myanglow-sage/30">
                <Lock size={17} className="pointer-events-none absolute left-4 text-myanglow-medium" />
                <input 
                  required 
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="h-full min-w-0 w-full appearance-none border-0 bg-transparent pl-8 pr-8 text-sm font-normal outline-none"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(value => !value)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-slate-400 shadow-none outline-none transition hover:bg-transparent hover:text-myanglow-forest focus:bg-transparent focus:outline-none focus:ring-0"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            {mode === 'signup' && (
              <label className="block text-sm font-semibold text-myanglow-navy">
                {t('auth.confirmPassword') || 'Confirm Password'}
                <span className="relative mt-2 flex h-14 items-center rounded-2xl border border-myanglow-sage bg-white px-4 focus-within:border-myanglow-medium focus-within:ring-4 focus-within:ring-myanglow-sage/30">
                  <Lock size={17} className="pointer-events-none absolute left-4 text-myanglow-medium" />
                  <input
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="h-full min-w-0 w-full appearance-none border-0 bg-transparent pl-8 pr-8 text-sm font-normal outline-none"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(value => !value)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-4 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-slate-400 shadow-none outline-none transition hover:bg-transparent hover:text-myanglow-forest focus:bg-transparent focus:outline-none focus:ring-0"
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </span>
              </label>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-myanglow-forest px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-myanglow-forest/20 transition hover:-translate-y-0.5 hover:bg-myanglow-medium disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : (
                mode === 'signin' ? (t('auth.loginBtn') || 'Sign In') : (t('auth.registerBtn') || 'Sign Up')
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
            <button
              type="button"
              onClick={() => changeMode(mode === 'signin' ? 'signup' : 'signin')}
              className="font-semibold text-myanglow-forest underline underline-offset-2 hover:text-myanglow-medium"
            >
              {mode === 'signin' ? t('auth.switchSignup') : t('auth.switchSignin')}
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}
