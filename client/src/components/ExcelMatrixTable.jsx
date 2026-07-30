import { useState } from 'react'

const STATUS_COLORS = {
  Passed:  { bg: '#15803d', border: '#166534', text: '#ffffff' },
  Failed:  { bg: '#b91c1c', border: '#991b1b', text: '#ffffff' },
  Blocked: { bg: '#b45309', border: '#92400e', text: '#ffffff' },
  'Not Run': { bg: '#475569', border: '#334155', text: '#ffffff' },
}

export default function ExcelMatrixTable({ testCases = [], sectionName = 'LOGIN PAGE', preconditions = [] }) {
  const [rows, setRows] = useState(() => {
    return (testCases || []).map((tc, idx) => {
      const tcId = tc.testCaseId || tc.id || `TC_BAP_${String(idx + 1).padStart(3, '0')}`
      const scenario = tc.scenario || tc.title || 'Verify feature functionality'
      const steps = Array.isArray(tc.stepDescription || tc.steps)
        ? (tc.stepDescription || tc.steps).map((s, i) => `${i + 1}. ${s}`).join('\n')
        : (tc.stepDescription || tc.steps || '')
      const expected = tc.expectedResult || tc.expected || ''
      const actual = tc.actualResult || (tc.expected ? `User is able to see:\n${tc.expected}` : '')
      const testData = tc.testData || (tc.tags ? `Tags: ${tc.tags.join(', ')}` : 'N/A')

      return {
        testCaseId: tcId,
        scenario,
        stepDescription: steps,
        expectedResult: expected,
        actualResult: actual,
        testData,
        status: tc.status || 'Passed',
        bugId: tc.bugId || '',
        qaComments: tc.qaComments || '',
      }
    })
  })

  const handleStatusChange = (index, newStatus) => {
    const updated = [...rows]
    updated[index].status = newStatus
    setRows(updated)
  }

  const handleFieldChange = (index, field, value) => {
    const updated = [...rows]
    updated[index][field] = value
    setRows(updated)
  }

  const defaultPreconditions = preconditions.length > 0 ? preconditions : [
    '1. Navigate to target feature page / application URL',
    '2. Ensure testing environment is active and connected',
    '3. Feature section / modal is opened',
  ]

  return (
    <div style={{ margin: '2rem 0', fontFamily: 'Arial, sans-serif' }}>
      
      {/* ── Table Top Metadata Bar (Section & Pre-condition) ─────────────────── */}
      <div style={{ border: '2px solid #000', borderRadius: '4px 4px 0 0', overflow: 'hidden', background: '#ffffff', color: '#000000' }}>
        
        {/* Section Title Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', borderBottom: '1px solid #000' }}>
          <div style={{ background: '#0033cc', color: '#ffffff', fontWeight: 800, padding: '0.75rem 1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
            Section
          </div>
          <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.05em', padding: '0.75rem', textTransform: 'uppercase' }}>
            {sectionName}
          </div>
        </div>

        {/* Pre-condition Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', borderBottom: '2px solid #000' }}>
          <div style={{ background: '#0033cc', color: '#ffffff', fontWeight: 800, padding: '0.85rem 1rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
            Pre-condition
          </div>
          <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', lineHeight: 1.5, color: '#000' }}>
            {defaultPreconditions.map((pc, i) => (
              <div key={i} style={{ marginBottom: i < defaultPreconditions.length - 1 ? 2 : 0 }}>{pc}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Test Matrix Grid Table ────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', border: '2px solid #000', borderTop: 'none', background: '#ffffff', color: '#000000' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0033cc', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>
              <th style={{ padding: '0.75rem 0.6rem', borderRight: '1px solid #ffffff', width: '110px' }}>TestcaseID</th>
              <th style={{ padding: '0.75rem 0.75rem', borderRight: '1px solid #ffffff', width: '220px' }}>Scenarios</th>
              <th style={{ padding: '0.75rem 0.75rem', borderRight: '1px solid #ffffff', width: '240px' }}>Step Description</th>
              <th style={{ padding: '0.75rem 0.75rem', borderRight: '1px solid #ffffff', width: '250px' }}>Expected Result</th>
              <th style={{ padding: '0.75rem 0.75rem', borderRight: '1px solid #ffffff', width: '250px' }}>Actual Result</th>
              <th style={{ padding: '0.75rem 0.75rem', borderRight: '1px solid #ffffff', width: '180px' }}>Test Data</th>
              <th style={{ padding: '0.75rem 0.75rem', borderRight: '1px solid #ffffff', width: '130px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '0.75rem 0.6rem', borderRight: '1px solid #ffffff', width: '100px' }}>Bug ID</th>
              <th style={{ padding: '0.75rem 0.6rem', width: '140px' }}>QA Comments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const statusStyle = STATUS_COLORS[row.status] || STATUS_COLORS['Passed']

              return (
                <tr key={idx} style={{ borderBottom: '1px solid #000000', verticalAlign: 'top', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                  
                  {/* TestcaseID */}
                  <td style={{ padding: '0.85rem 0.6rem', fontWeight: 700, borderRight: '1px solid #000000', whiteSpace: 'nowrap', color: '#000' }}>
                    {row.testCaseId}
                  </td>

                  {/* Scenarios */}
                  <td style={{ padding: '0.85rem 0.75rem', borderRight: '1px solid #000000', lineHeight: 1.4, color: '#000' }}>
                    {row.scenario}
                  </td>

                  {/* Step Description */}
                  <td style={{ padding: '0.85rem 0.75rem', borderRight: '1px solid #000000', whiteSpace: 'pre-line', lineHeight: 1.45, color: '#000' }}>
                    {row.stepDescription}
                  </td>

                  {/* Expected Result */}
                  <td style={{ padding: '0.85rem 0.75rem', borderRight: '1px solid #000000', whiteSpace: 'pre-line', lineHeight: 1.45, color: '#000' }}>
                    {row.expectedResult}
                  </td>

                  {/* Actual Result */}
                  <td style={{ padding: '0.85rem 0.75rem', borderRight: '1px solid #000000', whiteSpace: 'pre-line', lineHeight: 1.45, color: '#000' }}>
                    {row.actualResult}
                  </td>

                  {/* Test Data */}
                  <td style={{ padding: '0.85rem 0.75rem', borderRight: '1px solid #000000', whiteSpace: 'pre-line', fontFamily: 'monospace', fontSize: '0.775rem', color: '#000' }}>
                    {row.testData}
                  </td>

                  {/* Status Dropdown Badge */}
                  <td style={{ padding: '0.85rem 0.6rem', borderRight: '1px solid #000000', textAlign: 'center' }}>
                    <select
                      value={row.status}
                      onChange={(e) => handleStatusChange(idx, e.target.value)}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '9999px',
                        background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
                        color: statusStyle.text, fontWeight: 800, fontSize: '0.775rem',
                        cursor: 'pointer', outline: 'none', textAlign: 'center', appearance: 'auto',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      <option value="Passed" style={{ background: '#15803d', color: '#fff' }}>Passed ▾</option>
                      <option value="Failed" style={{ background: '#b91c1c', color: '#fff' }}>Failed ▾</option>
                      <option value="Blocked" style={{ background: '#b45309', color: '#fff' }}>Blocked ▾</option>
                      <option value="Not Run" style={{ background: '#475569', color: '#fff' }}>Not Run ▾</option>
                    </select>
                  </td>

                  {/* Bug ID */}
                  <td style={{ padding: '0.85rem 0.6rem', borderRight: '1px solid #000000' }}>
                    <input
                      type="text"
                      placeholder="e.g. BUG-101"
                      value={row.bugId}
                      onChange={(e) => handleFieldChange(idx, 'bugId', e.target.value)}
                      style={{
                        width: '100%', padding: '0.25rem 0.4rem', border: '1px solid #cbd5e1',
                        borderRadius: '0.25rem', fontSize: '0.775rem', fontFamily: 'monospace',
                        boxSizing: 'border-box', background: '#fff', color: '#000',
                      }}
                    />
                  </td>

                  {/* QA Comments */}
                  <td style={{ padding: '0.85rem 0.6rem' }}>
                    <input
                      type="text"
                      placeholder="Add comments..."
                      value={row.qaComments}
                      onChange={(e) => handleFieldChange(idx, 'qaComments', e.target.value)}
                      style={{
                        width: '100%', padding: '0.25rem 0.4rem', border: '1px solid #cbd5e1',
                        borderRadius: '0.25rem', fontSize: '0.775rem', boxSizing: 'border-box',
                        background: '#fff', color: '#000',
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
