import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api'
import Sidebar from '../components/Sidebar'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

const STATUS_BADGE = {
  'Pending with Lecturer':   'badge-pending',
  'Approved by Lecturer':    'badge-approved',
  'Rejected by Lecturer':    'badge-rejected',
  'Forwarded to Management': 'badge-info',
  'Pending with Management': 'badge-pending',
  'Approved by Management':  'badge-approved',
  'Rejected by Management':  'badge-rejected',
}

export default function LecturerDashboard() {
  const { user } = useAuth()
  const { toasts, showToast } = useToast()
  const [page, setPage]         = useState('dashboard')
  const [requests, setRequests] = useState([])
  const [myLeaves, setMyLeaves] = useState([])
  const [modal, setModal]       = useState(null)
  const [remarks, setRemarks]   = useState('')
  const [modalAction, setModalAction] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [leaveType, setLeaveType] = useState('')
  const [fromDate, setFromDate]   = useState(today)
  const [toDate, setToDate]       = useState(today)
  const [reason, setReason]       = useState('')

  const load = useCallback(async () => {
    const [r, m] = await Promise.all([api.studentRequests(), api.myLeaves()])
    setRequests(r); setMyLeaves(m)
  }, [])

  useEffect(() => { load() }, [load])

  const pending = requests.filter(l => l.status === 'Pending with Lecturer')
  const days = Math.max(1, Math.round((new Date(toDate) - new Date(fromDate)) / 86400000) + 1)
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const openModal = (leave, action) => { setModal(leave); setModalAction(action); setRemarks('') }

  const confirmAction = async () => {
    if (!modal) return
    try {
      if (modalAction === 'approve') await api.approveLeave(modal.id, { remarks: remarks || 'Approved.' })
      if (modalAction === 'reject')  await api.rejectLeave(modal.id,  { remarks: remarks || 'Rejected.' })
      setModal(null)
      await load()
      showToast(
        modalAction === 'approve' ? 'Approved' : 'Rejected',
        'Leave status updated successfully.',
        modalAction === 'approve' ? 'success' : 'error'
      )
    } catch (e) { showToast('Error', e.message, 'error') }
  }

  const submitLeave = async () => {
    if (!leaveType) { showToast('Missing', 'Select leave type', 'warning'); return }
    if (!reason.trim()) { showToast('Missing', 'Provide a reason', 'warning'); return }
    try {
      await api.applyLeave({ leave_type: leaveType, from_date: fromDate, to_date: toDate, days, reason })
      setLeaveType(''); setReason(''); setFromDate(today); setToDate(today)
      await load()
      showToast('Submitted', 'Your leave request sent to Management.', 'success')
      setPage('my-leaves')
    } catch (e) { showToast('Error', e.message, 'error') }
  }

  const statusBadge = s => `badge ${STATUS_BADGE[s] || 'badge-pending'}`

  const ActionBtns = ({ l }) => (
    l.status === 'Pending with Lecturer' ? (
      <div style={{ display:'flex', gap:6 }}>
        <button className="btn btn-sm btn-success" style={{ minWidth:70, fontWeight:600 }}
          onClick={() => openModal(l, 'approve')}>Approve</button>
        <button className="btn btn-sm btn-danger" style={{ minWidth:60, fontWeight:600 }}
          onClick={() => openModal(l, 'reject')}>Reject</button>
      </div>
    ) : null
  )

  return (
    <div className="dash-layout">
      <div className="bg-mesh" /><div className="bg-grid" />
      <Toast toasts={toasts} />
      <button className="mobile-toggle" onClick={() => document.querySelector('.sidebar').classList.toggle('open')}>Menu</button>
      <Sidebar activePage={page} onNavigate={setPage} badge={pending.length} />

      <main className="main">

        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <div className="fade-in">
            <div className="topbar">
              <div className="topbar-left">
                <h1>{greet}, {user?.lecturer_name?.split(' ').pop() || 'Lecturer'}</h1>
                <p>Lecturer leave management overview</p>
              </div>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
              <div className="stat-card c-yellow">
                <div className="stat-value">{pending.length}</div>
                <div className="stat-label">Pending Requests</div>
                <div className="stat-sub">student leaves</div>
              </div>
              <div className="stat-card c-teal">
                <div className="stat-value">{requests.filter(l => l.status === 'Approved by Lecturer').length}</div>
                <div className="stat-label">Approved</div>
                <div className="stat-sub">by you</div>
              </div>
              <div className="stat-card c-red">
                <div className="stat-value">{requests.filter(l => l.status === 'Rejected by Lecturer').length}</div>
                <div className="stat-label">Rejected</div>
                <div className="stat-sub">by you</div>
              </div>
            </div>

            <div className="grid-2-1">
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Pending Student Requests</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setPage('requests')}>View All</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Student</th><th>Type</th><th>Dates</th><th>Days</th><th>Actions</th></tr></thead>
                    <tbody>
                      {pending.slice(0, 5).map(l => (
                        <tr key={l.id}>
                          <td className="td-primary">{l.applicant_name}</td>
                          <td style={{ textTransform:'capitalize' }}>{l.leave_type}</td>
                          <td>{l.from_date}{l.from_date !== l.to_date ? ' to ' + l.to_date : ''}</td>
                          <td>{l.days}d</td>
                          <td><ActionBtns l={l} /></td>
                        </tr>
                      ))}
                      {!pending.length && (
                        <tr><td colSpan={5}><div className="empty-state"><p>All caught up!</p></div></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom:'1rem' }}>Quick Stats</div>
                {[
                  { label:'Total Requests', val: requests.length },
                  { label:'Pending',  val: pending.length,                                               color:'var(--pending)'  },
                  { label:'Approved', val: requests.filter(l => l.status === 'Approved by Lecturer').length, color:'var(--approved)' },
                  { label:'Rejected', val: requests.filter(l => l.status === 'Rejected by Lecturer').length, color:'var(--rejected)' },
                  { label:'My Leaves', val: myLeaves.length },
                ].map(d => (
                  <div key={d.label} className="qs-row">
                    <span className="qs-label">{d.label}</span>
                    <span className="qs-val" style={{ color: d.color || 'var(--text-1)' }}>{d.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LEAVE REQUESTS */}
        {page === 'requests' && (
          <div className="fade-in">
            <div className="topbar">
              <div className="topbar-left">
                <h1>Leave Requests</h1>
                <p>All student leave requests from your assigned classes</p>
              </div>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Student</th><th>Class</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {requests.map(l => (
                      <tr key={l.id}>
                        <td className="td-primary">{l.applicant_name}</td>
                        <td>{l.class_name}</td>
                        <td style={{ textTransform:'capitalize' }}>{l.leave_type}</td>
                        <td>{l.from_date}</td>
                        <td>{l.to_date}</td>
                        <td>{l.days}d</td>
                        <td className="td-clip">{l.reason}</td>
                        <td><span className={statusBadge(l.status)}>{l.status}</span></td>
                        <td><ActionBtns l={l} /></td>
                      </tr>
                    ))}
                    {!requests.length && (
                      <tr><td colSpan={9}><div className="empty-state"><p>No requests for your classes</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* APPLY MY LEAVE */}
        {page === 'apply' && (
          <div className="fade-in">
            <div className="topbar">
              <div className="topbar-left">
                <h1>Apply for Leave</h1>
                <p>Your request goes directly to Management</p>
              </div>
            </div>
            <div className="card">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="form-control" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                    <option value="">Select...</option>
                    <option value="medical">Medical</option>
                    <option value="personal">Personal</option>
                    <option value="family">Family Emergency</option>
                    <option value="academic">Academic</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Days</label>
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
                <label className="form-label">Reason</label>
                <textarea className="form-control" value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain your reason..." />
              </div>
              <div style={{ fontSize:'.78rem', color:'#1e40af', padding:'.65rem .875rem',
                background:'#dbeafe', border:'1px solid #3b82f6', borderRadius:8, marginBottom:'1rem', lineHeight:1.5 }}>
                Lecturer leave requests go directly to Management for approval.
              </div>
              <button className="btn btn-primary" onClick={submitLeave}>Submit Application</button>
            </div>
          </div>
        )}

        {/* MY LEAVE HISTORY */}
        {page === 'my-leaves' && (
          <div className="fade-in">
            <div className="topbar">
              <div className="topbar-left">
                <h1>My Leave History</h1>
                <p>Your submitted leave applications</p>
              </div>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>#</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Remarks</th></tr>
                  </thead>
                  <tbody>
                    {myLeaves.map((l, i) => (
                      <tr key={l.id}>
                        <td className="td-muted">{i + 1}</td>
                        <td style={{ textTransform:'capitalize' }}>{l.leave_type}</td>
                        <td>{l.from_date}</td>
                        <td>{l.to_date}</td>
                        <td>{l.days}d</td>
                        <td className="td-clip">{l.reason}</td>
                        <td><span className={statusBadge(l.status)}>{l.status}</span></td>
                        <td className="td-muted td-clip">{l.remarks || '—'}</td>
                      </tr>
                    ))}
                    {!myLeaves.length && (
                      <tr><td colSpan={8}><div className="empty-state"><p>No leaves applied yet</p></div></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {page === 'profile' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>My Profile</h1></div></div>
            <div className="card">
              <div style={{ display:'flex', alignItems:'center', gap:'1.25rem', marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid var(--border)' }}>
                <div className="avatar-lg avatar-faculty">
                  {user?.lecturer_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <p style={{ fontSize:'1.2rem', fontWeight:600, color:'var(--text-1)' }}>{user?.lecturer_name}</p>
                  <p style={{ color:'var(--text-3)', fontSize:'.875rem', marginTop:'.2rem' }}>{user?.department}</p>
                </div>
              </div>
              <div className="profile-grid">
                <div className="profile-field"><label>Lecturer ID</label><p>{user?.lecturer_id || '—'}</p></div>
                <div className="profile-field"><label>Department</label><p>{user?.department}</p></div>
                <div className="profile-field"><label>Email</label><p>{user?.email}</p></div>
                <div className="profile-field"><label>Role</label><p>Lecturer</p></div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* REVIEW MODAL */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modalAction === 'approve' ? 'Approve Leave' : 'Reject Leave'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}>X</button>
            </div>
            <div className="modal-grid">
              <div className="modal-field"><label>Student</label><p>{modal.applicant_name}</p></div>
              <div className="modal-field"><label>Class</label><p>{modal.class_name}</p></div>
              <div className="modal-field"><label>Leave Type</label><p style={{ textTransform:'capitalize' }}>{modal.leave_type}</p></div>
              <div className="modal-field"><label>Duration</label><p>{modal.from_date} to {modal.to_date} ({modal.days}d)</p></div>
            </div>
            <div className="modal-field" style={{ marginTop:'.85rem' }}>
              <label>Reason</label>
              <p style={{ color:'var(--text-2)', lineHeight:1.5, fontSize:'.875rem' }}>{modal.reason}</p>
            </div>
            <div className="form-group" style={{ marginTop:'1rem' }}>
              <label className="form-label">Remarks (optional)</label>
              <textarea className="form-control" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add a note..." />
            </div>
            <div className="modal-actions">
              {modalAction === 'approve' && (
                <button className="btn btn-success" style={{ minWidth:100, fontWeight:600 }} onClick={confirmAction}>Approve</button>
              )}
              {modalAction === 'reject' && (
                <button className="btn btn-danger" style={{ minWidth:90, fontWeight:600 }} onClick={confirmAction}>Reject</button>
              )}
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
