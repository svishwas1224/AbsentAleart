from extensions import db
from datetime import datetime

class Student(db.Model):
    __tablename__ = 'students'
    id           = db.Column(db.Integer, primary_key=True)
    roll_no      = db.Column(db.String(30), unique=True, nullable=False)
    email        = db.Column(db.String(120), unique=True, nullable=False)
    password     = db.Column(db.String(200), nullable=False)
    student_name = db.Column(db.String(100))
    department   = db.Column(db.String(100), nullable=False)
    class_name   = db.Column(db.String(50), nullable=False)
    semester     = db.Column(db.String(20))
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return dict(id=self.id, roll_no=self.roll_no, email=self.email,
                    student_name=self.student_name, department=self.department,
                    class_name=self.class_name, semester=self.semester,
                    created_at=str(self.created_at))


class Lecturer(db.Model):
    __tablename__ = 'lecturers'
    id            = db.Column(db.Integer, primary_key=True)
    lecturer_name = db.Column(db.String(100), nullable=False)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password      = db.Column(db.String(200), nullable=False)
    lecturer_id   = db.Column(db.String(30))
    department    = db.Column(db.String(100), nullable=False)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return dict(id=self.id, lecturer_name=self.lecturer_name, email=self.email,
                    lecturer_id=self.lecturer_id, department=self.department,
                    created_at=str(self.created_at))


class Management(db.Model):
    __tablename__ = 'management'
    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(200), nullable=False)
    role       = db.Column(db.String(10), default='admin')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return dict(id=self.id, email=self.email, role=self.role)


class Class(db.Model):
    __tablename__ = 'classes'
    id         = db.Column(db.Integer, primary_key=True)
    class_name = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(100))
    semester   = db.Column(db.String(20))
    section    = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return dict(id=self.id, class_name=self.class_name, department=self.department,
                    semester=self.semester, section=self.section)


class Subject(db.Model):
    __tablename__ = 'subjects'
    id           = db.Column(db.Integer, primary_key=True)
    subject_name = db.Column(db.String(100), nullable=False)
    subject_code = db.Column(db.String(20))
    department   = db.Column(db.String(100))
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return dict(id=self.id, subject_name=self.subject_name,
                    subject_code=self.subject_code, department=self.department)


class LecturerAssignment(db.Model):
    __tablename__ = 'lecturer_assignments'
    id               = db.Column(db.Integer, primary_key=True)
    lecturer_id      = db.Column(db.Integer, db.ForeignKey('lecturers.id'), nullable=False)
    class_id         = db.Column(db.Integer, db.ForeignKey('classes.id'), nullable=False)
    subject_id       = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=True)
    is_mentor        = db.Column(db.Boolean, default=False)   # class in-charge / mentor
    department       = db.Column(db.String(100))
    assigned_by_admin= db.Column(db.Integer, db.ForeignKey('management.id'))
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    lecturer = db.relationship('Lecturer', backref='assignments')
    cls      = db.relationship('Class',    backref='assignments')
    subject  = db.relationship('Subject',  backref='assignments')

    def to_dict(self):
        return dict(
            id=self.id,
            lecturer_id=self.lecturer_id,
            lecturer_name=self.lecturer.lecturer_name if self.lecturer else '',
            class_id=self.class_id,
            class_name=self.cls.class_name if self.cls else '',
            subject_id=self.subject_id,
            subject_name=self.subject.subject_name if self.subject else '—',
            is_mentor=self.is_mentor,
            department=self.department,
        )


# Leave statuses
LEAVE_STATUSES = [
    'Pending with Lecturer',
    'Approved by Lecturer',
    'Rejected by Lecturer',
    'Forwarded to Management',
    'Pending with Management',
    'Approved by Management',
    'Rejected by Management',
]

class Leave(db.Model):
    __tablename__ = 'leaves'
    id             = db.Column(db.Integer, primary_key=True)
    applicant_id   = db.Column(db.Integer, nullable=False)
    applicant_role = db.Column(db.String(15), nullable=False)   # student | lecturer
    applicant_name = db.Column(db.String(100))
    email          = db.Column(db.String(120))
    department     = db.Column(db.String(100))
    class_name     = db.Column(db.String(50))
    leave_type     = db.Column(db.String(30), nullable=False)
    reason         = db.Column(db.Text, nullable=False)
    from_date      = db.Column(db.String(12), nullable=False)
    to_date        = db.Column(db.String(12), nullable=False)
    days           = db.Column(db.Integer, default=1)
    status         = db.Column(db.String(40), default='Pending with Lecturer')
    handled_by     = db.Column(db.Integer)
    forwarded_to   = db.Column(db.String(20))
    remarks        = db.Column(db.String(300), default='')
    created_at     = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at     = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return dict(
            id=self.id, applicant_id=self.applicant_id,
            applicant_role=self.applicant_role, applicant_name=self.applicant_name,
            email=self.email, department=self.department, class_name=self.class_name,
            leave_type=self.leave_type, reason=self.reason,
            from_date=self.from_date, to_date=self.to_date, days=self.days,
            status=self.status, handled_by=self.handled_by,
            forwarded_to=self.forwarded_to, remarks=self.remarks,
            created_at=str(self.created_at), updated_at=str(self.updated_at),
        )
