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
  const [form, setForm] = useState({ nominee_name: '', achievement_field: '', achievements_desc: '', nomination_reasons: '', contact_info: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const query = p?.role === 'admin'
      ? supabase.from('nominations').select('*, profiles(name)').order('created_at', { ascending: false })
      : supabase.from('nominations').select('*, profiles(name)').eq('nominator_id', user.id).order('created_at', { ascending: false })

    const { data } = await query
    setNominations(data || [])
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
      ...form,
      nominator_id: user?.id,
      cycle_id: null,
      status: 'pending'
    })
    setForm({ nominee_name: '', achievement_field: '', achievements_desc: '', nomination_reasons: '', contact_info: '' })
    setShowForm(false)
    setSubmitting(false)
    load()
  }

  async function deleteNomination(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا الترشيح نهائياً؟")) return
    const supabase = createClient()
    await supabase.from("nominations").delete().eq("id", id)
    load()
  }

  async function updateStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from('nominations').update({ status }).eq('id', id)
    load()
  }

  const statusMap: any = {
    pending: { label: 'قيد المراجعة', class: 'bg-amber-50 text-amber-600' },
    approved: { label: 'معتمد', class: 'bg-emerald-50 text-emerald-600' },
    shortlisted: { label: 'مختصرة', class: 'bg-blue-50 text-blue-600' },
    rejected: { label: 'مرفوض', class: 'bg-red-50 text-red-500' },
  }

  const fields = ['ريادة الأعمال', 'التعليم', 'العمل الاجتماعي', 'الصحة', 'الرياضة', 'الفنون والثقافة', 'التقنية', 'أخرى']

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-7 max-w-4xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الترشيحات</h1>
          <p className="text-sm text-gray-500 mt-1">{nominations.length} ترشيح مقدم</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
            + تقديم ترشيح
          </button>
        )}
      </div>

      {/* نموذج الترشيح */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-4">
            <div className="text-sm font-semibold text-emerald-700 mb-2">معايير الترشيح</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-emerald-600">
              <div className="bg-white rounded px-2 py-1">✓ الأثر الإيجابي على المجتمع</div>
              <div className="bg-white rounded px-2 py-1">✓ التميز والتفرد في المجال</div>
              <div className="bg-white rounded px-2 py-1">✓ الاستمرارية والثبات</div>
              <div className="bg-white rounded px-2 py-1">✓ القدوة والإلهام للآخرين</div>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">وصف الإنجازات وأثرها <span className="text-red-400">*</span> <span className="text-gray-400">(200 كلمة كحد أقصى)</span></label>
              <textarea value={form.achievements_desc} onChange={e => setForm({ ...form, achievements_desc: e.target.value })}
                rows={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="اكتب وصفاً شاملاً..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">أسباب الترشيح <span className="text-red-400">*</span> <span className="text-gray-400">(100 كلمة كحد أقصى)</span></label>
              <textarea value={form.nomination_reasons} onChange={e => setForm({ ...form, nomination_reasons: e.target.value })}
                rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="لماذا يستحق التكريم؟" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">معلومات التواصل <span className="text-gray-400">(اختياري)</span></label>
              <input value={form.contact_info} onChange={e => setForm({ ...form, contact_info: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="رقم الجوال أو البريد الإلكتروني" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition">إلغاء</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50">
                {submitting ? 'جارٍ الإرسال...' : '↪ تقديم الترشيح'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* جدول الترشيحات */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المرشح/ة</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المجال</th>
              {profile?.role === 'admin' && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المرشِّح</th>}
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
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusMap[n.status]?.class}`}>
                    {statusMap[n.status]?.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {profile?.role === 'admin' ? (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => updateStatus(n.id, 'shortlisted')} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition">إضافة للقائمة</button>
                      <button onClick={() => updateStatus(n.id, 'approved')} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition">اعتماد</button>
                      <button onClick={() => updateStatus(n.id, 'rejected')} className="text-xs px-2 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100 transition">رفض</button>
                      <button onClick={() => deleteNomination(n.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition">حذف</button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
