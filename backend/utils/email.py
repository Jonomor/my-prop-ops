import logging
from .config import (
    MAILCHIMP_MARKETING_API_KEY, MAILCHIMP_MARKETING_SERVER,
    MAILCHIMP_MARKETING_AUDIENCE_ID, MAILCHIMP_TRANSACTIONAL_API_KEY,
    MAILCHIMP_FROM_EMAIL
)

logger = logging.getLogger(__name__)

# Initialize Mailchimp clients
mailchimp_marketing_client = None
mailchimp_transactional_client = None

try:
    import mailchimp_marketing as MailchimpMarketing
    import mailchimp_transactional as MailchimpTransactional
    MAILCHIMP_AVAILABLE = True
except ImportError:
    MAILCHIMP_AVAILABLE = False

if MAILCHIMP_AVAILABLE and MAILCHIMP_MARKETING_API_KEY:
    try:
        mailchimp_marketing_client = MailchimpMarketing.Client()
        mailchimp_marketing_client.set_config({
            "api_key": MAILCHIMP_MARKETING_API_KEY,
            "server": MAILCHIMP_MARKETING_SERVER
        })
        logger.info("Mailchimp Marketing client initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize Mailchimp Marketing: {e}")

if MAILCHIMP_AVAILABLE and MAILCHIMP_TRANSACTIONAL_API_KEY:
    try:
        mailchimp_transactional_client = MailchimpTransactional.Client(MAILCHIMP_TRANSACTIONAL_API_KEY)
        logger.info("Mailchimp Transactional client initialized")
    except Exception as e:
        logger.warning(f"Failed to initialize Mailchimp Transactional: {e}")


def send_transactional_email(to_email: str, subject: str, html_content: str):
    if not mailchimp_transactional_client:
        logger.warning(f"Email not sent (no client): {subject} to {to_email}")
        return False
    
    try:
        message = {
            "from_email": MAILCHIMP_FROM_EMAIL,
            "subject": subject,
            "html": html_content,
            "to": [{"email": to_email, "type": "to"}]
        }
        result = mailchimp_transactional_client.messages.send({"message": message})
        logger.info(f"Email sent: {subject} to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False


def send_welcome_email(email: str, name: str):
    subject = "Welcome to MyPropOps!"
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Welcome to MyPropOps!</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
            <h2 style="color: #111827;">Hi {name},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
                Thank you for joining MyPropOps! We're excited to help you streamline your property management operations.
            </p>
            <p style="color: #4b5563; line-height: 1.6;">
                With your new account, you can:
            </p>
            <ul style="color: #4b5563; line-height: 1.8;">
                <li>Manage properties and units efficiently</li>
                <li>Track maintenance requests</li>
                <li>Schedule and manage inspections</li>
                <li>Keep all your documents organized</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://mypropops.com/dashboard" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Go to Dashboard
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
                If you have any questions, feel free to reach out to our support team.
            </p>
        </div>
        <div style="background: #111827; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2025 MyPropOps. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    return send_transactional_email(email, subject, html_content)


def send_subscription_email(email: str, name: str, plan: str, amount: float):
    subject = f"Subscription Upgraded to {plan.title()} - MyPropOps"
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Subscription Upgraded!</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
            <h2 style="color: #111827;">Hi {name},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
                Great news! Your subscription has been upgraded to the <strong>{plan.title()}</strong> plan.
            </p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #111827;"><strong>Plan:</strong> {plan.title()}</p>
                <p style="margin: 10px 0 0 0; color: #111827;"><strong>Amount:</strong> ${amount:.2f}</p>
            </div>
            <p style="color: #4b5563; line-height: 1.6;">
                You now have access to all the features included in your new plan. Log in to explore what's new!
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://mypropops.com/billing" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View Subscription
                </a>
            </div>
        </div>
        <div style="background: #111827; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2025 MyPropOps. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    return send_transactional_email(email, subject, html_content)


def send_maintenance_notification(email: str, name: str, request_title: str, property_name: str, priority: str):
    subject = f"New Maintenance Request: {request_title}"
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Maintenance Request</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
            <h2 style="color: #111827;">Hi {name},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
                A new maintenance request has been submitted:
            </p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #111827;"><strong>Title:</strong> {request_title}</p>
                <p style="margin: 10px 0 0 0; color: #111827;"><strong>Property:</strong> {property_name}</p>
                <p style="margin: 10px 0 0 0; color: #111827;"><strong>Priority:</strong> {priority.upper()}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://mypropops.com/maintenance" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View Request
                </a>
            </div>
        </div>
        <div style="background: #111827; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2025 MyPropOps. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    return send_transactional_email(email, subject, html_content)


def send_contractor_assignment_email(email: str, name: str, job_title: str, property_address: str, scheduled_date: str = None):
    subject = f"New Job Assigned: {job_title}"
    schedule_text = f"<p style='margin: 10px 0 0 0; color: #111827;'><strong>Scheduled:</strong> {scheduled_date}</p>" if scheduled_date else ""
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">New Job Assigned</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
            <h2 style="color: #111827;">Hi {name},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
                You have been assigned a new maintenance job:
            </p>
            <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #111827;"><strong>Job:</strong> {job_title}</p>
                <p style="margin: 10px 0 0 0; color: #111827;"><strong>Location:</strong> {property_address}</p>
                {schedule_text}
            </div>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://mypropops.com/contractor/jobs" style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    View Job Details
                </a>
            </div>
        </div>
        <div style="background: #111827; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2025 MyPropOps. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    return send_transactional_email(email, subject, html_content)


def send_team_invite_email(email: str, inviter_name: str, org_name: str, invite_link: str):
    subject = f"You've been invited to join {org_name} on MyPropOps"
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">Team Invitation</h1>
        </div>
        <div style="padding: 40px; background: #f9fafb;">
            <h2 style="color: #111827;">You're Invited!</h2>
            <p style="color: #4b5563; line-height: 1.6;">
                <strong>{inviter_name}</strong> has invited you to join <strong>{org_name}</strong> on MyPropOps.
            </p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{invite_link}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    Accept Invitation
                </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
                This invitation will expire in 7 days.
            </p>
        </div>
        <div style="background: #111827; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2025 MyPropOps. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    return send_transactional_email(email, subject, html_content)
