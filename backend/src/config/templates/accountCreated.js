module.exports = {
  "subject": "Welcome to {{siteName}}",
  "html": `
      <div style="width: 100%; min-height: 100vh; padding: 40px 16px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; border: 1px solid #292929; border-radius: 9px; background-color: #101010; color: #eeeeee;">
          
          <div style="padding: 32px 48px;">
            {{logoHtml}}
          </div>

          <div style="width: 100%; height: 3px; background-color: #ff5a1f;"></div>

          <div style="padding: 64px 72px 60px;">
            <div style="margin-bottom: 16px; color: #ff5a1f; font-size: 13px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.4; text-transform: uppercase;">
              ACCOUNT CREATED
            </div>

            <h1 style="margin: 0; color: #f1f1f1; font-size: 42px; font-weight: 600; line-height: 1.2; letter-spacing: -0.8px;">
              Welcome to {{siteName}}
            </h1>

            <p style="margin: 24px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              Hi {{username}},
            </p>
            <p style="margin: 18px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
              Your {{siteName}} account has been created and is ready to use. You can now deploy servers, manage your resources, and access your dashboard.
            </p>

            <div style="margin-top: 48px; padding: 24px 28px; border-left: 5px solid #ff5a1f; background-color: #1a120e; color: #958077; font-size: 15px; line-height: 1.7;">
              <div style="margin-bottom: 8px; color: #b7a097; font-size: 15px; font-weight: 600;">
                Security Recommendation
              </div>
              To keep your account protected, we recommend enabling Two-Factor Authentication (2FA) from your profile security settings.
            </div>

            <div style="margin-top: 48px; text-align: center;">
              <a href="{{frontendUrl}}/dashboard" style="display: inline-block; padding: 14px 28px; border-radius: 6px; background-color: #ff5a1f; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; letter-spacing: 0.3px;">
                Go to Dashboard
              </a>
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
  "text": "Welcome to {{siteName}}, {{username}}! Your account has been created and is ready to use."
};
