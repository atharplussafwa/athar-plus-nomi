'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            أ+
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-1">مبادرة أثر+</h1>
        <p className="text-sm text-center text-gray-500 mb-8">المجلس الشبابي — مدينة صفوى</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="your@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
