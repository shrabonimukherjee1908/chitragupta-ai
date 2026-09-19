import { useState } from 'react'
import { FileBarChart2, Download } from 'lucide-react'

// ---------------------------------------------------------------------------
// Existing MOCK_REPORTS — preserved verbatim
// ---------------------------------------------------------------------------
const MOCK_REPORTS = [
  { id: 'RPT-2025-Q1', title: 'Q1 2025 — MPLADS Utilization Summary',        type: 'QUARTERLY', date: '2025-04-01', status: 'READY'      },
  { id: 'RPT-2025-M2', title: 'February 2025 — Anomaly Detection Report',     type: 'MONTHLY',   date: '2025-03-05', status: 'READY'      },
  { id: 'RPT-2025-M1', title: 'January 2025 — Compliance Audit Report',       type: 'MONTHLY',   date: '2025-02-03', status: 'READY'      },
  { id: 'RPT-2024-Q4', title: 'Q4 2024 — Year-End Fund Absorption',           type: 'QUARTERLY', date: '2025-01-15', status: 'READY'      },
  { id: 'RPT-2025-AD', title: 'Ad-hoc — Varanasi District Deep Dive',         type: 'AD-HOC',    date: '2025-03-20', status: 'GENERATING' },
]

// Existing TYPE_STYLES — preserved verbatim
const TYPE_STYLES: Record<string, string> = {
  QUARTERLY: 'bg-[#1E3878] text-[#F5F2E8]',
  MONTHLY:   'bg-[#1A1A18] text-[#F5F2E8]',
  'AD-HOC':  'bg-[#E8C018] text-[#1A1A18]',
}

// ---------------------------------------------------------------------------
// F10 — Per-row CSV export: serialise a single report as CSV and download it
// The "data" of each report is a mini demo dataset representing what the
// report covers. This is safe frontend-only demo behaviour (no API call).
// ---------------------------------------------------------------------------
const REPORT_DEMO_ROWS: Record<string, string[][]> = {
  'RPT-2025-Q1': [
    ['District', 'Works', 'Sanctioned (L)', 'Expenditure (L)', 'Utilization %'],
    ['Varanasi',  '34', '1840', '1520', '82.6'],
    ['Mirzapur',  '21', '960',  '810',  '84.4'],
    ['Chandauli', '18', '740',  '560',  '75.7'],
    ['Ghazipur',  '27', '1230', '980',  '79.7'],
  ],
  'RPT-2025-M2': [
    ['Alert ID', 'District', 'Type', 'Risk Score', 'Status'],
    ['ALT-001', 'Varanasi', 'Duplicate Payment', '9.1', 'Open'],
    ['ALT-004', 'Bhopal',   'Cost Inflation',    '8.6', 'Open'],
    ['ALT-007', 'Agra',     'Missing UC',        '9.4', 'Open'],
  ],
  'RPT-2025-M1': [
    ['Work ID', 'Name',                               'Compliance', 'Remarks'],
    ['WK-4820', 'Community Health Centre — Mirzapur', 'PASS', 'All documents verified'],
    ['WK-4816', 'Solar Street Lighting — Azamgarh',   'PASS', 'UC submitted on time'],
    ['WK-4819', 'Primary School Renovation — Chandauli','FAIL','UC pending > 30 days'],
  ],
  'RPT-2024-Q4': [
    ['MP',       'Allocated (Cr)', 'Spent (Cr)', 'Lapse Risk'],
    ['MP-UP-01', '5.00', '4.82', 'LOW'],
    ['MP-UP-02', '5.00', '3.91', 'MEDIUM'],
    ['MP-UP-07', '5.00', '2.44', 'HIGH'],
  ],
}

