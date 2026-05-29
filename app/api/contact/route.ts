import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const TO_EMAIL = 'hishamshiboob@gmail.com'

export async function POST(req: NextRequest) {
  const { name, email, project, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  try {
    await resend.emails.send({
      from: 'Hisham Hany Portfolio <onboarding@resend.dev>',
      to: TO_EMAIL,
      replyTo: email,
      subject: `New Inquiry — ${project || 'General'} from ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f0f10;color:#dfd7c5">
          <h2 style="font-size:20px;font-weight:400;margin-bottom:24px;color:#dfd7c5">
            New inquiry from <strong>${name}</strong>
          </h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#aaa79f;font-size:12px;letter-spacing:0.1em">Name</td><td style="padding:8px 0;font-size:14px">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#aaa79f;font-size:12px;letter-spacing:0.1em">Email</td><td style="padding:8px 0;font-size:14px"><a href="mailto:${email}" style="color:#be4c00">${email}</a></td></tr>
            ${project ? `<tr><td style="padding:8px 0;color:#aaa79f;font-size:12px;letter-spacing:0.1em">Project</td><td style="padding:8px 0;font-size:14px">${project}</td></tr>` : ''}
          </table>
          <div style="margin-top:24px;padding-top:24px;border-top:1px solid rgba(223,215,197,0.1)">
            <p style="color:#aaa79f;font-size:12px;letter-spacing:0.1em;margin-bottom:10px">Message</p>
            <p style="font-size:14px;line-height:1.8;white-space:pre-wrap">${message}</p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 })
  }
}
