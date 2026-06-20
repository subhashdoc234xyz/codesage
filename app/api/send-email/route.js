import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    // 1. Parse the request body
    const { toEmail: requestedEmail, subject, prTitle, review, shareUrl } = await req.json();

    // 2. Read Gmail credentials from environment
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    // 3. Validate recipient
    if (!requestedEmail) {
      return NextResponse.json(
        { error: 'Recipient email (toEmail) is required' },
        { status: 400 }
      );
    }
    const toEmail = requestedEmail;

    // 4. Validate credentials exist
    if (!gmailUser || !gmailAppPassword) {
      console.error('Email not configured. Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env.local');
      return NextResponse.json(
        { error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local' },
        { status: 500 }
      );
    }

    // 5. Create the SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    // 6. Build the score color based on value
    const score = review?.score ?? 0;
    let scoreColor = '#f97316'; // orange default
    if (score >= 8) scoreColor = '#10b981'; // emerald
    else if (score >= 6) scoreColor = '#eab308'; // yellow
    else if (score < 5) scoreColor = '#ef4444'; // red

    const criticalCount = review?.critical?.length || 0;
    const warningsCount = review?.warnings?.length || 0;
    const improvementsCount = review?.improvements?.length || 0;

    // 7. Build critical issues HTML
    let criticalHtml = '';
    if (review?.critical?.length > 0) {
      const items = review.critical.slice(0, 5).map(issue =>
        `<tr>
          <td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;font-size:13px;color:#fca5a5;">
            🔴 ${escapeHtml(typeof issue === 'string' ? issue : issue.message || issue.description || JSON.stringify(issue))}
          </td>
        </tr>`
      ).join('');
      criticalHtml = `
        <tr>
          <td style="padding:0 40px 20px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#ef4444;text-transform:uppercase;letter-spacing:1px;">
              Critical Issues (${criticalCount})
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;">
              ${items}
            </table>
          </td>
        </tr>`;
    }

    // 8. Build warnings HTML
    let warningsHtml = '';
    if (review?.warnings?.length > 0) {
      const items = review.warnings.slice(0, 5).map(issue =>
        `<tr>
          <td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;font-size:13px;color:#fde68a;">
            🟡 ${escapeHtml(typeof issue === 'string' ? issue : issue.message || issue.description || JSON.stringify(issue))}
          </td>
        </tr>`
      ).join('');
      warningsHtml = `
        <tr>
          <td style="padding:0 40px 20px;">
            <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#eab308;text-transform:uppercase;letter-spacing:1px;">
              Warnings (${warningsCount})
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;overflow:hidden;">
              ${items}
            </table>
          </td>
        </tr>`;
    }

    // 9. Build the premium HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#e5e5e5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#111111;border:1px solid #1f1f1f;border-radius:16px;
                      overflow:hidden;max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f2922,#0d1117);
                       padding:32px 40px;border-bottom:1px solid #1f1f1f;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display:inline-block;background:linear-gradient(135deg,#10b981,#06b6d4);
                                width:40px;height:40px;border-radius:12px;text-align:center;
                                line-height:40px;font-weight:800;font-size:16px;color:#000;">
                      CS
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;">
                    <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                      Code<span style="color:#10b981;">Sage</span> AI
                    </h1>
                    <p style="margin:4px 0 0;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                      Smart PR Review Report
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PR Title -->
          <tr>
            <td style="padding:28px 40px 16px;">
              <p style="margin:0 0 6px;font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">
                Pull Request
              </p>
              <h2 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                ${escapeHtml(prTitle || 'Code Review')}
              </h2>
            </td>
          </tr>

          <!-- Score Card -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="20" cellspacing="0"
                     style="background:#0d0d0d;border:1px solid #1f1f1f;border-radius:14px;">
                <tr>
                  <td align="center">
                    <div style="font-size:64px;font-weight:900;color:${scoreColor};line-height:1;">
                      ${score}<span style="font-size:24px;color:#4b5563;">/10</span>
                    </div>
                    <p style="margin:8px 0 0;font-size:15px;font-weight:700;color:${scoreColor};text-transform:uppercase;letter-spacing:1px;">
                      ${escapeHtml(review?.verdict || 'Review Complete')}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Stats Row -->
          <tr>
            <td style="padding:0 40px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" align="center" style="padding:12px 4px;">
                    <div style="background:#1a0a0a;border:1px solid #2a1515;border-radius:10px;padding:14px 8px;">
                      <div style="font-size:24px;font-weight:800;color:#ef4444;">${criticalCount}</div>
                      <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-top:4px;">Critical</div>
                    </div>
                  </td>
                  <td width="33%" align="center" style="padding:12px 4px;">
                    <div style="background:#1a1508;border:1px solid #2a2515;border-radius:10px;padding:14px 8px;">
                      <div style="font-size:24px;font-weight:800;color:#eab308;">${warningsCount}</div>
                      <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-top:4px;">Warnings</div>
                    </div>
                  </td>
                  <td width="33%" align="center" style="padding:12px 4px;">
                    <div style="background:#0a1a14;border:1px solid #152a20;border-radius:10px;padding:14px 8px;">
                      <div style="font-size:24px;font-weight:800;color:#10b981;">${improvementsCount}</div>
                      <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;font-weight:600;margin-top:4px;">Suggestions</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding:0 40px 24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">
                Summary
              </p>
              <p style="margin:0;font-size:14px;color:#d1d5db;line-height:1.7;background:#0d0d0d;border:1px solid #1f1f1f;border-radius:10px;padding:16px;">
                ${escapeHtml(review?.summary || 'No summary available.')}
              </p>
            </td>
          </tr>

          ${criticalHtml}
          ${warningsHtml}

          <!-- CTA Button -->
          ${shareUrl ? `
          <tr>
            <td style="padding:8px 40px 32px;" align="center">
              <a href="${escapeHtml(shareUrl)}"
                 style="display:inline-block;background:linear-gradient(135deg,#10b981,#06b6d4);color:#000;
                        font-weight:700;font-size:14px;text-decoration:none;
                        padding:14px 36px;border-radius:10px;letter-spacing:0.5px;">
                View Full Review →
              </a>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #1f1f1f;" align="center">
              <p style="margin:0;font-size:11px;color:#4b5563;">
                Sent by <strong style="color:#10b981;">CodeSage AI</strong> · Smart PR Reviewer
              </p>
              <p style="margin:6px 0 0;font-size:10px;color:#374151;">
                Powered by Google Gemini 2.5 Flash
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 10. Send the email
    await transporter.sendMail({
      from: `CodeSage AI <${gmailUser}>`,
      to: toEmail,
      subject: subject || `CodeSage Review: ${prTitle || 'Code Review'} — Score ${score}/10`,
      html,
    });

    console.log(`✅ Review email sent to ${toEmail}`);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('FULL EMAIL ERROR:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Escape HTML to prevent injection in email template */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
