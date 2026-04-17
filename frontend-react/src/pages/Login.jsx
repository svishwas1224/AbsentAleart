import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

const ROLES = [
  { key: 'student',    label: 'Student',    color: 'var(--teal)'   },
  { key: 'lecturer',   label: 'Lecturer',   color: 'var(--blue)'   },
  { key: 'management', label: 'Management', color: 'var(--purple)' },
]

const S = {
  page: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', padding: '1.5rem', position: 'relative', zIndex: 1,
  },
  wrap: { width: '100%', maxWidth: '480px' },
  brand: { textAlign: 'center', marginBottom: '2rem' },
  logo: (color) => ({
    width: 56, height: 56,
    background: `rgba(45,212,191,.12)`,
    border: `1.5px solid ${color}`,
    borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1rem',
    fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: '1.1rem',
    color: color, letterSpacing: 1, transition: 'all .3s',
  }),
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 22,
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
  },
  roleTabs: {
    display: 'flex', gap: 4,
    background: 'var(--bg-2)',
    borderRadius: 13, padding: 4,
    marginBottom: '1.5rem',
    border: '1px solid var(--border)',
  },
  roleBtn: (active, color) => ({
    flex: 1, padding: '.55rem .25rem',
    border: `1px solid ${active ? color : 'transparent'}`,
    background: active ? color + '15' : 'transparent',
    color: active ? color : 'var(--text-3)',
    fontFamily: "'Inter',sans-serif", fontSize: '.82rem', fontWeight: 600,
    cursor: 'pointer', borderRadius: 10, transition: 'all .22s', whiteSpace: 'nowrap',
  }),
  modeTabs: {
    display: 'flex', gap: 4,
    background: 'var(--bg-2)',
    borderRadius: 10, padding: 3,
    marginBottom: '1.5rem',
    border: '1px solid var(--border)',
  },
  modeBtn: (active, color) => ({
    flex: 1, padding: '.5rem',
    border: 'none',
    background: active ? color + '15' : 'transparent',
    color: active ? color : 'var(--text-3)',
    fontFamily: "'Inter',sans-serif", fontSize: '.85rem', fontWeight: 600,
    cursor: 'pointer', borderRadius: 8, transition: 'all .2s', textTransform: 'capitalize',
  }),
  // ── Alert boxes ──
  alertError: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: '#dc2626',
    fontSize: '.9rem', fontWeight: 600,
    margin: '0 0 1rem 0',
    padding: '1rem 1.25rem',
    background: '#fee2e2',
    border: '2px solid #ef4444',
    borderRadius: 12,
    lineHeight: 1.5,
  },
  alertSuccess: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: '#059669',
    fontSize: '.9rem', fontWeight: 600,
    margin: '0 0 1rem 0',
    padding: '1rem 1.25rem',
    background: '#d1fae5',
    border: '2px solid #10b981',
    borderRadius: 12,
    lineHeight: 1.5,
  },
  alertIcon: {
    flexShrink: 0, width: 24, height: 24,
    borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '.9rem', fontWeight: 700,
    background: '#fff',
  },
  submitBtn: (color) => ({
    width: '100%', padding: '.95rem',
    marginTop: '1rem',
    background: color,
    color: '#ffffff',
    border: 'none', borderRadius: 12,
    fontFamily: "'Inter',sans-serif",
    fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer', transition: 'all .2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    letterSpacing: '.4px',
    boxShadow: `0 4px 12px ${color}40`,
  }),
}