function exportReportCSV(report: typeof MOCK_REPORTS[number]) {
  const rows = REPORT_DEMO_ROWS[report.id]
  if (!rows) return

  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const csv    = rows.map((r) => r.map(escape).join(',')).join('\r\n')
  const blob   = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = `${report.id}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// F10 — Bulk export panel: choose a report + format, then export
// ---------------------------------------------------------------------------
const READY_REPORTS = MOCK_REPORTS.filter((r) => r.status === 'READY')

function ExportPanel() {
  const [selectedId, setSelectedId] = useState<string>(READY_REPORTS[0]?.id ?? '')

  const selectedReport = READY_REPORTS.find((r) => r.id === selectedId)
  const canExport      = Boolean(selectedReport && REPORT_DEMO_ROWS[selectedId])

  function handleExport() {
    if (selectedReport) exportReportCSV(selectedReport)
  }

  return (
    <div className="border-2 border-[#1A1A18] bg-[#FFFFFF] mt-8">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-[#1A1A18] bg-[#F5F2E8]">
        <Download className="w-4 h-4 text-[#1E3878]" strokeWidth={2} />
        <span className="text-xs font-black uppercase tracking-wider text-[#1A1A18]">
          Export Report
        </span>
      </div>

      {/* Panel body */}
      <div className="px-5 py-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">

        {/* Report selector */}
        <div className="flex-1">
          <label
            htmlFor="export-report-select"
            className="block text-xs font-black uppercase tracking-wider text-[#8A8680] mb-1.5"
          >
            Report
          </label>
          <select
            id="export-report-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full h-9 border-2 border-[#1A1A18] bg-[#FFFFFF] px-3 text-xs text-[#1A1A18] uppercase tracking-wide focus:outline-none focus:ring-0 appearance-none"
            style={{ borderRadius: 0 }}
          >
            {READY_REPORTS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} — {r.title}
              </option>
            ))}
          </select>
        </div>

        {/* Format selector (CSV only) */}
        <div className="shrink-0">
          <label className="block text-xs font-black uppercase tracking-wider text-[#8A8680] mb-1.5">
            Format
          </label>
          <div className="flex items-center h-9 border-2 border-[#1A1A18] bg-[#F5F2E8] px-4">
            <span className="text-xs font-black uppercase tracking-wider text-[#1A1A18]">CSV</span>
          </div>
        </div>

        {/* Export action */}
        <div className="shrink-0">
          <button
            onClick={handleExport}
            disabled={!canExport}
            className="flex items-center gap-1.5 px-5 h-9 border-2 border-[#1A1A18] text-xs font-black uppercase tracking-wider text-[#1A1A18] bg-[#E8C018] hover:bg-[#E8C018]/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#E8C018]"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Export Report
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Reports component — existing list (preserved) + F10 export panel below
// ---------------------------------------------------------------------------
export function Reports() {
  return (
    <div className="p-8">
      {/* Existing page header — preserved verbatim */}
      <div className="flex items-center gap-3 mb-8 border-b-2 border-[#1A1A18] pb-4">
        <FileBarChart2 className="w-5 h-5 text-[#1E3878]" strokeWidth={2} />
        <h1 className="text-xl font-black uppercase tracking-tight text-[#1A1A18]">Reports</h1>
      </div>

      {/* Existing report list — preserved verbatim */}
      <div className="border-2 border-[#1A1A18] bg-[#FFFFFF] divide-y-2 divide-[#1A1A18]">
        {MOCK_REPORTS.map((report) => (
          <div key={report.id} className="flex items-center gap-4 px-5 py-4">
            <span
              className={`shrink-0 px-2 py-0.5 text-xs font-black uppercase tracking-wider ${TYPE_STYLES[report.type]}`}
            >
              {report.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#1A1A18] truncate">{report.title}</p>
              <p className="text-xs text-[#8A8680] mt-0.5">{report.id} · Generated {report.date}</p>
            </div>
            {report.status === 'READY' ? (
              <button
                onClick={() => exportReportCSV(report)}
                className="shrink-0 flex items-center gap-1.5 px-3 h-8 border-2 border-[#1A1A18] text-xs font-medium uppercase tracking-wider text-[#1A1A18] hover:bg-[#E8C018] transition-colors"
                title="Download report as CSV"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Download
              </button>
            ) : (
              <span className="shrink-0 text-xs font-medium uppercase tracking-wider text-[#8A8680] animate-pulse">
                Generating…
              </span>
            )}
          </div>
        ))}
      </div>

      {/* F10 — Export panel */}
      <ExportPanel />
    </div>
  )
}
