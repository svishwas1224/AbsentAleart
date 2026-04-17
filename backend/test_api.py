"""
AbsentAlert — Comprehensive API Test Suite
Run: python test_api.py
"""
import requests
import json

BASE = "http://localhost:5000/api"
PASS = 0
FAIL = 0

def test(name, method, url, body=None, expect=200, session=None):
    global PASS, FAIL
    s = session or requests.Session()
    try:
        r = getattr(s, method.lower())(url, json=body, timeout=5)
        ok = r.status_code == expect
        status = "PASS" if ok else f"FAIL (got {r.status_code}, expected {expect})"
        if ok: PASS += 1
        else:  FAIL += 1
        print(f"  [{status}] {name}")
        return r, s
    except Exception as e:
        FAIL += 1
        print(f"  [FAIL] {name} — {e}")
        return None, s

def section(title):
    print(f"\n{'='*50}")
    print(f"  {title}")
    print('='*50)

# ── AUTH TESTS ────────────────────────────────────────────────
section("AUTH — Login / Logout")
s = requests.Session()
test("Wrong password -> 401",              "POST", f"{BASE}/student/login",    {"identifier":"arjun@demo.com","password":"wrong"},   401, s)
test("Wrong role (student as lecturer) -> 401","POST",f"{BASE}/lecturer/login",{"email":"arjun@demo.com","password":"1234"},          401, s)
test("Empty credentials -> 401",           "POST", f"{BASE}/student/login",    {"identifier":"","password":""},                       401, s)
test("Valid student login -> 200",         "POST", f"{BASE}/student/login",    {"identifier":"arjun@demo.com","password":"1234"},     200, s)
test("GET /me while logged in -> 200",     "GET",  f"{BASE}/me",               None,                                                  200, s)
test("Logout -> 200",                      "POST", f"{BASE}/logout",           None,                                                  200, s)
test("GET /me after logout -> 401",        "GET",  f"{BASE}/me",               None,                                                  401, s)

# ── STUDENT TESTS ─────────────────────────────────────────────
section("STUDENT — Leave Operations")
s = requests.Session()
test("Student login",                     "POST", f"{BASE}/student/login",    {"identifier":"arjun@demo.com","password":"1234"},     200, s)
test("Get my leaves -> 200",               "GET",  f"{BASE}/leaves/my",        None,                                                  200, s)
test("Apply leave (valid) -> 201",         "POST", f"{BASE}/leaves/apply",     {"leave_type":"medical","from_date":"2026-05-01","to_date":"2026-05-02","days":2,"reason":"Fever"}, 201, s)
test("Apply leave (missing reason) -> 400","POST", f"{BASE}/leaves/apply",     {"leave_type":"medical","from_date":"2026-05-01","to_date":"2026-05-02","days":2,"reason":""}, 400, s)
test("Apply leave (missing type) -> 400",  "POST", f"{BASE}/leaves/apply",     {"leave_type":"","from_date":"2026-05-01","to_date":"2026-05-02","days":1,"reason":"test"}, 400, s)

section("STUDENT — Access Control")
test("Student cannot view admin students -> 403","GET",f"{BASE}/admin/students",None,                                                 403, s)
test("Student cannot view lec-requests -> 403","GET",f"{BASE}/leaves/student-requests",None,                                         403, s)
test("Student cannot approve leave -> 403","POST",f"{BASE}/leaves/approve/1",  {"remarks":"test"},                                    403, s)
test("Student cannot reject leave -> 403", "POST",f"{BASE}/leaves/reject/1",   {"remarks":"test"},                                    403, s)
test("Student cannot view all leaves -> 403","GET",f"{BASE}/leaves/all",       None,                                                  403, s)
test("Student cannot create class -> 403", "POST",f"{BASE}/admin/create-class",{"class_name":"X","department":"CS"},                  403, s)
test("Logout student",                    "POST", f"{BASE}/logout",           None,                                                  200, s)

# ── LECTURER TESTS ────────────────────────────────────────────
section("LECTURER — Leave Operations")
s = requests.Session()
test("Lecturer login",                    "POST", f"{BASE}/lecturer/login",   {"email":"priya@demo.com","password":"1234"},          200, s)
test("Get student requests -> 200",        "GET",  f"{BASE}/leaves/student-requests",None,                                            200, s)
test("Get my leaves -> 200",               "GET",  f"{BASE}/leaves/my",        None,                                                  200, s)
test("Apply own leave -> 201",             "POST", f"{BASE}/leaves/apply",     {"leave_type":"personal","from_date":"2026-05-10","to_date":"2026-05-10","days":1,"reason":"Personal work"}, 201, s)

# Get a pending student leave ID
r, _ = test("Get student requests for approval","GET",f"{BASE}/leaves/student-requests",None,200,s)
pending_id = None
if r:
    leaves = r.json()
    pending = [l for l in leaves if l['status'] == 'Pending with Lecturer']
    if pending:
        pending_id = pending[0]['id']

if pending_id:
    test(f"Approve student leave #{pending_id} -> 200","POST",f"{BASE}/leaves/approve/{pending_id}",{"remarks":"Approved."},200,s)
else:
    print("  [SKIP] No pending student leave to approve")

section("LECTURER — Access Control")
test("Lecturer cannot view admin students -> 403","GET",f"{BASE}/admin/students",None,                                                403, s)
test("Lecturer cannot view mgmt leaves -> 403","GET",f"{BASE}/leaves/lecturer-requests",None,                                         403, s)
test("Lecturer cannot view all leaves -> 403","GET",f"{BASE}/leaves/all",      None,                                                  403, s)
test("Lecturer cannot create class -> 403","POST",f"{BASE}/admin/create-class",{"class_name":"X","department":"CS"},                  403, s)
test("Logout lecturer",                   "POST", f"{BASE}/logout",           None,                                                  200, s)

