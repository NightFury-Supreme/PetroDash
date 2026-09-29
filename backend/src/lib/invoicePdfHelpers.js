const fs = require('fs');
const path = require('path');
const axios = require('axios');
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
  const brand = settings?.payments?.paypal?.businessName || settings?.siteName || 'PteroDash';
  
  let host = frontendHost;
  if (host && host.startsWith('http')) {
    try { host = new URL(host).host; } catch {}
  }
  
  let rootDomain = host;
  if (host && host.includes('.')) {
    const parts = host.split('.');
    if (parts.length > 2 && !parts[parts.length - 2].match(/^(co|com|org|net)$/i)) {
      rootDomain = parts.slice(-2).join('.');
    } else if (parts.length > 3) {
      rootDomain = parts.slice(-3).join('.');
    }
  }

  let defaultDomain = rootDomain;
  if (!defaultDomain) {
    const cleanBrand = (brand || 'PetroDash').toLowerCase().replace(/[^a-z0-9]/g, '');
    defaultDomain = `${cleanBrand || 'petrodash'}.tech`;
  }
  const siteUrl = host || defaultDomain || 'dashboard.petrodash.tech';
  const address = settings?.payments?.paypal?.businessAddress || siteUrl;
  const supportEmail = settings?.contactEmail && !settings.contactEmail.includes('pterodash.com') ? settings.contactEmail : `support@${defaultDomain}`;

  return { brand, siteUrl, address, supportEmail, host };
}

async function renderInvoiceLogo(doc, settings, host, protocol, margin, y, pdfColors) {
  let hasLogo = false;
  let targetIcon = settings?.siteIcon;
  if (!targetIcon && host) {
    const baseFrontendUrl = process.env.FRONTEND_URL || `${protocol}://${host}`;
    targetIcon = baseFrontendUrl.endsWith('/') ? `${baseFrontendUrl}logo.svg` : `${baseFrontendUrl}/logo.svg`;
  }

  if (targetIcon) {
    try {
      let logoBuffer;
      if (targetIcon.startsWith('/uploads/')) {
        const localPath = path.join(__dirname, '../../', targetIcon);
        if (fs.existsSync(localPath)) {
          logoBuffer = fs.readFileSync(localPath);
        } else {
          throw new Error('Local file not found');
        }
      } else {
        let iconUrl = targetIcon;
        if (iconUrl.startsWith('/')) {
          iconUrl = `${protocol}://${host || 'localhost'}${iconUrl}`;
        }
        const logoResponse = await axios.get(iconUrl, { responseType: 'arraybuffer' });
        logoBuffer = Buffer.from(logoResponse.data);
      }
      
      logoBuffer = await sharp(logoBuffer).png().toBuffer();
      doc.image(logoBuffer, margin, y, { width: 40, height: 40 });
      hasLogo = true;
    } catch (e) {
      console.error('Failed to load siteIcon for PDF:', e.message);
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
