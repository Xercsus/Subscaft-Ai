import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, name } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email required' },
        { status: 400 }
      )
    }

    // Send welcome email with lead magnet
    await resend.emails.send({
      from: 'Subscraft AI <onboarding@resend.dev>',
      to: email,
      subject: '🎬 Your Free Subtitle Mastery Guide is Here!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="margin:0;padding:0;background:#0c0d0f;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

            <!-- Header -->
            <div style="text-align:center;margin-bottom:32px;">
              <h1 style="color:#e8eaf0;font-size:24px;margin:0;">
                Subs<span style="color:#e8a84c;">craft</span>
                <span style="background:#e8a84c;color:#000;font-size:10px;padding:2px 8px;border-radius:99px;vertical-align:middle;margin-left:6px;">AI</span>
              </h1>
            </div>

            <!-- Welcome -->
            <div style="background:#13151a;border:1px solid #272b36;border-radius:12px;padding:32px 24px;margin-bottom:24px;">
              <h2 style="color:#e8a84c;font-size:20px;margin:0 0 12px;">
                Hey ${name || 'there'}! 🎉
              </h2>
              <p style="color:#c8cad0;font-size:15px;line-height:1.6;margin:0 0 20px;">
                Welcome to Subscraft AI! Here's your free guide to creating
                professional subtitles that boost engagement by up to 80%.
              </p>

              <!-- Lead Magnet CTA -->
              <div style="background:rgba(232,168,76,0.08);border:1px solid rgba(232,168,76,0.2);border-radius:10px;padding:20px;margin-bottom:20px;">
                <h3 style="color:#e8a84c;font-size:16px;margin:0 0 8px;">
                  📖 The Subtitle Mastery Guide
                </h3>
                <ul style="color:#c8cad0;font-size:13px;line-height:1.8;padding-left:20px;margin:0 0 16px;">
                  <li>5 subtitle styles that go viral on Reels & TikTok</li>
                  <li>Word-by-word vs karaoke — when to use each</li>
                  <li>Color combinations that maximize readability</li>
                  <li>Font size guide for different platforms</li>
                  <li>SRT vs VTT — which to upload where</li>
                  <li>Pro tips for syncing subtitles perfectly</li>
                </ul>
              </div>

              <!-- Quick Start -->
              <div style="background:#1c1f27;border:1px solid #272b36;border-radius:8px;padding:16px;margin-bottom:20px;">
                <h4 style="color:#4ce8a8;font-size:14px;margin:0 0 8px;">
                  🚀 Quick Start with Subscraft AI
                </h4>
                <ol style="color:#c8cad0;font-size:13px;line-height:1.8;padding-left:20px;margin:0;">
                  <li>Upload any video (MP4, WebM, MOV)</li>
                  <li>Select language + words per segment</li>
                  <li>Click <strong style="color:#e8a84c;">Start Subtitling</strong></li>
                  <li>Customize style — try <strong style="color:#e8a84c;">Karaoke</strong> mode!</li>
                  <li>Export as SRT or download with burned subtitles</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <a href="https://subscaft-ai.vercel.app"
                style="display:block;text-align:center;background:#e8a84c;color:#000;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:800;font-size:14px;">
                🎬 Start Creating Subtitles →
              </a>
            </div>

            <!-- Pro Tips -->
            <div style="background:#13151a;border:1px solid #272b36;border-radius:12px;padding:24px;margin-bottom:24px;">
              <h3 style="color:#e8eaf0;font-size:16px;margin:0 0 16px;">
                💡 5 Viral Subtitle Styles
              </h3>

              <div style="margin-bottom:14px;padding:12px;background:#1c1f27;border-radius:8px;">
                <p style="color:#e8a84c;font-weight:700;font-size:13px;margin:0 0 4px;">1. Word-by-Word Pop 📝</p>
                <p style="color:#6b7080;font-size:12px;margin:0;line-height:1.5;">
                  One word at a time with pop animation. Perfect for motivational hooks and reels intros. Set words/segment to 1.
                </p>
              </div>

              <div style="margin-bottom:14px;padding:12px;background:#1c1f27;border-radius:8px;">
                <p style="color:#4c8ee8;font-weight:700;font-size:13px;margin:0 0 4px;">2. Karaoke Glow 🎤</p>
                <p style="color:#6b7080;font-size:12px;margin:0;line-height:1.5;">
                  All words visible, active word glows. Great for music videos, podcast clips, and storytelling content.
                </p>
              </div>

              <div style="margin-bottom:14px;padding:12px;background:#1c1f27;border-radius:8px;">
                <p style="color:#4ce8a8;font-weight:700;font-size:13px;margin:0 0 4px;">3. Typewriter ⌨️</p>
                <p style="color:#6b7080;font-size:12px;margin:0;line-height:1.5;">
                  Characters appear one by one with blinking cursor. Creates suspense. Perfect for dramatic reveals.
                </p>
              </div>

              <div style="margin-bottom:14px;padding:12px;background:#1c1f27;border-radius:8px;">
                <p style="color:#ff8800;font-weight:700;font-size:13px;margin:0 0 4px;">4. Bounce In 🏀</p>
                <p style="color:#6b7080;font-size:12px;margin:0;line-height:1.5;">
                  Subtitles bounce from top with physics animation. Fun, energetic feel for comedy and vlog content.
                </p>
              </div>

              <div style="padding:12px;background:#1c1f27;border-radius:8px;">
                <p style="color:#ff44ff;font-weight:700;font-size:13px;margin:0 0 4px;">5. Blur Reveal 🌫️</p>
                <p style="color:#6b7080;font-size:12px;margin:0;line-height:1.5;">
                  Text starts blurred and sharpens into focus. Cinematic feel for trailers, reviews, and educational content.
                </p>
              </div>
            </div>

            <!-- Platform Guide -->
            <div style="background:#13151a;border:1px solid #272b36;border-radius:12px;padding:24px;margin-bottom:24px;">
              <h3 style="color:#e8eaf0;font-size:16px;margin:0 0 12px;">
                📱 Platform Export Guide
              </h3>
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="color:#e8a84c;font-size:12px;font-weight:700;padding:8px 6px;border-bottom:1px solid #272b36;">YouTube</td>
                  <td style="color:#c8cad0;font-size:12px;padding:8px 6px;border-bottom:1px solid #272b36;">Upload .SRT in Studio → Subtitles</td>
                </tr>
                <tr>
                  <td style="color:#e8a84c;font-size:12px;font-weight:700;padding:8px 6px;border-bottom:1px solid #272b36;">Instagram</td>
                  <td style="color:#c8cad0;font-size:12px;padding:8px 6px;border-bottom:1px solid #272b36;">Burn into MP4 → Upload directly</td>
                </tr>
                <tr>
                  <td style="color:#e8a84c;font-size:12px;font-weight:700;padding:8px 6px;border-bottom:1px solid #272b36;">TikTok</td>
                  <td style="color:#c8cad0;font-size:12px;padding:8px 6px;border-bottom:1px solid #272b36;">Burn into MP4 → Upload directly</td>
                </tr>
                <tr>
                  <td style="color:#e8a84c;font-size:12px;font-weight:700;padding:8px 6px;border-bottom:1px solid #272b36;">Premiere</td>
                  <td style="color:#c8cad0;font-size:12px;padding:8px 6px;border-bottom:1px solid #272b36;">Import .SRT as captions track</td>
                </tr>
                <tr>
                  <td style="color:#e8a84c;font-size:12px;font-weight:700;padding:8px 6px;">Web Player</td>
                  <td style="color:#c8cad0;font-size:12px;padding:8px 6px;">Use .VTT with HTML5 &lt;track&gt;</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding:20px 0;">
              <p style="color:#6b7080;font-size:11px;margin:0 0 8px;">
                Made with 🎬 by Subscraft AI
              </p>
              <p style="color:#3a3f4d;font-size:10px;margin:0;">
                You received this because you signed up at subscraft.ai
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    })

    // Also notify yourself of new subscriber
    await resend.emails.send({
      from: 'Subscraft AI <onboarding@resend.dev>',
      to: 'krishkiran0317@gmail.com',
      subject: `🎉 New Subscriber: ${email}`,
      html: `
        <h2>New Subscraft AI Subscriber!</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Subscribe error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to subscribe' },
      { status: 500 }
    )
  }
}