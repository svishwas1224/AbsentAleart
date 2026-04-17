from flask import Blueprint, request, jsonify, session, current_app
from models import Leave, Student, Lecturer, LecturerAssignment, Class
from extensions import db
from mail_service import notify_leave_submitted, notify_leave_status, notify_lecturer_leave_status
from datetime import datetime

leaves_bp = Blueprint('leaves', __name__)

def current_user():
    return session.get('user_id'), session.get('user_role')


# ── Apply Leave ───────────────────────────────────────────────
@leaves_bp.route('/apply', methods=['POST'])
def apply_leave():
    uid, role = current_user()
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401

    d = request.get_json()

    if role == 'student':
        student = Student.query.get(uid)
        assignments = LecturerAssignment.query.join(Class).filter(
            Class.class_name == student.class_name
        ).all()
        initial_status = 'Pending with Lecturer' if assignments else 'Pending with Management'

        leave = Leave(
            applicant_id=uid, applicant_role='student',
            applicant_name=student.student_name or student.roll_no,
            email=student.email, department=student.department,
            class_name=student.class_name,
            leave_type=d['leave_type'], reason=d['reason'],
            from_date=d['from_date'], to_date=d['to_date'],
            days=d.get('days', 1), status=initial_status
        )
        db.session.add(leave)
        db.session.commit()

        # Email all assigned lecturers
        for a in assignments:
            lec = Lecturer.query.get(a.lecturer_id)
            if lec:
                notify_leave_submitted(
                    current_app._get_current_object(),
                    student_name=student.student_name or student.roll_no,
                    leave_type=d['leave_type'],
                    from_date=d['from_date'],
                    to_date=d['to_date'],
                    reason=d['reason'],
                    lecturer_email=lec.email,
                    lecturer_name=lec.lecturer_name,
                )

    elif role == 'lecturer':
        lec = Lecturer.query.get(uid)
        leave = Leave(
            applicant_id=uid, applicant_role='lecturer',
            applicant_name=lec.lecturer_name, email=lec.email,
            department=lec.department, class_name='',
            leave_type=d['leave_type'], reason=d['reason'],
            from_date=d['from_date'], to_date=d['to_date'],
            days=d.get('days', 1), status='Pending with Management'
        )
        db.session.add(leave)
        db.session.commit()
    else:
        return jsonify({'error': 'Only students and lecturers can apply'}), 403

    return jsonify(leave.to_dict()), 201


# ── My Leaves ─────────────────────────────────────────────────
@leaves_bp.route('/my', methods=['GET'])
def my_leaves():
    uid, role = current_user()
    if not uid:
        return jsonify({'error': 'Not authenticated'}), 401
    leaves = Leave.query.filter_by(applicant_id=uid, applicant_role=role).order_by(Leave.id.desc()).all()
    return jsonify([l.to_dict() for l in leaves]), 200


# ── Student requests visible to Lecturer ─────────────────────
@leaves_bp.route('/student-requests', methods=['GET'])
def student_requests():
    uid, role = current_user()
    if role != 'lecturer':
        return jsonify({'error': 'Forbidden'}), 403

    assignments = LecturerAssignment.query.filter_by(lecturer_id=uid).all()
    class_ids   = {a.class_id for a in assignments}
    class_names = set()
    for cid in class_ids:
        c = Class.query.get(cid)
        if c:
            class_names.add(c.class_name)

    leaves = Leave.query.filter(
        Leave.applicant_role == 'student',
        Leave.class_name.in_(class_names),
        Leave.status.in_(['Pending with Lecturer', 'Approved by Lecturer',
                          'Rejected by Lecturer', 'Forwarded to Management'])
    ).order_by(Leave.id.desc()).all()
    return jsonify([l.to_dict() for l in leaves]), 200


# ── Lecturer leave requests visible to Management ─────────────
@leaves_bp.route('/lecturer-requests', methods=['GET'])
def lecturer_requests():
    _, role = current_user()
    if role != 'management':
        return jsonify({'error': 'Forbidden'}), 403
    leaves = Leave.query.filter_by(applicant_role='lecturer').order_by(Leave.id.desc()).all()
    return jsonify([l.to_dict() for l in leaves]), 200


# ── All leaves (management) ───────────────────────────────────
@leaves_bp.route('/all', methods=['GET'])
def all_leaves():
    _, role = current_user()
    if role != 'management':
        return jsonify({'error': 'Forbidden'}), 403
    leaves = Leave.query.order_by(Leave.id.desc()).all()
    return jsonify([l.to_dict() for l in leaves]), 200


# ── Student report ────────────────────────────────────────────
@leaves_bp.route('/student-report', methods=['GET'])
def student_report():
    _, role = current_user()
    if role != 'management':
        return jsonify({'error': 'Forbidden'}), 403
    leaves = Leave.query.filter(
        Leave.applicant_role == 'student',
        Leave.status.in_([
            'Pending with Lecturer', 'Pending with Management',
            'Forwarded to Management', 'Approved by Lecturer', 'Approved by Management',
        ])
    ).order_by(Leave.id.desc()).all()
    return jsonify([l.to_dict() for l in leaves]), 200


