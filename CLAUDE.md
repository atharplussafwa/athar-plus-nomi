# أثر+ — مشروع المجلس الشبابي

## معلومات المشروع
- المبادرة: أثر+ — مجلس الحاج عادل علي حبيب آل قريش — مدينة صفوى
- رئيس المجلس: الحاج عادل علي حبيب آل قريش
- مدير المنصة: أحمد قريش (أبو رنا)
- الهدف: تكريم الشخصيات الشبابية المنجزة من مدينة صفوى

## الروابط
- الموقع: https://athar-plus-nomi-eeyv.vercel.app
- GitHub: https://github.com/atharplussafwa/athar-plus-nomi
- Supabase URL: https://phdbfmicmijidtsbquvm.supabase.co

## المسار المحلي
/Users/ahmadminimac/athar-plus

## أمر الرفع
git push https://atharplussafwa:TOKEN@github.com/atharplussafwa/athar-plus-nomi.git main

## المكدس التقني
- Next.js 16 + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Vercel (استضافة)
- proxy.ts بدلاً من middleware.ts (Next.js 16)

## الصفحات
- /dashboard — لوحة التحكم
- /dashboard/nominations — الترشيحات
- /dashboard/shortlist — القائمة المختصرة
- /dashboard/voting — التصويت السري
- /dashboard/awards — الجائزة
- /dashboard/contribution — القطة
- /dashboard/budget — الميزانية
- /dashboard/members — إدارة الأعضاء (admin فقط)
- /dashboard/settings — الإعدادات (admin فقط)
- /dashboard/report — التقرير PDF (admin فقط)
- /dashboard/profile — الملف الشخصي

## API Routes
- /api/create-user — إنشاء عضو جديد (service_role)
- /api/contribution — إدارة القطة (service_role)

## جداول Supabase
profiles, nominations, honoree_votes, award_options, award_votes,
contribution_intents, expenses, budget, settings

## ملاحظات تقنية
- التصويت السري: hash = btoa(userId + 'athar-plus-secret')
- القطة: API route بـ service_role لتجاوز RLS
- الجولة التعريفية: localStorage مفتاح athar_tour_{userId}
- التقرير: HTML window.print() بدعم عربي كامل
- الميزانية في القطة: تُجلب تلقائياً من جدول expenses
- مرحلة الدورة تتحكم في فتح/إغلاق الترشيح تلقائياً

## مراحل الدورة (settings.cycle_status)
draft | nominations | shortlisting | voting | awards | completed

## معايير الترشيح
1. من مدينة صفوى
2. من فئة الشباب
3. إنجاز وطني أو دولي
4. القدوة والإلهام للشباب
