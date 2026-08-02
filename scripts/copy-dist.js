const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '../client/dist')
const dest = path.join(__dirname, '../server/public')

try {
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true })
    fs.cpSync(src, dest, { recursive: true })
    console.log('✅ Copied client/dist to server/public for production deployment')
  } else {
    console.warn('⚠️ client/dist does not exist, skipping copy')
  }
} catch (err) {
  console.error('❌ Failed to copy dist files:', err.message)
}
