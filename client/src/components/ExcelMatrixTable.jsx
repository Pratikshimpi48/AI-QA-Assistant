import { useState } from 'react'

const STATUS_COLORS = {
  Passed:  { bg: '#15803d', border: '#166534', text: '#ffffff' },
  Failed:  { bg: '#b91c1c', border: '#991b1b', text: '#ffffff' },
  Blocked: { bg: '#b45309', border: '#92400e', text: '#ffffff' },
  'Not Run': { bg: '#475569', border: '#334155', text: '#ffffff' },
}

function formatHeaderLabel(fieldKey) {
  if (!fieldKey) return ''
  const knownLabels = {
    testCaseId: 'TestcaseID',
    id: 'Testcase ID',
    scenario: 'Scenarios',
    scenarioTitle: 'Scenario Title',
    stepDescription: 'Step Description',
    steps: 'Step Description',
    executionSteps: 'Execution Steps',
    stepsToTrigger: 'Steps to Trigger',
    expectedResult: 'Expected Result',
    expectedOutputs: 'Expected Outputs',
    expected: 'Expected Result',
    actualResult: 'Actual Result',
    testData: 'Test Data',
    inputData: 'Input Data',
    status: 'Status',
    bugId: 'Bug ID',
    qaComments: 'QA Comments',
    vulnerabilityId: 'Vulnerability ID',
    owaspCategory: 'OWASP Category',
    attackVector: 'Attack Vector',
    remediationCriteria: 'Remediation Criteria',
    environmentalNeeds: 'Environmental Needs',
    intercaseDependencies: 'Intercase Dependencies',
  }

  if (knownLabels[fieldKey]) return knownLabels[fieldKey]

  return fieldKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

export default function ExcelMatrixTable({ testCases = [], sectionName = 'LOGIN PAGE', preconditions = [], template = null }) {
  // Determine dynamic column fields from selected template, or default matrix fields
  const fields = (template && template.structure && Array.isArray(template.structure.fields) && template.structure.fields.length > 0)
    ? template.structure.fields
    : ['testCaseId', 'scenario', 'stepDescription', 'expectedResult', 'actualResult', 'testData', 'status', 'bugId', 'qaComments']

  const headers = fields.map(formatHeaderLabel)

  const [rows, setRows] = useState(() => {
    return (testCases || []).map((tc, idx) => {
      const rowObj = {}
      fields.forEach(f => {
        let val = tc[f]
        if (val === undefined || val === null) {
          if (f === 'testCaseId' || f === 'id') val = tc.testCaseId || tc.id || `TC_BAP_${String(idx + 1).padStart(3, '0')}`
          else if (f === 'scenario' || f === 'title' || f === 'scenarioTitle') val = tc.scenario || tc.title || tc.scenarioTitle || 'Verify feature functionality'
          else if (f === 'stepDescription' || f === 'steps' || f === 'executionSteps' || f === 'stepsToTrigger') {
            val = tc.stepDescription || tc.steps || tc.executionSteps || tc.stepsToTrigger || ''
          } else if (f === 'expectedResult' || f === 'expected' || f === 'expectedOutputs') {
            val = tc.expectedResult || tc.expected || tc.expectedOutputs || ''
          } else if (f === 'actualResult') val = tc.actualResult || (tc.expected ? `User is able to see:\n${tc.expected}` : '')
          else if (f === 'testData' || f === 'inputData') val = tc.testData || tc.inputData || (tc.tags ? `Tags: ${tc.tags.join(', ')}` : 'N/A')
          else if (f === 'status') val = tc.status || 'Passed'
          else if (f === 'bugId') val = tc.bugId || ''
          else if (f === 'qaComments') val = tc.qaComments || ''
          else val = ''
        }
        if (Array.isArray(val)) {
          val = val.map((item, i) => (typeof item === 'string' ? item : JSON.stringify(item))).join('\n')
        }
        rowObj[f] = val
      })
      return rowObj
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

      {/* ── Main Dynamic Test Matrix Grid Table ────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', border: '2px solid #000', borderTop: 'none', background: '#ffffff', color: '#000000' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0033cc', color: '#ffffff', fontWeight: 800, fontSize: '0.85rem' }}>
              {headers.map((headerText, i) => (
                <th
                  key={i}
                  style={{
                    padding: '0.75rem 0.75rem',
                    borderRight: i < headers.length - 1 ? '1px solid #ffffff' : 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {headerText}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #000000', verticalAlign: 'top', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                {fields.map((fieldKey, colIdx) => {
                  const isStatus = fieldKey === 'status'
                  const isBugId = fieldKey === 'bugId'
                  const isComments = fieldKey === 'qaComments'
                  const statusStyle = STATUS_COLORS[row.status] || STATUS_COLORS['Passed']

                  return (
                    <td
                      key={colIdx}
                      style={{
                        padding: '0.85rem 0.75rem',
                        borderRight: colIdx < fields.length - 1 ? '1px solid #000000' : 'none',
                        whiteSpace: isStatus ? 'nowrap' : 'pre-line',
                        lineHeight: 1.45,
                        color: '#000000',
                        fontWeight: fieldKey.toLowerCase().includes('id') ? 700 : 400,
                        textAlign: isStatus ? 'center' : 'left',
                      }}
                    >
                      {isStatus ? (
                        <select
                          value={row.status || 'Passed'}
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
                      ) : isBugId ? (
                        <input
                          type="text"
                          placeholder="e.g. BUG-101"
                          value={row.bugId || ''}
                          onChange={(e) => handleFieldChange(idx, 'bugId', e.target.value)}
                          style={{
                            width: '100%', padding: '0.25rem 0.4rem', border: '1px solid #cbd5e1',
                            borderRadius: '0.25rem', fontSize: '0.775rem', fontFamily: 'monospace',
                            boxSizing: 'border-box', background: '#fff', color: '#000',
                          }}
                        />
                      ) : isComments ? (
                        <input
                          type="text"
                          placeholder="Add comments..."
                          value={row.qaComments || ''}
                          onChange={(e) => handleFieldChange(idx, 'qaComments', e.target.value)}
                          style={{
                            width: '100%', padding: '0.25rem 0.4rem', border: '1px solid #cbd5e1',
                            borderRadius: '0.25rem', fontSize: '0.775rem', boxSizing: 'border-box',
                            background: '#fff', color: '#000',
                          }}
                        />
                      ) : (
                        row[fieldKey] || ''
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
