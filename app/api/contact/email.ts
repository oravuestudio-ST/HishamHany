// Pure, dependency-free helpers for the contact route so they can be unit-tested
// without spinning up the Next request/Resend stack.

export function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export interface Inquiry {
  name: string
  email: string
  project?: string
  message: string
}

export function buildInquiryEmail(input: Inquiry): { subject: string; html: string } {
  const safe = {
    name: escapeHtml(input.name),
    email: escapeHtml(input.email),
    project: escapeHtml(input.project || ''),
    message: escapeHtml(input.message).replace(/\n/g, '<br>'),
  }

  const subject = `New Inquiry — ${safe.project || 'General'} from ${safe.name}`

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f0f10;color:#dfd7c5">
      <h2 style="font-size:20px;font-weight:400;margin-bottom:24px;color:#dfd7c5">
        New inquiry from <strong>${safe.name}</strong>
      </h2>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#aaa79f;font-size:12px;letter-spacing:0.1em">Name</td><td style="padding:8px 0;font-size:14px">${safe.name}</td></tr>
        <tr><td style="padding:8px 0;color:#aaa79f;font-size:12px;letter-spacing:0.1em">Email</td><td style="padding:8px 0;font-size:14px"><a href="mailto:${safe.email}" style="color:#be4c00">${safe.email}</a></td></tr>
        ${safe.project ? `<tr><td style="padding:8px 0;color:#aaa79f;font-size:12px;letter-spacing:0.1em">Project</td><td style="padding:8px 0;font-size:14px">${safe.project}</td></tr>` : ''}
      </table>
      <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(223,215,197,0.1)">
        <p style="color:#aaa79f;font-size:12px;letter-spacing:0.1em;margin-bottom:10px">Message</p>
        <p style="font-size:14px;line-height:1.8;white-space:pre-wrap">${safe.message}</p>
      </div>
    </div>
  `

  return { subject, html }
}
