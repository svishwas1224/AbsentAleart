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
  const [newAssign,  setNewAssign]  = useState({ lecturer_id:'', class_id:'', is_mentor:false })
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
  const pendingCount = lecLeaves.filter(l => l.status === 'Pending with Management').length

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
    if (!newAssign.lecturer_id || !newAssign.class_id) {
      showToast('Missing', 'Select lecturer and class', 'warning'); return
    }
    try { await api.assignLecturer(newAssign); await load(); setNewAssign({lecturer_id:'',class_id:'',is_mentor:false}); showToast('Assigned', 'Lecturer assigned.', 'success') }
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
                    <div style={{display:'flex', gap:6}}>
                      <button
                        className="btn btn-sm btn-success"
                        style={{padding:'.4rem .9rem', fontWeight:600, minWidth:80}}
                        onClick={()=>{setModal(l);setModalAction('approve');setRemarks('')}}>
                        Approve
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        style={{padding:'.4rem .9rem', fontWeight:600, minWidth:70}}
                        onClick={()=>{setModal(l);setModalAction('reject');setRemarks('')}}>
                        Reject
                      </button>
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
            <div className="topbar">
              <div className="topbar-left">
                <h1>{greet}, Admin</h1>
                <p>Management overview — AbsentAlert</p>
              </div>
            </div>

            {/* Two key stats only */}
            <div className="stats-grid" style={{ gridTemplateColumns:'1fr 1fr', maxWidth:500 }}>
              <div className="stat-card c-blue">
                <div className="stat-value">{studentReport.length}</div>
                <div className="stat-label">Student Leaves</div>
                <div className="stat-sub">applied this semester</div>
              </div>
              <div className="stat-card c-yellow">
                <div className="stat-value">{lecLeaves.filter(l=>l.status==='Pending with Management').length}</div>
                <div className="stat-label">Lecturer Leaves Pending</div>
                <div className="stat-sub">awaiting your approval</div>
              </div>
            </div>

            {/* Lecturer leaves table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Lecturer Leave Requests</div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setPage('lecturer-leaves')}>View All</button>
              </div>
              <LeaveTable leaves={lecLeaves.filter(l=>l.status==='Pending with Management').slice(0,5)} showActions={true} />
            </div>
          </div>
        )}

        {/* ── ASSIGNMENTS ── */}
        {page === 'assignments' && (
          <div className="fade-in">
            <div className="topbar"><div className="topbar-left"><h1>Lecturer Assignments</h1><p>Assign lecturers to classes and subjects</p></div></div>
            <div className="card" style={{marginBottom:'1.5rem'}}>
              <div className="card-title" style={{marginBottom:'1.25rem'}}><div className="card-icon">—</div>New Assignment</div>
              <div className="form-grid" style={{gridTemplateColumns:'1fr 1fr'}}>
                <div className="form-group">
                  <label className="form-label">Lecturer</label>
                  <select className="form-control" value={newAssign.lecturer_id} onChange={e=>setNewAssign(a=>({...a,lecturer_id:e.target.value}))}>
                    <option value="">Select lecturer</option>
                    {lecturers.map(l => <option key={l.id} value={l.id}>{l.lecturer_name} ({l.department})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-control" value={newAssign.class_id} onChange={e=>setNewAssign(a=>({...a,class_id:e.target.value}))}>
                    <option value="">Select class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.class_name} — {c.department}</option>)}
                  </select>
                </div>
              </div>
              <div style={{padding:'.65rem .875rem',background:'#dbeafe',border:'1px solid #3b82f6',borderRadius:8,marginBottom:'1rem',fontSize:'.78rem',color:'#1e40af',lineHeight:1.5}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',margin:0}}>
                  <input type="checkbox" checked={newAssign.is_mentor} onChange={e=>setNewAssign(a=>({...a,is_mentor:e.target.checked}))} />
                  <span style={{fontWeight:600}}>Set as Class Mentor / In-charge</span>
                </label>
                <p style={{marginTop:'.35rem',fontSize:'.75rem',color:'#475569'}}>Student leave requests will go to the class mentor. Only one mentor per class.</p>
              </div>
              <button className="btn btn-primary" onClick={addAssignment}>Assign Lecturer</button>
            </div>
            <div className="card">
              <div className="card-title" style={{marginBottom:'1.25rem'}}><div className="card-icon">—</div>Current Assignments</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Lecturer</th><th>Class</th><th>Department</th><th>Role</th><th>Action</th></tr></thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td className="td-primary">{a.lecturer_name}</td>
                        <td>{a.class_name}</td>
                        <td className="td-muted">{a.department}</td>
                        <td>
                          {a.is_mentor
                            ? <span className="badge badge-approved">Class Mentor</span>
                            : <span className="badge badge-info">Lecturer</span>}
                        </td>
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
                    <div className="form-group"><label className="form-label">Class Name *</label><input className="form-control" value={newClass.class_name} onChange={e=>setNewClass(c=>({...c,class_name:e.target.value}))} placeholder="e.g. BCA-3A" /></div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select className="form-control" value={newClass.department} onChange={e=>setNewClass(c=>({...c,department:e.target.value}))}>
                        <option value="">Select department</option>
                        <option value="Computer Science">Computer Science (BCA)</option>
                        <option value="Business Administration">Business Administration (BBA)</option>
                        <option value="Commerce">Commerce (BCom)</option>
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Semester</label><input className="form-control" value={newClass.semester} onChange={e=>setNewClass(c=>({...c,semester:e.target.value}))} placeholder="1-6" /></div>
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
                  <div className="form-group"><label className="form-label">Subject Name *</label><input className="form-control" value={newSubject.subject_name} onChange={e=>setNewSubject(s=>({...s,subject_name:e.target.value}))} placeholder="e.g. Data Structures" /></div>
                  <div className="form-grid">
                    <div className="form-group"><label className="form-label">Subject Code</label><input className="form-control" value={newSubject.subject_code} onChange={e=>setNewSubject(s=>({...s,subject_code:e.target.value}))} placeholder="e.g. BCA301" /></div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select className="form-control" value={newSubject.department} onChange={e=>setNewSubject(s=>({...s,department:e.target.value}))}>
                        <option value="">Select department</option>
                        <option value="Computer Science">Computer Science (BCA)</option>
                        <option value="Business Administration">Business Administration (BBA)</option>
                        <option value="Commerce">Commerce (BCom)</option>
                        <option value="Common">Common (All Departments)</option>
                      </select>
                    </div>
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
                  <select className="form-control" value={newLecturer.department}
                    onChange={e => setNewLecturer(l => ({...l, department: e.target.value}))}>
                    <option value="">Select department</option>
                    <option value="Computer Science">Computer Science (BCA)</option>
                    <option value="Business Administration">Business Administration (BBA)</option>
                    <option value="Commerce">Commerce (BCom)</option>
                    <option value="Common">Common (All Departments)</option>
                  </select>
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
                          <td>{asgn.length ? asgn.map(a=>`${a.class_name}${a.is_mentor?' (Mentor)':''}`).join(', ') : <span className="td-muted">Not assigned</span>}</td>
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




