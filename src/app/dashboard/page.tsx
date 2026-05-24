'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const STAGES = [
  { value: 'draft', label: 'مسودة', n: '0' },
  { value: 'nominations', label: 'الترشيح', n: '1' },
  { value: 'shortlisting', label: 'القائمة', n: '2' },
  { value: 'voting', label: 'التصويت', n: '3' },
  { value: 'awards', label: 'الجائزة', n: '4' },
  { value: 'completed', label: 'التكريم', n: '5' },
]

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ nominations: 0, shortlisted: 0, votes: 0, willing: 0 })
  const [cycleLabel, setCycleLabel] = useState('')
  const [cycleStatus, setCycleStatus] = useState('nominations')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)

      const { data: s } = await supabase.from('settings').select('*')
      if (s) {
        const map: any = {}
        s.forEach((row: any) => { map[row.key] = row.value })
        const q = map.cycle_quarter
        const qLabel = q === '1' ? 'الأول' : q === '2' ? 'الثاني' : q === '3' ? 'الثالث' : 'الرابع'
        setCycleLabel(`${map.cycle_name} — الربع ${qLabel} ${map.cycle_year}`)
        setCycleStatus(map.cycle_status || 'nominations')
      }

      const { count: nomCount } = await supabase.from('nominations').select('*', { count: 'exact', head: true })
      const { count: shortCount } = await supabase.from('nominations').select('*', { count: 'exact', head: true }).eq('status', 'shortlisted')
      const { count: voteCount } = await supabase.from('honoree_votes').select('*', { count: 'exact', head: true })
      const { count: willingCount } = await supabase.from('contribution_intents').select('*', { count: 'exact', head: true }).eq('is_willing', true)

      setStats({ nominations: nomCount || 0, shortlisted: shortCount || 0, votes: voteCount || 0, willing: willingCount || 0 })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  const isAdmin = profile?.role === 'admin'
  const currentStageIndex = STAGES.findIndex(s => s.value === cycleStatus)
  const visibleStages = STAGES.filter(s => s.value !== 'draft')

  const notifMap: any = {
    nominations: { icon: '📝', title: 'الترشيح مفتوح', sub: 'يمكنك تقديم ترشيحاتك الآن' },
    shortlisting: { icon: '📋', title: 'إعداد القائمة المختصرة', sub: 'المدير يراجع الترشيحات' },
    voting: { icon: '🗳', title: 'التصويت مفتوح', sub: 'صوّت على المرشح المناسب' },
    awards: { icon: '🏆', title: 'اختيار الجائزة', sub: 'صوّت على الجائزة الأنسب' },
    completed: { icon: '✅', title: 'الدورة مكتملة', sub: 'شكراً على مشاركتكم' },
  }

  const currentNotif = notifMap[cycleStatus] || notifMap['nominations']

  return (
    <div className="p-4 md:p-7 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-500 mt-1">{cycleLabel}</p>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
        {visibleStages.map((stage, i) => {
          const stageIndex = STAGES.findIndex(s => s.value === stage.value)
          const status = stageIndex < currentStageIndex ? 'done' : stageIndex === currentStageIndex ? 'current' : 'pending'
          return (
            <div key={stage.value} className={`flex-1 py-2 text-center text-xs border-l border-gray-200 last:border-0
              ${status === 'done' ? 'bg-emerald-50 text-emerald-600' :
                status === 'current' ? 'bg-emerald-500 text-white' :
                'bg-white text-gray-400'}`}>
              <div className="text-xs opacity-70">{stage.n}</div>
              <div className="font-semibold">{stage.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'الترشيحات', value: stats.nominations, sub: 'مقدمة' },
          { label: 'المختصرون', value: stats.shortlisted, sub: 'معتمدون' },
          { label: 'الأصوات', value: stats.votes, sub: 'مسجلة' },
          { label: isAdmin ? 'المتطوعون للقطة' : 'المرحلة الحالية', value: isAdmin ? stats.willing : '—', sub: isAdmin ? 'عضو' : visibleStages[currentStageIndex - 1]?.label || '' },
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
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
            <span className="text-lg">{currentNotif.icon}</span>
            <div>
              <div className="text-sm font-semibold text-gray-800">{currentNotif.title}</div>
              <div className="text-xs text-gray-500">{currentNotif.sub}</div>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg">📝</span>
              <div>
                <div className="text-sm font-semibold text-gray-800">{stats.nominations} ترشيح مقدم</div>
                <div className="text-xs text-gray-500">{stats.shortlisted} في القائمة المختصرة</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
