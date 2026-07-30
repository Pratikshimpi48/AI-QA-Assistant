import { useState, useRef, useEffect } from 'react'

export default function ExportButton({ onExport, label = 'Export Results' }) {
  const [open, setOpen] = useState(false)
  const menuRef         = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectFormat = (format) => {
    setOpen(false)
    if (typeof onExport === 'function') {
      onExport(format)
    }
  }

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.55rem 1.15rem', borderRadius: '0.625rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(6,182,212,0.2) 100%)',
          border: '1px solid rgba(99,102,241,0.4)',
          color: '#ffffff', fontSize: '0.875rem', fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          transition: 'all 0.2s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
            zIndex: 150, width: '210px',
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--color-border)',
            borderRadius: '0.75rem', padding: '0.5rem',
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', padding: '0.35rem 0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Select Format
          </div>

          <button
            onClick={() => handleSelectFormat('xlsx')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
              padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
              background: 'transparent', border: 'none',
              color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '1.1rem' }}>📊</span>
            <div>
              <div style={{ color: '#4ade80' }}>Excel (.xlsx)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Formatted spreadsheet</div>
            </div>
          </button>

          <button
            onClick={() => handleSelectFormat('csv')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
              padding: '0.6rem 0.75rem', borderRadius: '0.5rem',
              background: 'transparent', border: 'none',
              color: 'var(--color-text)', fontSize: '0.85rem', fontWeight: 600,
              cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(6,182,212,0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '1.1rem' }}>📄</span>
            <div>
              <div style={{ color: '#22d3ee' }}>CSV (.csv)</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Comma-separated text</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
