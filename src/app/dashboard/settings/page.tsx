'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p?.role !== 'admin') { router.push('/dashboard'); return }
    setProfile(p)
    const { data: s } = await supabase.from('settings').select('*')
    const map: any = {}
    s?.forEach((row: any) => { map[row.key] = row.value })
    setSettings(map)
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    for (const key of Object.keys(settings)) {
      await supabase.from('settings').upsert({ key, value: settings[key], updated_at: new Date().toISOString() }, { onConflict: 'key' })
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function getCyclePreview() {
    return `${settings.cycle_name} — Q${settings.cycle_quarter} ${settings.cycle_year}`
  }

  const statusOptions = [
    { value: 'draft', label: 'مسودة' },
    { value: 'nominations', label: 'الترشيح مفتوح' },
    { value: 'shortlisting', label: 'إعداد القائمة المختصرة' },
    { value: 'voting', label: 'التصويت مفتوح' },
    { value: 'awards', label: 'اختيار الجائزة' },
    { value: 'completed', label: 'مكتملة' },
  ]

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-7 max-w-2xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">إعدادات الدورة</h1>
        <p className="text-sm text-gray-500 mt-1">تحكم في معلومات الدورة الحالية</p>
      </div>

      {/* معاينة */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 text-center">
        <div className="text-xs text-emerald-600 mb-1">معاينة اسم الدورة</div>
        <div className="text-lg font-bold text-emerald-700">{getCyclePreview()}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">اسم الدورة</label>
          <input
            value={settings.cycle_name || ''}
            onChange={e => setSettings({ ...settings, cycle_name: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
            placeholder="مثال: الدورة الأولى"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">الربع</label>
            <select
              value={settings.cycle_quarter || '1'}
              onChange={e => setSettings({ ...settings, cycle_quarter: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
              <option value="1">الربع الأول — Q1</option>
              <option value="2">الربع الثاني — Q2</option>
              <option value="3">الربع الثالث — Q3</option>
              <option value="4">الربع الرابع — Q4</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">السنة</label>
            <input
              type="number"
              value={settings.cycle_year || '2026'}
              onChange={e => setSettings({ ...settings, cycle_year: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
              placeholder="2026"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">مرحلة الدورة الحالية</label>
          <select
            value={settings.cycle_status || 'nominations'}
            onChange={e => setSettings({ ...settings, cycle_status: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="flex justify-end items-center gap-3 pt-2">
          {saved && <span className="text-sm text-emerald-500">✓ تم الحفظ</span>}
          <button
            onClick={save}
            disabled={saving}
            className="bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition disabled:opacity-50">
            {saving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  )
}
