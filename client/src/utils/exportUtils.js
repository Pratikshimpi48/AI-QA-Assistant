import * as XLSX from 'xlsx'

/**
 * Format Test Cases into structured rows
 */
function formatTestCasesData(testCases) {
  if (!Array.isArray(testCases)) return []
  return testCases.map((tc, idx) => ({
    'ID':              tc.id || `TC-${String(idx + 1).padStart(3, '0')}`,
    'Title':           tc.title || '',
    'Type':            tc.type || 'Positive',
    'Priority':        tc.priority || 'Medium',
    'Steps':           Array.isArray(tc.steps) ? tc.steps.join(' | ') : (tc.steps || ''),
    'Expected Result': tc.expected || '',
    'Tags':            Array.isArray(tc.tags) ? tc.tags.join(', ') : (tc.tags || ''),
  }))
}

/**
 * Format Bug Report into structured row
 */
function formatBugReportData(bugReport) {
  if (!bugReport) return []
  return [{
    'Title':               bugReport.title || 'Bug Report',
    'Severity':            bugReport.severity || 'Medium',
    'Type':                bugReport.type || 'Bug',
    'Environment':         bugReport.environment || 'Production',
    'Summary':             bugReport.summary || '',
    'Steps to Reproduce':  Array.isArray(bugReport.stepsToReproduce) ? bugReport.stepsToReproduce.join(' | ') : (bugReport.stepsToReproduce || ''),
    'Expected Behavior':   bugReport.expectedBehavior || '',
    'Actual Behavior':     bugReport.actualBehavior || '',
    'Workaround':          bugReport.workaround || 'None',
    'Tags':                Array.isArray(bugReport.tags) ? bugReport.tags.join(', ') : (bugReport.tags || ''),
  }]
}

/**
 * Export Test Cases as .xlsx or .csv
 * @param {Array} testCases
 * @param {'xlsx'|'csv'} format
 * @param {string} filenamePrefix
 */
export function exportTestCases(testCases, format = 'xlsx', filenamePrefix = 'Test_Cases') {
  const rows = formatTestCasesData(testCases)
  if (rows.length === 0) {
    alert('No test cases available to export.')
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook  = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Test Cases')

  // Auto-fit column widths
  const colWidths = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(key.length, 18),
  }))
  worksheet['!cols'] = colWidths

  const ext      = format === 'csv' ? 'csv' : 'xlsx'
  const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.${ext}`

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' })
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' })
  }
}

/**
 * Export Bug Report as .xlsx or .csv
 * @param {Object} bugReport
 * @param {'xlsx'|'csv'} format
 * @param {string} filenamePrefix
 */
export function exportBugReport(bugReport, format = 'xlsx', filenamePrefix = 'Bug_Report') {
  const rows = formatBugReportData(bugReport)
  if (rows.length === 0) {
    alert('No bug report available to export.')
    return
  }

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook  = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Bug Report')

  const colWidths = Object.keys(rows[0]).map((key) => ({
    wch: Math.max(key.length, 20),
  }))
  worksheet['!cols'] = colWidths

  const ext      = format === 'csv' ? 'csv' : 'xlsx'
  const filename = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.${ext}`

  if (format === 'csv') {
    XLSX.writeFile(workbook, filename, { bookType: 'csv' })
  } else {
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx' })
  }
}
