'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ShortlistPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [shortlisted, setShortlisted] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const { data: noms } = await supabase
      .from('nominations')
      .select('*')
      .eq('status', 'shortlisted')
      .order('created_at', { ascending: false })
    setShortlisted(noms || [])

    if (p?.role === 'admin') {
      const { data: v } = await supabase.from('honoree_votes').select('nomination_id')
      setVotes(v || [])
    }
    setLoading(false)
  }

  function getVoteCount(nomId: string) {
    return votes.filter(v => v.nomination_id === nomId).length
  }

  const totalVotes = votes.length

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-7 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">القائمة المختصرة</h1>
          <p className="text-sm text-gray-500 mt-1">{shortlisted.length} مرشح معتمد للتصويت</p>
        </div>
        {profile?.role === 'admin' && (
          <button
            onClick={() => router.push('/dashboard/nominations')}
            className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            + إضافة من الترشيحات
          </button>
        )}
      </div>

      {shortlisted.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3 opacity-30">📋</div>
          <p className="text-gray-500">لا يوجد مرشحون في القائمة المختصرة بعد</p>
          {profile?.role === 'admin' && (
            <p className="text-sm text-gray-400 mt-2">اذهب إلى الترشيحات وأضف المرشحين للقائمة</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shortlisted.map((n, i) => {
            const vCount = getVoteCount(n.id)
            const pct = totalVotes > 0 ? Math.round((vCount / totalVotes) * 100) : 0
            return (
              <div key={n.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{i + 1}</span>
                      <h2 className="text-base font-bold text-gray-900">{n.nominee_name}</h2>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{n.achievement_field}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{n.achievements_desc}</p>
                    <p className="text-sm text-gray-500 mt-1"><span className="font-medium">سبب الترشيح:</span> {n.nomination_reasons}</p>
                  </div>
                  {profile?.role === 'admin' && (
                    <div className="text-center bg-emerald-50 rounded-lg px-4 py-2 mr-4 flex-shrink-0">
                      <div className="text-2xl font-bold text-emerald-500">{vCount}</div>
                      <div className="text-xs text-emerald-600">صوت</div>
                    </div>
                  )}
                </div>
                {profile?.role === 'admin' && totalVotes > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{pct}%</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
