import nodemailer from "nodemailer"
import { getVerificationEmailHtml } from "@/features/user-mgmt/components/email-template"

const DEMO_EMAIL_FROM = "noreply@bentahub.local"

let cachedTransporter: nodemailer.Transporter | null = null

/**
 * Dynamically resolves the best available nodemailer transporter.
 * 1. Checks if a local SMTP mail catcher (e.g. Mailpit/Maildev) is running on localhost:1025.
 * 2. Uses explicit SMTP credentials (e.g., Gmail) if configured in environment variables.
 * 3. Falls back to pre-created Ethereal credentials.
 * 4. Falls back to generating a fresh Ethereal test account dynamically.
 * 5. Absolute fallback: mock JSON transport (never fails, useful offline).
 */
async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) return cachedTransporter

  const emailHost = process.env.EMAIL_HOST || "localhost"
  const emailPort = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 1025
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD
  const emailService = process.env.EMAIL_SERVICE

  // 1. Try environment-configured SMTP credentials (e.g., Gmail) if provided
  if (emailUser && emailPassword) {
    try {
      let transport: nodemailer.Transporter
      if (emailService) {
        transport = nodemailer.createTransport({
          service: emailService,
          auth: {
            user: emailUser,
            pass: emailPassword.replace(/\s+/g, ""),
          },
        })
      } else {
        transport = nodemailer.createTransport({
          host: emailHost,
          port: emailPort,
          secure: process.env.EMAIL_SECURE === "true",
          auth: {
            user: emailUser,
            pass: emailPassword.replace(/\s+/g, ""),
          },
        })
      }
      await transport.verify()
      console.log(`✉️ Connected to environment-configured SMTP server.`)
      cachedTransporter = transport
      return cachedTransporter
    } catch {
      console.warn("⚠️ Configured SMTP credentials failed to authenticate. Falling back...")
    }
  }

  // 2. Try to connect to a local SMTP mail catcher (e.g., Mailpit) on localhost:1025
  try {
    const localTransporter = nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      secure: false,
      ignoreTLS: true,
    })
    await localTransporter.verify()
    console.log("✉️ Connected to local SMTP mail catcher at localhost:1025")
    cachedTransporter = localTransporter
    return cachedTransporter
  } catch {
    // Local mail catcher not running, continue fallback
  }

  // 3. Fallback to hardcoded Ethereal test credentials
  try {
    const etherealTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: "verna.hickle92@ethereal.email",
        pass: "UaK16f7311m4UjXFdq",
      },
    })
    await etherealTransporter.verify()
    console.log("✉️ Connected to hardcoded Ethereal test account.")
    cachedTransporter = etherealTransporter
    return cachedTransporter
  } catch {
    // Hardcoded credentials expired or rejected, continue fallback
  }

  // 4. Dynamic Ethereal account generation (requires internet connection)
  try {
    console.log("✉️ Generating a fresh Ethereal test account dynamically...")
    const testAccount = await nodemailer.createTestAccount()
    const dynamicTransporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    await dynamicTransporter.verify()
    console.log(`✅ Fresh Ethereal account created successfully: ${testAccount.user}`)
    cachedTransporter = dynamicTransporter
    return cachedTransporter
  } catch {
    console.warn("⚠️ Failed to generate dynamic Ethereal account. Falling back to JSON transport.")
  }

  // 5. Absolute fallback: Mock JSON transport (works offline, never fails)
  console.log("✉️ Using local JSON transport fallback (offline-friendly).")
  cachedTransporter = nodemailer.createTransport({
    jsonTransport: true,
  })
  return cachedTransporter
}

/**
 * Sends a verification email containing the 6-digit OTP code.
 * Also logs the code to the terminal for easy local testing.
 */
export async function sendVerificationEmail(email: string, code: string, fullName: string): Promise<boolean> {
  try {
    const transporter = await getTransporter()
    
    // Print code to terminal so developers can copy/paste it immediately
    console.log("\n==================================================")
    console.log(`[VERIFICATION EMAIL LOG]`)
    console.log(`To: ${email} (${fullName})`)
    console.log(`Code: ${code}`)
    console.log("==================================================\n")

    const info = await transporter.sendMail({
      from: DEMO_EMAIL_FROM,
      to: email,
      subject: "Verify your BentaHub Account",
      html: getVerificationEmailHtml(fullName, code),
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`✉️ View sent email preview online: ${previewUrl}`)
    }

    return true
  } catch (error) {
    console.error("❌ Failed to send verification email:")
    console.error("   Error:", error instanceof Error ? error.message : String(error))
    // Reset cached transporter on error to try a fresh connection strategy on next attempt
    cachedTransporter = null
    return false
  }
}

/**
 * Sends a password reset email containing the reset link and code.
 */
export async function sendPasswordResetEmail(email: string, code: string, resetLink: string, fullName: string): Promise<boolean> {
  try {
    const transporter = await getTransporter()
    
    console.log("\n==================================================")
    console.log(`[PASSWORD RESET EMAIL LOG]`)
    console.log(`To: ${email} (${fullName})`)
    console.log(`Code: ${code}`)
    console.log(`Link: ${resetLink}`)
    console.log("==================================================\n")

    const info = await transporter.sendMail({
      from: DEMO_EMAIL_FROM,
      to: email,
      subject: "Reset your BentaHub Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Reset Your Password</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Hi ${fullName},
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            You requested to reset your password. Use the verification code below to proceed:
          </p>
          <div style="background-color: #f7f7f7; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 1px dashed #d0d0d0;">
            <p style="font-size: 36px; font-weight: bold; color: #1a56db; letter-spacing: 6px; margin: 0;">
              ${code}
            </p>
          </div>
          <p style="color: #666; font-size: 16px; line-height: 1.5; text-align: center;">
            Or click the button below to go directly to the password reset page:
          </p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${resetLink}" style="background-color: #1a56db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #999; font-size: 13px; text-align: center;">
            This link and code will expire in 1 hour.
          </p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #aaa; font-size: 11px; text-align: center; margin: 0;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`✉️ View sent email preview online: ${previewUrl}`)
    }

    return true
  } catch (error) {
    console.error("❌ Failed to send password reset email:")
    console.error("   Error:", error instanceof Error ? error.message : String(error))
    cachedTransporter = null
    return false
  }
}
