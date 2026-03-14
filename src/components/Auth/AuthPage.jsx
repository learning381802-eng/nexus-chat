import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import { useAuthStore } from '../../store'
import { MessageSquare, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ login: '', email: '', username: '', password: '', displayName: '' })
  const isLogin = mode === 'login'

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
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 p-16 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8" style={{ background: 'var(--brand-gradient)' }}>
            <MessageSquare size={36} color="white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-bold mb-6 gradient-text">Nexus Chat</h1>
          <p className="text-lg leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            A modern chat platform for communities, friends, and teams. Real-time messaging, voice channels, and more.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Real-time', desc: 'Instant messaging' },
              { label: 'Secure', desc: 'End-to-end auth' },
              { label: 'Free', desc: 'Always & forever' },
            ].map(f => (
              <div key={f.label} className="p-4 rounded-xl text-left" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}>
                <p className="font-semibold text-sm mb-1" style={{ color: 'var(--header-primary)' }}>{f.label}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-col justify-center items-center flex-1 lg:max-w-md p-8" style={{ background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-subtle)' }}>
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--brand-gradient)' }}>
              <MessageSquare size={24} color="white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Nexus Chat</h1>
          </div>

          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--header-primary)' }}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? 'Sign in to continue to Nexus Chat' : 'Join thousands of communities on Nexus'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Display Name</label>
                  <input type="text" value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    className="input-base" placeholder="How others will see you" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Email <span style={{ color: 'var(--text-danger)' }}>*</span></label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required className="input-base" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Username <span style={{ color: 'var(--text-danger)' }}>*</span></label>
                  <input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required className="input-base" placeholder="cooluser123" />
                </div>
              </>
            )}
            {isLogin && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Email or Username <span style={{ color: 'var(--text-danger)' }}>*</span></label>
                <input type="text" value={form.login} onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                  required className="input-base" placeholder="Enter your email or username" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Password <span style={{ color: 'var(--text-danger)' }}>*</span></label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required className="input-base pr-12" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-6">
              {loading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ArrowRight size={16} />}
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="mt-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            {isLogin ? (
              <>Don't have an account?{' '}
                <Link to="/register" className="font-semibold" style={{ color: 'var(--brand-color)' }}>Register</Link></>
            ) : (
              <>Already have an account?{' '}
                <Link to="/login" className="font-semibold" style={{ color: 'var(--brand-color)' }}>Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
