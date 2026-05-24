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
  const [success, setSuccess] = useState('')

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

  async function createMember() {
    if (!form.name || !form.email || !form.password) {
      setError('يرجى تعبئة جميع الحقول'); return
    }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.error) {
      setError(data.error)
    } else {
      setSuccess('تم إضافة العضو بنجاح')
      setForm({ name: '', email: '', password: '', role: 'member' })
      setShowForm(false)
      setTimeout(() => setSuccess(''), 3000)
      load()
    }
    setSubmitting(false)
  }

  async function updateMember() {
    if (!editMember) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('profiles').update({ name: form.name, role: form.role }).eq('id', editMember.id)
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

  function openAdd() {
    setEditMember(null)
    setForm({ name: '', email: '', password: '', role: 'member' })
    setError('')
    setShowForm(true)
  }

  function openEdit(m: any) {
    setEditMember(m)
    setForm({ name: m.name, email: m.email || '', password: '', role: m.role })
    setError('')
    setShowForm(true)
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
        <button onClick={openAdd}
          className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
          + إضافة عضو
        </button>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-4 text-sm text-emerald-700">
          ✓ {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            {editMember ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">الاسم الكامل</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="الاسم الرباعي" />
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
          {!editMember && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">البريد الإلكتروني</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">كلمة المرور</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••" />
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditMember(null) }}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">إلغاء</button>
            <button onClick={editMember ? updateMember : createMember} disabled={submitting}
              className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
              {submitting ? 'جارٍ الحفظ...' : editMember ? 'حفظ' : 'إضافة'}
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
                    <div className="font-semibold text-gray-900">{m.name}</div>
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