export default function Login() {
  const { setUser } = useAuth()
  const [role, setRole]       = useState('student')
  const [mode, setMode]       = useState('login')
  const [form, setForm]       = useState({})
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const activeColor = ROLES.find(r => r.key === role)?.color || 'var(--teal)'

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'login') {
        let res
        if (role === 'student')    res = await api.studentLogin({ identifier: form.identifier, password: form.password })
        if (role === 'lecturer')   res = await api.lecturerLogin({ email: form.email, password: form.password })
        if (role === 'management') res = await api.managementLogin({ email: form.email, password: form.password })
        setUser(res.user)
      } else {
        // Only students can self-register
        if (role === 'student') {
          await api.studentRegister({
            roll_no: form.roll_no, email: form.email, password: form.password,
            student_name: form.student_name, department: form.department,
            class_name: form.class_name, semester: form.semester,
          })
          setForm({})
          setMode('login')
          setSuccess('Registration successful! You can now sign in.')
        }
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchRole = (r) => {
    setRole(r); setMode('login'); setForm({}); setError(''); setSuccess('')
  }

  const switchMode = (m) => {
    setMode(m); setForm({}); setError(''); setSuccess('')
  }

  return (
    <div style={S.page}>
      <div className="fade-up" style={S.wrap}>

        {/* Brand */}
        <div style={S.brand}>
          <img src="/logo.svg" alt="AbsentAlert Logo"
            style={{ width: 80, height: 80, margin: '0 auto 0.75rem', display: 'block' }} />
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'2rem', letterSpacing:'-.5px', color:'var(--text-1)' }}>
            Absent<span style={{ color: '#1d4ed8' }}>Alert</span>
          </h1>
          <p style={{ color:'var(--text-3)', fontSize:'.875rem', marginTop:'.3rem' }}>
            Absence Management &amp; Notification System
          </p>
        </div>

        <div style={S.card}>

          {/* Role tabs */}
          <div style={S.roleTabs}>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => switchRole(r.key)} style={S.roleBtn(role === r.key, r.color)}>
                {r.label}
              </button>
            ))}
          </div>

          {/* Login / Register toggle — only for students */}
          {role === 'student' && (
            <div style={S.modeTabs}>
              {['login', 'register'].map(m => (
                <button key={m} onClick={() => switchMode(m)} style={S.modeBtn(mode === m, activeColor)}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {success && (
            <div style={S.alertSuccess}>
              <div style={{ ...S.alertIcon, background:'#a7f3d0', color:'#065f46' }}>OK</div>
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div style={S.alertError}>
              <div style={{ ...S.alertIcon, background:'#fecaca', color:'#991b1b' }}>!</div>
              <span>{error}</span>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <>
              {role === 'student' && (
                <div className="form-group">
                  <label className="form-label">Roll Number or Email</label>
                  <input className="form-control" value={form.identifier || ''} onChange={e => set('identifier', e.target.value)}
                    placeholder="Enter your roll number or email" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                </div>
              )}
              {(role === 'lecturer' || role === 'management') && (
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-control" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)}
                    placeholder="Enter your email address" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-control" type="password" value={form.password || ''} onChange={e => set('password', e.target.value)}
                  placeholder="Enter your password" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              </div>
            </>
          )}

          {/* ── STUDENT REGISTER ── */}
          {mode === 'register' && role === 'student' && (
            <>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Roll Number <span style={{color:'var(--rejected)'}}>*</span></label>
                  <input className="form-control" value={form.roll_no || ''} onChange={e => set('roll_no', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={form.student_name || ''} onChange={e => set('student_name', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address <span style={{color:'var(--rejected)'}}>*</span></label>
                <input className="form-control" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Department <span style={{color:'var(--rejected)'}}>*</span></label>
                  <select className="form-control" value={form.department || ''} onChange={e => set('department', e.target.value)}>
                    <option value="">Select department</option>
                    <option value="Computer Science">Computer Science (BCA)</option>
                    <option value="Business Administration">Business Administration (BBA)</option>
                    <option value="Commerce">Commerce (BCom)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Class <span style={{color:'var(--rejected)'}}>*</span></label>
                  <select className="form-control" value={form.class_name || ''} onChange={e => set('class_name', e.target.value)}>
                    <option value="">Select class</option>
                    <optgroup label="BCA — Computer Science">
                      <option value="BCA-1A">BCA-1A (Semester 1)</option>
                      <option value="BCA-2A">BCA-2A (Semester 3)</option>
                      <option value="BCA-3A">BCA-3A (Semester 5)</option>
                    </optgroup>
                    <optgroup label="BBA — Business Administration">
                      <option value="BBA-1A">BBA-1A (Semester 1)</option>
                      <option value="BBA-2A">BBA-2A (Semester 3)</option>
                      <option value="BBA-3A">BBA-3A (Semester 5)</option>
                    </optgroup>
                    <optgroup label="BCom — Commerce">
                      <option value="BCom-1A">BCom-1A (Semester 1)</option>
                      <option value="BCom-2A">BCom-2A (Semester 3)</option>
                      <option value="BCom-3A">BCom-3A (Semester 5)</option>
                    </optgroup>
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-control" value={form.semester || ''} onChange={e => set('semester', e.target.value)}>
                    <option value="">Select semester</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span style={{color:'var(--rejected)'}}>*</span></label>
                  <input className="form-control" type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} />
                </div>
              </div>
            </>
          )}

          {/* ── LECTURER REGISTER — removed, admin adds lecturers ── */}

          {/* ── LECTURER LOGIN NOTE ── */}
          {mode === 'login' && role === 'lecturer' && (
            <div style={{ fontSize:'.78rem', color:'#1e40af', padding:'.65rem .875rem',
              background:'#dbeafe', border:'1px solid #3b82f6',
              borderRadius:8, marginBottom:'1rem', lineHeight:1.5 }}>
              Lecturer accounts are created by Management. Contact your administrator if you do not have an account.
            </div>
          )}

          {/* Submit button */}
          <button onClick={handleSubmit} disabled={loading} style={S.submitBtn(activeColor)}>
            {loading
              ? <><span className="spinner" /> Processing…</>
              : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

        </div>
      </div>
    </div>
  )
}



