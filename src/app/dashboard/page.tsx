'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ nominations: 0, shortlisted: 0, votes: 0, willing: 0 })
  const [cycleLabel, setCycleLabel] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const { data: s } = await supabase.from('settings').select('*')
      if (s) {
        const map: any = {}
        s.forEach((row: any) => { map[row.key] = row.value })
        setCycleLabel(`${map.cycle_name} — الربع ${map.cycle_quarter === '1' ? 'الأول' : map.cycle_quarter === '2' ? 'الثاني' : map.cycle_quarter === '3' ? 'الثالث' : 'الرابع'} ${map.cycle_year}`)
      }

      const { count: nomCount } = await supabase
        .from('nominations').select('*', { count: 'exact', head: true })
      const { count: shortCount } = await supabase
        .from('nominations').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted')
      const { count: voteCount } = await supabase
        .from('honoree_votes').select('*', { count: 'exact', head: true })
      const { count: willingCount } = await supabase
        .from('contribution_intents').select('*', { count: 'exact', head: true }).eq('is_willing', true)

      setStats({
        nominations: nomCount || 0,
        shortlisted: shortCount || 0,
        votes: voteCount || 0,
        willing: willingCount || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400">جارٍ التحميل...</p>
    </div>
  )

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-7 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-500 mt-1">{cycleLabel}</p>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
        {[
          { n: '1', l: 'الترشيح', s: 'done' },
          { n: '2', l: 'القائمة', s: 'done' },
          { n: '3', l: 'التصويت', s: 'current' },
          { n: '4', l: 'الجائزة', s: 'pending' },
          { n: '5', l: 'التكريم', s: 'pending' },
        ].map((step, i) => (
          <div key={i} className={`flex-1 py-2 text-center text-xs border-l border-gray-200 last:border-0
            ${step.s === 'done' ? 'bg-emerald-50 text-emerald-600' :
              step.s === 'current' ? 'bg-emerald-500 text-white' :
              'bg-white text-gray-400'}`}>
            <div className="text-xs opacity-70">{step.n}</div>
            <div className="font-semibold">{step.l}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'الترشيحات', value: stats.nominations, sub: 'مقدمة' },
          { label: 'المختصرون', value: stats.shortlisted, sub: 'معتمدون' },
          { label: 'الأصوات', value: stats.votes, sub: 'مسجلة' },
          { label: isAdmin ? 'المتطوعون للقطة' : 'مرحلة التصويت', value: isAdmin ? stats.willing : '—', sub: isAdmin ? 'عضو' : 'جارية' },
        ].map((m, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-400 mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">التنبيهات</h2>
        <div className="space-y-2">
          {isAdmin ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                <span className="text-lg">⚠️</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">التصويت مفتوح</div>
                  <div className="text-xs text-gray-500">يومان متبقيان</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">📝</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{stats.nominations} ترشيح مقدم</div>
                  <div className="text-xs text-gray-500">راجع الترشيحات الجديدة</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <span className="text-lg">🗳</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">التصويت مفتوح الآن</div>
                  <div className="text-xs text-gray-500">يومان متبقيان للتصويت</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">💰</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">دعوة المساهمة في القطة</div>
                  <div className="text-xs text-gray-500">سجّل رغبتك قبل نهاية الشهر</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
