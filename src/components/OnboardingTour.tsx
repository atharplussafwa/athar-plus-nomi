'use client'
import { useState } from 'react'

const STEPS = [
  {
    icon: '👋',
    title: 'أهلاً وسهلاً في منصة أثر+',
    desc: 'منصة مجلس الحاج عادل علي حبيب آل قريش لتكريم الشخصيات المنجزة من مدينة صفوى.',
    detail: 'هذه جولة سريعة ستعرّفك على أهم أقسام المنصة.',
    color: 'bg-emerald-500',
  },
  {
    icon: '🏠',
    title: 'لوحة التحكم',
    desc: 'أول صفحة تراها عند الدخول.',
    detail: 'تُظهر لك المرحلة الحالية للدورة (ترشيح، تصويت، جائزة...)، وعدد الترشيحات والأصوات، والإشعارات المهمة.',
    color: 'bg-blue-500',
  },
  {
    icon: '📝',
    title: 'الترشيحات',
    desc: 'رشّح من تراه مستحقاً للتكريم.',
    detail: 'يجب أن يكون المرشح من مدينة صفوى، من فئة الشباب، وله إنجاز على المستوى الوطني أو الدولي.',
    color: 'bg-purple-500',
  },
  {
    icon: '🗳',
    title: 'التصويت السري',
    desc: 'اختر المرشح الأجدر للتكريم.',
    detail: 'تصويتك مشفر وسري تماماً — لا يستطيع أي عضو أو مدير معرفة اختيارك.',
    color: 'bg-amber-500',
  },
  {
    icon: '🏆',
    title: 'الجائزة',
    desc: 'صوّت على نوع الجائزة المناسبة.',
    detail: 'بعد إعلان المكرَّم، يصوّت الأعضاء على نوع الجائزة الأنسب من الخيارات المتاحة.',
    color: 'bg-yellow-500',
  },
  {
    icon: '💰',
    title: 'القطة',
    desc: 'ساهم في تكريم المنجز.',
    detail: 'اختياري وسري تماماً. فقط أبدِ رغبتك — بعد الحفل تُقسَّم التكلفة بالتساوي على المتطوعين.',
    color: 'bg-green-500',
  },
  {
    icon: '👤',
    title: 'ملفك الشخصي',
    desc: 'عدّل معلوماتك الشخصية.',
    detail: 'يمكنك تغيير اسمك وكلمة مرورك في أي وقت من صفحة الملف الشخصي في القائمة الجانبية.',
    color: 'bg-gray-600',
  },
  {
    icon: '✅',
    title: 'أنت جاهز!',
    desc: 'يمكنك الآن استخدام المنصة بكل ثقة.',
    detail: 'إذا احتجت مساعدة تواصل مع مدير المنصة: أحمد قريش (أبو رنا).',
    color: 'bg-emerald-500',
  },
]

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else onComplete()
  }

  function prev() {
    if (step > 0) setStep(step - 1)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black bg-opacity-60" onClick={onComplete} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`${current.color} p-8 text-center text-white`}>
          <div className="text-5xl mb-3">{current.icon}</div>
          <h2 className="text-xl font-bold">{current.title}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-base font-semibold text-gray-900 mb-2 text-center">{current.desc}</p>
          <p className="text-sm text-gray-500 text-center leading-relaxed">{current.detail}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 justify-center pb-2">
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)}
              className={`h-1.5 rounded-full cursor-pointer transition-all ${
                i === step ? 'w-6 bg-emerald-500' : i < step ? 'w-1.5 bg-emerald-200' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-4 pt-2 border-t border-gray-100">
          <button onClick={onComplete} className="text-xs text-gray-400 hover:text-gray-600 transition">
            تخطي الجولة
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={prev}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                ← السابق
              </button>
            )}
            <button onClick={next}
              className="bg-emerald-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition">
              {step === STEPS.length - 1 ? 'ابدأ الاستخدام ✓' : 'التالي →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
