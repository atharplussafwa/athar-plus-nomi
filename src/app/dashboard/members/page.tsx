'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function MembersPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editMember, setEditMember] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p?.role !== 'admin') { router.push('/dashboard'); return }
    setProfile(p)
    const { data: m } = await supabase.from('profiles').select('*').order('created_at')
    setMembers(m || [])
    setLoading(false)
  }

  async function updateMember() {
    if (!editMember) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      name: form.name,
      role: form.role
    }).eq('id', editMember.id)
    setEditMember(null)
    setShowForm(false)
    setSubmitting(false)
    load()
  }

  async function deleteMember(id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return
    const supabase = createClient()
    await supabase.from('profiles').delete().eq('id', id)
    load()
  }

  function openEdit(m: any) {
    setEditMember(m)
    setForm({ name: m.name, email: m.email || '', password: '', role: m.role })
    setShowForm(true)
    setError('')
  }

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('')
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-7 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">إدارة الأعضاء</h1>
          <p className="text-sm text-gray-500 mt-1">{members.length} عضو مسجل</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-600">
          لإضافة عضو جديد: أنشئه من Supabase Authentication
        </div>
      </div>

      {showForm && editMember && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">تعديل بيانات العضو</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الدور</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                <option value="member">عضو</option>
                <option value="admin">مدير</option>
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditMember(null) }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">إلغاء</button>
            <button onClick={updateMember} disabled={submitting}
              className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
              {submitting ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">العضو</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الدور</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاريخ الانضمام</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(m.name)}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{m.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                    ${m.role === 'admin' ? 'bg-emerald-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    {m.role === 'admin' ? 'مدير' : 'عضو'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(m.created_at).toLocaleDateString('ar-SA')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(m)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 transition">تعديل</button>
                    {m.id !== profile?.id && (
                      <button onClick={() => deleteMember(m.id)}
                        className="text-xs px-2 py-1 text-red-400 border border-red-200 rounded hover:bg-red-50 transition">حذف</button>
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
