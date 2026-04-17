from models import Student, Lecturer, Management, Class, LecturerAssignment, Leave
from extensions import db
from werkzeug.security import generate_password_hash

def seed_db():
    # Only seed if database is completely empty
    if Management.query.count() > 0:
        print('Database already has data — skipping seed.')
        return

    print('Seeding fresh database...')

    # ── Management ────────────────────────────────────────────
    admin = Management(email='admin@demo.com', password=generate_password_hash('admin123'))
    db.session.add(admin)

    # ── Classes (BCom, BBA, BCA — 3 departments) ─────────────
    classes = [
        Class(class_name='BCA-1', department='Computer Science'),
        Class(class_name='BCA-2', department='Computer Science'),
        Class(class_name='BCA-3', department='Computer Science'),
        Class(class_name='BBA-1', department='Business Administration'),
        Class(class_name='BBA-2', department='Business Administration'),
        Class(class_name='BBA-3', department='Business Administration'),
        Class(class_name='BCom-1', department='Commerce'),
        Class(class_name='BCom-2', department='Commerce'),
        Class(class_name='BCom-3', department='Commerce'),
    ]
    db.session.add_all(classes)

    # ── Lecturers ─────────────────────────────────────────────
    lecturers = [
        Lecturer(lecturer_name='Dr. Priya Nair',    email='priya@demo.com',   password=generate_password_hash('1234'), lecturer_id='FAC001', department='Computer Science'),
        Lecturer(lecturer_name='Prof. Rajan Kumar', email='rajan@demo.com',   password=generate_password_hash('1234'), lecturer_id='FAC002', department='Computer Science'),
        Lecturer(lecturer_name='Dr. Sunita Rao',    email='sunita@demo.com',  password=generate_password_hash('1234'), lecturer_id='FAC003', department='Business Administration'),
        Lecturer(lecturer_name='Prof. Anil Mehta',  email='anil@demo.com',    password=generate_password_hash('1234'), lecturer_id='FAC004', department='Business Administration'),
        Lecturer(lecturer_name='Dr. Kavitha Reddy', email='kavitha@demo.com', password=generate_password_hash('1234'), lecturer_id='FAC005', department='Commerce'),
        Lecturer(lecturer_name='Prof. Suresh Babu', email='suresh@demo.com',  password=generate_password_hash('1234'), lecturer_id='FAC006', department='Commerce'),
    ]
    db.session.add_all(lecturers)
    db.session.flush()

    # ── Students ──────────────────────────────────────────────
    students = [
        Student(roll_no='BCA2024001', email='arjun@demo.com',  password=generate_password_hash('1234'), student_name='Arjun Sharma',  department='Computer Science',        class_name='BCA-3', semester='5'),
        Student(roll_no='BCA2024002', email='meera@demo.com',  password=generate_password_hash('1234'), student_name='Meera Patel',   department='Computer Science',        class_name='BCA-3', semester='5'),
        Student(roll_no='BCA2025001', email='rohan@demo.com',  password=generate_password_hash('1234'), student_name='Rohan Desai',   department='Computer Science',        class_name='BCA-2', semester='3'),
        Student(roll_no='BBA2024001', email='sneha@demo.com',  password=generate_password_hash('1234'), student_name='Sneha Iyer',    department='Business Administration', class_name='BBA-3', semester='5'),
        Student(roll_no='BBA2024002', email='karan@demo.com',  password=generate_password_hash('1234'), student_name='Karan Singh',   department='Business Administration', class_name='BBA-3', semester='5'),
        Student(roll_no='BBA2025001', email='priyam@demo.com', password=generate_password_hash('1234'), student_name='Priya Menon',   department='Business Administration', class_name='BBA-2', semester='3'),
        Student(roll_no='BCom2024001',email='dev@demo.com',    password=generate_password_hash('1234'), student_name='Dev Kapoor',    department='Commerce',               class_name='BCom-3', semester='5'),
        Student(roll_no='BCom2024002',email='ananya@demo.com', password=generate_password_hash('1234'), student_name='Ananya Rao',    department='Commerce',               class_name='BCom-3', semester='5'),
        Student(roll_no='BCom2025001',email='rahul@demo.com',  password=generate_password_hash('1234'), student_name='Rahul Verma',   department='Commerce',               class_name='BCom-2', semester='3'),
    ]
    db.session.add_all(students)
    db.session.flush()

    # ── Lecturer Assignments (one mentor per class) ──────────
    assignments = [
        # BCA — Dr. Priya Nair is mentor for all BCA classes
        LecturerAssignment(lecturer_id=lecturers[0].id, class_id=classes[0].id, is_mentor=True,  department='Computer Science',        assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[0].id, class_id=classes[1].id, is_mentor=True,  department='Computer Science',        assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[1].id, class_id=classes[1].id, is_mentor=False, department='Computer Science',        assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[0].id, class_id=classes[2].id, is_mentor=True,  department='Computer Science',        assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[1].id, class_id=classes[2].id, is_mentor=False, department='Computer Science',        assigned_by_admin=admin.id),
        # BBA — Dr. Sunita Rao is mentor for all BBA classes
        LecturerAssignment(lecturer_id=lecturers[2].id, class_id=classes[3].id, is_mentor=True,  department='Business Administration', assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[2].id, class_id=classes[4].id, is_mentor=True,  department='Business Administration', assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[3].id, class_id=classes[4].id, is_mentor=False, department='Business Administration', assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[2].id, class_id=classes[5].id, is_mentor=True,  department='Business Administration', assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[3].id, class_id=classes[5].id, is_mentor=False, department='Business Administration', assigned_by_admin=admin.id),
        # BCom — Dr. Kavitha Reddy is mentor for all BCom classes
        LecturerAssignment(lecturer_id=lecturers[4].id, class_id=classes[6].id, is_mentor=True,  department='Commerce',               assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[4].id, class_id=classes[7].id, is_mentor=True,  department='Commerce',               assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[5].id, class_id=classes[7].id, is_mentor=False, department='Commerce',               assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[4].id, class_id=classes[8].id, is_mentor=True,  department='Commerce',               assigned_by_admin=admin.id),
        LecturerAssignment(lecturer_id=lecturers[5].id, class_id=classes[8].id, is_mentor=False, department='Commerce',               assigned_by_admin=admin.id),
    ]
    db.session.add_all(assignments)

    # ── Sample Leaves ─────────────────────────────────────────
    leaves = [
        Leave(applicant_id=students[0].id, applicant_role='student', applicant_name='Arjun Sharma',     email='arjun@demo.com',    department='Computer Science',        class_name='BCA-3',  leave_type='medical',  reason='Fever and cold',   from_date='2026-04-10', to_date='2026-04-11', days=2, status='Approved by Lecturer',   remarks='Approved. Get well soon.'),
        Leave(applicant_id=students[1].id, applicant_role='student', applicant_name='Meera Patel',      email='meera@demo.com',    department='Computer Science',        class_name='BCA-3',  leave_type='personal', reason='Family function',   from_date='2026-04-20', to_date='2026-04-20', days=1, status='Pending with Lecturer', remarks=''),
        Leave(applicant_id=students[3].id, applicant_role='student', applicant_name='Sneha Iyer',       email='sneha@demo.com',    department='Business Administration', class_name='BBA-3',  leave_type='academic', reason='Business seminar',  from_date='2026-04-22', to_date='2026-04-23', days=2, status='Pending with Lecturer', remarks=''),
        Leave(applicant_id=students[6].id, applicant_role='student', applicant_name='Dev Kapoor',       email='dev@demo.com',      department='Commerce',               class_name='BCom-3', leave_type='medical',  reason='Doctor appointment',from_date='2026-04-24', to_date='2026-04-24', days=1, status='Approved by Lecturer',   remarks='Approved.'),
        Leave(applicant_id=lecturers[0].id,applicant_role='lecturer',applicant_name='Dr. Priya Nair',   email='priya@demo.com',    department='Computer Science',        class_name='',       leave_type='medical',  reason='Medical checkup',   from_date='2026-04-25', to_date='2026-04-25', days=1, status='Pending with Management', remarks=''),
        Leave(applicant_id=lecturers[4].id,applicant_role='lecturer',applicant_name='Dr. Kavitha Reddy',email='kavitha@demo.com',  department='Commerce',               class_name='',       leave_type='personal', reason='Family emergency',  from_date='2026-04-26', to_date='2026-04-26', days=1, status='Approved by Management',  remarks='Approved.'),
    ]
    db.session.add_all(leaves)
    db.session.commit()
    print('Database seeded with BCom, BBA, BCA departments.')
