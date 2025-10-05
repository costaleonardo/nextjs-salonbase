/**
 * Email Service
 *
 * Uses Resend for transactional emails.
 * Handles receipt emails, appointment confirmations, and other notifications.
 */

import { Resend } from 'resend'
import { render } from '@react-email/render'

// Initialize Resend client
const resend = process.env.EMAIL_API_KEY
  ? new Resend(process.env.EMAIL_API_KEY)
  : null

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@salonbase.app'

/**
 * Send an email using Resend
 */
export async function sendEmail({
  to,
  subject,
  react,
  html,
  text,
}: {
  to: string | string[]
  subject: string
  react?: React.ReactElement
  html?: string
  text?: string
}) {
  if (!resend) {
    console.error('Email service not configured - EMAIL_API_KEY missing')
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Email would have been sent', {
        to,
        subject,
        preview: text?.substring(0, 100),
      })
      return { success: true, data: { id: 'dev-mode' } }
    }
    throw new Error('Email service not configured')
  }

  try {
    const emailBody = react
      ? { react }
      : html
      ? { html, ...(text ? { text } : {}) }
      : text
      ? { text }
      : { html: '' }

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      ...emailBody,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

/**
 * Send email from React component
 */
export async function sendEmailFromComponent({
  to,
  subject,
  component,
}: {
  to: string | string[]
  subject: string
  component: React.ReactElement
}) {
  return sendEmail({
    to,
    subject,
    react: component,
  })
}

/**
 * Render React email component to HTML
 * Useful for previewing or testing email templates
 */
export async function renderEmailToHtml(component: React.ReactElement): Promise<string> {
  return render(component)
}
