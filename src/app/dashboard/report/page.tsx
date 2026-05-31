'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ReportPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [nominations, setNominations] = useState<any[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [awardVotes, setAwardVotes] = useState<any[]>([])
  const [awards, setAwards] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [budget, setBudget] = useState<any>(null)
  const [willingCount, setWillingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (p?.role !== 'admin') { router.push('/dashboard'); return }
    setProfile(p)
    const { data: s } = await supabase.from('settings').select('*')
    if (s) { const map: any = {}; s.forEach((r: any) => { map[r.key] = r.value }); setSettings(map) }
    const { data: noms } = await supabase.from('nominations').select('*, profiles(name)').order('created_at', { ascending: false })
    setNominations(noms || [])
    const { data: v } = await supabase.from('honoree_votes').select('nomination_id')
    setVotes(v || [])
    const { data: av } = await supabase.from('award_votes').select('award_option_id')
    setAwardVotes(av || [])
    const { data: a } = await supabase.from('award_options').select('*')
    setAwards(a || [])
    const { data: exp } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
    setExpenses(exp || [])
    const { data: b } = await supabase.from('budget').select('*').maybeSingle()
    setBudget(b)
    const { count } = await supabase.from('contribution_intents').select('*', { count: 'exact', head: true }).eq('is_willing', true)
    setWillingCount(count || 0)
    setLoading(false)
  }

  function getWinner() {
    if (votes.length === 0) return null
    const counts: any = {}
    votes.forEach((v: any) => { counts[v.nomination_id] = (counts[v.nomination_id] || 0) + 1 })
    const topId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
    const nom = nominations.find(n => n.id === topId)
    return nom ? { ...nom, voteCount: counts[topId] } : null
  }

  function getTopAward() {
    if (awardVotes.length === 0) return null
    const counts: any = {}
    awardVotes.forEach((v: any) => { counts[v.award_option_id] = (counts[v.award_option_id] || 0) + 1 })
    const topId = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
    return awards.find(a => a.id === topId)
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
  const winner = getWinner()
  const topAward = getTopAward()
  const cycleName = `${settings.cycle_name || 'الدورة'} — Q${settings.cycle_quarter || '1'} ${settings.cycle_year || '2026'}`

  function generatePDF() {
    setGenerating(true)
    const printWindow = window.open('', '_blank')
    if (!printWindow) { setGenerating(false); return }

    const budgetTotal = budget?.total_amount || 0
    const remaining = budgetTotal - totalExpenses
    const perPerson = willingCount > 0 ? Math.round(totalExpenses / willingCount) : 0

    const statusMap: any = { pending: 'قيد المراجعة', approved: 'معتمد', shortlisted: 'مختصرة', rejected: 'مرفوض' }
    const colorMap: any = { pending: '#BA7517', approved: '#1D9E75', shortlisted: '#185FA5', rejected: '#A32D2D' }

    const nomsRows = nominations.map((n, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${n.nominee_name || ''}</strong></td>
        <td>${n.achievement_field || ''}</td>
        <td>${n.profiles?.name || '—'}</td>
        <td><span style="color:${colorMap[n.status]};font-weight:600">${statusMap[n.status] || ''}</span></td>
      </tr>`).join('')

    const expRows = expenses.map(e => `
      <tr>
        <td>${e.description || ''}</td>
        <td>${e.category || '—'}</td>
        <td style="font-weight:600;color:#1D9E75">${parseFloat(e.amount || 0).toLocaleString('ar-SA')} ريال</td>
      </tr>`).join('')

    const winnerHTML = winner
      ? `<div class="winner-box">
          <div class="trophy">🏆</div>
          <div class="winner-name">${winner.nominee_name}</div>
          <div class="winner-field">${winner.achievement_field}</div>
          <div class="winner-votes">${winner.voteCount} أصوات</div>
        </div>`
      : '<p class="no-data">لم يُحدد بعد</p>'

    const awardHTML = topAward
      ? `<div class="award-box">
          <div><strong>${topAward.title}</strong><br>
          <span>${topAward.description || ''}</span><br>
          <span>القيمة التقريبية: ${topAward.estimated_value || 0} ريال</span></div>
        </div>`
      : '<p class="no-data">لم تُحدد بعد</p>'

    printWindow.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<title>تقرير ${cycleName}</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Cairo',sans-serif;color:#1A1A18;background:white;font-size:13px}
.header{background:#085041;color:white;padding:28px 40px;text-align:center}
.logo{width:56px;height:56px;background:#1D9E75;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;margin-bottom:10px}
.header h1{font-size:22px;font-weight:700;margin-bottom:4px}
.header h2{font-size:13px;opacity:.8;font-weight:400}
.meta{background:#E1F5EE;padding:10px 40px;display:flex;justify-content:space-between;font-size:11px;color:#0F6E56;border-bottom:2px solid #1D9E75}
.content{padding:22px 40px}
.section{margin-bottom:24px}
.sec-title{background:#1D9E75;color:white;padding:7px 13px;border-radius:5px;font-size:13px;font-weight:700;margin-bottom:12px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.stat{background:#F4F2EE;border-radius:7px;padding:12px;text-align:center}
.stat-v{font-size:20px;font-weight:700;color:#1D9E75}
.stat-l{font-size:11px;color:#5A5954;margin-top:2px}
.winner-box{background:#085041;color:white;border-radius:9px;padding:18px;text-align:center}
.trophy{font-size:28px;margin-bottom:6px}
.winner-name{font-size:18px;font-weight:700}
.winner-field{font-size:12px;opacity:.8;margin-top:3px}
.winner-votes{font-size:11px;opacity:.7;margin-top:3px}
.award-box{background:#E1F5EE;border-radius:7px;padding:12px}
.award-box strong{color:#085041;font-size:14px}
.award-box span{color:#5A5954;font-size:12px;display:block;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:12px}
th{background:#F4F2EE;padding:8px 10px;text-align:right;font-weight:600;color:#5A5954;border-bottom:1px solid #D3D1C7}
td{padding:8px 10px;border-bottom:1px solid #EEEDE8}
.total-row td{background:#E1F5EE;font-weight:700}
.no-data{color:#8A8880;font-style:italic;padding:6px 0}
.footer{background:#085041;color:#9FE1CB;padding:12px 40px;text-align:center;font-size:11px;margin-top:16px}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}
</style>
</head>
<body>
<div class="header">
  <div class="logo">أ+</div>
  <h1>تقرير مبادرة أثر+</h1>
  <h2>مجلس الحاج عادل علي حبيب آل قريش</h2>
</div>
<div class="meta">
  <span>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</span>
  <span>${cycleName}</span>
  <span>صادر عن: مجلس إدارة مبادرة أثر+</span>
</div>
<div class="content">
  <div class="section">
    <div class="sec-title">١. ملخص الدورة</div>
    <div class="stats">
      <div class="stat"><div class="stat-v">${nominations.length}</div><div class="stat-l">الترشيحات</div></div>
      <div class="stat"><div class="stat-v">${nominations.filter(n=>n.status==='shortlisted').length}</div><div class="stat-l">المختصرون</div></div>
      <div class="stat"><div class="stat-v">${votes.length}</div><div class="stat-l">الأصوات</div></div>
      <div class="stat"><div class="stat-v">${willingCount}</div><div class="stat-l">المتطوعون للقطة</div></div>
    </div>
  </div>
  <div class="section">
    <div class="sec-title">٢. المكرَّم الفائز</div>
    ${winnerHTML}
  </div>
  <div class="section">
    <div class="sec-title">٣. تفاصيل الترشيحات</div>
    <table>
      <thead><tr><th>#</th><th>الاسم</th><th>المجال</th><th>المرشِّح</th><th>الحالة</th></tr></thead>
      <tbody>${nomsRows || '<tr><td colspan="5" style="text-align:center;color:#8A8880;padding:16px">لا توجد ترشيحات</td></tr>'}</tbody>
    </table>
  </div>
  <div class="section">
    <div class="sec-title">٤. الجائزة المختارة</div>
    ${awardHTML}
  </div>
  <div class="section">
    <div class="sec-title">٥. الملخص المالي</div>
    <table>
      <thead><tr><th>البند</th><th>التصنيف</th><th>المبلغ</th></tr></thead>
      <tbody>
        <tr><td colspan="2"><strong>الميزانية الإجمالية</strong></td><td style="font-weight:700;color:#1D9E75">${budgetTotal.toLocaleString('ar-SA')} ريال</td></tr>
        ${expRows}
        <tr class="total-row"><td colspan="2"><strong>إجمالي المصروفات</strong></td><td>${totalExpenses.toLocaleString('ar-SA')} ريال</td></tr>
        <tr><td colspan="2">المتبقي</td><td style="font-weight:700;color:${remaining < 0 ? '#A32D2D' : '#1D9E75'}">${remaining.toLocaleString('ar-SA')} ريال</td></tr>
        <tr><td colspan="2">عدد المتطوعين للقطة</td><td>${willingCount} عضو</td></tr>
        <tr><td colspan="2">نصيب كل مساهم</td><td style="font-weight:700;color:#1D9E75">${perPerson > 0 ? perPerson.toLocaleString('ar-SA') + ' ريال' : 'لم يُحدد بعد'}</td></tr>
      </tbody>
    </table>
  </div>
</div>
<div class="footer">مبادرة أثر+ — مجلس الحاج عادل علي حبيب آل قريش — مدينة صفوى</div>
<script>window.onload=function(){setTimeout(function(){window.print()},800)}</script>
</body></html>`)
    printWindow.document.close()
    setGenerating(false)
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">جارٍ التحميل...</p></div>

  return (
    <div className="p-4 md:p-7 max-w-3xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">تقرير الدورة</h1>
        <p className="text-sm text-gray-500 mt-1">{cycleName}</p>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">محتويات التقرير</h2>
        <div className="space-y-2 text-sm text-gray-600">
          {['١. ملخص الدورة — الإحصائيات العامة','٢. المكرَّم الفائز ومجال إنجازه','٣. تفاصيل جميع الترشيحات','٤. الجائزة المختارة','٥. الملخص المالي — الميزانية والمصروفات والقطة'].map((item,i) => (
            <div key={i} className="flex items-center gap-2"><span className="text-emerald-500">✓</span>{item}</div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'الترشيحات', value: nominations.length },
          { label: 'الأصوات', value: votes.length },
          { label: 'المصروفات', value: `${totalExpenses.toLocaleString('ar-SA')} ريال` },
          { label: 'المتطوعون', value: willingCount },
        ].map((m,i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>
      {winner && (
        <div className="bg-emerald-500 rounded-xl p-4 text-white text-center mb-5">
          <div className="text-2xl mb-1">🏆</div>
          <div className="font-bold text-lg">{winner.nominee_name}</div>
          <div className="text-sm opacity-85">{winner.achievement_field}</div>
        </div>
      )}
      <button onClick={generatePDF} disabled={generating}
        className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
        {generating ? 'جارٍ إنشاء التقرير...' : '📄 استخراج التقرير PDF'}
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">التقرير صادر من مجلس إدارة مبادرة أثر+ إلى أعضاء مجلس الحاج عادل علي حبيب آل قريش</p>
    </div>
  )
}
