import { useAuth } from '../context/AuthContext'

const NAV = {
  student: [
    { id:'dashboard',     label:'Dashboard' },
    { id:'apply',         label:'Apply Leave' },
    { id:'history',       label:'Leave History' },
    { id:'calendar',      label:'Calendar' },
    { id:'notifications', label:'Notifications', badge:true },
    { id:'profile',       label:'Profile' },
  ],
  lecturer: [
    { id:'dashboard',     label:'Dashboard' },
    { id:'requests',      label:'Student Requests', badge:true },
    { id:'all-requests',  label:'All Requests' },
    { id:'apply',         label:'Apply My Leave' },
    { id:'my-leaves',     label:'My Leave History' },
    { id:'profile',       label:'Profile' },
  ],
  management: [
    { id:'dashboard',       label:'Dashboard' },
    { id:'student-report',  label:'Student Leave Report' },
    { id:'assignments',     label:'Lecturer Assignments' },
    { id:'classes',         label:'Classes & Subjects' },
    { id:'add-lecturer',    label:'Add Lecturer' },
    { id:'lecturer-leaves', label:'Lecturer Leaves', badge:true },
    { id:'all-leaves',      label:'All Leaves' },
    { id:'students',        label:'Students' },
    { id:'lecturers',       label:'Lecturers' },
    { id:'profile',         label:'Profile' },
  ],
}

const ROLE_COLOR = { student:'student', lecturer:'faculty', management:'faculty' }
const ROLE_LABEL = { student:'Student Portal', lecturer:'Lecturer Portal', management:'Management Portal' }

export default function Sidebar({ activePage, onNavigate, badge = 0 }) {
  const { user, logout } = useAuth()
  const role = user?.role || 'student'
  const ini  = (user?.student_name || user?.lecturer_name || user?.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const displayName = user?.student_name || user?.lecturer_name || user?.email || ''
  const meta = role === 'student'
    ? `${user?.roll_no} · ${user?.class_name}`
    : role === 'lecturer'
    ? user?.department
    : 'Administrator'

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">AA</div>
        <div className="brand-text">
          <h2>Absent<span>Alert</span></h2>
          <p>{ROLE_LABEL[role]}</p>
        </div>
      </div>

      <div className="sidebar-user">
        <div className={`sidebar-avatar ${ROLE_COLOR[role]}`}>{ini}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{displayName}</div>
          <div className="sidebar-user-meta">{meta}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Navigation</div>
        {(NAV[role] || []).map(item => (
          <div key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}>
            {item.label}
            {item.badge && badge > 0 && (
              <span className="nav-badge yellow">{badge}</span>
            )}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={logout}>Sign Out</button>
      </div>
    </aside>
  )
}


