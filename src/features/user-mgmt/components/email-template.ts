/**
 * Email Template Component for BentaHub Verification
 * Returns a fully styled, responsive HTML template string for email clients.
 */
export function getVerificationEmailHtml(fullName: string, code: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your BentaHub Account</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f9fafb;
          color: #1f2937;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          padding: 32px;
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
        }
        .logo {
          font-size: 24px;
          font-weight: 800;
          color: #2563eb;
          text-decoration: none;
          letter-spacing: -0.025em;
        }
        .title {
          font-size: 22px;
          font-weight: 700;
          color: #111827;
          text-align: center;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .greeting {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 16px;
          line-height: 1.5;
        }
        .text {
          font-size: 15px;
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .code-container {
          background-color: #f3f4f6;
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          padding: 18px;
          text-align: center;
          margin: 24px 0;
        }
        .code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 36px;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: 8px;
          margin: 0;
        }
        .expiry {
          font-size: 13px;
          color: #9ca3af;
          text-align: center;
          margin-top: 8px;
        }
        .footer {
          margin-top: 32px;
          border-top: 1px solid #f3f4f6;
          padding-top: 24px;
          text-align: center;
        }
        .footer-text {
          font-size: 12px;
          color: #9ca3af;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo">BENTAHUB</span>
        </div>
        <h1 class="title">Email Verification</h1>
        <p class="greeting">Hi ${fullName},</p>
        <p class="text">
          Thank you for registering an account on BentaHub. To complete your registration and secure your account, please verify your email address by using the 6-digit verification code below:
        </p>
        <div class="code-container">
          <p class="code">${code}</p>
        </div>
        <p class="expiry">This verification code is valid for <strong>5 minutes</strong>. If the code expires, you can request a new one.</p>
        <div class="footer">
          <p class="footer-text">
            If you did not request this email, please disregard it. Your email address was used to register a customer account on BentaHub.
          </p>
          <p class="footer-text" style="margin-top: 8px;">
            &copy; 2026 BentaHub. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
