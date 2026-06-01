'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function NominationsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [nominations, setNominations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedNom, setSelectedNom] = useState<any>(null)
  const [form, setForm] = useState({ nominee_name: '', achievement_field: '', achievements_desc: '', nomination_reasons: '', contact_info: '' })
  const [submitting, setSubmitting] = useState(false)
  const [cycleStatus, setCycleStatus] = useState('nominations')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)
    const query = p?.role === 'admin'
      ? supabase.from('nominations').select('*, profiles(name)').order('created_at', { ascending: false })
      : supabase.from('nominations').select('*, profiles(name)').order('created_at', { ascending: false })
    const { data } = await query
    setNominations(data || [])

    const { data: s } = await supabase.from('settings').select('*')
    if (s) { const map: any = {}; s.forEach((r: any) => { map[r.key] = r.value }); setCycleStatus(map.cycle_status || 'nominations') }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nominee_name || !form.achievement_field || !form.achievements_desc || !form.nomination_reasons) {
      alert('يرجى تعبئة جميع الحقول الإلزامية'); return
    }
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('nominations').insert({
      ...form, nominator_id: user?.id, cycle_id: null, status: 'pending'
    })
    setForm({ nominee_name: '', achievement_field: '', achievements_desc: '', nomination_reasons: '', contact_info: '' })
    setShowForm(false)
    setSubmitting(false)
    load()
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('nominations').update({ status }).eq('id', id)
    load()
  }

  async function deleteNomination(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا الترشيح نهائياً؟')) return
    const supabase = createClient()
    await supabase.from('nominations').delete().eq('id', id)
    load()
  }

  const statusMap: any = {
    pending: { label: 'قيد المراجعة', class: 'bg-amber-50 text-amber-600' },
    approved: { label: 'معتمد', class: 'bg-emerald-50 text-emerald-600' },
    shortlisted: { label: 'مختصرة', class: 'bg-blue-50 text-blue-600' },
    rejected: { label: 'مرفوض', class: 'bg-red-50 text-red-500' },
  }

  const allowNomination = ['nominations', 'draft'].includes(cycleStatus)

  const fields = ['ريادة الأعمال', 'التعليم', 'العمل الاجتماعي', 'الصحة', 'الرياضة', 'الفنون والثقافة', 'التقنية', 'أخرى']

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-4 md:p-7 max-w-4xl" dir="rtl">

      {selectedNom && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4" onClick={() => setSelectedNom(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedNom.nominee_name}</h2>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{selectedNom.achievement_field}</span>
              </div>
              <button onClick={() => setSelectedNom(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">وصف الإنجازات وأثرها</div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">{selectedNom.achievements_desc}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-1">أسباب الترشيح</div>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">{selectedNom.nomination_reasons}</div>
              </div>
              {selectedNom.contact_info && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">معلومات التواصل</div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">{selectedNom.contact_info}</div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-400">رشّحه: {selectedNom.profiles?.name}</div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusMap[selectedNom.status]?.class}`}>
                  {statusMap[selectedNom.status]?.label}
                </span>
              </div>
            </div>
            {profile?.role === 'admin' && selectedNom.status === 'pending' && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button onClick={() => { updateStatus(selectedNom.id, 'shortlisted'); setSelectedNom(null) }}
                  className="flex-1 text-xs px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-semibold">إضافة للقائمة</button>
                <button onClick={() => { updateStatus(selectedNom.id, 'approved'); setSelectedNom(null) }}
                  className="flex-1 text-xs px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition font-semibold">اعتماد</button>
                <button onClick={() => { updateStatus(selectedNom.id, 'rejected'); setSelectedNom(null) }}
                  className="flex-1 text-xs px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition font-semibold">رفض</button>
              </div>
            )}
          </div>
        </div>
      )}
{!allowNomination && profile?.role !== 'admin' && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-5 text-center">
          <div className="text-2xl mb-2">🔒</div>
          <div className="font-semibold text-amber-700">باب الترشيح مغلق حالياً</div>
          <div className="text-sm text-amber-600 mt-1">المبادرة في مرحلة أخرى — تابع التحديثات من لوحة التحكم</div>
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الترشيحات</h1>
          <p className="text-sm text-gray-500 mt-1">{nominations.length} ترشيح مقدم</p>
        </div>
        {!showForm && allowNomination && profile?.role !== 'admin' && (
          <button onClick={() => setShowForm(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
            + تقديم ترشيح
          </button>
        )}
      </div>

      {showForm && allowNomination && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-4">
            <div className="text-sm font-semibold text-emerald-700 mb-2">معايير الترشيح</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600">
              <div className="bg-white rounded px-2 py-1">✓ أن يكون المرشح من مدينة صفوى</div>
              <div className="bg-white rounded px-2 py-1">✓ أن يكون من فئة الشباب</div>
              <div className="bg-white rounded px-2 py-1">✓ إنجاز على المستوى الوطني أو الدولي</div>
              <div className="bg-white rounded px-2 py-1">✓ القدوة والإلهام للشباب</div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">اسم المرشح/ة كاملاً <span className="text-red-400">*</span></label>
                <input value={form.nominee_name} onChange={e => setForm({ ...form, nominee_name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="الاسم الرباعي" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">مجال الإنجاز <span className="text-red-400">*</span></label>
                <select value={form.achievement_field} onChange={e => setForm({ ...form, achievement_field: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="">اختر المجال</option>
                  {fields.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">وصف الإنجازات وأثرها <span className="text-red-400">*</span></label>
              <textarea value={form.achievements_desc} onChange={e => setForm({ ...form, achievements_desc: e.target.value })}
                rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="اكتب وصفاً شاملاً..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">أسباب الترشيح <span className="text-red-400">*</span></label>
              <textarea value={form.nomination_reasons} onChange={e => setForm({ ...form, nomination_reasons: e.target.value })}
                rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="لماذا يستحق التكريم؟" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">معلومات التواصل <span className="text-gray-400">(اختياري)</span></label>
              <input value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="رقم الجوال أو البريد الإلكتروني" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">إلغاء</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                {submitting ? 'جارٍ الإرسال...' : '↪ تقديم الترشيح'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المرشح/ة</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المجال</th>
              {profile?.role === 'admin' && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المرشِّح</th>}
              {profile?.role !== 'admin' && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المرشِّح</th>}
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحالة</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {nominations.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">لا توجد ترشيحات بعد</td></tr>
            ) : nominations.map(n => (
              <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-900">{n.nominee_name}</td>
                <td className="px-4 py-3 text-gray-600">{n.achievement_field}</td>
                {profile?.role === 'admin' && <td className="px-4 py-3 text-gray-500">{n.profiles?.name}</td>}
                {profile?.role !== 'admin' && <td className="px-4 py-3 text-gray-400">—</td>}
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusMap[n.status]?.class}`}>
                    {statusMap[n.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setSelectedNom(n)}
                      className="text-xs px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded hover:bg-gray-100 transition">
                      عرض التفاصيل
                    </button>
                    {profile?.role === 'admin' && n.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(n.id, 'shortlisted')} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">للقائمة</button>
                        <button onClick={() => updateStatus(n.id, 'rejected')} className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100 transition">رفض</button>
                      </>
                    )}
                    {profile?.role === 'admin' && (
                      <button onClick={() => deleteNomination(n.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">حذف</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}