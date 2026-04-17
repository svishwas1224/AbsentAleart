const BASE = '/api'

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Auth
  studentRegister:  (d)  => req('POST', '/student/register', d),
  studentLogin:     (d)  => req('POST', '/student/login', d),
  lecturerRegister: (d)  => req('POST', '/lecturer/register', d),
  lecturerLogin:    (d)  => req('POST', '/lecturer/login', d),
  managementLogin:  (d)  => req('POST', '/management/login', d),
  me:               ()   => req('GET',  '/me'),
  logout:           ()   => req('POST', '/logout'),

  // Leaves
  applyLeave:        (d)   => req('POST', '/leaves/apply', d),
  myLeaves:          ()    => req('GET',  '/leaves/my'),
  myMentor:          ()    => req('GET',  '/leaves/my-mentor'),
  studentRequests:   ()    => req('GET',  '/leaves/student-requests'),
  lecturerRequests:  ()    => req('GET',  '/leaves/lecturer-requests'),
  forwardedLeaves:   ()    => req('GET',  '/leaves/forwarded'),
  allLeaves:         ()    => req('GET',  '/leaves/all'),
  approveLeave:      (id, d) => req('POST', `/leaves/approve/${id}`, d),
  rejectLeave:       (id, d) => req('POST', `/leaves/reject/${id}`, d),
  forwardLeave:      (id, d) => req('POST', `/leaves/forward/${id}`, d),

  // Admin
  createClass:       (d)   => req('POST',   '/admin/create-class', d),
  getClasses:        ()    => req('GET',    '/admin/classes'),
  getPublicClasses:  ()    => req('GET',    '/admin/public/classes'),
  deleteClass:       (id)  => req('DELETE', `/admin/delete-class/${id}`),
  assignLecturer:    (d)   => req('POST',   '/admin/assign-lecturer', d),
  getAssignments:    ()    => req('GET',    '/admin/assignments'),
  updateAssignment:  (id, d) => req('PUT',  `/admin/update-assignment/${id}`, d),
  deleteAssignment:  (id)  => req('DELETE', `/admin/delete-assignment/${id}`),
  getStudents:       ()    => req('GET',    '/admin/students'),
  getLecturers:      ()    => req('GET',    '/admin/lecturers'),
  getDashboard:      ()    => req('GET',    '/admin/dashboard'),
  getStudentReport:  ()    => req('GET',    '/leaves/student-report'),
}
