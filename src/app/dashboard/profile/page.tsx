'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [nameMsg, setNameMsg] = useState('')
  const [passMsg, setPassMsg] = useState('')
  const [nameMsgType, setNameMsgType] = useState<'success'|'error'>('success')
  const [passMsgType, setPassMsgType] = useState<'success'|'error'>('success')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    setName(p?.name || '')
    setLoading(false)
  }

  async function saveName() {
    if (!name.trim()) return
    setSavingName(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ name }).eq('id', profile.id)
    if (error) {
      setNameMsg('حدث خطأ أثناء الحفظ'); setNameMsgType('error')
    } else {
      setNameMsg('تم تحديث الاسم بنجاح'); setNameMsgType('success')
      setTimeout(() => setNameMsg(''), 3000)
    }
    setSavingName(false)
  }

  async function savePassword() {
    if (!newPassword || !confirmPassword) { setPassMsg('يرجى تعبئة جميع الحقول'); setPassMsgType('error'); return }
    if (newPassword !== confirmPassword) { setPassMsg('كلمتا المرور غير متطابقتين'); setPassMsgType('error'); return }
    if (newPassword.length < 8) { setPassMsg('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); setPassMsgType('error'); return }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPassMsg('حدث خطأ: ' + error.message); setPassMsgType('error')
    } else {
      setPassMsg('تم تغيير كلمة المرور بنجاح'); setPassMsgType('success')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      setTimeout(() => setPassMsg(''), 3000)
    }
    setSavingPassword(false)
  }

  function getInitials(n: string) {
    return n.split(' ').slice(0, 2).map((w: string) => w[0]).join('')
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-4 md:p-7 max-w-2xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">الملف الشخصي</h1>
        <p className="text-sm text-gray-500 mt-1">إدارة معلوماتك الشخصية وكلمة المرور</p>
      </div>

      {/* معلومات الحساب */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {getInitials(profile?.name || '؟')}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">{profile?.name}</div>
            <div className="text-sm text-gray-400">{profile?.role === 'admin' ? 'مدير النظام' : 'عضو المجلس'}</div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">تعديل الاسم</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="الاسم الكامل"
            />
            <button onClick={saveName} disabled={savingName}
              className="bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50">
              {savingName ? 'جارٍ...' : 'حفظ'}
            </button>
          </div>
          {nameMsg && (
            <div className={`mt-2 text-sm ${nameMsgType === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
              {nameMsgType === 'success' ? '✓' : '✕'} {nameMsg}
            </div>
          )}
        </div>
      </div>

      {/* تغيير كلمة المرور */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">تغيير كلمة المرور</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="8 أحرف على الأقل"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="أعد كتابة كلمة المرور"
            />
          </div>
        </div>
        {passMsg && (
          <div className={`mt-3 text-sm ${passMsgType === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
            {passMsgType === 'success' ? '✓' : '✕'} {passMsg}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <button onClick={savePassword} disabled={savingPassword}
            className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50">
            {savingPassword ? 'جارٍ الحفظ...' : 'تغيير كلمة المرور'}
          </button>
        </div>
      </div>
    </div>
  )
}
