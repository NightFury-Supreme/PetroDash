module.exports = {
  "subject": "Reset your {{siteName}} password",
  "html": `
    <div style="width: 100%; min-height: 100vh; padding: 40px 16px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
      <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; border: 1px solid #292929; border-radius: 9px; background-color: #101010; color: #eeeeee;">
        
        <div style="padding: 32px 48px;">
          {{logoHtml}}
        </div>

        <div style="width: 100%; height: 3px; background-color: #ff5a1f;"></div>

        <div style="padding: 64px 72px 60px;">
          <div style="margin-bottom: 16px; color: #ff5a1f; font-size: 13px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.4; text-transform: uppercase;">
            ACCOUNT SECURITY
          </div>

          <h1 style="margin: 0; color: #f1f1f1; font-size: 42px; font-weight: 600; line-height: 1.2; letter-spacing: -0.8px;">
            Password Reset
          </h1>

          <p style="margin: 24px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
            Hi {{username}},
          </p>
          <p style="margin: 18px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
            We received a request to reset the password for your {{siteName}} account. Please use the following code to complete the process.
          </p>
          
          <div style="margin-top: 48px; padding: 48px 32px; border: 1px solid #292929; border-radius: 9px; background-color: #171717; text-align: center;">
            <div style="margin-bottom: 16px; color: #666666; font-size: 14px; font-weight: 700; letter-spacing: 2px; line-height: 1.4; text-transform: uppercase;">
              YOUR RESET CODE
            </div>
            <div style="color: #f1f1f1; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 48px; font-weight: 700; letter-spacing: 12px; line-height: 1.2;">
              {{resetCode}}
            </div>
          </div>
          
          <p style="margin: 24px 0 0; color: #777777; font-size: 15px; line-height: 1.6; text-align: center;">
            This code expires in <strong style="color: #aaaaaa; font-weight: 600;">15 minutes</strong>.
          </p>

          <p style="margin: 32px 0 0; color: #666666; font-size: 14px; line-height: 1.7;">
            If you didn't request a password reset, you can safely ignore this email. Your account is still secure.
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
  "text": "Your password reset code is: {{resetCode}}. It expires in 15 minutes."
};
