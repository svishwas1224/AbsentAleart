from flask import Blueprint, request, jsonify, session
from models import Class, Subject, LecturerAssignment, Student, Lecturer, Leave
from extensions import db

admin_bp = Blueprint('admin', __name__)

def require_management():
    if session.get('user_role') != 'management':
        return jsonify({'error': 'Forbidden — management only'}), 403
    return None

# ── Classes ───────────────────────────────────────────────────
@admin_bp.route('/create-class', methods=['POST'])
def create_class():
    err = require_management()
    if err: return err
    d = request.get_json()
    if not d.get('class_name'):
        return jsonify({'error': 'class_name required'}), 400
    c = Class(class_name=d['class_name'], department=d.get('department',''),
              semester=d.get('semester',''), section=d.get('section',''))
    db.session.add(c); db.session.commit()
    return jsonify(c.to_dict()), 201

@admin_bp.route('/classes', methods=['GET'])
def get_classes():
    return jsonify([c.to_dict() for c in Class.query.all()]), 200

@admin_bp.route('/delete-class/<int:cid>', methods=['DELETE'])
def delete_class(cid):
    err = require_management()
    if err: return err
    c = Class.query.get_or_404(cid)
    db.session.delete(c); db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

# ── Subjects ──────────────────────────────────────────────────
@admin_bp.route('/create-subject', methods=['POST'])
def create_subject():
    err = require_management()
    if err: return err
    d = request.get_json()
    if not d.get('subject_name'):
        return jsonify({'error': 'subject_name required'}), 400
    s = Subject(subject_name=d['subject_name'], subject_code=d.get('subject_code',''),
                department=d.get('department',''))
    db.session.add(s); db.session.commit()
    return jsonify(s.to_dict()), 201

@admin_bp.route('/subjects', methods=['GET'])
def get_subjects():
    return jsonify([s.to_dict() for s in Subject.query.all()]), 200

@admin_bp.route('/delete-subject/<int:sid>', methods=['DELETE'])
def delete_subject(sid):
    err = require_management()
    if err: return err
    s = Subject.query.get_or_404(sid)
    db.session.delete(s); db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

# ── Lecturer Assignments ──────────────────────────────────────
@admin_bp.route('/assign-lecturer', methods=['POST'])
def assign_lecturer():
    err = require_management()
    if err: return err
    d = request.get_json()
    if not d.get('lecturer_id') or not d.get('class_id'):
        return jsonify({'error': 'lecturer_id and class_id required'}), 400

    # If setting as mentor, clear existing mentor for this class first
    if d.get('is_mentor'):
        LecturerAssignment.query.filter_by(
            class_id=d['class_id'], is_mentor=True
        ).update({'is_mentor': False})

    a = LecturerAssignment(
        lecturer_id=d['lecturer_id'],
        class_id=d['class_id'],
        subject_id=d.get('subject_id') or None,
        is_mentor=bool(d.get('is_mentor', False)),
        department=d.get('department', ''),
        assigned_by_admin=session.get('user_id')
    )
    db.session.add(a); db.session.commit()
    return jsonify(a.to_dict()), 201

@admin_bp.route('/assignments', methods=['GET'])
def get_assignments():
    return jsonify([a.to_dict() for a in LecturerAssignment.query.all()]), 200

@admin_bp.route('/update-assignment/<int:aid>', methods=['PUT'])
def update_assignment(aid):
    err = require_management()
    if err: return err
    a = LecturerAssignment.query.get_or_404(aid)
    d = request.get_json()
    if d.get('lecturer_id'): a.lecturer_id = d['lecturer_id']
    if d.get('class_id'):    a.class_id    = d['class_id']
    if d.get('subject_id'):  a.subject_id  = d['subject_id']
    db.session.commit()
    return jsonify(a.to_dict()), 200

@admin_bp.route('/delete-assignment/<int:aid>', methods=['DELETE'])
def delete_assignment(aid):
    err = require_management()
    if err: return err
    a = LecturerAssignment.query.get_or_404(aid)
    db.session.delete(a); db.session.commit()
    return jsonify({'message': 'Deleted'}), 200

# ── Students & Lecturers ──────────────────────────────────────
@admin_bp.route('/students', methods=['GET'])
def get_students():
    err = require_management()
    if err: return err
    return jsonify([s.to_dict() for s in Student.query.all()]), 200

@admin_bp.route('/lecturers', methods=['GET'])
def get_lecturers():
    err = require_management()
    if err: return err
    return jsonify([l.to_dict() for l in Lecturer.query.all()]), 200

# ── Dashboard analytics ───────────────────────────────────────
@admin_bp.route('/dashboard', methods=['GET'])
def dashboard():
    err = require_management()
    if err: return err
    leaves = Leave.query.all()
    return jsonify({
        'total_students':  Student.query.count(),
        'total_lecturers': Lecturer.query.count(),
        'total_leaves':    len(leaves),
        'pending_lecturer':  sum(1 for l in leaves if l.status == 'Pending with Lecturer'),
        'pending_management':sum(1 for l in leaves if l.status in ('Pending with Management','Forwarded to Management')),
        'approved':          sum(1 for l in leaves if 'Approved' in l.status),
        'rejected':          sum(1 for l in leaves if 'Rejected' in l.status),
        'forwarded':         sum(1 for l in leaves if l.status == 'Forwarded to Management'),
    }), 200
