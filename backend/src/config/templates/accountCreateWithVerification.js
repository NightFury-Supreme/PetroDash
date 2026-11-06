module.exports = {
  "subject": "Verify your {{siteName}} account",
  "html": `
      <div style="width: 100%; min-height: 100vh; padding: 40px 16px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; border: 1px solid #292929; border-radius: 9px; background-color: #101010; color: #eeeeee;">
          
          <div style="padding: 32px 48px;">
            {{logoHtml}}
          </div>

          <div style="width: 100%; height: 3px; background-color: #ff5a1f;"></div>

          <div style="padding: 64px 72px 60px;">
            <div style="margin-bottom: 16px; color: #ff5a1f; font-size: 13px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.4; text-transform: uppercase;">
              EMAIL VERIFICATION
            </div>

            <h1 style="margin: 0; color: #f1f1f1; font-size: 42px; font-weight: 600; line-height: 1.2; letter-spacing: -0.8px;">
              Verify your email
            </h1>

            <p style="margin: 24px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              Hi {{username}},
            </p>
            <p style="margin: 18px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              Thanks for creating your {{siteName}} account. Enter the verification code below to confirm your email address and continue.
            </p>

            <div style="margin-top: 48px; padding: 40px 32px; border: 1px solid #292929; border-radius: 9px; background-color: #171717; text-align: center;">
              <div style="margin-bottom: 14px; color: #666666; font-size: 14px; font-weight: 700; letter-spacing: 1.5px; line-height: 1.4;">
                VERIFICATION CODE
              </div>
              <div style="color: #f1f1f1; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace; font-size: 52px; font-weight: 700; letter-spacing: 10px; line-height: 1.2;">
                {{verificationCode}}
              </div>
            </div>
            <p style="margin: 24px 0 0; color: #777777; font-size: 15px; line-height: 1.6; text-align: center;">
              This code expires in <strong style="color: #aaaaaa; font-weight: 600;">15 minutes</strong>.
            </p>
            <div style="margin-top: 48px; padding: 24px 28px; border-left: 5px solid #ff5a1f; background-color: #1a120e; color: #958077; font-size: 15px; line-height: 1.7;">
              <div style="margin-bottom: 8px; color: #b7a097; font-size: 15px; font-weight: 600;">
                Security notice
              </div>
              For your security, never share this code with anyone. {{siteName}} support will never ask you for your verification code.
            </div>

            <p style="margin: 32px 0 0; color: #666666; font-size: 14px; line-height: 1.7;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>

          <div style="padding: 32px 48px; border-top: 1px solid #242424; background-color: #0d0d0d;">
            <div style="color: #d8d8d8; font-size: 18px; font-weight: 700;">
              {{siteName}}
            </div>
            <div style="margin-top: 8px; color: #666666; font-size: 14px; line-height: 1.5;">
              © ${new Date().getFullYear()} {{siteName}}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    `,
  "text": "Welcome to {{siteName}}, {{username}}! Your verification code is: {{verificationCode}}. This code will expire in 15 minutes."
};
