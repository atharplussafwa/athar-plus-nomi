'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function VotingPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [shortlisted, setShortlisted] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [hasVoted, setHasVoted] = useState(false)
  const [votes, setVotes] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const { data: vs } = await supabase.from('settings').select('*')
    if (vs) {
      const map: any = {}
      vs.forEach((r: any) => { map[r.key] = r.value })
      if (map.voting_end) {
        const end = new Date(map.voting_end)
        const today = new Date()
        const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        setDaysLeft(diff)
      }
    }

    const { data: noms } = await supabase.from('nominations').select('*').eq('status', 'shortlisted')
    setShortlisted(noms || [])

    const voterHash = hashVoter(user.id)
    if (localStorage.getItem('athar_voted_' + voterHash)) setHasVoted(true)
    const { data: existingVote } = await supabase
      .from('honoree_votes').select('*').eq('voter_hash', voterHash).maybeSingle()
    if (existingVote) {
      setHasVoted(true)
      localStorage.setItem('athar_voted_' + voterHash, 'true')
    }

    if (p?.role === 'admin') {
      const { data: v } = await supabase.from('honoree_votes').select('nomination_id, reason')
      setVotes(v || [])
    }
    setLoading(false)
  }

  function hashVoter(userId: string) {
    return btoa(userId + 'athar-plus-secret').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
  }

  async function submitVote() {
    if (!selected) return
    if (!reason.trim()) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const voterHash = hashVoter(user.id)
    const { error } = await supabase.from('honoree_votes').insert({
      voter_hash: voterHash,
      nomination_id: selected,
      reason: reason.trim(),
      cycle_id: null
    })

    if (error) {
      if (error.code === '23505') {
        setHasVoted(true)
        localStorage.setItem('athar_voted_' + voterHash, 'true')
      }
    } else {
      setHasVoted(true)
      localStorage.setItem('athar_voted_' + voterHash, 'true')
    }
    setSubmitting(false)
  }

  function getVoteCount(nomId: string) {
    return votes.filter(v => v.nomination_id === nomId).length
  }

  function getReasons(nomId: string) {
    return votes.filter(v => v.nomination_id === nomId && v.reason).map(v => v.reason)
  }

  const totalVotes = votes.length
  const isAdmin = profile?.role === 'admin'

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-7 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">التصويت</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin ? 'نتائج التصويت الإجمالية' : 'اختر مرشحاً واحداً للتكريم'}
          </p>
        </div>
        {daysLeft !== null && (
          <div className={`text-xs px-3 py-1.5 rounded-full border ${daysLeft > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-500 border-red-100'}`}>
            {daysLeft > 0 ? `⏱ ${daysLeft} ${daysLeft === 1 ? 'يوم متبقٍ' : 'أيام متبقية'}` : '⛔ انتهت فترة التصويت'}
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 text-sm text-blue-700">
          🔒 تصويتك سري تماماً — لا يمكن لأحد الاطلاع على اختيارك
        </div>
      )}

      {shortlisted.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3 opacity-30">🗳</div>
          <p className="text-gray-500">لا يوجد مرشحون في القائمة المختصرة بعد</p>
        </div>
      ) : isAdmin ? (
        <div className="space-y-4">
          {shortlisted.map(n => {
            const vCount = getVoteCount(n.id)
            const pct = totalVotes > 0 ? Math.round((vCount / totalVotes) * 100) : 0
            const reasons = getReasons(n.id)
            return (
              <div key={n.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{n.nominee_name}</div>
                    <div className="text-xs text-gray-500">{n.achievement_field}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-emerald-500">{vCount}</div>
                    <div className="text-xs text-gray-400">أصوات ({pct}%)</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                </div>
                {reasons.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs font-semibold text-gray-400 mb-1">أسباب التصويت:</div>
                    {reasons.map((r, i) => (
                      <div key={i} className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">"{r}"</div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          <div className="text-xs text-gray-400 text-center mt-2">إجمالي الأصوات: {totalVotes}</div>
          {totalVotes > 0 && (
            <button onClick={() => router.push('/dashboard/awards')}
              className="w-full mt-2 bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
              🏆 الانتقال لإعلان المكرَّم
            </button>
          )}
        </div>
      ) : hasVoted ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">لقد أتممت تصويتك</h2>
          <p className="text-sm text-gray-500 mb-2">شكراً على مشاركتك في اختيار المكرَّم</p>
          <p className="text-xs text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full inline-block mt-2">⏳ انتظر النتائج قريباً</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            {shortlisted.map(n => (
              <div key={n.id} onClick={() => setSelected(n.id)}
                className={`border rounded-xl p-4 cursor-pointer transition
                  ${selected === n.id
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-emerald-200'}`}>
                <div className="font-semibold text-gray-900">{n.nominee_name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{n.achievement_field}</div>
                <div className="text-sm text-gray-600 mt-2">{n.achievements_desc}</div>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              سبب تصويتك <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="اكتب سبب اختيارك لهذا المرشح..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 resize-none" />
            <p className="text-xs text-gray-400 mt-1">هذا الحقل إلزامي ولن يظهر مع اسمك</p>
          </div>

          <div className="flex justify-end">
            <button onClick={submitVote}
              disabled={!selected || !reason.trim() || submitting}
              className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-40">
              {submitting ? 'جارٍ التسجيل...' : '✓ تأكيد التصويت'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
