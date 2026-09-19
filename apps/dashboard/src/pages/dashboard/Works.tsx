import { useState } from 'react'
import { HardHat, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  createColumnHelper,
  flexRender,
  stockFeatures,
  useTable,
} from '@tanstack/react-table'
import {
  rowPaginationFeature,
  createPaginatedRowModel,
} from '@tanstack/table-core'

// ---------------------------------------------------------------------------
// F8 — Works table data
// Extends the existing MOCK_WORKS shape with district, mp, and expenditure.
// Existing fields (id, name, status, amount, risk) are preserved verbatim.
// ---------------------------------------------------------------------------
type WorkStatus = 'IN PROGRESS' | 'COMPLETED' | 'SANCTIONED' | 'ON HOLD'

interface WorkRow {
  id:          string
  name:        string
  district:    string
  mp:          string
  amount:      string   // sanctioned amount (existing field, kept as string)
  expenditure: string
  risk:        number   // existing 0-100 risk score
  status:      WorkStatus
}

const WORKS_DATA: WorkRow[] = [
  { id: 'WK-4821', name: 'Rural Road Construction — Varanasi West',  district: 'Varanasi',  mp: 'MP-UP-01', amount: '₹48.5 L', expenditure: '₹31.2 L', risk: 82, status: 'IN PROGRESS' },
  { id: 'WK-4820', name: 'Community Health Centre — Mirzapur',        district: 'Mirzapur',  mp: 'MP-UP-02', amount: '₹92.0 L', expenditure: '₹92.0 L', risk: 12, status: 'COMPLETED'   },
  { id: 'WK-4819', name: 'Primary School Renovation — Chandauli',     district: 'Chandauli', mp: 'MP-UP-03', amount: '₹36.2 L', expenditure: '₹ 8.4 L', risk: 35, status: 'SANCTIONED'  },
  { id: 'WK-4818', name: 'Drinking Water Supply — Ghazipur',          district: 'Ghazipur',  mp: 'MP-UP-01', amount: '₹61.8 L', expenditure: '₹39.7 L', risk: 54, status: 'IN PROGRESS' },
  { id: 'WK-4817', name: 'Bridge Repair — Jaunpur',                   district: 'Jaunpur',   mp: 'MP-UP-04', amount: '₹28.4 L', expenditure: '₹ 0.0 L', risk: 67, status: 'ON HOLD'     },
  { id: 'WK-4816', name: 'Solar Street Lighting — Azamgarh',          district: 'Azamgarh',  mp: 'MP-UP-05', amount: '₹14.0 L', expenditure: '₹14.0 L', risk:  8, status: 'COMPLETED'   },
  { id: 'WK-4815', name: 'Panchayat Bhavan Construction — Mau',       district: 'Mau',       mp: 'MP-UP-04', amount: '₹22.5 L', expenditure: '₹11.3 L', risk: 44, status: 'IN PROGRESS' },
  { id: 'WK-4814', name: 'Irrigation Canal Repair — Ballia',          district: 'Ballia',    mp: 'MP-UP-06', amount: '₹53.1 L', expenditure: '₹ 5.0 L', risk: 71, status: 'ON HOLD'     },
  { id: 'WK-4813', name: 'Anganwadi Building — Deoria',               district: 'Deoria',    mp: 'MP-UP-06', amount: '₹18.8 L', expenditure: '₹18.8 L', risk: 15, status: 'COMPLETED'   },
  { id: 'WK-4812', name: 'Rural Electrification — Gorakhpur',         district: 'Gorakhpur', mp: 'MP-UP-07', amount: '₹77.3 L', expenditure: '₹42.9 L', risk: 58, status: 'IN PROGRESS' },
  { id: 'WK-4811', name: 'Cold Storage Facility — Kushinagar',        district: 'Kushinagar',mp: 'MP-UP-07', amount: '₹95.0 L', expenditure: '₹ 0.0 L', risk: 29, status: 'SANCTIONED'  },
  { id: 'WK-4810', name: 'Flood Protection Embankment — Maharajganj', district: 'Maharajganj',mp:'MP-UP-08', amount: '₹68.6 L', expenditure: '₹22.1 L', risk: 63, status: 'IN PROGRESS' },
]

