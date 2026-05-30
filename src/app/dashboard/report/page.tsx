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

  async function generatePDF() {
    setGenerating(true)
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    const W = 210
    const margin = 20
    let y = 0

    // Header background
    doc.setFillColor(8, 80, 65)
    doc.rect(0, 0, W, 50, 'F')

    // Logo circle
    doc.setFillColor(29, 158, 117)
    doc.circle(W / 2, 20, 10, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('+', W / 2, 24, { align: 'center' })

    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Athar+ Initiative', W / 2, 37, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Al-Hajj Adel Ali Habib Al-Quraish Council', W / 2, 44, { align: 'center' })

    y = 60

    // Report title box
    doc.setFillColor(225, 245, 238)
    doc.roundedRect(margin, y, W - margin * 2, 20, 3, 3, 'F')
    doc.setTextColor(15, 110, 86)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Cycle Report', W / 2, y + 9, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(cycleName, W / 2, y + 16, { align: 'center' })

    y += 28

    // Date
    doc.setTextColor(90, 89, 84)
    doc.setFontSize(9)
    doc.text(`Report Date: ${new Date().toLocaleDateString('en-GB')}`, margin, y)
    doc.text(`Issued by: Athar+ Executive Board`, W - margin, y, { align: 'right' })
    y += 10

    // Divider
    doc.setDrawColor(209, 209, 199)
    doc.line(margin, y, W - margin, y)
    y += 8

    // Section: Summary
    doc.setFillColor(29, 158, 117)
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('1. Cycle Summary', margin + 5, y + 5.5)
    y += 12

    const shortlisted = nominations.filter(n => n.status === 'shortlisted').length
    const stats = [
      ['Total Nominations', nominations.length.toString()],
      ['Shortlisted Candidates', shortlisted.toString()],
      ['Total Votes Cast', votes.length.toString()],
      ['Members Willing to Contribute', willingCount.toString()],
    ]

    doc.setTextColor(26, 26, 24)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    stats.forEach(([label, value], i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = col === 0 ? margin : W / 2 + 5
      const ry = y + row * 12
      doc.setFillColor(col === 0 ? 244 : 244, col === 0 ? 242 : 242, col === 0 ? 238 : 238)
      doc.roundedRect(x, ry, 80, 10, 1.5, 1.5, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(29, 158, 117)
      doc.text(value, x + 5, ry + 6.5)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(90, 89, 84)
      doc.text(label, x + 20, ry + 6.5)
    })
    y += Math.ceil(stats.length / 2) * 12 + 8

    // Section: Winner
    doc.setFillColor(29, 158, 117)
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('2. Honoree', margin + 5, y + 5.5)
    y += 12

    if (winner) {
      doc.setFillColor(225, 245, 238)
      doc.roundedRect(margin, y, W - margin * 2, 22, 2, 2, 'F')
      doc.setTextColor(8, 80, 65)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(winner.nominee_name || '', W / 2, y + 9, { align: 'center' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 110, 86)
      doc.text(`Field: ${winner.achievement_field || ''}`, W / 2, y + 15, { align: 'center' })
      doc.text(`Votes Received: ${winner.voteCount}`, W / 2, y + 20, { align: 'center' })
      y += 26
    } else {
      doc.setTextColor(90, 89, 84)
      doc.setFontSize(10)
      doc.text('Not determined yet', margin, y + 5)
      y += 12
    }

    // Section: Nominations
    y += 4
    doc.setFillColor(29, 158, 117)
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('3. Nominations Details', margin + 5, y + 5.5)
    y += 12

    nominations.forEach((n, i) => {
      if (y > 240) {
        doc.addPage()
        y = 20
      }
      const statusLabel: any = { pending: 'Pending', approved: 'Approved', shortlisted: 'Shortlisted', rejected: 'Rejected' }
      const statusColor: any = { pending: [186, 117, 23], approved: [29, 158, 117], shortlisted: [24, 95, 165], rejected: [162, 45, 45] }
      const sc = statusColor[n.status] || [90, 89, 84]

      doc.setFillColor(i % 2 === 0 ? 244 : 255, i % 2 === 0 ? 242 : 255, i % 2 === 0 ? 238 : 255)
      doc.rect(margin, y, W - margin * 2, 14, 'F')
      doc.setTextColor(26, 26, 24)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`${i + 1}. ${n.nominee_name || ''}`, margin + 3, y + 5.5)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(90, 89, 84)
      doc.text(`Field: ${n.achievement_field || ''}  |  Nominated by: ${n.profiles?.name || ''}`, margin + 3, y + 11)
      doc.setTextColor(sc[0], sc[1], sc[2])
      doc.setFont('helvetica', 'bold')
      doc.text(statusLabel[n.status] || '', W - margin - 3, y + 5.5, { align: 'right' })
      y += 15
    })

    y += 4

    // Section: Award
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFillColor(29, 158, 117)
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('4. Selected Award', margin + 5, y + 5.5)
    y += 12

    doc.setTextColor(26, 26, 24)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    if (topAward) {
      doc.setFillColor(225, 245, 238)
      doc.roundedRect(margin, y, W - margin * 2, 14, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(8, 80, 65)
      doc.text(topAward.title || '', margin + 5, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(90, 89, 84)
      doc.text(`Estimated Value: ${topAward.estimated_value || 0} SAR`, margin + 5, y + 11)
      y += 18
    } else {
      doc.text('Not determined yet', margin, y + 5)
      y += 12
    }

    // Section: Budget
    y += 4
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFillColor(29, 158, 117)
    doc.roundedRect(margin, y, W - margin * 2, 8, 2, 2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('5. Financial Summary', margin + 5, y + 5.5)
    y += 12

    const budgetTotal = budget?.total_amount || 0
    const remaining = budgetTotal - totalExpenses
    const perPerson = willingCount > 0 ? Math.round(totalExpenses / willingCount) : 0

    const finRows = [
      ['Total Budget', `${budgetTotal.toLocaleString()} SAR`],
      ['Total Expenses', `${totalExpenses.toLocaleString()} SAR`],
      ['Remaining', `${remaining.toLocaleString()} SAR`],
      ['Contributing Members', willingCount.toString()],
      ['Share per Contributor', perPerson > 0 ? `${perPerson.toLocaleString()} SAR` : 'TBD'],
    ]

    finRows.forEach(([label, value], i) => {
      doc.setFillColor(i % 2 === 0 ? 244 : 255, i % 2 === 0 ? 242 : 255, i % 2 === 0 ? 238 : 255)
      doc.rect(margin, y, W - margin * 2, 10, 'F')
      doc.setTextColor(90, 89, 84)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(label, margin + 5, y + 6.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(i === 2 && remaining < 0 ? 162 : 29, i === 2 && remaining < 0 ? 45 : 158, i === 2 && remaining < 0 ? 45 : 117)
      doc.text(value, W - margin - 5, y + 6.5, { align: 'right' })
      y += 11
    })

    y += 8

    // Expenses detail
    if (expenses.length > 0) {
      if (y > 230) { doc.addPage(); y = 20 }
      doc.setTextColor(90, 89, 84)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Expense Breakdown:', margin, y)
      y += 6
      expenses.forEach((e, i) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.setFillColor(i % 2 === 0 ? 244 : 255, i % 2 === 0 ? 242 : 255, i % 2 === 0 ? 238 : 255)
        doc.rect(margin, y, W - margin * 2, 9, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(26, 26, 24)
        doc.text(`${e.description || ''} ${e.category ? '(' + e.category + ')' : ''}`, margin + 3, y + 6)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(29, 158, 117)
        doc.text(`${parseFloat(e.amount || 0).toLocaleString()} SAR`, W - margin - 3, y + 6, { align: 'right' })
        y += 10
      })
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFillColor(8, 80, 65)
      doc.rect(0, 282, W, 15, 'F')
      doc.setTextColor(157, 225, 203)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Athar+ Initiative — Al-Hajj Adel Ali Habib Al-Quraish Council — Safwa City', W / 2, 290, { align: 'center' })
      doc.text(`Page ${i} of ${pageCount}`, W - margin, 290, { align: 'right' })
    }

    doc.save(`Athar-Plus-Report-${settings.cycle_quarter || '1'}-${settings.cycle_year || '2026'}.pdf`)
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
          {[
            '1. ملخص الدورة — الإحصائيات العامة',
            '2. المكرَّم الفائز ومجال إنجازه',
            '3. تفاصيل جميع الترشيحات',
            '4. الجائزة المختارة',
            '5. الملخص المالي — الميزانية والمصروفات والقطة',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-emerald-500">✓</span>{item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'الترشيحات', value: nominations.length },
          { label: 'الأصوات', value: votes.length },
          { label: 'المصروفات', value: `${totalExpenses.toLocaleString()} ريال` },
          { label: 'المتطوعون', value: willingCount },
        ].map((m, i) => (
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

      <button
        onClick={generatePDF}
        disabled={generating}
        className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
        {generating ? 'جارٍ إنشاء التقرير...' : '📄 استخراج التقرير PDF'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        التقرير صادر من مجلس إدارة مبادرة أثر+ إلى أعضاء مجلس الحاج عادل علي حبيب آل قريش
      </p>
    </div>
  )
}
