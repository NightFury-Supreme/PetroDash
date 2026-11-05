const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const colors = {
  bg: '#101010',
  border: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#999999',
  orange: '#F97316',
  orangeDarkText: '#FB923C',
  orangeBoxBg: '#1A110D',
  orangeBoxBorder: '#331D12',
  emerald: '#10B981',
  emeraldText: '#34D399',
  emeraldBoxBg: '#092116',
  emeraldBoxBorder: '#0F3826',
  tableHeaderBg: '#161616',
  darkGrayLabel: '#888888',
  mediumGray: '#BBBBBB',
};

function resolveInvoiceDomain(settings, frontendHost) {
  const brand = settings?.payments?.paypal?.businessName || settings?.siteName || '';
  
  const envUrl = process.env.FRONTEND_URL || process.env.APP_URL || process.env.BACKEND_URL;
  let envHost = '';
  if (envUrl) {
    try {
      envHost = new URL(envUrl).host;
    } catch (_envUrlErr) {
      envHost = envUrl.replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  let host = frontendHost;
  if (host && host.startsWith('http')) {
    try {
      host = new URL(host).host;
    } catch (_urlErr) {
      host = host.replace(/^https?:\/\//, '').split('/')[0];
    }
  }
  
  const siteUrl = envHost || host || '';
  const address = settings?.payments?.paypal?.businessAddress || siteUrl || '';
  const supportEmail = settings?.contactEmail || settings?.supportEmail || '';

  return { brand, siteUrl, address, supportEmail, host };
}

async function renderInvoiceLogo(doc, settings, _host, _protocol, margin, y, pdfColors) {
  let hasLogo = false;
  const targetIcon = settings?.siteIcon;

  if (targetIcon && typeof targetIcon === 'string' && targetIcon.startsWith('/cdn/')) {
    try {
      const cdnDir = path.resolve(__dirname, '../../cdn');
      const relativeTarget = path.normalize(targetIcon.replace(/^\/cdn\//, '')).replace(/^(\.\.[\/\\])+/, '');
      const localPath = path.resolve(cdnDir, relativeTarget);
      if (localPath.startsWith(cdnDir) && fs.existsSync(localPath)) {
        let logoBuffer = fs.readFileSync(localPath);
        logoBuffer = await sharp(logoBuffer).png().toBuffer();
        doc.image(logoBuffer, margin, y, { width: 40, height: 40 });
        hasLogo = true;
      }
    } catch (_iconLoadError) {
    }
  }

  if (!hasLogo) {
    doc.roundedRect(margin, y, 40, 40, 8).fillAndStroke(pdfColors.orangeBoxBg, pdfColors.orangeBoxBorder);
    doc.save();
    doc.translate(margin + 10, y + 10);
    doc.scale(0.8);
    doc.lineWidth(2).strokeColor(pdfColors.orange);
    doc.path('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z').stroke();
    doc.path('M14 2v6h6').stroke();
    doc.path('M16 13H8').stroke();
    doc.path('M16 17H8').stroke();
    doc.path('M10 9H8').stroke();
    doc.restore();
  }
}

module.exports = {
  colors,
  resolveInvoiceDomain,
  renderInvoiceLogo,
};
