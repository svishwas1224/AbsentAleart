import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import Sidebar from '../components/Sidebar'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

const QUOTA = 15
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function StudentDashboard() {
  const { user } = useAuth()
  const { toasts, showToast } = useToast()
  const [page, setPage]       = useState('dashboard')
  const [leaves, setLeaves]   = useState([])
  const [notifs, setNotifs]   = useState([])
  const [mentor, setMentor]   = useState(null)
  const [calDate, setCalDate] = useState(new Date())

  // Form state
  const today = new Date().toISOString().split('T')[0]
  const [leaveType, setLeaveType] = useState('')
  const [fromDate, setFromDate]   = useState(today)
  const [toDate, setToDate]       = useState(today)
  const [reason, setReason]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType]     = useState('all')

  const load = useCallback(async () => {
    const [l, m] = await Promise.all([api.myLeaves(), api.myMentor()])
    setLeaves(l)
    setMentor(m.mentor)
  }, [])

  useEffect(() => { load() }, [load])

  const days = Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1)
  const approved = leaves.filter(l => l.status === 'Approved')
  const used     = approved.reduce((s, l) => s + l.days, 0)
  const remaining = Math.max(0, QUOTA - used)
  const unread   = notifs.filter(n => !n.read).length
  const quotaPct = Math.round((used / QUOTA) * 100)

  const submitLeave = async () => {
    if (!leaveType) { showToast('Missing Field', 'Please select a leave type.', 'warning'); return }
    if (!reason.trim()) { showToast('Missing Field', 'Please provide a reason.', 'warning'); return }
    if (new Date(toDate) < new Date(fromDate)) { showToast('Invalid Dates', 'End date cannot be before start date.', 'error'); return }
    if (used + days > QUOTA) { showToast('Quota Exceeded', `Only ${QUOTA - used} days remaining.`, 'error'); return }
    try {
      await api.applyLeave({ leave_type: leaveType, from_date: fromDate, to_date: toDate, days, reason: reason.trim() })
      setLeaveType(''); setReason(''); setFromDate(today); setToDate(today)
      await load()
      showToast('Submitted ', 'Your leave application has been sent to your faculty.', 'success')
      setPage('history')
    } catch (e) { showToast('Error', e.message, 'error') }
  }

  const markNotifsRead = async () => {
    await api.markRead()
    setNotifs(n => n.map(x => ({ ...x, read: true })))
  }

  // Calendar
  const leaveDays = new Set()
  leaves.filter(l => !l.status.includes('Rejected')).forEach(l => {
    let d = new Date(l.from_date + 'T00:00:00')
    const end = new Date(l.to_date + 'T00:00:00')
    while (d <= end) {
      if (d.getMonth() === calDate.getMonth() && d.getFullYear() === calDate.getFullYear())
        leaveDays.add(d.getDate())
      d.setDate(d.getDate() + 1)
    }
  })
  const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay()
  const daysInM  = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate()
  const todayDate = new Date()

  const filteredLeaves = [...leaves].reverse().filter(l =>
    (filterStatus === 'all' || l.status === filterStatus) &&
    (filterType   === 'all' || l.leave_type === filterType)
  )

  const notifDot = t => t === 'approved' ? 'dot-teal' : t === 'rejected' ? 'dot-red' : 'dot-yellow'

  return (
    <div className="dash-layout">
      <div className="bg-mesh" /><div className="bg-grid" />
      <Toast toasts={toasts} />
      <button className="mobile-toggle" onClick={() => document.querySelector('.sidebar').classList.toggle('open')}>☰</button>
      <Sidebar role="student" activePage={page} onNavigate={p => { setPage(p); if (p === 'notifications') markNotifsRead() }} unread={unread} />

      <main className="main">

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <div className="fade-in">
            <div className="topbar">
              <div className="topbar-left">
                <h1>{`${new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'}, ${(user?.student_name || user?.roll_no || 'Student').split(' ')[0]}`}</h1>
                <p>Here's your leave status at a glance</p>
              </div>
              <div className="topbar-right">
                <button className="btn btn-secondary btn-sm" onClick={() => setPage('apply')}>+ New Application</button>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card c-yellow">
                <div className="stat-icon">PND</div>
                <div className="stat-value">{leaves.filter(l=>l.status.includes('Pending')).length}</div>
                <div className="stat-label">Pending</div>
                <div className="stat-sub">awaiting approval</div>
              </div>
              <div className="stat-card c-teal">
                <div className="stat-icon">APR</div>
                <div className="stat-value">{approved.length}</div>
                <div className="stat-label">Approved</div>
                <div className="stat-sub">this semester</div>
              </div>
              <div className="stat-card c-red">
                <div className="stat-icon">REJ</div>
                <div className="stat-value">{leaves.filter(l=>l.status.includes('Rejected')).length}</div>
                <div className="stat-label">Rejected</div>
                <div className="stat-sub">this semester</div>
              </div>
              <div className="stat-card c-blue">
                <div className="stat-icon">TOT</div>
                <div className="stat-value">{leaves.length}</div>
                <div className="stat-label">Total Applied</div>
                <div className="stat-sub">all time</div>
              </div>
            </div>

            {/* Mentor info banner */}
            {mentor && (
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', background:'var(--teal-dim)', border:'1px solid var(--teal)', borderRadius:14, marginBottom:'1.5rem' }}>
                <div className="avatar-lg avatar-faculty" style={{ width:44, height:44, fontSize:'.9rem', flexShrink:0 }}>
                  {mentor.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:'.72rem', color:'var(--teal)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.6px' }}>Your Class Mentor</p>
                  <p style={{ fontWeight:600, color:'var(--text-1)', fontSize:'.95rem', marginTop:'.1rem' }}>{mentor.name}</p>
                  <p style={{ color:'var(--text-3)', fontSize:'.75rem' }}>{mentor.department} · {mentor.email}</p>
                </div>
                <div style={{ fontSize:'.72rem', color:'var(--teal)', background:'var(--surface)', border:'1px solid var(--teal)', borderRadius:8, padding:'.35rem .75rem', whiteSpace:'nowrap' }}>
                  Leave requests go to this mentor
                </div>
              </div>
            )}

            <div className="grid-2-1">
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><div className="card-icon">—</div>Recent Applications</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage('history')}>View All</button>
                </div>                <div className="table-wrap">
                  <table><thead><tr><th>Type</th><th>Dates</th><th>Days</th><th>Status</th></tr></thead>
                  <tbody>
                    {leaves.slice(-5).reverse().map(l => (
                      <tr key={l.id}>
                        <td style={{ textTransform:'capitalize' }}>{l.leave_type}</td>
                        <td>{l.from_date}{l.from_date !== l.to_date ? ' to ' + l.to_date : ''}</td>
                        <td>{l.days}d</td>
                        <td><span className={`badge badge-${l.status.toLowerCase().replace(/ /g,'-')}`}>{l.status}</span></td>
                      </tr>
                    ))}
                    {!leaves.length && <tr><td colSpan={4}><div className="empty-state"><p>No applications yet</p></div></td></tr>}
                  </tbody></table>
                </div>
              </div>
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><div className="card-icon">—</div>Notifications</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setPage('notifications'); markNotifsRead() }}>All</button>
                </div>
                {notifs.slice(0, 4).map(n => (
                  <div key={n.id} className="notif-item">
                    <div className={`notif-dot ${notifDot(n.type)}`} />
                    <div className="notif-body"><p>{n.msg}</p><span>{n.time}</span></div>
                  </div>
                ))}
                {!notifs.length && <div className="empty-state"><p>No notifications</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* ── APPLY ── */}
        {page === 'apply' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Apply for Leave</h1><p>Fill in the details — your faculty will be notified automatically</p></div></div>
            <div className="card">
              <div className="card-title" style={{ marginBottom:'1.5rem' }}><div className="card-icon">—</div>Leave Application Form</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-control" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                    <option value="">Select type</option>
                    <option value="medical">Medical / Health</option>
                    <option value="personal">Personal</option>
                    <option value="family">Family Emergency</option>
                    <option value="academic">Academic Event</option>
                    <option value="sports">Sports / Cultural</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Days Required</label>
                  <input className="form-control" type="number" value={days} readOnly />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">From Date</label>
                  <input className="form-control" type="date" value={fromDate} min={today} onChange={e => setFromDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">To Date</label>
                  <input className="form-control" type="date" value={toDate} min={fromDate} onChange={e => setToDate(e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason / Description</label>
                <textarea className="form-control" value={reason} onChange={e => setReason(e.target.value)} placeholder="Briefly explain your reason for leave" />
              </div>
              <div style={{ display:'flex', gap:'.75rem', marginTop:'.75rem', flexWrap:'wrap' }}>
                <button className="btn btn-primary" onClick={submitLeave}>Submit Application</button>
                <button className="btn btn-secondary" onClick={() => { setLeaveType(''); setReason(''); setFromDate(today); setToDate(today) }}>Clear Form</button>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {page === 'history' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Leave History</h1><p>All your submitted leave applications</p></div></div>
            <div className="card">
              <div style={{ display:'flex', gap:'.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
                <select className="form-control" style={{ width:'auto', padding:'.45rem .85rem', fontSize:'.82rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="all">All Status</option><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option>
                </select>
                <select className="form-control" style={{ width:'auto', padding:'.45rem .85rem', fontSize:'.82rem' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                  <option value="all">All Types</option><option value="medical">Medical</option><option value="personal">Personal</option><option value="family">Family</option><option value="academic">Academic</option><option value="sports">Sports</option>
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>#</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Remarks</th></tr></thead>
                  <tbody>
                    {filteredLeaves.map((l, i) => (
                      <tr key={l.id}>
                        <td className="td-muted">{i+1}</td>
                        <td style={{ textTransform:'capitalize' }}>{l.leave_type}</td>
                        <td>{l.from_date}</td><td>{l.to_date}</td><td>{l.days}</td>
                        <td className="td-clip">{l.reason}</td>
                        <td><span className={`badge badge-${l.status.toLowerCase().replace(/ /g,'-')}`}>{l.status}</span></td>
                        <td className="td-muted td-clip">{l.remarks}</td>
                      </tr>
                    ))}
                    {!filteredLeaves.length && <tr><td colSpan={8}><div className="empty-state"><p>No records match your filters</p></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CALENDAR ── */}
        {page === 'calendar' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Leave Calendar</h1><p>Visual overview of your leave dates</p></div></div>
            <div className="grid-1-1">
              <div className="card">
                <div className="cal-nav">
                  <button className="cal-nav-btn" onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}>‹</button>
                  <h3>{MONTHS[calDate.getMonth()]} {calDate.getFullYear()}</h3>
                  <button className="cal-nav-btn" onClick={() => setCalDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}>›</button>
                </div>
                <div className="cal-grid">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="cal-day-label">{d}</div>)}
                  {Array(firstDay).fill(null).map((_, i) => <div key={'e'+i} className="cal-day empty" />)}
                  {Array(daysInM).fill(null).map((_, i) => {
                    const d = i + 1
                    const isToday = todayDate.getDate()===d && todayDate.getMonth()===calDate.getMonth() && todayDate.getFullYear()===calDate.getFullYear()
                    return <div key={d} className={`cal-day${isToday?' today':''}${leaveDays.has(d)?' leave':''}`}>{d}</div>
                  })}
                </div>
                <div className="cal-legend">
                  <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background:'var(--teal-dim)', border:'1px solid rgba(45,212,191,.3)' }} />Today</div>
                  <div className="cal-legend-item"><div className="cal-legend-dot" style={{ background:'var(--pending-bg)' }} />Leave Day</div>
                </div>
              </div>
              <div className="card">
                <div className="card-title" style={{ marginBottom:'1rem' }}><div className="card-icon">—</div>Upcoming Leaves</div>
                {leaves.filter(l => new Date(l.from_date+'T00:00:00') >= new Date() && !l.status.includes('Rejected')).map(l => (
                  <div key={l.id} className="upcoming-item">
                    <div className="upcoming-row">
                      <span className="upcoming-title">{l.leave_type} Leave</span>
                      <span className={`badge badge-${l.status.toLowerCase().replace(/ /g,'-')}`}>{l.status}</span>
                    </div>
                    <p className="upcoming-meta">{l.from_date}{l.from_date!==l.to_date?' to '+l.to_date:''} · {l.days} day{l.days>1?'s':''}</p>
                  </div>
                ))}
                {!leaves.filter(l => new Date(l.from_date+'T00:00:00') >= new Date() && !l.status.includes('Rejected')).length &&
                  <div className="empty-state"><p>No upcoming leaves</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {page === 'notifications' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Notifications</h1><p>Updates on your leave applications</p></div></div>
            <div className="card">
              {notifs.length ? notifs.map(n => (
                <div key={n.id} className={`notif-item${!n.read?' unread':''}`}>
                  <div className={`notif-dot ${notifDot(n.type)}`} />
                  <div className="notif-body"><p>{n.msg}</p><span>{n.time}</span></div>
                </div>
              )) : <div className="empty-state"><p>No notifications yet</p></div>}
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {page === 'profile' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>My Profile</h1><p>Your academic information</p></div></div>
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--border)' }}>
                <div className="avatar-lg avatar-student">
                  {(user?.student_name || user?.roll_no || 'S').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <p style={{ fontSize:'1.2rem', fontWeight:600, color:'var(--text-1)' }}>{user?.student_name || user?.roll_no}</p>
                  <p style={{ color:'var(--text-3)', fontSize:'.875rem', marginTop:'.2rem' }}>{user?.department} · Semester {user?.semester}</p>
                </div>
              </div>
              <div className="profile-grid">
                <div className="profile-field"><label>Roll Number</label><p>{user?.roll_no}</p></div>
                <div className="profile-field"><label>Department</label><p>{user?.department}</p></div>
                <div className="profile-field"><label>Class</label><p>{user?.class_name || '—'}</p></div>
                <div className="profile-field"><label>Semester</label><p>{user?.semester || '—'}</p></div>
                <div className="profile-field"><label>Email</label><p>{user?.email}</p></div>
                <div className="profile-field"><label>Leave Quota</label><p>{QUOTA} days / semester</p></div>
              </div>
              {mentor && (
                <div style={{ marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid var(--border)' }}>
                  <div className="card-title" style={{ marginBottom:'1rem' }}>Class Mentor</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem', background:'var(--teal-dim)', border:'1px solid var(--teal)', borderRadius:12 }}>
                    <div className="avatar-lg avatar-faculty" style={{ width:48, height:48, fontSize:'1rem' }}>
                      {mentor.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <div>
                      <p style={{ fontWeight:600, color:'var(--text-1)', fontSize:'.95rem' }}>{mentor.name}</p>
                      <p style={{ color:'var(--text-3)', fontSize:'.78rem', marginTop:'.2rem' }}>{mentor.department}</p>
                      <p style={{ color:'var(--teal)', fontSize:'.78rem', marginTop:'.1rem' }}>{mentor.email}</p>
                    </div>
                  </div>
                  <p style={{ fontSize:'.75rem', color:'var(--text-3)', marginTop:'.6rem' }}>
                    Your leave requests are sent to this mentor for approval.
                  </p>
                </div>
              )}
              {!mentor && user?.class_name && (
                <div style={{ marginTop:'1.5rem', paddingTop:'1.5rem', borderTop:'1px solid var(--border)', fontSize:'.82rem', color:'var(--text-3)' }}>
                  No mentor assigned to your class yet. Contact management.
                </div>
              )}

            </div>
          </div>
        )}

      </main>
    </div>
  )
}




