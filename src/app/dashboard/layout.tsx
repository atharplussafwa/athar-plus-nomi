'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ADMIN_NAV = [
  { section: 'عام' },
  { id: 'dashboard', icon: '🏠', label: 'لوحة التحكم' },
  { section: 'مراحل المبادرة' },
  { id: 'nominations', icon: '📝', label: 'الترشيحات' },
  { id: 'shortlist', icon: '📋', label: 'القائمة المختصرة' },
  { id: 'voting', icon: '🗳', label: 'التصويت' },
  { id: 'awards', icon: '🏆', label: 'الجائزة' },
  { section: 'المالية' },
  { id: 'contribution', icon: '💰', label: 'القطة' },
  { id: 'budget', icon: '📊', label: 'الميزانية' },
  { section: 'الإدارة' },
  { id: 'settings', icon: '⚙️', label: 'الإعدادات' },
  { id: 'members', icon: '👥', label: 'الأعضاء' },
]

const MEMBER_NAV = [
  { section: 'عام' },
  { id: 'dashboard', icon: '🏠', label: 'لوحة التحكم' },
  { section: 'مشاركتي' },
  { id: 'nominations', icon: '📝', label: 'تقديم ترشيح' },
  { id: 'voting', icon: '🗳', label: 'التصويت' },
  { id: 'awards', icon: '🏆', label: 'اختيار الجائزة' },
  { section: 'المالية' },
  { id: 'contribution', icon: '💰', label: 'مساهمتي' },
  { id: 'budget', icon: '📊', label: 'الميزانية' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
    load()
  }, [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const [cycleLabel, setCycleLabel] = useState('جارٍ التحميل...')

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data } = await supabase.from('settings').select('*')
      if (data) {
        const map: any = {}
        data.forEach((row: any) => { map[row.key] = row.value })
        setCycleLabel(`${map.cycle_name} — Q${map.cycle_quarter} ${map.cycle_year}`)
      }
    }
    loadSettings()
  }, [])

  const nav = profile?.role === 'admin' ? ADMIN_NAV : MEMBER_NAV
  const initials = profile?.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('') || '؟'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">أ+</div>
            <span className="text-lg font-bold text-gray-900">أثر<span className="text-emerald-500">+</span></span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full inline-block">جارٍ التحميل...</div>
        </div>

        <div className="p-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">{initials}</div>
            <div>
              <div className="text-sm font-semibold text-gray-900">{profile?.name}</div>
              <div className="text-xs text-gray-400">{profile?.role === 'admin' ? 'مدير النظام' : 'عضو المجلس'}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 overflow-y-auto">
          {nav.map((item: any, i) =>
            item.section ? (
              <div key={i} className="text-xs text-gray-400 px-2 pt-3 pb-1 font-semibold uppercase tracking-wide">{item.section}</div>
            ) : (
              <div
                key={item.id}
                onClick={() => router.push(`/dashboard/${item.id === 'dashboard' ? '' : item.id}`)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm mb-0.5 transition
                  ${pathname === `/dashboard${item.id === 'dashboard' ? '' : '/' + item.id}`
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <span>{item.icon}</span>{item.label}
              </div>
            )
          )}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <button onClick={handleSignOut} className="w-full text-sm text-gray-500 border border-gray-200 rounded-lg py-2 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition">
            ⬅ تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