# ── MANAGEMENT TESTS ──────────────────────────────────────────
section("MANAGEMENT — Dashboard & Data")
s = requests.Session()
test("Management login",                  "POST", f"{BASE}/management/login", {"email":"admin@demo.com","password":"admin123"},      200, s)
test("Get dashboard -> 200",               "GET",  f"{BASE}/admin/dashboard",  None,                                                  200, s)
test("Get all students -> 200",            "GET",  f"{BASE}/admin/students",   None,                                                  200, s)
test("Get all lecturers -> 200",           "GET",  f"{BASE}/admin/lecturers",  None,                                                  200, s)
test("Get assignments -> 200",             "GET",  f"{BASE}/admin/assignments",None,                                                  200, s)
test("Get classes -> 200",                 "GET",  f"{BASE}/admin/classes",    None,                                                  200, s)
test("Get subjects -> 200",                "GET",  f"{BASE}/admin/subjects",   None,                                                  200, s)
test("Get lecturer leaves -> 200",         "GET",  f"{BASE}/leaves/lecturer-requests",None,                                           200, s)
test("Get all leaves -> 200",              "GET",  f"{BASE}/leaves/all",       None,                                                  200, s)

section("MANAGEMENT — CRUD Operations")
r, _ = test("Create class -> 201",         "POST", f"{BASE}/admin/create-class",{"class_name":"BCA-TEST","department":"Computer Science","semester":"1","section":"A"},201,s)
new_class_id = r.json()['id'] if r else None
r, _ = test("Create subject -> 201",       "POST", f"{BASE}/admin/create-subject",{"subject_name":"Test Subject","subject_code":"TST101","department":"Computer Science"},201,s)
new_subj_id = r.json()['id'] if r else None
test("Create class (missing name) -> 400", "POST", f"{BASE}/admin/create-class",{"class_name":"","department":"CS"},                  400, s)
test("Create subject (missing name) -> 400","POST",f"{BASE}/admin/create-subject",{"subject_name":"","subject_code":"X"},             400, s)
if new_class_id:
    test(f"Delete class #{new_class_id} -> 200","DELETE",f"{BASE}/admin/delete-class/{new_class_id}",None,200,s)
if new_subj_id:
    test(f"Delete subject #{new_subj_id} -> 200","DELETE",f"{BASE}/admin/delete-subject/{new_subj_id}",None,200,s)

section("MANAGEMENT — Approve Lecturer Leave")
r, _ = test("Get lecturer leaves",        "GET",  f"{BASE}/leaves/lecturer-requests",None,200,s)
lec_pending_id = None
if r:
    ll = [l for l in r.json() if l['status'] == 'Pending with Management']
    if ll: lec_pending_id = ll[0]['id']
if lec_pending_id:
    test(f"Approve lecturer leave #{lec_pending_id} -> 200","POST",f"{BASE}/leaves/approve/{lec_pending_id}",{"remarks":"Approved."},200,s)
else:
    print("  [SKIP] No pending lecturer leave")
test("Logout management",                 "POST", f"{BASE}/logout",           None,                                                  200, s)

# ── REGISTRATION TESTS ────────────────────────────────────────
section("REGISTRATION — Validation")
test("Duplicate roll number -> 409",       "POST", f"{BASE}/student/register", {"roll_no":"BCA2024001","email":"new@test.com","password":"1234","department":"Computer Science","class_name":"BCA-3A"},409)
test("Duplicate email -> 409",             "POST", f"{BASE}/student/register", {"roll_no":"BCA9998","email":"arjun@demo.com","password":"1234","department":"Computer Science","class_name":"BCA-3A"},409)
test("Missing department -> 400",          "POST", f"{BASE}/student/register", {"roll_no":"BCA9997","email":"x@test.com","password":"1234","department":"","class_name":"BCA-3A"},400)
test("Missing class -> 400",               "POST", f"{BASE}/student/register", {"roll_no":"BCA9996","email":"y@test.com","password":"1234","department":"Computer Science","class_name":""},400)
test("Valid new student -> 201",           "POST", f"{BASE}/student/register", {"roll_no":"BCA9999","email":"newstudent@test.com","password":"1234","department":"Computer Science","class_name":"BCA-1A","student_name":"Test Student"},201)

# ── UNAUTHENTICATED ACCESS ────────────────────────────────────
section("UNAUTHENTICATED — All Protected Routes")
s2 = requests.Session()
test("GET /me without login -> 401",       "GET",  f"{BASE}/me",               None,                                                  401, s2)
test("GET leaves/my without login -> 401", "GET",  f"{BASE}/leaves/my",        None,                                                  401, s2)
test("POST leaves/apply without login -> 401","POST",f"{BASE}/leaves/apply",   {"leave_type":"medical","from_date":"2026-05-01","to_date":"2026-05-01","days":1,"reason":"test"},401,s2)
test("GET admin/dashboard without login -> 403","GET",f"{BASE}/admin/dashboard",None,                                                 403, s2)
test("GET admin/students without login -> 403","GET",f"{BASE}/admin/students", None,                                                  403, s2)

# ── SUMMARY ───────────────────────────────────────────────────
total = PASS + FAIL
print(f"\n{'='*50}")
print(f"  RESULTS: {PASS}/{total} passed  |  {FAIL} failed")
print('='*50)
if FAIL == 0:
    print("  All tests passed!")
else:
    print(f"  {FAIL} test(s) need attention.")

