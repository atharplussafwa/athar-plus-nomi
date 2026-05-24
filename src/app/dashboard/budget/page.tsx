'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function BudgetPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [totalBudget, setTotalBudget] = useState(0)
  const [newBudget, setNewBudget] = useState('')
  const [editingBudget, setEditingBudget] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: '' })
  const [submitting, setSubmitting] = useState(false)
  const [budgetId, setBudgetId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(p)

    const { data: b } = await supabase.from('budget').select('*').maybeSingle()
    if (b) { setTotalBudget(b.total_amount || 0); setBudgetId(b.id) }

    const { data: exp } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
    setExpenses(exp || [])
    setLoading(false)
  }

  async function saveBudget() {
    const supabase = createClient()
    const amount = parseFloat(newBudget) || 0
    if (budgetId) {
      await supabase.from('budget').update({ total_amount: amount }).eq('id', budgetId)
    } else {
      const { data } = await supabase.from('budget').insert({ total_amount: amount, cycle_id: null }).select().single()
      if (data) setBudgetId(data.id)
    }
    setTotalBudget(amount)
    setEditingBudget(false)
    setNewBudget('')
  }

  async function addExpense() {
    if (!form.description || !form.amount) return
    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('expenses').insert({
      description: form.description,
      amount: parseFloat(form.amount),
      category: form.category,
      cycle_id: null,
      recorded_by: user?.id
    })
    setForm({ description: '', amount: '', category: '' })
    setShowForm(false)
    setSubmitting(false)
    load()
  }

  async function deleteExpense(id: string) {
    const supabase = createClient()
    await supabase.from('expenses').delete().eq('id', id)
    load()
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0)
  const remaining = totalBudget - totalExpenses
  const usedPct = totalBudget > 0 ? Math.min(Math.round((totalExpenses / totalBudget) * 100), 100) : 0
  const categories = ['الجائزة والدرع', 'المأدبة والحفل', 'الطباعة والتصميم', 'أخرى']

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="p-4 md:p-7 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الميزانية</h1>
          <p className="text-sm text-gray-500 mt-1">ملخص مالي للدورة الحالية</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
            + تسجيل مصروف
          </button>
        )}
      </div>

      {/* الميزانية الإجمالية */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1">الميزانية الإجمالية</div>
            {editingBudget && isAdmin ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-emerald-500 w-32"
                  placeholder="0"
                  autoFocus
                />
                <button onClick={saveBudget}
                  className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-600 transition">
                  حفظ
                </button>
                <button onClick={() => setEditingBudget(false)}
                  className="text-gray-400 text-sm px-2 py-1.5">
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {totalBudget > 0 ? totalBudget.toLocaleString('ar-SA') : '—'}
                </div>
                <span className="text-gray-400 text-sm">ريال</span>
                {isAdmin && (
                  <button onClick={() => { setEditingBudget(true); setNewBudget(totalBudget.toString()) }}
                    className="text-xs text-emerald-500 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-50 transition">
                    تعديل
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">المصروفات</div>
          <div className="text-xl font-bold text-gray-900">{totalExpenses.toLocaleString('ar-SA')}</div>
          <div className="text-xs text-gray-400 mt-1">ريال</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">المتبقي</div>
          <div className={`text-xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {remaining.toLocaleString('ar-SA')}
          </div>
          <div className="text-xs text-gray-400 mt-1">ريال</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 mb-1">نسبة الصرف</div>
          <div className="text-xl font-bold text-gray-900">{usedPct}%</div>
          <div className="text-xs text-gray-400 mt-1">من الميزانية</div>
        </div>
      </div>

      {totalBudget > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>المصروف: {totalExpenses.toLocaleString('ar-SA')} ريال</span>
            <span>المتبقي: {remaining.toLocaleString('ar-SA')} ريال</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${usedPct > 90 ? 'bg-red-400' : 'bg-emerald-400'}`}
              style={{ width: `${usedPct}%` }}></div>
          </div>
        </div>
      )}

      {showForm && isAdmin && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">البند</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="مثال: طباعة شهادات" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">المبلغ (ريال)</label>
              <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                placeholder="0" />
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">التصنيف</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">اختر التصنيف</option>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">إلغاء</button>
            <button onClick={addExpense} disabled={submitting}
              className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
              {submitting ? 'جارٍ الحفظ...' : 'تسجيل'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">تفاصيل المصروفات</h2>
        </div>
        {expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-3xl mb-2 opacity-30">📊</div>
            <p>لا توجد مصروفات مسجلة بعد</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">البند</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">التصنيف</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">المبلغ</th>
                {isAdmin && <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">إجراء</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                  <td className="px-4 py-3 text-gray-500">{e.category || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{parseFloat(e.amount).toLocaleString('ar-SA')} ريال</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <button onClick={() => deleteExpense(e.id)} className="text-xs text-red-400 hover:text-red-600">حذف</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
