import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import { useAuthStore } from '../../store'
import { MessageSquare, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function GoogleButton({ onSuccess, loading }) {
  const handleClick = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google sign-in is not configured yet. Use email/password instead.')
      return
    }
    // Open Google OAuth popup
    const width = 500, height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${window.location.origin}/auth/google/callback`,
      response_type: 'token id_token',
      scope: 'openid email profile',
      nonce: Math.random().toString(36),
    })
    window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'googleAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl font-medium text-sm transition-all hover:opacity-90 active:scale-95"
      style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--text-normal)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Google SVG logo */}
      <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
      Continue with Google
    </button>
  )
}

export default function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ login: '', email: '', username: '', password: '', displayName: '' })
  const isLogin = mode === 'login'

  // Listen for Google OAuth callback via postMessage
  useEffect(() => {
    const handler = async (e) => {
      if (e.data?.type === 'GOOGLE_AUTH' && e.data.credential) {
        setLoading(true)
        try {
          const data = await api.googleAuth(e.data.credential)
          setAuth(data.user, data.token)
          navigate('/channels/@me')
          toast.success('Signed in with Google!')
        } catch (err) {
          toast.error(err.message || 'Google sign-in failed')
        } finally {
          setLoading(false)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Also handle Google One Tap if client ID is set
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          setLoading(true)
          try {
            const data = await api.googleAuth(response.credential)
            setAuth(data.user, data.token)
            navigate('/channels/@me')
            toast.success('Signed in with Google!')
          } catch (err) {
            toast.error(err.message || 'Google sign-in failed')
          } finally {
            setLoading(false)
          }
        },
      })
      window.google?.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'filled_black', size: 'large', width: '100%', text: isLogin ? 'signin_with' : 'signup_with' }
      )
    }
    document.head.appendChild(script)
    return () => document.head.removeChild(script)
  }, [isLogin])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = isLogin
        ? await api.login({ login: form.login, password: form.password })
        : await api.register({ email: form.email, username: form.username, password: form.password, displayName: form.displayName })
      setAuth(data.user, data.token)
      navigate('/channels/@me')
      toast.success(isLogin ? 'Welcome back!' : 'Account created!')
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 p-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8" style={{ background: 'var(--brand-gradient)' }}>
            <MessageSquare size={36} color="white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-bold mb-6 gradient-text">Nexus Chat</h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            A modern platform for communities, friends, and teams. Real-time messaging, voice channels, and more.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: 'Real-time', desc: 'Instant messaging' },
              { label: 'Secure', desc: 'JWT + OAuth' },
              { label: 'Free', desc: 'Always & forever' },
            ].map(f => (
              <div key={f.label} className="p-4 rounded-xl text-left"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--header-primary)' }}>{f.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center items-center flex-1 lg:max-w-md p-8"
        style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: 'var(--brand-gradient)' }}>
              <MessageSquare size={24} color="white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Nexus Chat</h1>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--header-primary)' }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? 'Sign in to continue to Nexus Chat' : 'Join thousands of communities on Nexus'}
          </p>

          {/* Google sign in - rendered by Google SDK if client ID set, otherwise fallback button */}
          <div className="mb-4">
            {GOOGLE_CLIENT_ID ? (
              <div id="google-signin-btn" className="w-full" />
            ) : (
              <GoogleButton loading={loading} />
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Display Name
                  </label>
                  <input type="text" value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    className="input-base" placeholder="How others will see you" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Email <span style={{ color: 'var(--text-danger)' }}>*</span>
                  </label>
                  <input type="email" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required className="input-base" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                    Username <span style={{ color: 'var(--text-danger)' }}>*</span>
                  </label>
                  <input type="text" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required className="input-base" placeholder="cooluser123" />
                </div>
              </>
            )}

            {isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Email or Username <span style={{ color: 'var(--text-danger)' }}>*</span>
                </label>
                <input type="text" value={form.login}
                  onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                  required className="input-base" placeholder="Enter your email or username" />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                Password <span style={{ color: 'var(--text-danger)' }}>*</span>
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required className="input-base pr-12" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading
                ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                : <ArrowRight size={16} />}
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="mt-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? (
              <>Don't have an account?{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--brand-color)' }}>Register</Link>
              </>
            ) : (
              <>Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--brand-color)' }}>Sign in</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
