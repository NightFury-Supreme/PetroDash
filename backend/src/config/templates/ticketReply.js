module.exports = {
  "subject": "New Reply: {{title}}",
  "html": `
    <div style="width: 100%; min-height: 100vh; padding: 40px 16px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
      <div style="width: 100%; max-width: 800px; margin: 0 auto; overflow: hidden; border: 1px solid #292929; border-radius: 9px; background-color: #101010; color: #eeeeee;">
        
        <div style="padding: 32px 48px;">
          {{logoHtml}}
        </div>

        <div style="width: 100%; height: 3px; background-color: #ff5a1f;"></div>

        <div style="padding: 64px 72px 60px;">
          <div style="margin-bottom: 16px; color: #ff5a1f; font-size: 13px; font-weight: 700; letter-spacing: 1.6px; line-height: 1.4; text-transform: uppercase;">
            SUPPORT UPDATE
          </div>

          <h1 style="margin: 0; color: #f1f1f1; font-size: 42px; font-weight: 600; line-height: 1.2; letter-spacing: -0.8px;">
            New Reply Received
          </h1>

          <p style="margin: 24px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
            Hi {{username}},
          </p>
          <p style="margin: 18px 0 0; color: #999999; font-size: 18px; line-height: 1.7;">
            Our support team has just replied to your ticket "<strong>{{title}}</strong>".
          </p>

          <div style="margin-top: 48px; border: 1px solid #292929; border-radius: 6px; overflow: hidden;">
            <div style="padding: 16px 24px; background-color: #171717; border-bottom: 1px solid #292929; color: #d8d8d8; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px;">
              Ticket Details
            </div>
            <div style="display: table; width: 100%;">
              <div style="display: table-cell; padding: 24px; width: 50%; vertical-align: top; border-right: 1px solid #292929;">
                <div style="margin-bottom: 24px;">
                  <div style="margin-bottom: 4px; color: #777777; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Ticket ID</div>
                  <div style="color: #eeeeee; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px;">#{{ticketId}}</div>
                </div>
                <div>
                  <div style="margin-bottom: 4px; color: #777777; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Category</div>
                  <div style="color: #eeeeee; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px;">{{category}}</div>
                </div>
              </div>
              
              <div style="display: table-cell; padding: 24px; width: 50%; vertical-align: top;">
                <div style="margin-bottom: 24px;">
                  <div style="margin-bottom: 4px; color: #777777; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Status</div>
                  <div style="color: #eeeeee; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px;">
                    <span style="display: inline-block; padding: 2px 10px; border-radius: 9999px; background-color: {{statusBg}}; color: {{statusColor}}; border: 1px solid {{statusBorder}}; font-size: 11px; font-weight: 600; text-transform: uppercase;">{{status}}</span>
                  </div>
                </div>
                <div>
                  <div style="margin-bottom: 4px; color: #777777; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Priority</div>
                  <div style="color: #eeeeee; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px;">{{priority}}</div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 48px; padding: 40px 32px; border: 1px solid #292929; border-radius: 9px; background-color: #171717;">
            <div style="margin-bottom: 14px; color: #666666; font-size: 14px; font-weight: 700; letter-spacing: 1.5px; line-height: 1.4;">REPLY PREVIEW</div>
            <div style="color: #f1f1f1; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">{{snippet}}</div>
          </div>

          <div style="margin-top: 48px; text-align: center;">
            <a href="{{frontendUrl}}/tickets/{{ticketId}}" style="display: inline-block; padding: 14px 28px; border-radius: 6px; background-color: #ff5a1f; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; text-align: center; letter-spacing: 0.3px;">
              View Full Reply
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
  "text": "New reply to your ticket \"{{title}}\": {{snippet}}"
};
