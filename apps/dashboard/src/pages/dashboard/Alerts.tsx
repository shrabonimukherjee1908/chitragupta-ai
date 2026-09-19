import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, X, CheckCheck } from 'lucide-react'
import {
  createColumnHelper,
  flexRender,
  stockFeatures,
  useTable,
} from '@tanstack/react-table'

// ---------------------------------------------------------------------------
// F5 — Alerts table data types
// Shape aligns with future AlertsResponse contract.
// ---------------------------------------------------------------------------
type Severity = 'Low' | 'Medium' | 'High' | 'Critical'
type Status   = 'Open' | 'Under Review' | 'Resolved' | 'Reviewed'

interface AlertRow {
  alert_id:   string
  district:   string
  work:       string
  risk_score: number
  severity:   Severity
  date:       string
  status:     Status
}

const INITIAL_ALERT_DATA: AlertRow[] = [
  { alert_id: 'ALT-001', district: 'Varanasi',  work: 'Road resurfacing WK-4821',         risk_score: 9.1, severity: 'Critical',  date: '2025-03-14', status: 'Open'         },
  { alert_id: 'ALT-002', district: 'Patna',     work: 'School boundary wall WK-3910',      risk_score: 7.4, severity: 'High',      date: '2025-03-13', status: 'Under Review' },
  { alert_id: 'ALT-003', district: 'Jaipur',    work: 'Drainage canal WK-2201',            risk_score: 4.8, severity: 'Medium',    date: '2025-03-12', status: 'Open'         },
  { alert_id: 'ALT-004', district: 'Bhopal',    work: 'Community hall WK-5503',            risk_score: 8.6, severity: 'High',      date: '2025-03-11', status: 'Open'         },
  { alert_id: 'ALT-005', district: 'Lucknow',   work: 'Health sub-centre WK-6712',         risk_score: 6.2, severity: 'Medium',    date: '2025-03-10', status: 'Under Review' },
  { alert_id: 'ALT-006', district: 'Indore',    work: 'Anganwadi building WK-1108',        risk_score: 3.1, severity: 'Low',       date: '2025-03-09', status: 'Resolved'     },
  { alert_id: 'ALT-007', district: 'Agra',      work: 'Rural connectivity road WK-8830',   risk_score: 9.4, severity: 'Critical',  date: '2025-03-08', status: 'Open'         },
]

