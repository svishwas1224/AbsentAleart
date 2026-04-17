"""
AbsentAlert — Email Notification Service
Sends emails on leave events using Flask-Mail + Gmail SMTP.

Setup:
  1. Enable 2-Step Verification on your Gmail account
  2. Generate an App Password: Google Account > Security > App Passwords
  3. Set MAIL_USERNAME and MAIL_PASSWORD in config below (or use .env)
"""

from flask_mail import Mail, Message

mail = Mail()

# ── Templates ─────────────────────────────────────────────────

def _send(app, subject, recipients, body):
    """Send a single email. Silently logs errors so app never crashes."""
    try:
        with app.app_context():
            msg = Message(
                subject=subject,
                sender=app.config.get('MAIL_USERNAME', 'noreply@absentalert.com'),
                recipients=recipients if isinstance(recipients, list) else [recipients],
            )
            msg.body = body
            mail.send(msg)
            print(f"[MAIL] Sent to {recipients}: {subject}")
    except Exception as e:
        print(f"[MAIL ERROR] {e}")


def notify_leave_submitted(app, student_name, leave_type, from_date, to_date,
                            reason, lecturer_email, lecturer_name):
    """Student submits leave → notify assigned lecturer."""
    _send(
        app,
        subject=f"[AbsentAlert] New Leave Request from {student_name}",
        recipients=lecturer_email,
        body=f"""Dear {lecturer_name},

A new leave request has been submitted and requires your review.

Student   : {student_name}
Leave Type: {leave_type.capitalize()}
From      : {from_date}
To        : {to_date}
Reason    : {reason}

Please log in to AbsentAlert to approve or reject this request.

Regards,
AbsentAlert System
"""
    )


def notify_leave_status(app, student_name, student_email,
                         leave_type, from_date, to_date, status, remarks):
    """Lecturer approves/rejects student leave → notify student."""
    _send(
        app,
        subject=f"[AbsentAlert] Your Leave Request has been {status}",
        recipients=student_email,
        body=f"""Dear {student_name},

Your leave request has been reviewed.

Leave Type: {leave_type.capitalize()}
From      : {from_date}
To        : {to_date}
Status    : {status}
Remarks   : {remarks or 'No remarks provided.'}

Please log in to AbsentAlert to view the full details.

Regards,
AbsentAlert System
"""
    )


def notify_lecturer_leave_status(app, lecturer_name, lecturer_email,
                                  leave_type, from_date, to_date, status, remarks):
    """Management approves/rejects lecturer leave → notify lecturer."""
    _send(
        app,
        subject=f"[AbsentAlert] Your Leave Request has been {status}",
        recipients=lecturer_email,
        body=f"""Dear {lecturer_name},

Your leave request has been reviewed by Management.

Leave Type: {leave_type.capitalize()}
From      : {from_date}
To        : {to_date}
Status    : {status}
Remarks   : {remarks or 'No remarks provided.'}

Please log in to AbsentAlert to view the full details.

Regards,
AbsentAlert System
"""
    )
