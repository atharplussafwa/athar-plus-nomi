'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function AwardsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [awards, setAwards] = useState<any[]>([])
  const [awardVotes, setAwardVotes] = useState<any[]>([])
  const [winner, setWinner] = useState<any>(null)
const [topVoter, setTopVoter] = useState<any>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAward, setNewAward] = useState({ title: '', description: '', estimated_value: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

const { data: votes } = await supabase.from('honoree_votes').select('nomination_id')
    if (votes && votes.length > 0) {
      const counts: any = {}
      votes.forEach((v: any) => { counts[v.nomination_id] = (counts[v.nomination_id] || 0) + 1 })
      const topId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
      const { data: nom } = await supabase.from('nominations').select('nominee_name, achievement_field').eq('id', topId).single()
      if (nom) setTopVoter({ ...nom, votes: counts[topId] })
    }
    const { data: a } = await supabase.from('award_options').select('*').eq('is_active', true)
    setAwards(a || [])

    const voterHash = hashVoter(user.id)
    const { data: existing } = await supabase
      .from('award_votes').select('*').eq('voter_hash', voterHash).maybeSingle()
    if (existing) setHasVoted(true)

    if (p?.role === 'admin') {
      const { data: v } = await supabase.from('award_votes').select('award_option_id')
      setAwardVotes(v || [])

      const { data: topVote } = await supabase
        .from('honoree_votes')
        .select('nomination_id, nominations(nominee_name, achievement_field)')
        .order('nomination_id')
      if (topVote && topVote.length > 0) {
        const counts: any = {}
        topVote.forEach((v: any) => { counts[v.nomination_id] = (counts[v.nomination_id] || 0) + 1 })
        const topId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
        const top = topVote.find((v: any) => v.nomination_id === topId)
        setWinner(top?.nominations)
      }
    }
    setLoading(false)
  }

  function hashVoter(userId: string) {
    return btoa(userId + 'athar-plus-secret').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
  }

  function getVoteCount(awardId: string) {
    return awardVotes.filter(v => v.award_option_id === awardId).length
  }

  async function submitVote() {
    if (!selected) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const voterHash = hashVoter(user.id)
    const { error } = await supabase.from('award_votes').insert({
      voter_hash: voterHash,
      award_option_id: selected,
      cycle_id: null
    })
    if (!error) setHasVoted(true)
    setSubmitting(false)
    load()
  }

  async function addAward() {
    if (!newAward.title) return
    const supabase = createClient()
    await supabase.from('award_options').insert({
      title: newAward.title,
      description: newAward.description,
      estimated_value: parseFloat(newAward.estimated_value) || 0,
      cycle_id: null,
      is_active: true
    })
    setNewAward({ title: '', description: '', estimated_value: '' })
    setShowAddForm(false)
    load()
  }

  async function deleteAward(id: string) {
    const supabase = createClient()
    await supabase.from('award_options').delete().eq('id', id)
    load()
  }

  const totalVotes = awardVotes.length

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-7 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الجائزة</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? 'إدارة خيارات الجوائز ونتائج التصويت' : 'صوّت على الجائزة الأنسب للمكرَّم'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
            + إضافة خيار
          </button>
        )}
      </div>

      {/* المكرَّم */}
{topVoter && (
        <div className="bg-emerald-500 rounded-xl p-5 text-white text-center mb-5">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-sm opacity-80 mb-1">المكرَّم المختار</div>
          <div className="text-2xl font-bold">{topVoter.nominee_name}</div>
          <div className="text-sm opacity-85 mt-1">{topVoter.achievement_field}</div>
          <div className="text-xs opacity-70 mt-2">{topVoter.votes} أصوات</div>
        </div>
      )}      
{winner ? (
        <div className="bg-emerald-500 rounded-xl p-5 text-white text-center mb-5">
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-xl font-bold">{winner.nominee_name}</div>
          <div className="text-sm opacity-85 mt-1">{winner.achievement_field}</div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-5 text-sm text-amber-600">
          ⏳ لم يُعلن عن المكرَّم بعد — يجب إتمام التصويت أولاً
        </div>
      )}

      {/* نموذج إضافة جائزة */}
      {showAddForm && isAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">عنوان الجائزة</label>
              <input value={newAward.title} onChange={e => setNewAward({ ...newAward, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="مثال: درع تذكاري" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الوصف</label>
              <input value={newAward.description} onChange={e => setNewAward({ ...newAward, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="وصف مختصر" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">القيمة التقريبية (ريال)</label>
              <input type="number" value={newAward.estimated_value} onChange={e => setNewAward({ ...newAward, estimated_value: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="0" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">إلغاء</button>
              <button onClick={addAward} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600">إضافة</button>
            </div>
          </div>
        </div>
      )}

      {/* خيارات الجوائز */}
      {awards.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3 opacity-30">🏅</div>
          <p className="text-gray-500">لا توجد خيارات جوائز بعد</p>
          {isAdmin && <p className="text-sm text-gray-400 mt-2">اضغط + إضافة خيار لإضافة جوائز</p>}
        </div>
      ) : isAdmin ? (
        <div className="space-y-3">
          {awards.map(a => {
            const vCount = getVoteCount(a.id)
            const pct = totalVotes > 0 ? Math.round((vCount / totalVotes) * 100) : 0
            return (
              <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.description} — ~{a.estimated_value} ريال</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-xl font-bold text-emerald-500">{vCount}</div>
                      <div className="text-xs text-gray-400">أصوات ({pct}%)</div>
                    </div>
                    <button onClick={() => deleteAward(a.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
            )
          })}
          <div className="text-xs text-gray-400 text-center">إجمالي الأصوات: {totalVotes}</div>
        </div>
      ) : hasVoted ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">تم تسجيل تصويتك</h2>
          <p className="text-sm text-gray-500">شكراً على مشاركتك</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            {awards.map(a => (
              <div key={a.id} onClick={() => setSelected(a.id)}
                className={`border rounded-xl p-4 cursor-pointer transition
                  ${selected === a.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{a.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
                  </div>
                  <div className="text-xs text-gray-400">~{a.estimated_value} ريال</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={submitVote} disabled={!selected || submitting}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-40">
              {submitting ? 'جارٍ التسجيل...' : '✓ تأكيد اختيار الجائزة'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
