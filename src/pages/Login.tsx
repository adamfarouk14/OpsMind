import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      setError('Please enter your username and password')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await login(username.trim(), password)
      navigate('/')
    } catch (err: any) {
      console.error('Login error:', err?.code ?? 'login_failed')
         setError(
        err?.code === 'rate_limited'
          ? 'Too many sign-in attempts. Please wait a few minutes.'
          : err?.code === 'invalid_credentials'
            ? 'Invalid username or password'
            : 'Could not reach the sign-in service. Check your connection and try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        {/* logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">OM</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">OpsMind</span>
          </div>
          <p className="text-sm text-slate-500">Technical Support Knowledge Base</p>
        </div>

        {/* login card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-sm text-slate-500">Sign in to access the knowledge base</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your.username"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                Remember me
              </label>
              <button type="button" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account? Contact your administrator.
            </p>
          </div>
        </div>

        
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>© 2026 OpsMind. Technical Support Knowledge Management System</p>
        </div>
      </div>
    </div>
  )
}
