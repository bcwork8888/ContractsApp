require('dotenv').config();
const { Resend } = require('resend');

// Initialize Resend client if API key is provided
const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : '';
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

// Default sender address:
// Resend provides 'onboarding@resend.dev' for sandbox / unverified testing domains.
// For production with custom domain, configure RESEND_FROM_EMAIL (e.g. 'FieldSync <noreply@yourdomain.com>').
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'FieldSync <onboarding@resend.dev>';

/**
 * Base email sending function using Resend
 * Falls back gracefully to simulation mode if RESEND_API_KEY is not configured.
 */
async function sendEmail({ to, subject, html, text, from = DEFAULT_FROM }) {
    if (!to) {
        console.warn('[Resend] Warning: Cannot send email without recipient address.');
        return { success: false, error: 'Recipient address required' };
    }

    const recipients = Array.isArray(to) ? to : [to];
    const isTestMode = process.env.NODE_ENV === 'test';

    // In test environment or if client is not configured
    if (!resendClient || isTestMode) {
        console.log(`
======================================================================
[RESEND - SIMULATED EMAIL DELIVERY (${isTestMode ? 'TEST MODE' : 'NO API KEY'})]
To: ${recipients.join(', ')}
From: ${from}
Subject: ${subject}
Text Body:
${text || '(No plain text body provided)'}
----------------------------------------------------------------------
Tip: Add RESEND_API_KEY=re_... in your .env file to send real emails.
======================================================================
        `);
        return {
            success: true,
            simulated: true,
            id: 'sim_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
        };
    }

    try {
        const payload = {
            from,
            to: recipients,
            subject,
            html,
            text
        };

        const result = await resendClient.emails.send(payload);

        if (result.error) {
            console.error('[Resend Error]', result.error);
            return {
                success: false,
                error: result.error.message || result.error
            };
        }

        const emailId = result.data ? result.data.id : null;
        console.log(`[Resend] Email successfully dispatched to ${recipients.join(', ')} (ID: ${emailId})`);
        return {
            success: true,
            id: emailId,
            data: result.data
        };
    } catch (err) {
        console.error('[Resend Exception]', err.message || err);
        return {
            success: false,
            error: err.message || err
        };
    }
}

/**
 * Send password reset link email to an Admin
 */
async function sendPasswordResetEmail({ to, username, fullname, resetLink }) {
    const displayName = fullname || username || 'Admin';
    const subject = 'FieldSync Password Reset Link';

    const text = `Hello ${displayName},

You requested a password reset for your FieldSync Admin account.
Please click the link below to set a new password:

${resetLink}

This link will expire in 1 hour.
If you did not request this password reset, please disregard this email.

Best regards,
The FieldSync Team`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); padding: 28px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">FieldSync</h1>
        <p style="color: #bfdbfe; margin: 6px 0 0 0; font-size: 13px;">Security & Account Management</p>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Password Reset Request</h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #334155;">Hello <strong>${displayName}</strong>,</p>
        <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
          You requested a password reset for your FieldSync Admin account. Click the button below to choose a new password:
        </p>

        <!-- CTA Button -->
        <table border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center" style="border-radius: 6px; background-color: #2563eb;">
              <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 13px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">Reset Password</a>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.5; color: #64748b;">
          <strong>Security Notice:</strong> This link will expire in <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email — your existing password remains secure.
        </p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; word-break: break-all;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${resetLink}" style="color: #2563eb; text-decoration: underline;">${resetLink}</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} FieldSync Inc. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return await sendEmail({ to, subject, html, text });
}

/**
 * Send contract signing link email to customer ("Sign Later" flow)
 */
async function sendContractSignEmail({ to, customerName, projectName, signLink, companyName }) {
    const senderCompany = companyName || 'FieldSync';
    const clientName = customerName || 'Valued Customer';
    const subject = `Sign your contract for project: ${projectName || 'FieldSync Project'}`;

    const text = `Hello ${clientName},

${senderCompany} has prepared a contract for your project "${projectName || 'FieldSync Project'}".

Please review and sign your contract by visiting the link below:
${signLink}

Thank you for your business!

Best regards,
${senderCompany}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 28px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">${senderCompany}</h1>
        <p style="color: #d1fae5; margin: 6px 0 0 0; font-size: 13px;">Contract Signature Request</p>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Action Required: Sign Your Contract</h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #334155;">Hello <strong>${clientName}</strong>,</p>
        <p style="margin: 0 0 20px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
          <strong>${senderCompany}</strong> has finalized the contract documents for project:
        </p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px 18px; margin-bottom: 24px; border-radius: 0 6px 6px 0;">
          <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Project</div>
          <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 2px;">${projectName || 'FieldSync Project'}</div>
        </div>

        <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
          Please review the contract details, terms, and specifications, then provide your digital signature using the secure link below:
        </p>

        <!-- CTA Button -->
        <table border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center" style="border-radius: 6px; background-color: #10b981;">
              <a href="${signLink}" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">Review & Sign Contract</a>
            </td>
          </tr>
        </table>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

        <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; word-break: break-all;">
          If the button above does not work, copy and paste this URL into your browser:<br>
          <a href="${signLink}" style="color: #059669; text-decoration: underline;">${signLink}</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          Powered by FieldSync Contractor Platform • © ${new Date().getFullYear()} ${senderCompany}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return await sendEmail({ to, subject, html, text });
}

/**
 * Send temporary password email to user when Admin resets their password
 */
async function sendTemporaryPasswordEmail({ to, username, fullname, tempPassword, companyName }) {
    const displayName = fullname || username || 'Team Member';
    const senderCompany = companyName || 'FieldSync';
    const subject = 'FieldSync Temporary Password Assigned';

    const text = `Hello ${displayName},

Your administrator at ${senderCompany} has assigned a temporary password to your account.

Temporary Password: ${tempPassword}

Please log in with this temporary password and update your credentials as soon as possible.

Best regards,
${senderCompany}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #475569 0%, #334155 100%); padding: 28px 32px; text-align: left;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">FieldSync</h1>
        <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px;">Temporary Password Notification</p>
      </td>
    </tr>
    <!-- Content Body -->
    <tr>
      <td style="padding: 32px;">
        <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">Temporary Password Assigned</h2>
        <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.5; color: #334155;">Hello <strong>${displayName}</strong>,</p>
        <p style="margin: 0 0 20px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
          Your administrator at <strong>${senderCompany}</strong> has assigned a temporary password to your FieldSync account:
        </p>

        <!-- Temp Password Box -->
        <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
          <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #1d4ed8; margin-bottom: 6px;">Your Temporary Password</div>
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 24px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px;">${tempPassword}</div>
        </div>

        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; color: #475569;">
          Please log in to your account with this temporary password and update your password immediately.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          © ${new Date().getFullYear()} FieldSync Inc. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return await sendEmail({ to, subject, html, text });
}

module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendContractSignEmail,
    sendTemporaryPasswordEmail,
    DEFAULT_FROM
};
