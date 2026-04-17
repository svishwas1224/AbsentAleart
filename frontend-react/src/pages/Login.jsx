import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'

const ROLES = [
  { key: 'student',    label: 'Student',    color: 'var(--teal)'   },
  { key: 'lecturer',   label: 'Lecturer',   color: 'var(--blue)'   },
  { key: 'management', label: 'Management', color: 'var(--purple)' },
]

/* ── Eye icon SVG ── */
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

/* ── Password input with eye toggle ── */
function PasswordInput({ value, onChange, onKeyDown, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <input
        className="form-control"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder || 'Enter password'}
        style={{ paddingRight: '2.75rem' }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        style={{
          position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
          background:'none', border:'none', cursor:'pointer',
          color:'var(--text-3)', display:'flex', alignItems:'center', padding:4,
          transition:'color .2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
      >
        {show ? <EyeOff /> : <EyeOpen />}
      </button>
    </div>
  )
}

export default function Login() {
  const { setUser } = useAuth()
  const [role, setRole]       = useState('student')
  const [mode, setMode]       = useState('login')
  const [form, setForm]       = useState({})
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState([])

  // Load classes on mount (public endpoint - no auth needed)
  useEffect(() => {
    api.getPublicClasses().then(setClasses).catch(() => setClasses([]))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const activeColor = ROLES.find(r => r.key === role)?.color || 'var(--teal)'

  // Filter classes by selected department only
  const filteredClasses = classes.filter(c => c.department === form.department)

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
        await api.studentRegister({
          roll_no: form.roll_no, email: form.email, password: form.password,
          student_name: form.student_name, department: form.department,
          class_name: form.class_name || '',
        })
        setForm({}); setMode('login')
        setSuccess('Registration successful! You can now sign in.')
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const switchRole = (r) => { setRole(r); setMode('login'); setForm({}); setError(''); setSuccess('') }
  const switchMode = (m) => { setMode(m); setForm({}); setError(''); setSuccess('') }

  const card = {
    background:'var(--surface)', border:'1px solid var(--border)',
    borderRadius:22, padding:'2rem', boxShadow:'var(--shadow-lg)',
  }
  const roleBtn = (active) => ({
    flex:1, padding:'.55rem .25rem',
    border:`1px solid ${active ? activeColor : 'transparent'}`,
    background: active ? activeColor + '15' : 'transparent',
    color: active ? activeColor : 'var(--text-3)',
    fontFamily:"'Inter',sans-serif", fontSize:'.82rem', fontWeight:600,
    cursor:'pointer', borderRadius:10, transition:'all .22s', whiteSpace:'nowrap',
  })
  const modeBtn = (active) => ({
    flex:1, padding:'.5rem', border:'none',
    background: active ? activeColor + '15' : 'transparent',
    color: active ? activeColor : 'var(--text-3)',
    fontFamily:"'Inter',sans-serif", fontSize:'.85rem', fontWeight:600,
    cursor:'pointer', borderRadius:8, transition:'all .2s',
  })

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'1.5rem', position:'relative', zIndex:1 }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:'480px' }}>

        {/* Brand */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <img src="/logo.svg" alt="AbsentAlert" style={{ width:80, height:80, margin:'0 auto 0.75rem', display:'block' }} />
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'2rem', letterSpacing:'-.5px', color:'var(--text-1)' }}>
            Absent<span style={{ color:'#1d4ed8' }}>Alert</span>
          </h1>
          <p style={{ color:'var(--text-3)', fontSize:'.875rem', marginTop:'.3rem' }}>
            Absence Management &amp; Notification System
          </p>
        </div>

        <div style={card}>

          {/* Role tabs */}
          <div style={{ display:'flex', gap:4, background:'var(--bg-2)', borderRadius:13, padding:4, marginBottom:'1.5rem', border:'1px solid var(--border)' }}>
            {ROLES.map(r => (
              <button key={r.key} onClick={() => switchRole(r.key)} style={roleBtn(role === r.key)}>{r.label}</button>
            ))}
          </div>

          {/* Sign In / Register toggle — students only */}
          {role === 'student' && (
            <div style={{ display:'flex', gap:4, background:'var(--bg-2)', borderRadius:10, padding:3, marginBottom:'1.5rem', border:'1px solid var(--border)' }}>
              {['login','register'].map(m => (
                <button key={m} onClick={() => switchMode(m)} style={modeBtn(mode === m)}>
                  {m === 'login' ? 'Sign In' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {/* Success */}
          {success && (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'#059669', fontSize:'.9rem', fontWeight:600, margin:'0 0 1rem', padding:'1rem 1.25rem', background:'#d1fae5', border:'2px solid #10b981', borderRadius:12 }}>
              <span style={{ width:24, height:24, borderRadius:'50%', background:'#a7f3d0', color:'#065f46', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>OK</span>
              {success}
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:10, color:'#dc2626', fontSize:'.9rem', fontWeight:600, margin:'0 0 1rem', padding:'1rem 1.25rem', background:'#fee2e2', border:'2px solid #ef4444', borderRadius:12 }}>
              <span style={{ width:24, height:24, borderRadius:'50%', background:'#fecaca', color:'#991b1b', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, flexShrink:0 }}>!</span>
              {error}
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
                <PasswordInput value={form.password || ''} onChange={e => set('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()} placeholder="Enter your password" />
              </div>
              {role === 'lecturer' && (
                <div style={{ fontSize:'.78rem', color:'#1e40af', padding:'.65rem .875rem', background:'#dbeafe', border:'1px solid #3b82f6', borderRadius:8, marginBottom:'1rem', lineHeight:1.5 }}>
                  Lecturer accounts are created by Management. Contact your administrator if you do not have an account.
                </div>
              )}
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
                  <select className="form-control" value={form.department || ''} onChange={e => { set('department', e.target.value); set('class_name', '') }}>
                    <option value="">Select department</option>
                    <option value="Computer Science">Computer Science (BCA)</option>
                    <option value="Business Administration">Business Administration (BBA)</option>
                    <option value="Commerce">Commerce (BCom)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Class <span style={{color:'var(--text-3)',fontWeight:400}}>(optional)</span></label>
                  <select className="form-control" value={form.class_name || ''} onChange={e => set('class_name', e.target.value)}>
                    <option value="">Select class</option>
                    {filteredClasses.map(c => (
                      <option key={c.id} value={c.class_name}>{c.class_name}</option>
                    ))}
                    {!filteredClasses.length && form.department && (
                      <option disabled>No classes found for this department</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password <span style={{color:'var(--rejected)'}}>*</span></label>
                <PasswordInput value={form.password || ''} onChange={e => set('password', e.target.value)} placeholder="Create a password" />
              </div>
            </>
          )}

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', padding:'.95rem', marginTop:'1rem', background:activeColor, color:'#fff', border:'none', borderRadius:12, fontFamily:"'Inter',sans-serif", fontSize:'1rem', fontWeight:700, cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:`0 4px 12px ${activeColor}40` }}>
            {loading ? <><span className="spinner" /> Processing…</> : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

        </div>
      </div>
    </div>
  )
}
