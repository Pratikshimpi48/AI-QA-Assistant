import XLSX from 'xlsx-js-style'

/**
 * Convert camelCase or snake_case field key to clean title-cased Column Header
 */
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

/**
 * Helper to get column letter (0 -> A, 1 -> B, ..., 6 -> G)
 */
function getColLetter(colIdx) {
  let letter = ''
  while (colIdx >= 0) {
    letter = String.fromCharCode((colIdx % 26) + 65) + letter
    colIdx = Math.floor(colIdx / 26) - 1
  }
  return letter
}

const thinBorder = {
  top:    { style: 'thin', color: { rgb: '000000' } },
  bottom: { style: 'thin', color: { rgb: '000000' } },
  left:   { style: 'thin', color: { rgb: '000000' } },
  right:  { style: 'thin', color: { rgb: '000000' } },
}

const headerStyle = {
  fill: { fgColor: { rgb: '0033CC' } },
  font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11, name: 'Arial' },
  alignment: { vertical: 'center', horizontal: 'left', wrapText: true },
  border: thinBorder,
}

const sectionLabelStyle = {
  fill: { fgColor: { rgb: '0033CC' } },
  font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 11, name: 'Arial' },
  alignment: { vertical: 'center', horizontal: 'left' },
  border: thinBorder,
}

const sectionValueStyle = {
  fill: { fgColor: { rgb: 'FFFFFF' } },
  font: { color: { rgb: '000000' }, bold: true, sz: 11, name: 'Arial' },
  alignment: { vertical: 'center', horizontal: 'center' },
  border: thinBorder,
}

const dataRowStyle = {
  font: { color: { rgb: '000000' }, sz: 10, name: 'Arial' },
  alignment: { vertical: 'top', wrapText: true },
  border: thinBorder,
}

const statusStyles = {
  Passed: {
    fill: { fgColor: { rgb: '15803D' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 10, name: 'Arial' },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: thinBorder,
  },
  Failed: {
    fill: { fgColor: { rgb: 'B91C1C' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 10, name: 'Arial' },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: thinBorder,
  },
  Blocked: {
    fill: { fgColor: { rgb: 'B45309' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 10, name: 'Arial' },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: thinBorder,
  },
  'Not Run': {
    fill: { fgColor: { rgb: '475569' } },
    font: { color: { rgb: 'FFFFFF' }, bold: true, sz: 10, name: 'Arial' },
    alignment: { vertical: 'center', horizontal: 'center' },
    border: thinBorder,
  },
}

/**
 * Export Test Cases as fully styled .xlsx or .csv matching the exact active template structure
 */
export function exportTestCases(testCases, format = 'xlsx', filenamePrefix = 'Test_Cases', template = null) {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    alert('No test cases available to export.')
    return
  }

  const fields = (template && template.structure && Array.isArray(template.structure.fields) && template.structure.fields.length > 0)
    ? template.structure.fields
    : ['testCaseId', 'scenario', 'stepDescription', 'expectedResult', 'actualResult', 'testData', 'status', 'bugId', 'qaComments']

  const headerLabels = fields.map(formatHeaderLabel)
  const isMatrixTemplate = !template || template?.id === 'tmpl_spreadsheet_matrix' || template?.name?.toLowerCase().includes('pratik shimpi') || template?.name?.toLowerCase().includes('matrix')
  const sectionName = filenamePrefix ? filenamePrefix.replace(/_/g, ' ').toUpperCase() : 'LOGIN PAGE'

  const aoaData = []
  let headerRowIdx = 0

  if (isMatrixTemplate) {
    const padCount = Math.max(0, fields.length - 2)
    aoaData.push(['Section', sectionName, ...Array(padCount).fill('')])
    aoaData.push(['Pre-condition', '1. Navigate to target application URL\n2. Click on "Sign In" button\n3. Login section got open', ...Array(padCount).fill('')])
    headerRowIdx = 2
  }

  aoaData.push(headerLabels)

  testCases.forEach((tc, idx) => {
    const row = fields.map(f => {
      let val = tc[f]
      if (val === undefined || val === null) {
        if (f === 'testCaseId' || f === 'id') val = tc.testCaseId || tc.id || `TC_BAP_${String(idx + 1).padStart(3, '0')}`
        else if (f === 'scenario' || f === 'title' || f === 'scenarioTitle') val = tc.scenario || tc.title || tc.scenarioTitle || ''
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
      return val
    })
    aoaData.push(row)
  })

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData)

  // 🎨 APPLY STYLES (Fills, Borders, Fonts, Text Wrapping)
  if (format !== 'csv') {
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    const statusColIdx = fields.indexOf('status')

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '', t: 's' }

        const cell = worksheet[cellAddress]

        if (isMatrixTemplate && R === 0) {
          cell.s = C === 0 ? sectionLabelStyle : sectionValueStyle
        } else if (isMatrixTemplate && R === 1) {
          cell.s = C === 0 ? sectionLabelStyle : dataRowStyle
        } else if (R === headerRowIdx) {
          cell.s = headerStyle
        } else {
          if (C === statusColIdx) {
            const statusVal = String(cell.v || 'Passed')
            cell.s = statusStyles[statusVal] || statusStyles['Passed']
          } else {
            cell.s = dataRowStyle
          }
        }
      }
    }

    // Add Excel Data Validation (Dropdown for Status Column)
    if (statusColIdx !== -1) {
      const colLetter = getColLetter(statusColIdx)
      const startRow = headerRowIdx + 2
      const endRow = range.e.r + 1
      worksheet['!dataValidation'] = [
        {
          sqref: `${colLetter}${startRow}:${colLetter}${endRow}`,
          type: 'list',
          operator: 'equal',
          formula1: '"Passed,Failed,Blocked,Not Run"',
          allowBlank: true,
          showDropDown: true,
        },
      ]
    }
  }

  // Set column widths
  worksheet['!cols'] = fields.map((f, i) => ({
    wch: Math.max((headerLabels[i] || '').length + 6, 20),
  }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases')

  const ext = format === 'csv' ? 'csv' : 'xlsx'
  const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.${ext}`

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' })
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' })
  }
}

/**
 * Export Bug Report as .xlsx or .csv
 */
export function exportBugReport(bugReport, format = 'xlsx', filenamePrefix = 'Bug_Report') {
  if (!bugReport) {
    alert('No bug report available to export.')
    return
  }

  const data = [
    ['Title', bugReport.title || 'Bug Report'],
    ['Severity', bugReport.severity || 'Medium'],
    ['Type', bugReport.type || 'Bug'],
    ['Environment', bugReport.environment || 'Production'],
    ['Summary', bugReport.summary || ''],
    ['Steps to Reproduce', Array.isArray(bugReport.stepsToReproduce) ? bugReport.stepsToReproduce.join('\n') : (bugReport.stepsToReproduce || '')],
    ['Expected Behavior', bugReport.expectedBehavior || ''],
    ['Actual Behavior', bugReport.actualBehavior || ''],
    ['Workaround', bugReport.workaround || 'None'],
    ['Tags', Array.isArray(bugReport.tags) ? bugReport.tags.join(', ') : (bugReport.tags || '')],
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(data)

  if (format !== 'csv') {
    const range = XLSX.utils.decode_range(worksheet['!ref'])
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = C === 0 ? headerStyle : dataRowStyle
        }
      }
    }
  }

  worksheet['!cols'] = [{ wch: 22 }, { wch: 50 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bug Report')

  const ext = format === 'csv' ? 'csv' : 'xlsx'
  const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.${ext}`

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' })
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' })
  }
}
