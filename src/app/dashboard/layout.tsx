'use client'
import { useEffect, useState } from 'react'
import OnboardingTour from '@/components/OnboardingTour'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ADMIN_NAV = [
  { section: 'عام' },
  { id: 'dashboard', icon: '🏠', label: 'لوحة التحكم' },
  { id: 'profile', icon: '👤', label: 'ملفي الشخصي' },
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
  { id: 'report', icon: '📄', label: 'التقرير' },
  { id: 'members', icon: '👥', label: 'الأعضاء' },
]

const MEMBER_NAV = [
  { section: 'عام' },
  { id: 'dashboard', icon: '🏠', label: 'لوحة التحكم' },
  { id: 'profile', icon: '👤', label: 'ملفي الشخصي' },
  { section: 'مشاركتي' },
  { id: 'nominations', icon: '📝', label: 'ترشيح' },
  { id: 'voting', icon: '🗳', label: 'التصويت' },
  { id: 'awards', icon: '🏆', label: 'الجائزة' },
  { section: 'المالية' },
  { id: 'contribution', icon: '💰', label: 'القطة' },
  { id: 'budget', icon: '📊', label: 'الميزانية' },
]

const BOTTOM_NAV_ADMIN = [
  { id: 'dashboard', icon: '🏠', label: 'الرئيسية' },
  { id: 'nominations', icon: '📝', label: 'الترشيحات' },
  { id: 'voting', icon: '🗳', label: 'التصويت' },
  { id: 'awards', icon: '🏆', label: 'الجائزة' },
  { id: 'report', icon: '📄', label: 'التقرير' },
  { id: 'members', icon: '👥', label: 'الأعضاء' },
]

const BOTTOM_NAV_MEMBER = [
  { id: 'dashboard', icon: '🏠', label: 'الرئيسية' },
  { id: 'nominations', icon: '📝', label: 'ترشيح' },
  { id: 'voting', icon: '🗳', label: 'التصويت' },
  { id: 'awards', icon: '🏆', label: 'الجائزة' },
  { id: 'contribution', icon: '💰', label: 'القطة' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profile, setProfile] = useState<any>(null)
  const [cycleLabel, setCycleLabel] = useState('...')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showTour, setShowTour] = useState(false)

  async function loadSettings() {
    const supabase = createClient()
    const { data } = await supabase.from('settings').select('*')
    if (data) {
      const map: any = {}
      data.forEach((row: any) => { map[row.key] = row.value })
      setCycleLabel(`${map.cycle_name} — Q${map.cycle_quarter} ${map.cycle_year}`)
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      const tourDone = localStorage.getItem('athar_tour_' + data?.id)
      if (!tourDone) setShowTour(true)
    }
    load()
    loadSettings()
  }, [])

  useEffect(() => {
    loadSettings()
    setMenuOpen(false)
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const nav = profile?.role === 'admin' ? ADMIN_NAV : MEMBER_NAV
  const bottomNav = profile?.role === 'admin' ? BOTTOM_NAV_ADMIN : BOTTOM_NAV_MEMBER
  const initials = profile?.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('') || '؟'

  function goTo(id: string) {
    router.push(`/dashboard${id === 'dashboard' ? '' : '/' + id}`)
  }

  function isActive(id: string) {
    return pathname === `/dashboard${id === 'dashboard' ? '' : '/' + id}`
  }

  function completeTour() {
    setShowTour(false)
    if (profile?.id) localStorage.setItem('athar_tour_' + profile.id, 'done')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50" dir="rtl">
      {showTour && <OnboardingTour onComplete={completeTour} />}

      <div className="hidden md:flex w-56 flex-shrink-0 bg-white border-l border-gray-200 flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">أ+</div>
            <span className="text-lg font-bold text-gray-900">أثر<span className="text-emerald-500">+</span></span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full inline-block">{cycleLabel}</div>
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
              <div key={i} className="text-xs text-gray-400 px-2 pt-3 pb-1 font-semibold">{item.section}</div>
            ) : (
              <div key={item.id} onClick={() => goTo(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm mb-0.5 transition
                  ${isActive(item.id) ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
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

      <div className="flex-1 flex flex-col overflow-hidden">

        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">أ+</div>
            <div>
              <div className="text-sm font-bold text-gray-900">أثر<span className="text-emerald-500">+</span></div>
              <div className="text-xs text-gray-400">{cycleLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">{initials}</div>
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-white overflow-y-auto" style={{paddingTop:'60px'}}>
            <div className="px-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">{initials}</div>
                <div>
                  <div className="font-semibold text-gray-900">{profile?.name}</div>
                  <div className="text-xs text-gray-400">{profile?.role === 'admin' ? 'مدير النظام' : 'عضو المجلس'}</div>
                </div>
              </div>
              {nav.map((item: any, i) =>
                item.section ? (
                  <div key={i} className="text-xs text-gray-400 px-2 pt-4 pb-1 font-semibold">{item.section}</div>
                ) : (
                  <div key={item.id} onClick={() => goTo(item.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-base mb-1 transition
                      ${isActive(item.id) ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <span className="text-xl">{item.icon}</span>{item.label}
                  </div>
                )
              )}
              <div className="mt-4 pb-8">
                <button onClick={handleSignOut}
                  className="w-full text-sm text-red-500 border border-red-200 rounded-xl py-3 hover:bg-red-50 transition">
                  ⬅ تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex">
            {bottomNav.map((item: any) => (
              <button key={item.id} onClick={() => goTo(item.id)}
                className={`flex-1 flex flex-col items-center py-2 text-xs transition
                  ${isActive(item.id) ? 'text-emerald-600' : 'text-gray-400'}`}>
                <span className="text-xl mb-0.5">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