// ---------------------------------------------------------------------------
// Existing STATUS_STYLES — preserved exactly
// ---------------------------------------------------------------------------
const STATUS_STYLES: Record<WorkStatus, string> = {
  'IN PROGRESS': 'bg-[#1E3878] text-[#F5F2E8]',
  'COMPLETED':   'bg-[#1A1A18] text-[#F5F2E8]',
  'SANCTIONED':  'bg-[#E8C018] text-[#1A1A18]',
  'ON HOLD':     'bg-[#C8302A] text-[#F5F2E8]',
}

// ---------------------------------------------------------------------------
// Existing RiskBar — preserved exactly
// ---------------------------------------------------------------------------
function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? '#C8302A' : score >= 40 ? '#E8C018' : '#1E3878'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 border border-[#1A1A18] bg-[#F5F2E8]">
        <div
          style={{ width: `${score}%`, backgroundColor: color }}
          className="h-full"
        />
      </div>
      <span className="text-xs font-medium text-[#4A4845] w-7 text-right">{score}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// F9 — CSV export (complete dataset, browser-native)
// ---------------------------------------------------------------------------
function exportWorksCSV(data: WorkRow[]) {
  const headers = ['Work ID', 'Name', 'District', 'MP / Owner', 'Sanctioned Amount', 'Expenditure', 'Risk Score', 'Status']
  const escape  = (v: string) => `"${v.replace(/"/g, '""')}"`

  const rows = data.map((w) =>
    [w.id, w.name, w.district, w.mp, w.amount, w.expenditure, String(w.risk), w.status]
      .map(escape)
      .join(','),
  )

  const csv  = [headers.map(escape).join(','), ...rows].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'works-export.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// F8 — TanStack Table v9 column definitions
// ---------------------------------------------------------------------------
const colHelper = createColumnHelper<WorkRow>()
const features  = { ...stockFeatures, rowPaginationFeature }

const columns = [
  colHelper.accessor('id', {
    header: 'Work ID',
    cell: (info) => (
      <span className="font-medium text-[#1A1A18] text-xs tracking-wider whitespace-nowrap">
        {info.getValue()}
      </span>
    ),
  }),
  colHelper.accessor('name', {
    header: 'Name',
    cell: (info) => (
      <span className="text-xs text-[#4A4845] block max-w-[260px] truncate" title={info.getValue()}>
        {info.getValue()}
      </span>
    ),
  }),
  colHelper.accessor('district', {
    header: 'District',
    cell: (info) => <span className="text-xs text-[#1A1A18] whitespace-nowrap">{info.getValue()}</span>,
  }),
  colHelper.accessor('mp', {
    header: 'MP / Owner',
    cell: (info) => <span className="text-xs text-[#4A4845]">{info.getValue()}</span>,
  }),
  colHelper.accessor('amount', {
    header: 'Sanctioned',
    cell: (info) => (
      <span className="text-xs font-medium text-[#1A1A18] whitespace-nowrap">{info.getValue()}</span>
    ),
  }),
  colHelper.accessor('expenditure', {
    header: 'Expenditure',
    cell: (info) => (
      <span className="text-xs font-medium text-[#1A1A18] whitespace-nowrap">{info.getValue()}</span>
    ),
  }),
  colHelper.accessor('risk', {
    header: 'Risk Score',
    cell: (info) => <RiskBar score={info.getValue()} />,
  }),
  colHelper.accessor('status', {
    header: 'Status',
    cell: (info) => (
      <span
        className={`px-2 py-0.5 text-xs font-black uppercase tracking-wider whitespace-nowrap ${STATUS_STYLES[info.getValue()]}`}
      >
        {info.getValue()}
      </span>
    ),
  }),
]

// ---------------------------------------------------------------------------
// F8+F9 — Works component
// ---------------------------------------------------------------------------
const PAGE_SIZE = 5

export function Works() {
  // F9 — pagination state
  const [pageIndex, setPageIndex] = useState(0)

  const table = useTable(
    {
      features,
      columns,
      data: WORKS_DATA,
      rowCount:         WORKS_DATA.length,
      initialState:     { pagination: { pageIndex: 0, pageSize: PAGE_SIZE } },
      state:            { pagination: { pageIndex, pageSize: PAGE_SIZE } },
      onPaginationChange: (updater) => {
        const next =
          typeof updater === 'function'
            ? updater({ pageIndex, pageSize: PAGE_SIZE })
            : updater
        setPageIndex(next.pageIndex)
      },
      getCoreRowModel:      () => ({ rows: WORKS_DATA, flatRows: WORKS_DATA, rowsById: {} }),
      getPaginatedRowModel: createPaginatedRowModel(),
    },
  )

  const totalPages  = Math.ceil(WORKS_DATA.length / PAGE_SIZE)
  const currentPage = pageIndex + 1

  return (
    <div className="p-8">
      {/* Page header — preserved from original */}
      <div className="flex items-center gap-3 mb-8 border-b-2 border-[#1A1A18] pb-4">
        <HardHat className="w-5 h-5 text-[#1E3878]" strokeWidth={2} />
        <h1 className="text-xl font-black uppercase tracking-tight text-[#1A1A18]">Works</h1>
        <span className="ml-auto flex items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-[#8A8680]">
            {WORKS_DATA.length} records
          </span>
          {/* F9 — CSV export button */}
          <button
            onClick={() => exportWorksCSV(WORKS_DATA)}
            className="flex items-center gap-1.5 px-3 h-8 border-2 border-[#1A1A18] text-xs font-medium uppercase tracking-wider text-[#1A1A18] bg-[#FFFFFF] hover:bg-[#E8C018] transition-colors"
            title="Export all works as CSV"
          >
            <Download className="w-3.5 h-3.5" strokeWidth={2} />
            Export CSV
          </button>
        </span>
      </div>

      {/* F8 — TanStack Table */}
      <div className="border-2 border-[#1A1A18] bg-[#FFFFFF] overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b-2 border-[#1A1A18] bg-[#F5F2E8]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-xs font-black uppercase tracking-wider text-[#1A1A18]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y-2 divide-[#1A1A18]">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#F5F2E8] transition-colors duration-100">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 min-w-28">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* F9 — Pagination controls */}
      <div className="flex items-center justify-between mt-3 border-2 border-[#1A1A18] bg-[#F5F2E8] px-4 py-2">
        <span className="text-xs text-[#4A4845]">
          Page <span className="font-black text-[#1A1A18]">{currentPage}</span> of{' '}
          <span className="font-black text-[#1A1A18]">{totalPages}</span>
          {' '}—{' '}
          {WORKS_DATA.length} total records
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPageIndex((p) => p - 1)}
            disabled={pageIndex === 0}
            className="flex items-center gap-1 px-3 h-7 border-2 border-[#1A1A18] text-xs font-medium uppercase tracking-wider text-[#1A1A18] bg-[#FFFFFF] hover:bg-[#E8C018] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#FFFFFF]"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />
            Prev
          </button>
          <button
            onClick={() => setPageIndex((p) => p + 1)}
            disabled={pageIndex >= totalPages - 1}
            className="flex items-center gap-1 px-3 h-7 border-2 border-[#1A1A18] text-xs font-medium uppercase tracking-wider text-[#1A1A18] bg-[#FFFFFF] hover:bg-[#E8C018] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#FFFFFF]"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
