import { useState, useEffect, useCallback } from 'react'
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

export default function ManagementDashboard() {
  const { toasts, showToast } = useToast()
  const [page, setPage]           = useState('dashboard')
  const [stats, setStats]         = useState({})
  const [classes, setClasses]     = useState([])
  const [subjects, setSubjects]   = useState([])
  const [lecturers, setLecturers] = useState([])
  const [students, setStudents]   = useState([])
  const [assignments, setAssignments] = useState([])
  const [lecLeaves, setLecLeaves] = useState([])
  const [allLeaves, setAllLeaves] = useState([])
  const [studentReport, setStudentReport] = useState([])
  const [modal, setModal]         = useState(null)
  const [modalAction, setModalAction] = useState('')
  const [remarks, setRemarks]     = useState('')

  // Forms
  const [newClass,   setNewClass]   = useState({ class_name:'', department:'', semester:'', section:'' })
  const [newSubject, setNewSubject] = useState({ subject_name:'', subject_code:'', department:'' })
  const [newAssign,  setNewAssign]  = useState({ lecturer_id:'', class_id:'', subject_id:'' })
  const [newLecturer, setNewLecturer] = useState({ lecturer_name:'', email:'', password:'', department:'', lecturer_id:'' })

  const load = useCallback(async () => {
    const [s, c, sub, l, st, a, ll, al, sr] = await Promise.all([
      api.getDashboard(), api.getClasses(), api.getSubjects(),
      api.getLecturers(), api.getStudents(), api.getAssignments(),
      api.lecturerRequests(), api.allLeaves(),
      api.getStudentReport(),
    ])
    setStats(s); setClasses(c); setSubjects(sub); setLecturers(l)
    setStudents(st); setAssignments(a); setLecLeaves(ll)
    setAllLeaves(al); setStudentReport(sr)
  }, [])

  useEffect(() => { load() }, [load])

  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const pendingCount = (stats.pending_management || 0) + (lecLeaves.filter(l => l.status === 'Pending with Management').length)

  const confirmAction = async () => {
    try {
      if (modalAction === 'approve') await api.approveLeave(modal.id, { remarks: remarks || 'Approved by Management.' })
      if (modalAction === 'reject')  await api.rejectLeave(modal.id,  { remarks: remarks || 'Rejected by Management.' })
      setModal(null); await load()
      showToast(modalAction === 'approve' ? 'Approved' : ' Rejected',
        `Leave ${modalAction}d by Management.`, modalAction === 'approve' ? 'success' : 'error')
    } catch (e) { showToast('Error', e.message, 'error') }
  }

  const addClass = async () => {
    if (!newClass.class_name) { showToast('Missing', 'Class name required', 'warning'); return }
    try { await api.createClass(newClass); await load(); setNewClass({class_name:'',department:'',semester:'',section:''}); showToast('Created ', 'Class added.', 'success') }
    catch (e) { showToast('Error', e.message, 'error') }
  }

  const addSubject = async () => {
    if (!newSubject.subject_name) { showToast('Missing', 'Subject name required', 'warning'); return }
    try { await api.createSubject(newSubject); await load(); setNewSubject({subject_name:'',subject_code:'',department:''}); showToast('Created ', 'Subject added.', 'success') }
    catch (e) { showToast('Error', e.message, 'error') }
  }

  const addAssignment = async () => {
    if (!newAssign.lecturer_id || !newAssign.class_id || !newAssign.subject_id) {
      showToast('Missing', 'Select lecturer, class and subject', 'warning'); return
    }
    try { await api.assignLecturer(newAssign); await load(); setNewAssign({lecturer_id:'',class_id:'',subject_id:''}); showToast('Assigned ', 'Lecturer assigned.', 'success') }
    catch (e) { showToast('Error', e.message, 'error') }
  }

  const addLecturer = async () => {
    if (!newLecturer.lecturer_name || !newLecturer.email || !newLecturer.password || !newLecturer.department) {
      showToast('Missing', 'Name, email, password and department are required', 'warning'); return
    }
    try {
      await api.lecturerRegister(newLecturer)
      await load()
      setNewLecturer({ lecturer_name:'', email:'', password:'', department:'', lecturer_id:'' })
      showToast('Lecturer Added', `${newLecturer.lecturer_name} has been added successfully.`, 'success')
    } catch (e) { showToast('Error', e.message, 'error') }
  }

  const statusBadge = s => `badge ${STATUS_BADGE[s] || 'badge-pending'}`

  const LeaveTable = ({ leaves, showActions }) => (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Applicant</th><th>Role</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>{showActions&&<th>Actions</th>}</tr></thead>
        <tbody>
          {leaves.map(l => (
            <tr key={l.id}>
              <td className="td-primary">{l.applicant_name}</td>
              <td style={{textTransform:'capitalize'}}><span className={`badge ${l.applicant_role==='lecturer'?'badge-info':'badge-approved'}`}>{l.applicant_role}</span></td>
              <td style={{textTransform:'capitalize'}}>{l.leave_type}</td>
              <td>{l.from_date}</td><td>{l.to_date}</td><td>{l.days}d</td>
              <td className="td-clip">{l.reason}</td>
              <td><span className={statusBadge(l.status)}>{l.status}</span></td>
              {showActions && (
                <td>
                  {(l.status==='Pending with Management'||l.status==='Forwarded to Management') && (
                    <div style={{display:'flex',gap:4}}>
                      <button className="btn btn-sm btn-success" onClick={()=>{setModal(l);setModalAction('approve');setRemarks('')}}></button>
                      <button className="btn btn-sm btn-danger"  onClick={()=>{setModal(l);setModalAction('reject');setRemarks('')}}></button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
          {!leaves.length && <tr><td colSpan={showActions?9:8}><div className="empty-state"><p>No records</p></div></td></tr>}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="dash-layout">
      <div className="bg-mesh" /><div className="bg-grid" />
      <Toast toasts={toasts} />
      <button className="mobile-toggle" onClick={() => document.querySelector('.sidebar').classList.toggle('open')}>☰</button>
      <Sidebar activePage={page} onNavigate={setPage} badge={pendingCount} />

      <main className="main">

        {/* ── DASHBOARD ── */}
        {page === 'dashboard' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>{greet}, Admin</h1><p>Management overview — AbsentAlert</p></div></div>
            <div className="stats-grid">
              <div className="stat-card c-yellow"><div className="stat-icon">PND</div><div className="stat-value">{stats.pending_management||0}</div><div className="stat-label">Pending (Mgmt)</div><div className="stat-sub">need your action</div></div>
              <div className="stat-card c-teal"><div className="stat-icon">APR</div><div className="stat-value">{stats.approved||0}</div><div className="stat-label">Total Approved</div><div className="stat-sub">all roles</div></div>
              <div className="stat-card c-blue"><div className="stat-icon">AA</div><div className="stat-value">{stats.total_students||0}</div><div className="stat-label">Students</div><div className="stat-sub">registered</div></div>
              <div className="stat-card c-red"><div className="stat-icon">LEC</div><div className="stat-value">{stats.total_lecturers||0}</div><div className="stat-label">Lecturers</div><div className="stat-sub">registered</div></div>
            </div>
            <div className="stats-grid">
              <div className="stat-card"><div className="stat-icon">ALL</div><div className="stat-value">{stats.total_leaves||0}</div><div className="stat-label">Total Leaves</div></div>
              <div className="stat-card c-yellow"><div className="stat-icon">PND</div><div className="stat-value">{stats.pending_lecturer||0}</div><div className="stat-label">With Lecturer</div></div>
              <div className="stat-card c-red"><div className="stat-icon">REJ</div><div className="stat-value">{stats.rejected||0}</div><div className="stat-label">Rejected</div></div>
            </div>
            <div className="grid-2-1">
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><div className="card-icon">—</div>Pending Lecturer Leaves</div>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setPage('lecturer-leaves')}>View All</button>
                </div>
                <LeaveTable leaves={lecLeaves.filter(l=>l.status==='Pending with Management').slice(0,5)} showActions={true} />
              </div>
              <div className="card">
                <div className="card-title" style={{marginBottom:'1rem'}}><div className="card-icon">—</div>Recent Assignments</div>
                {assignments.slice(-6).reverse().map(a => (
                  <div key={a.id} className="qs-row">
                    <span className="qs-label" style={{fontSize:'.8rem'}}>{a.lecturer_name}</span>
                    <span className="qs-val" style={{fontSize:'.75rem',color:'var(--text-3)'}}>{a.class_name} to {a.subject_name}</span>
                  </div>
                ))}
                {!assignments.length && <div className="empty-state"><div className="empty-icon"></div><p>No assignments yet</p></div>}
              </div>
            </div>
          </div>
        )}

        {/* ── STUDENT LEAVE REPORT ── */}
        {page === 'student-report' && (
          <div className="fade-in">
            <div className="topbar">
              <div className="topbar-left">
                <h1>Student Leave Report</h1>
                <p>All student leaves that are applied or approved</p>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card c-yellow">
                <div className="stat-value">{studentReport.filter(l => l.status.includes('Pending')).length}</div>
                <div className="stat-label">Applied / Pending</div>
              </div>
              <div className="stat-card c-teal">
                <div className="stat-value">{studentReport.filter(l => l.status.includes('Approved')).length}</div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-card c-blue">
                <div className="stat-value">{studentReport.filter(l => l.status.includes('Forwarded')).length}</div>
                <div className="stat-label">Forwarded</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{studentReport.length}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Department</th>
                      <th>Leave Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Applied On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentReport.map((l, i) => (
                      <tr key={l.id}>
                        <td className="td-muted">{i + 1}</td>
                        <td className="td-primary">{l.applicant_name}</td>
                        <td>{l.class_name}</td>
                        <td>{l.department}</td>
                        <td style={{ textTransform:'capitalize' }}>{l.leave_type}</td>
                        <td>{l.from_date}</td>
                        <td>{l.to_date}</td>
                        <td>{l.days}d</td>
                        <td className="td-clip">{l.reason}</td>
                        <td>
                          <span className={`badge ${
                            l.status.includes('Approved') ? 'badge-approved' :
                            l.status.includes('Forwarded') ? 'badge-info' :
                            'badge-pending'
                          }`}>{l.status}</span>
                        </td>
                        <td className="td-muted">{l.created_at?.slice(0,10)}</td>
                      </tr>
                    ))}
                    {!studentReport.length && (
                      <tr><td colSpan={11}>
                        <div className="empty-state"><p>No student leaves found</p></div>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ASSIGNMENTS ── */}
        {page === 'assignments' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Lecturer Assignments</h1><p>Assign lecturers to classes and subjects</p></div></div>
            <div className="card" style={{marginBottom:'1.5rem'}}>
              <div className="card-title" style={{marginBottom:'1.25rem'}}><div className="card-icon">—</div>New Assignment</div>
              <div className="form-grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
                <div className="form-group">
                  <label className="form-label">Lecturer</label>
                  <select className="form-control" value={newAssign.lecturer_id} onChange={e=>setNewAssign(a=>({...a,lecturer_id:e.target.value}))}>
                    <option value="">Select lecturer…</option>
                    {lecturers.map(l => <option key={l.id} value={l.id}>{l.lecturer_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-control" value={newAssign.class_id} onChange={e=>setNewAssign(a=>({...a,class_id:e.target.value}))}>
                    <option value="">Select class…</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-control" value={newAssign.subject_id} onChange={e=>setNewAssign(a=>({...a,subject_id:e.target.value}))}>
                    <option value="">Select subject…</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" onClick={addAssignment}>Assign Lecturer</button>
            </div>
            <div className="card">
              <div className="card-title" style={{marginBottom:'1.25rem'}}><div className="card-icon">—</div>Current Assignments</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Lecturer</th><th>Class</th><th>Subject</th><th>Department</th><th>Action</th></tr></thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td className="td-primary">{a.lecturer_name}</td>
                        <td>{a.class_name}</td>
                        <td>{a.subject_name}</td>
                        <td className="td-muted">{a.department}</td>
                        <td><button className="btn btn-sm btn-danger" onClick={async()=>{await api.deleteAssignment(a.id);await load();showToast('Deleted','Assignment removed.','error')}}>Delete</button></td>
                      </tr>
                    ))}
                    {!assignments.length && <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon"></div><p>No assignments yet</p></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── CLASSES & SUBJECTS ── */}
        {page === 'classes' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Classes &amp; Subjects</h1><p>Manage class list and subject list</p></div></div>
            <div className="grid-1-1">
              <div>
                <div className="card" style={{marginBottom:'1rem'}}>
                  <div className="card-title" style={{marginBottom:'1.25rem'}}><div className="card-icon">—</div>Add Class</div>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">Class Name *</label><input className="form-control" value={newClass.class_name} onChange={e=>setNewClass(c=>({...c,class_name:e.target.value}))} placeholder="CS-A" /></div>
                    <div className="form-group"><label className="form-label">Department</label><input className="form-control" value={newClass.department} onChange={e=>setNewClass(c=>({...c,department:e.target.value}))} placeholder="Computer Science" /></div>
                    <div className="form-group"><label className="form-label">Semester</label><input className="form-control" value={newClass.semester} onChange={e=>setNewClass(c=>({...c,semester:e.target.value}))} placeholder="5" /></div>
                    <div className="form-group"><label className="form-label">Section</label><input className="form-control" value={newClass.section} onChange={e=>setNewClass(c=>({...c,section:e.target.value}))} placeholder="A" /></div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={addClass}>Add Class</button>
                </div>
                <div className="card">
                  <div className="card-title" style={{marginBottom:'1rem'}}><div className="card-icon">—</div>Classes ({classes.length})</div>
                  {classes.map(c => (
                    <div key={c.id} className="qs-row">
                      <div><span style={{color:'var(--text-1)',fontWeight:500}}>{c.class_name}</span> <span className="td-muted"> · {c.department} · Sem {c.semester}</span></div>
                      <button className="btn btn-sm btn-danger" onClick={async()=>{await api.deleteClass(c.id);await load()}}>✕</button>
                    </div>
                  ))}
                  {!classes.length && <div className="empty-state"><p>No classes yet</p></div>}
                </div>
              </div>
              <div>
                <div className="card" style={{marginBottom:'1rem'}}>
                  <div className="card-title" style={{marginBottom:'1.25rem'}}><div className="card-icon">—</div>Add Subject</div>
                  <div className="form-group"><label className="form-label">Subject Name *</label><input className="form-control" value={newSubject.subject_name} onChange={e=>setNewSubject(s=>({...s,subject_name:e.target.value}))} placeholder="Data Structures" /></div>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">Subject Code</label><input className="form-control" value={newSubject.subject_code} onChange={e=>setNewSubject(s=>({...s,subject_code:e.target.value}))} placeholder="CS301" /></div>
                    <div className="form-group"><label className="form-label">Department</label><input className="form-control" value={newSubject.department} onChange={e=>setNewSubject(s=>({...s,department:e.target.value}))} placeholder="Computer Science" /></div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={addSubject}>Add Subject</button>
                </div>
                <div className="card">
                  <div className="card-title" style={{marginBottom:'1rem'}}><div className="card-icon">—</div>Subjects ({subjects.length})</div>
                  {subjects.map(s => (
                    <div key={s.id} className="qs-row">
                      <div><span style={{color:'var(--text-1)',fontWeight:500}}>{s.subject_name}</span> <span className="td-muted"> · {s.subject_code}</span></div>
                      <button className="btn btn-sm btn-danger" onClick={async()=>{await api.deleteSubject(s.id);await load()}}>✕</button>
                    </div>
                  ))}
                  {!subjects.length && <div className="empty-state"><p>No subjects yet</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LECTURER LEAVES ── */}
        {page === 'lecturer-leaves' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Lecturer Leave Requests</h1><p>Approve or reject lecturer leaves</p></div></div>
            <div className="card"><LeaveTable leaves={lecLeaves} showActions={true} /></div>
          </div>
        )}

        {/* ── ALL LEAVES ── */}
        {page === 'all-leaves' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>All Leave Records</h1><p>Complete leave history across all roles</p></div></div>
            <div className="card"><LeaveTable leaves={allLeaves} showActions={false} /></div>
          </div>
        )}

        {/* ── STUDENTS ── */}
        {page === 'students' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>All Students</h1><p>Registered students</p></div></div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Roll No</th><th>Email</th><th>Department</th><th>Class</th><th>Semester</th></tr></thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td className="td-primary">{s.student_name||'—'}</td>
                        <td className="td-muted">{s.roll_no}</td>
                        <td>{s.email}</td>
                        <td>{s.department}</td>
                        <td><span className="badge badge-info">{s.class_name}</span></td>
                        <td>{s.semester||'—'}</td>
                      </tr>
                    ))}
                    {!students.length && <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">AA</div><p>No students registered</p></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── ADD LECTURER ── */}
        {page === 'add-lecturer' && (
          <div className="fade-in">
            <div className="topbar">
              <div className="topbar-left">
                <h1>Add Lecturer</h1>
                <p>Create a new lecturer account. They can then log in with these credentials.</p>
              </div>
            </div>
            <div className="card" style={{ maxWidth: 600 }}>
              <div className="form-group">
                <label className="form-label">Full Name <span style={{color:'var(--rejected)'}}>*</span></label>
                <input className="form-control" value={newLecturer.lecturer_name}
                  onChange={e => setNewLecturer(l => ({...l, lecturer_name: e.target.value}))}
                  placeholder="Dr. Full Name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address <span style={{color:'var(--rejected)'}}>*</span></label>
                <input className="form-control" type="email" value={newLecturer.email}
                  onChange={e => setNewLecturer(l => ({...l, email: e.target.value}))}
                  placeholder="lecturer@college.com" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Department <span style={{color:'var(--rejected)'}}>*</span></label>
                  <input className="form-control" value={newLecturer.department}
                    onChange={e => setNewLecturer(l => ({...l, department: e.target.value}))}
                    placeholder="Computer Science" />
                </div>
                <div className="form-group">
                  <label className="form-label">Lecturer ID <span style={{color:'var(--text-3)', fontWeight:400}}>(optional)</span></label>
                  <input className="form-control" value={newLecturer.lecturer_id}
                    onChange={e => setNewLecturer(l => ({...l, lecturer_id: e.target.value}))}
                    placeholder="FAC001" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Password <span style={{color:'var(--rejected)'}}>*</span></label>
                <input className="form-control" type="password" value={newLecturer.password}
                  onChange={e => setNewLecturer(l => ({...l, password: e.target.value}))}
                  placeholder="Set a password for this lecturer" />
              </div>
              <div style={{ fontSize:'.8rem', color:'#1e40af', padding:'.75rem 1rem',
                background:'#dbeafe', border:'1px solid #3b82f6', borderRadius:8,
                marginBottom:'1.25rem', lineHeight:1.6 }}>
                The lecturer will use their email and this password to log in. You can assign them to classes and subjects from Lecturer Assignments.
              </div>
              <button className="btn btn-primary" onClick={addLecturer}>Add Lecturer</button>
            </div>
          </div>
        )}

        {/* ── LECTURERS ── */}
        {page === 'lecturers' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>All Lecturers</h1><p>Registered lecturers</p></div></div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Name</th><th>Lecturer ID</th><th>Email</th><th>Department</th><th>Assigned Classes</th></tr></thead>
                  <tbody>
                    {lecturers.map(l => {
                      const asgn = assignments.filter(a => a.lecturer_id === l.id)
                      return (
                        <tr key={l.id}>
                          <td className="td-primary">{l.lecturer_name}</td>
                          <td className="td-muted">{l.lecturer_id||'—'}</td>
                          <td>{l.email}</td>
                          <td>{l.department}</td>
                          <td>{asgn.length ? asgn.map(a=>`${a.class_name}/${a.subject_name}`).join(', ') : <span className="td-muted">Not assigned</span>}</td>
                        </tr>
                      )
                    })}
                    {!lecturers.length && <tr><td colSpan={5}><div className="empty-state"><p>No lecturers registered</p></div></td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {page === 'profile' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Admin Profile</h1></div></div>
            <div className="card">
              <div style={{display:'flex',alignItems:'center',gap:'1.25rem',marginBottom:'1.5rem',paddingBottom:'1.5rem',borderBottom:'1px solid var(--border)'}}>
                <div className="avatar-lg avatar-faculty" style={{background:'rgba(167,139,250,.15)',border:'2px solid rgba(167,139,250,.3)',color:'var(--purple)'}}>AD</div>
                <div><p style={{fontSize:'1.2rem',fontWeight:600,color:'var(--text-1)'}}>Administrator</p><p style={{color:'var(--text-3)',fontSize:'.875rem',marginTop:'.2rem'}}>Management · AbsentAlert</p></div>
              </div>
              <div className="profile-grid">
                <div className="profile-field"><label>Role</label><p>Management / Admin</p></div>
                <div className="profile-field"><label>Access Level</label><p>Full Access</p></div>
                <div className="profile-field"><label>Total Students</label><p>{stats.total_students||0}</p></div>
                <div className="profile-field"><label>Total Lecturers</label><p>{stats.total_lecturers||0}</p></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── ACTION MODAL ── */}
      {modal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{modalAction==='approve'?'Approve Leave':'Reject Leave'}</h3>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>
            <div className="modal-grid">
              <div className="modal-field"><label>Applicant</label><p>{modal.applicant_name}</p></div>
              <div className="modal-field"><label>Role</label><p style={{textTransform:'capitalize'}}>{modal.applicant_role}</p></div>
              <div className="modal-field"><label>Leave Type</label><p style={{textTransform:'capitalize'}}>{modal.leave_type}</p></div>
              <div className="modal-field"><label>Duration</label><p>{modal.from_date} to {modal.to_date} ({modal.days}d)</p></div>
            </div>
            <div className="modal-field" style={{marginTop:'.85rem'}}>
              <label>Reason</label>
              <p style={{color:'var(--text-2)',lineHeight:1.5,fontSize:'.875rem'}}>{modal.reason}</p>
            </div>
            <div className="form-group" style={{marginTop:'1rem'}}>
              <label className="form-label">Remarks (optional)</label>
              <textarea className="form-control" value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Add a note…" />
            </div>
            <div className="modal-actions">
              <button className="btn btn-success" onClick={confirmAction}>Approve</button>
              <button className="btn btn-danger"  onClick={()=>{setModalAction('reject');confirmAction()}}> Reject</button>
              <button className="btn btn-secondary" onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