// ---------------------------------------------------------------------------
// Severity badge — sharp Bauhaus style, no pill/rounded classes
// ---------------------------------------------------------------------------
const SEVERITY_STYLE: Record<Severity, { bg: string; text: string; border?: string }> = {
  Low:      { bg: '#F5F2E8', text: '#1A1A18', border: '1px solid #1A1A18' },
  Medium:   { bg: '#E8C018', text: '#1A1A18' },
  High:     { bg: '#C8302A', text: '#F5F2E8' },
  Critical: { bg: '#C8302A', text: '#F5F2E8' },
}

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity]
  return (
    <span
      style={{
        background:    s.bg,
        color:         s.text,
        border:        s.border ?? 'none',
        display:       'inline-block',
        padding:       '1px 6px',
        fontSize:      '11px',
        fontWeight:    900,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      {severity}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Status chip — plain text style to keep density low
// ---------------------------------------------------------------------------
const STATUS_COLOR: Record<Status, string> = {
  Open:           '#C8302A',
  'Under Review': '#E8C018',
  Resolved:       '#1E3878',
  Reviewed:       '#4A4845',
}

function StatusChip({ status }: { status: Status }) {
  return (
    <span
      style={{
        color:         STATUS_COLOR[status],
        fontSize:      '11px',
        fontWeight:    700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  )
}

// ---------------------------------------------------------------------------
// F6 — Alert detail field row (used inside modal)
// ---------------------------------------------------------------------------
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2.5 border-b border-[#1A1A18]/20 last:border-0">
      <span className="w-28 shrink-0 text-xs font-black uppercase tracking-wider text-[#8A8680]">
        {label}
      </span>
      <span className="text-xs text-[#1A1A18]">{children}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// F6/F7 — Alert drill-down modal (native <dialog> — Bauhaus sharp style)
// Uses HTML dialog element so no extra library is needed and no rounded-corner
// shadcn overrides are required.
// ---------------------------------------------------------------------------
interface AlertModalProps {
  alert:    AlertRow | null
  onClose:  () => void
  onReview: (id: string) => void
}

function AlertModal({ alert, onClose, onReview }: AlertModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Sync open/close with native <dialog> API
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (alert) {
      if (!el.open) el.showModal()
    } else {
      if (el.open) el.close()
    }
  }, [alert])

  // Close on backdrop click (click outside the inner panel)
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose()
  }

  // Close on Escape (native <dialog> fires 'cancel' event)
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    const handler = () => onClose()
    el.addEventListener('cancel', handler)
    return () => el.removeEventListener('cancel', handler)
  }, [onClose])

  const canReview = alert && alert.status !== 'Reviewed' && alert.status !== 'Resolved'

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      style={{
        border:     '2px solid #1A1A18',
        background: '#FFFFFF',
        padding:    0,
        width:      '100%',
        maxWidth:   '480px',
        borderRadius: 0,
        boxShadow:  'none',
        // backdrop styling via CSS pseudo-element handled by browser
      }}
      className="backdrop:bg-black/40"
    >
      {alert && (
        <div>
          {/* Modal header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-[#1A1A18] bg-[#F5F2E8]">
            <AlertTriangle className="w-4 h-4 text-[#C8302A] shrink-0" strokeWidth={2} />
            <span className="text-sm font-black uppercase tracking-tight text-[#1A1A18] flex-1">
              {alert.alert_id}
            </span>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-6 h-6 border-2 border-[#1A1A18] bg-[#FFFFFF] hover:bg-[#E8C018] transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 text-[#1A1A18]" strokeWidth={2.5} />
            </button>
          </div>

          {/* Modal body */}
          <div className="px-5 py-4">
            <DetailRow label="Alert ID">
              <span className="font-medium">{alert.alert_id}</span>
            </DetailRow>
            <DetailRow label="District">{alert.district}</DetailRow>
            <DetailRow label="Work">{alert.work}</DetailRow>
            <DetailRow label="Risk Score">
              <span className="font-black">{alert.risk_score.toFixed(1)} / 10</span>
            </DetailRow>
            <DetailRow label="Severity">
              <SeverityBadge severity={alert.severity} />
            </DetailRow>
            <DetailRow label="Date">{alert.date}</DetailRow>
            <DetailRow label="Status">
              <StatusChip status={alert.status} />
            </DetailRow>
          </div>

          {/* F7 — Modal footer with Mark as Reviewed */}
          <div className="flex justify-end gap-2 px-5 py-4 border-t-2 border-[#1A1A18] bg-[#F5F2E8]">
            <button
              onClick={onClose}
              className="px-4 h-8 border-2 border-[#1A1A18] text-xs font-medium uppercase tracking-wider text-[#1A1A18] bg-[#FFFFFF] hover:bg-[#F5F2E8] transition-colors"
            >
              Close
            </button>
            {canReview && (
              <button
                onClick={() => {
                  onReview(alert.alert_id)
                  onClose()
                }}
                className="flex items-center gap-1.5 px-4 h-8 border-2 border-[#1A1A18] text-xs font-black uppercase tracking-wider text-[#1A1A18] bg-[#E8C018] hover:bg-[#E8C018]/80 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                Mark as Reviewed
              </button>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}

// ---------------------------------------------------------------------------
// TanStack Table v9 column definitions (F5 — unchanged)
// ---------------------------------------------------------------------------
const colHelper = createColumnHelper<AlertRow>()
const features  = stockFeatures

function buildColumns(onRowClick: (row: AlertRow) => void) {
  return [
    colHelper.accessor('alert_id', {
      header: 'Alert ID',
      cell: (info) => (
        <span className="font-medium text-[#1A1A18] text-xs tracking-wider">{info.getValue()}</span>
      ),
    }),
    colHelper.accessor('district', {
      header: 'District',
      cell: (info) => <span className="text-xs text-[#1A1A18]">{info.getValue()}</span>,
    }),
    colHelper.accessor('work', {
      header: 'Work',
      cell: (info) => (
        <span className="text-xs text-[#1A1A18] block max-w-[220px] truncate" title={info.getValue()}>
          {info.getValue()}
        </span>
      ),
    }),
    colHelper.accessor('risk_score', {
      header: 'Risk Score',
      cell: (info) => (
        <span className="text-xs font-black text-[#1A1A18]">{info.getValue().toFixed(1)} / 10</span>
      ),
    }),
    colHelper.accessor('severity', {
      header: 'Severity',
      cell: (info) => <SeverityBadge severity={info.getValue()} />,
    }),
    colHelper.accessor('date', {
      header: 'Date',
      cell: (info) => <span className="text-xs text-[#4A4845]">{info.getValue()}</span>,
    }),
    colHelper.accessor('status', {
      header: 'Status',
      cell: (info) => <StatusChip status={info.getValue()} />,
    }),
    // invisible helper column to carry the full row for click handler
    colHelper.display({
      id: '_action',
      header: '',
      cell: (info) => (
        <button
          onClick={() => onRowClick(info.row.original)}
          className="text-xs font-medium uppercase tracking-wider text-[#1E3878] hover:underline whitespace-nowrap"
        >
          View
        </button>
      ),
    }),
  ]
}

// ---------------------------------------------------------------------------
// Main Alerts component — F5 table + F6 modal + F7 mark-as-reviewed
// ---------------------------------------------------------------------------
export function Alerts() {
  // F7 — local mutable state for alert data (enables Mark as Reviewed)
  const [alertData, setAlertData] = useState<AlertRow[]>(INITIAL_ALERT_DATA)

  // F6 — selected alert for the modal
  const [selectedAlert, setSelectedAlert] = useState<AlertRow | null>(null)

  // F7 — update a single row's status in local state
  function markAsReviewed(alertId: string) {
    setAlertData((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, status: 'Reviewed' } : a)),
    )
  }

  // When modal is open, keep its data fresh (status may have changed)
  const liveSelected = selectedAlert
    ? (alertData.find((a) => a.alert_id === selectedAlert.alert_id) ?? null)
    : null

  const columns = buildColumns(setSelectedAlert)

  const table = useTable({ features, columns, data: alertData })

  return (
    <div className="p-8">
      {/* Page header — preserved */}
      <div className="flex items-center gap-3 mb-8 border-b-2 border-[#1A1A18] pb-4">
        <AlertTriangle className="w-5 h-5 text-[#C8302A]" strokeWidth={2} />
        <h1 className="text-xl font-black uppercase tracking-tight text-[#1A1A18]">Alerts</h1>
        <span className="ml-auto text-xs font-medium uppercase tracking-wider text-[#8A8680]">
          {alertData.length} active
        </span>
      </div>

      {/* F5 — TanStack Table v9 alerts table */}
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
              <tr
                key={row.id}
                className="hover:bg-[#F5F2E8] transition-colors duration-100 cursor-pointer"
                onClick={() => setSelectedAlert(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3"
                    onClick={
                      // prevent double-fire from the View button's own onClick
                      cell.column.id === '_action'
                        ? (e) => e.stopPropagation()
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* F6/F7 — drill-down modal */}
      <AlertModal
        alert={liveSelected}
        onClose={() => setSelectedAlert(null)}
        onReview={markAsReviewed}
      />
    </div>
  )
}
