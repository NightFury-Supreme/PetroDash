module.exports = {
  "subject": "Your account has been banned",
  "html": `
      <div style="width: 100%; min-height: 100vh; padding: 40px 16px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; border: 1px solid #292929; border-radius: 9px; background-color: #101010; color: #eeeeee;">
          
          <div style="padding: 32px 48px;">
            {{logoHtml}}
          </div>

          <div style="width: 100%; height: 3px; background-color: #ff5a1f;"></div>

          <div style="padding: 64px 72px 60px;">
            <div style="margin-bottom: 16px; color: #ff5a1f; font-size: 13px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.4; text-transform: uppercase;">
              ACCOUNT STATUS
            </div>

            <h1 style="margin: 0; color: #f1f1f1; font-size: 42px; font-weight: 600; line-height: 1.2; letter-spacing: -0.8px;">
              Account Suspended
            </h1>

            <p style="margin: 24px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              Hi {{username}},
            </p>
            <p style="margin: 18px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              We are writing to formally notify you that your {{siteName}} account has been suspended.
            </p>
            <p style="margin: 18px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              During this suspension, you will not be able to log in, create new instances, or access any of your active servers. Any recurring billing or running services may be paused or terminated depending on the severity of the violation.
            </p>

            <div style="margin-top: 48px; padding: 40px 32px; border: 1px solid #292929; border-radius: 9px; background-color: #171717;">
              <div style="margin-bottom: 14px; color: #666666; font-size: 14px; font-weight: 700; letter-spacing: 1.5px; line-height: 1.4;">REASON FOR BAN</div>
              <div style="color: #f1f1f1; font-size: 22px; font-weight: 600; line-height: 1.4;">{{reason}}</div>
              <div style="margin-top: 16px; color: #ff5a1f; font-size: 16px; font-weight: 600;">Suspended until: {{until}}</div>
            </div>

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
  "text": "Your account has been banned. Reason: {{reason}}. Until: {{until}}"
};
