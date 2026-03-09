import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import { useAuthStore } from '../../store'
import toast from 'react-hot-toast'

export default function AuthPage({ mode }) {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
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
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5865F2 0%, #7289DA 50%, #4752C4 100%)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-lg p-8 shadow-2xl" style={{ background: '#313338' }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: '#5865F2' }}>
              <svg width="32" height="32" viewBox="0 0 127.14 96.36" fill="white">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: '#F2F3F5' }}>
              {isLogin ? 'Welcome back!' : 'Create an account'}
            </h1>
            <p style={{ color: '#B5BAC1' }} className="text-sm">
              {isLogin ? "We're so excited to see you again!" : 'Join Nexus Chat today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#B5BAC1' }}>Display Name</label>
                  <input
                    type="text"
                    value={form.displayName}
                    onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                    className="w-full rounded px-3 py-2 text-sm outline-none focus:ring-2"
                    style={{ background: '#1E1F22', color: '#DBDEE1', ring: '#5865F2' }}
                    placeholder="How should we call you?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#B5BAC1' }}>Email <span style={{ color: '#ED4245' }}>*</span></label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full rounded px-3 py-2 text-sm outline-none"
                    style={{ background: '#1E1F22', color: '#DBDEE1' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#B5BAC1' }}>Username <span style={{ color: '#ED4245' }}>*</span></label>
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    required
                    className="w-full rounded px-3 py-2 text-sm outline-none"
                    style={{ background: '#1E1F22', color: '#DBDEE1' }}
                  />
                </div>
              </>
            )}
            {isLogin && (
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#B5BAC1' }}>Email or Username <span style={{ color: '#ED4245' }}>*</span></label>
                <input
                  type="text"
                  value={form.login}
                  onChange={e => setForm(f => ({ ...f, login: e.target.value }))}
                  required
                  className="w-full rounded px-3 py-2 text-sm outline-none"
                  style={{ background: '#1E1F22', color: '#DBDEE1' }}
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: '#B5BAC1' }}>Password <span style={{ color: '#ED4245' }}>*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="w-full rounded px-3 py-2 text-sm outline-none"
                style={{ background: '#1E1F22', color: '#DBDEE1' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded font-medium text-white transition-colors mt-2"
              style={{ background: loading ? '#4752C4' : '#5865F2' }}
            >
              {loading ? (
                <span className="loading-dots">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-0.5">.</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-0.5">.</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mx-0.5">.</span>
                </span>
              ) : (isLogin ? 'Log In' : 'Continue')}
            </button>
          </form>

          <p className="mt-4 text-sm" style={{ color: '#B5BAC1' }}>
            {isLogin ? (
              <>Need an account? <Link to="/register" style={{ color: '#00AFF4' }} className="hover:underline">Register</Link></>
            ) : (
              <>Already have an account? <Link to="/login" style={{ color: '#00AFF4' }} className="hover:underline">Log in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
