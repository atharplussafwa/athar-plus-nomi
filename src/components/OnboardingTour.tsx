'use client'
import { useState, useEffect } from 'react'

const STEPS = [
  {
    title: 'مرحباً بك في منصة أثر+ 🎉',
    desc: 'هذه جولة سريعة ستعرّفك على أهم أقسام المنصة. لن تستغرق أكثر من دقيقة.',
    target: null,
    position: 'center',
  },
  {
    title: 'القائمة الجانبية',
    desc: 'من هنا تنتقل بين جميع أقسام المنصة — الترشيحات، التصويت، القطة، والميزانية.',
    target: 'sidebar-nav',
    position: 'right',
  },
  {
    title: 'لوحة التحكم 🏠',
    desc: 'تُظهر لك المرحلة الحالية للدورة والإشعارات المهمة. ابدأ دائماً من هنا.',
    target: 'nav-dashboard',
    position: 'right',
  },
  {
    title: 'تقديم الترشيح 📝',
    desc: 'من هنا تُرشّح شخصاً تراه مستحقاً للتكريم وفق معايير المبادرة.',
    target: 'nav-nominations',
    position: 'right',
  },
  {
    title: 'التصويت السري 🗳',
    desc: 'حين يفتح باب التصويت، اختر المرشح الأجدر. تصويتك سري تماماً ولا يطّلع عليه أحد.',
    target: 'nav-voting',
    position: 'right',
  },
  {
    title: 'ملفك الشخصي 👤',
    desc: 'يمكنك تغيير اسمك وكلمة مرورك في أي وقت من هنا.',
    target: 'nav-profile',
    position: 'right',
  },
  {
    title: 'أنت جاهز! ✅',
    desc: 'استمتع بتجربة المنصة. إذا احتجت مساعدة تواصل مع مدير المنصة: أحمد قريش (أبو رنا).',
    target: null,
    position: 'center',
  },
]

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const current = STEPS[step]

  useEffect(() => {
    if (current.target) {
      const el = document.getElementById(current.target)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setTimeout(() => {
          const rect = el.getBoundingClientRect()
          setTargetRect(rect)
        }, 300)
      }
    } else {
      setTargetRect(null)
    }
  }, [step])

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else onComplete()
  }

  function skip() { onComplete() }

  const isCenter = current.position === 'center' || !targetRect

  return (
    <div className="fixed inset-0 z-[100]" dir="rtl">
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      {targetRect && (
        <div
          className="absolute rounded-lg ring-4 ring-emerald-400 ring-offset-2 transition-all duration-300"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            background: 'rgba(255,255,255,0.1)',
            zIndex: 101,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        className="absolute z-[102] bg-white rounded-2xl shadow-2xl p-6 w-80 transition-all duration-300"
        style={
          isCenter
            ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
            : targetRect
            ? {
                top: Math.min(targetRect.bottom + 12, window.innerHeight - 220),
                left: Math.min(targetRect.right + 12, window.innerWidth - 340),
              }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        }
      >
        <div className="flex gap-1.5 mb-4 justify-center">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-emerald-500' : i < step ? 'w-1.5 bg-emerald-200' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-2 text-center">{current.title}</h3>
        <p className="text-sm text-gray-600 text-center leading-relaxed mb-5">{current.desc}</p>

        <div className="flex items-center justify-between gap-3">
          <button onClick={skip} className="text-xs text-gray-400 hover:text-gray-600 transition">
            تخطي الجولة
          </button>
          <button onClick={next}
            className="bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition flex items-center gap-1">
            {step === STEPS.length - 1 ? 'ابدأ الاستخدام' : 'التالي →'}
          </button>
        </div>

        <div className="text-xs text-gray-300 text-center mt-3">
          {step + 1} من {STEPS.length}
        </div>
      </div>
    </div>
  )
}
