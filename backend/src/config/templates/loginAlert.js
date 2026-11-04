module.exports = {
  "subject": "New login to your account",
  "html": `
      <div style="width: 100%; min-height: 100vh; padding: 40px 16px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; border: 1px solid #292929; border-radius: 9px; background-color: #101010; color: #eeeeee;">
          
          <div style="padding: 32px 48px;">
            {{logoHtml}}
          </div>

          <div style="width: 100%; height: 3px; background-color: #ff5a1f;"></div>

          <div style="padding: 64px 72px 60px;">
            <div style="margin-bottom: 16px; color: #ff5a1f; font-size: 13px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.4; text-transform: uppercase;">
              SECURITY ALERT
            </div>

            <h1 style="margin: 0; color: #f1f1f1; font-size: 42px; font-weight: 600; line-height: 1.2; letter-spacing: -0.8px;">
              New Login Detected
            </h1>

            <p style="margin: 24px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              Hi {{username}},
            </p>
            <p style="margin: 18px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              A new login to your {{siteName}} account was just detected from a new session.
            </p>

            <div style="margin-top: 48px; padding: 40px 32px; border: 1px solid #292929; border-radius: 9px; background-color: #171717;">
              <div style="margin-bottom: 18px; color: #666666; font-size: 14px; font-weight: 700; letter-spacing: 1.5px; line-height: 1.4;">LOGIN DETAILS</div>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 12px 0; color: #777777; font-size: 15px; width: 120px;">Device</td>
                  <td style="padding: 12px 0; color: #f1f1f1; font-size: 16px; font-weight: 500;">{{device}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #777777; font-size: 15px;">Browser</td>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #f1f1f1; font-size: 16px; font-weight: 500;">{{browser}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #777777; font-size: 15px;">Location</td>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #f1f1f1; font-size: 16px; font-weight: 500;">{{location}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #777777; font-size: 15px;">IP Address</td>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #f1f1f1; font-size: 16px; font-weight: 500;">{{ip}}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #777777; font-size: 15px;">Time</td>
                  <td style="padding: 12px 0; border-top: 1px solid #242424; color: #f1f1f1; font-size: 16px; font-weight: 500;">{{time}}</td>
                </tr>
              </table>
            </div>

            <div style="margin-top: 24px; padding: 24px 28px; border-left: 5px solid #ff5a1f; background-color: #1a120e; color: #958077; font-size: 15px; line-height: 1.7;">
              <div style="margin-bottom: 8px; color: #b7a097; font-size: 15px; font-weight: 600;">
                Unrecognized Activity?
              </div>
              If you didn't log in recently, please change your password and log out of all active sessions from your profile settings immediately.
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
  "text": "New login detected from {{device}} using {{browser}} in {{location}} (IP: {{ip}}) at {{time}}."
};
