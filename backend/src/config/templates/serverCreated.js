module.exports = {
  "subject": "Server created: {{serverName}}",
  "html": `
      <div style="width: 100%; min-height: 100vh; padding: 40px 16px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; border: 1px solid #292929; border-radius: 9px; background-color: #101010; color: #eeeeee;">
          
          <div style="padding: 32px 48px;">
            {{logoHtml}}
          </div>

          <div style="width: 100%; height: 3px; background-color: #ff5a1f;"></div>

          <div style="padding: 64px 72px 60px;">
            <div style="margin-bottom: 16px; color: #ff5a1f; font-size: 13px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.4; text-transform: uppercase;">
              SERVER STATUS
            </div>

            <h1 style="margin: 0; color: #ffffff; font-size: 42px; font-weight: 700; line-height: 1.1; letter-spacing: -1px;">
              Server Ready
            </h1>

            <p style="margin: 28px 0 0; color: #a3a3a3; font-size: 18px; line-height: 1.6;">
              Hi {{username}},
            </p>
            <p style="margin: 16px 0 0; color: #a3a3a3; font-size: 18px; line-height: 1.6;">
              Your new server <strong style="color: #ffffff; font-weight: 600;">{{serverName}}</strong> has been successfully deployed and is now online. It is fully configured and ready for use.
            </p>

            <div style="margin-top: 48px; padding: 40px 32px; border: 1px solid #292929; border-radius: 9px; background-color: #171717;">
              
              <div style="margin-bottom: 24px; color: #666666; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                SERVER DETAILS
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 14px 0; color: #888888; font-size: 15px; width: 25%;">Location</td>
                  <td style="padding: 14px 0; color: #ffffff; font-size: 16px; font-weight: 500; width: 25%;">{{locationHtml}}</td>
                  <td style="padding: 14px 0; color: #888888; font-size: 15px; width: 25%; padding-left: 16px;">Egg</td>
                  <td style="padding: 14px 0; color: #ffffff; font-size: 16px; font-weight: 500; width: 25%;">{{eggHtml}}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #888888; font-size: 15px;">Server ID</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #ffffff; font-size: 16px; font-weight: 500; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;">{{serverId}}</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #888888; font-size: 15px; padding-left: 16px;">CPU Limit</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #ffffff; font-size: 16px; font-weight: 500;">{{cpu}}%</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #888888; font-size: 15px;">RAM Limit</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #ffffff; font-size: 16px; font-weight: 500;">{{ram}} MB</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #888888; font-size: 15px; padding-left: 16px;">Disk Space</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #ffffff; font-size: 16px; font-weight: 500;">{{disk}} MB</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #888888; font-size: 15px;">Databases</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #ffffff; font-size: 16px; font-weight: 500;">{{databases}}</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #888888; font-size: 15px; padding-left: 16px;">Ports Allowed</td>
                  <td style="padding: 14px 0; border-top: 1px solid #242424; color: #ffffff; font-size: 16px; font-weight: 500;">{{ports}}</td>
                </tr>
              </table>
            </div>

          </div>

          <div style="padding: 32px 48px; border-top: 1px solid #242424; background-color: #0d0d0d;">
            <div style="color: #d8d8d8; font-size: 18px; font-weight: 700;">
              {{siteName}}
            </div>
            <div style="margin-top: 8px; color: #666666; font-size: 14px; line-height: 1.5;">
              &copy; 2026 {{siteName}}. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    `,
  "text": "Your server {{serverName}} has been created. Server ID: {{serverId}}"
};
