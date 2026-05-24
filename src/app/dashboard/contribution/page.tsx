'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ContributionPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [intent, setIntent] = useState<boolean | null>(null)
  const [willingCount, setWillingCount] = useState(0)
  const [totalSpent, setTotalSpent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const memberHash = hashMember(user.id)
    const { data: existing } = await supabase
      .from('contribution_intents')
      .select('*')
      .eq('member_hash', memberHash)
      .maybeSingle()
    if (existing) setIntent(existing.is_willing)

    if (p?.role === 'admin') {
      const { count } = await supabase
        .from('contribution_intents')
        .select('*', { count: 'exact', head: true })
        .eq('is_willing', true)
      setWillingCount(count || 0)
    }
    setLoading(false)
  }

  function hashMember(userId: string) {
    return btoa(userId + 'athar-plus-contrib').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
  }

  async function submitIntent(val: boolean) {
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const memberHash = hashMember(user.id)
    await supabase.from('contribution_intents').upsert({
      member_hash: memberHash,
      is_willing: val,
      cycle_id: null
    }, { onConflict: 'member_hash,cycle_id' })
    setIntent(val)
    setSubmitting(false)
  }

  function calcPerPerson() {
    const spent = parseFloat(totalSpent) || 0
    if (spent > 0 && willingCount > 0) {
      return Math.round(spent / willingCount).toLocaleString('ar-SA')
    }
    return '—'
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-7 max-w-2xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">المساهمة في القطة</h1>
        <p className="text-sm text-gray-500 mt-1">اختياري وسري تماماً — الربع الأول 2025</p>
      </div>

      {!isAdmin && (
        <>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-sm text-blue-700">
            🔒 رغبتك في المساهمة لا تظهر لأي عضو آخر. بعد الحفل سيُقسَّم إجمالي المصروف على المتطوعين.
          </div>
          {intent === null ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <div className="text-4xl mb-4 text-emerald-400">♡</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">هل تودّ المساهمة في تكريم المنجز؟</h2>
              <p className="text-sm text-gray-500 mb-2">لا يُطلب منك تحديد مبلغ الآن.</p>
              <p className="text-sm text-gray-500 mb-6">بعد انتهاء الحفل سيقوم المدير بحساب إجمالي المصروف وتقسيمه بالتساوي على من أبدى استعداده.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => submitIntent(true)} disabled={submitting}
                  className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50">
                  ✓ نعم، أودّ المساهمة
                </button>
                <button onClick={() => submitIntent(false)} disabled={submitting}
                  className="bg-red-50 text-red-500 border border-red-200 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50">
                  ✗ لا، شكراً
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-4">🔒 اختيارك سري — لن يعلم به أحد سوى المدير</div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              {intent ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center gap-3 mb-4">
                  <span className="text-2xl">✅</span>
                  <div>
                    <div className="font-semibold text-gray-900">أبديت استعدادك للمساهمة</div>
                    <div className="text-sm text-gray-500 mt-0.5">بعد الحفل سيُحدَّد نصيبك بالتساوي مع باقي المتطوعين</div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-center gap-3 mb-4">
                  <span className="text-2xl">⭕</span>
                  <div>
                    <div className="font-semibold text-gray-900">اخترت عدم المساهمة هذه الدورة</div>
                    <div className="text-sm text-gray-500 mt-0.5">يمكنك تغيير اختيارك في أي وقت قبل إغلاق الدورة</div>
                  </div>
                </div>
              )}
              <button onClick={() => setIntent(null)}
                className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
                تغيير اختياري
              </button>
            </div>
          )}
        </>
      )}

      {isAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">لوحة القطة — للمدير فقط</h2>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">المتطوعون للمساهمة</div>
              <div className="text-2xl font-bold text-gray-900">{willingCount}</div>
              <div className="text-xs text-gray-400 mt-1">عضو</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">إجمالي المصروف</div>
              <div className="text-2xl font-bold text-gray-900">{parseFloat(totalSpent) > 0 ? parseFloat(totalSpent).toLocaleString('ar-SA') : '—'}</div>
              <div className="text-xs text-gray-400 mt-1">ريال</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">نصيب كل مساهم</div>
              <div className="text-2xl font-bold text-emerald-500">{calcPerPerson()}</div>
              <div className="text-xs text-gray-400 mt-1">ريال</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">أدخل إجمالي المصروف بعد الحفل (ريال)</label>
            <input type="number" value={totalSpent} onChange={e => setTotalSpent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="0" />
            {parseFloat(totalSpent) > 0 && willingCount > 0 && (
              <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-700">
                {parseFloat(totalSpent).toLocaleString('ar-SA')} ريال ÷ {willingCount} متطوع = <strong>{calcPerPerson()} ريال</strong> على كل مساهم
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