# ── Approve ───────────────────────────────────────────────────
@leaves_bp.route('/approve/<int:lid>', methods=['POST'])
def approve(lid):
    uid, role = current_user()
    leave = Leave.query.get_or_404(lid)
    d = request.get_json() or {}
    remarks = d.get('remarks', 'Approved.')

    if role == 'lecturer':
        if leave.status != 'Pending with Lecturer':
            return jsonify({'error': 'Cannot approve at this stage'}), 400
        leave.status     = 'Approved by Lecturer'
        leave.handled_by = uid
        leave.remarks    = remarks
        leave.updated_at = datetime.utcnow()
        db.session.commit()

        # Email student
        student = Student.query.get(leave.applicant_id)
        if student:
            notify_leave_status(
                current_app._get_current_object(),
                student_name=student.student_name or student.roll_no,
                student_email=student.email,
                leave_type=leave.leave_type,
                from_date=leave.from_date,
                to_date=leave.to_date,
                status='Approved by Lecturer',
                remarks=remarks,
            )

    elif role == 'management':
        if leave.status not in ('Pending with Management', 'Forwarded to Management'):
            return jsonify({'error': 'Cannot approve at this stage'}), 400
        leave.status     = 'Approved by Management'
        leave.handled_by = uid
        leave.remarks    = remarks
        leave.updated_at = datetime.utcnow()
        db.session.commit()

        # Email applicant (student or lecturer)
        if leave.applicant_role == 'student':
            student = Student.query.get(leave.applicant_id)
            if student:
                notify_leave_status(
                    current_app._get_current_object(),
                    student_name=student.student_name or student.roll_no,
                    student_email=student.email,
                    leave_type=leave.leave_type,
                    from_date=leave.from_date,
                    to_date=leave.to_date,
                    status='Approved by Management',
                    remarks=remarks,
                )
        elif leave.applicant_role == 'lecturer':
            lec = Lecturer.query.get(leave.applicant_id)
            if lec:
                notify_lecturer_leave_status(
                    current_app._get_current_object(),
                    lecturer_name=lec.lecturer_name,
                    lecturer_email=lec.email,
                    leave_type=leave.leave_type,
                    from_date=leave.from_date,
                    to_date=leave.to_date,
                    status='Approved by Management',
                    remarks=remarks,
                )
    else:
        return jsonify({'error': 'Forbidden'}), 403

    return jsonify(leave.to_dict()), 200


# ── Reject ────────────────────────────────────────────────────
@leaves_bp.route('/reject/<int:lid>', methods=['POST'])
def reject(lid):
    uid, role = current_user()
    leave = Leave.query.get_or_404(lid)
    d = request.get_json() or {}
    remarks = d.get('remarks', 'Rejected.')

    if role == 'lecturer':
        if leave.status != 'Pending with Lecturer':
            return jsonify({'error': 'Cannot reject at this stage'}), 400
        leave.status     = 'Rejected by Lecturer'
        leave.handled_by = uid
        leave.remarks    = remarks
        leave.updated_at = datetime.utcnow()
        db.session.commit()

        student = Student.query.get(leave.applicant_id)
        if student:
            notify_leave_status(
                current_app._get_current_object(),
                student_name=student.student_name or student.roll_no,
                student_email=student.email,
                leave_type=leave.leave_type,
                from_date=leave.from_date,
                to_date=leave.to_date,
                status='Rejected by Lecturer',
                remarks=remarks,
            )

    elif role == 'management':
        if leave.status not in ('Pending with Management', 'Forwarded to Management'):
            return jsonify({'error': 'Cannot reject at this stage'}), 400
        leave.status     = 'Rejected by Management'
        leave.handled_by = uid
        leave.remarks    = remarks
        leave.updated_at = datetime.utcnow()
        db.session.commit()

        if leave.applicant_role == 'student':
            student = Student.query.get(leave.applicant_id)
            if student:
                notify_leave_status(
                    current_app._get_current_object(),
                    student_name=student.student_name or student.roll_no,
                    student_email=student.email,
                    leave_type=leave.leave_type,
                    from_date=leave.from_date,
                    to_date=leave.to_date,
                    status='Rejected by Management',
                    remarks=remarks,
                )
        elif leave.applicant_role == 'lecturer':
            lec = Lecturer.query.get(leave.applicant_id)
            if lec:
                notify_lecturer_leave_status(
                    current_app._get_current_object(),
                    lecturer_name=lec.lecturer_name,
                    lecturer_email=lec.email,
                    leave_type=leave.leave_type,
                    from_date=leave.from_date,
                    to_date=leave.to_date,
                    status='Rejected by Management',
                    remarks=remarks,
                )
    else:
        return jsonify({'error': 'Forbidden'}), 403

    return jsonify(leave.to_dict()), 200


# ── Forward to Management ─────────────────────────────────────
@leaves_bp.route('/forward/<int:lid>', methods=['POST'])
def forward(lid):
    uid, role = current_user()
    if role != 'lecturer':
        return jsonify({'error': 'Only lecturers can forward'}), 403
    leave = Leave.query.get_or_404(lid)
    if leave.status != 'Pending with Lecturer':
        return jsonify({'error': 'Can only forward pending leaves'}), 400
    d = request.get_json() or {}
    leave.status       = 'Forwarded to Management'
    leave.forwarded_to = 'management'
    leave.handled_by   = uid
    leave.remarks      = d.get('remarks', 'Forwarded to management for review.')
    leave.updated_at   = datetime.utcnow()
    db.session.commit()
    return jsonify(leave.to_dict()), 200
