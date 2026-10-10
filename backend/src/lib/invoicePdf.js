const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

async function generateInvoicePdfBuffer(payment, plan, user, settings, frontendHost, protocol = 'https') {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margins: { top: 0, bottom: 0, left: 0, right: 0 } 
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });
      
      // Fill background of any dynamically added pages (just in case)
      doc.on('pageAdded', () => {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill('#101010');
      });

      const brand = settings?.payments?.paypal?.businessName || settings?.siteName || 'PteroDash';
      
      if (frontendHost && frontendHost.startsWith('http')) {
        try { frontendHost = new URL(frontendHost).host; } catch {}
      }
      
      // Try to extract root domain (e.g. dashboard.example.com -> example.com)
      let rootDomain = frontendHost;
      if (frontendHost && frontendHost.includes('.')) {
        const parts = frontendHost.split('.');
        if (parts.length > 2 && !parts[parts.length - 2].match(/^(co|com|org|net)$/i)) {
          rootDomain = parts.slice(-2).join('.');
        } else if (parts.length > 3) {
          rootDomain = parts.slice(-3).join('.');
        }
      }

      const defaultDomain = rootDomain || (brand.toLowerCase().replace(/\s/g, '') + '.com');
      const siteUrl = frontendHost || defaultDomain;
      const address = settings?.payments?.paypal?.businessAddress || siteUrl;
      const supportEmail = settings?.contactEmail && !settings.contactEmail.includes('pterodash.com') ? settings.contactEmail : `support@${defaultDomain}`;

      // Theme Colors (Brightened)
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
        mediumGray: '#BBBBBB'
      };

      // Fill background for first page
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg);

      const margin = 40;
      const w = doc.page.width - margin * 2;
      let y = 30;

      // HEADER
      let hasLogo = false;
      let targetIcon = settings?.siteIcon;
      if (!targetIcon && frontendHost) {
        const baseFrontendUrl = process.env.FRONTEND_URL || `${protocol}://${frontendHost}`;
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
              iconUrl = `${protocol}://${frontendHost || 'localhost'}${iconUrl}`;
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
        doc.roundedRect(margin, y, 40, 40, 8).fillAndStroke(colors.orangeBoxBg, colors.orangeBoxBorder);
        doc.save();
        doc.translate(margin + 10, y + 10);
        doc.scale(0.8);
        doc.lineWidth(2).strokeColor(colors.orange);
        doc.path('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z').stroke();
        doc.path('M14 2v6h6').stroke();
        doc.path('M16 13H8').stroke();
        doc.path('M16 17H8').stroke();
        doc.path('M10 9H8').stroke();
        doc.restore();
      }

      doc.fillColor(colors.textPrimary).fontSize(20).font('Helvetica-Bold').text(brand, margin + 55, y + 4);
      doc.fillColor(colors.textMuted).fontSize(10).font('Helvetica').text('Billing & Invoicing', margin + 55, y + 26);

      const prefix = settings?.payments?.paypal?.invoicePrefix || 'INV-';
      const invoiceId = `${prefix}${String(payment._id).slice(-8).toUpperCase()}`;

      doc.fillColor(colors.orange).fontSize(10).font('Helvetica-Bold').text('INVOICE', doc.page.width - margin - 200, y + 4, { align: 'right', width: 200, characterSpacing: 1.5 });
      doc.fillColor(colors.textPrimary).fontSize(16).text(`#${invoiceId}`, doc.page.width - margin - 200, y + 18, { align: 'right', width: 200 });
      
      const formattedIssuedDate = new Date(payment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      doc.fillColor(colors.textMuted).fontSize(10).font('Helvetica').text(`Issued ${formattedIssuedDate}`, doc.page.width - margin - 200, y + 38, { align: 'right', width: 200 });

      y += 70;
      doc.lineWidth(1).strokeColor(colors.border);
      doc.moveTo(margin, y).lineTo(doc.page.width - margin, y).stroke();
      y += 30;

      // BILLING / ORDER
      const col2 = margin + w / 2;

      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica-Bold').text('BILLED FROM', margin, y, { characterSpacing: 1.5 });
      doc.fillColor(colors.textPrimary).fontSize(11).text(brand, margin, y + 15);
      doc.fillColor(colors.mediumGray).fontSize(9).font('Helvetica').text(address, margin, y + 30, { lineGap: 4 });

      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica-Bold').text('ORDER DETAILS', col2, y, { characterSpacing: 1.5 });

      const drawInfoLine = (label, val, x, currY) => {
        doc.fillColor(colors.darkGrayLabel).fontSize(9).font('Helvetica').text(label, x, currY);
        doc.fillColor(colors.textSecondary).text(val, x + 80, currY);
      };

      const formattedTimeDate = new Date(payment.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      drawInfoLine('Date', formattedTimeDate, col2, y + 15);
      drawInfoLine('Provider', String(payment.provider || '').charAt(0).toUpperCase() + String(payment.provider || '').slice(1), col2, y + 15 + 16);
      drawInfoLine('Order ID', String(payment.providerOrderId), col2, y + 15 + 32);
      if (payment.providerCaptureId) {
        drawInfoLine('Transaction', String(payment.providerCaptureId), col2, y + 15 + 48);
      }

      y += 90;

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Customer';
      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica-Bold').text('BILLED TO', margin, y, { characterSpacing: 1.5 });
      doc.fillColor(colors.textPrimary).fontSize(11).text(fullName, margin, y + 15);
      doc.fillColor(colors.mediumGray).fontSize(9).font('Helvetica').text(user.email || '', margin, y + 30);

      y += 60;

      // PAYMENT STATUS
      doc.roundedRect(margin, y, w, 44, 8).fillAndStroke(colors.emeraldBoxBg, colors.emeraldBoxBorder);
      doc.save();
      doc.translate(margin + 15, y + 14);
      doc.scale(0.7);
      doc.lineWidth(2).strokeColor(colors.emerald);
      doc.path('M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z').stroke();
      doc.path('M9 12l2 2 4-4').stroke();
      doc.restore();

      doc.fillColor(colors.emeraldText).fontSize(9).font('Helvetica-Bold').text('PAYMENT COMPLETED', margin + 40, y + 12, { characterSpacing: 1 });
      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica').text('Payment has been successfully captured.', margin + 40, y + 25);
      doc.fillColor(colors.emeraldText).fontSize(13).text('Paid', doc.page.width - margin - 100, y + 15, { align: 'right', width: 85 });

      y += 70;

      // ITEMS TABLE
      const tableTopY = y;
      
      doc.roundedRect(margin, y, w, 36, 8).fill(colors.tableHeaderBg);
      doc.rect(margin, y + 20, w, 16).fill(colors.tableHeaderBg);
      doc.moveTo(margin, y + 36).lineTo(margin + w, y + 36).stroke(colors.border);

      doc.fillColor(colors.textMuted).fontSize(8).font('Helvetica-Bold');
      doc.text('DESCRIPTION', margin + 20, y + 14, { characterSpacing: 1 });
      doc.text('INTERVAL', margin + 350, y + 14, { characterSpacing: 1 });
      doc.text('AMOUNT', margin + w - 100, y + 14, { align: 'right', width: 80, characterSpacing: 1 });

      y += 36;
      const itemY = y + 20;

      doc.fillColor(colors.textPrimary).fontSize(11).font('Helvetica-Bold').text(plan?.name || String(payment.planId), margin + 20, itemY);
      if (plan?.description) {
         doc.fillColor(colors.textMuted).fontSize(9).font('Helvetica').text(plan.description.substring(0, 50), margin + 20, itemY + 16);
      }

      let rx = margin + 20;
      let ry = itemY + 36;
      const maxRx = margin + 330;

      const drawResource = (lbl, val) => {
        doc.fontSize(8).font('Helvetica');
        const w1 = doc.widthOfString(lbl);
        doc.font('Helvetica-Bold');
        const w2 = doc.widthOfString(val);
        const totalW = w1 + 4 + w2 + 15;

        if (rx + totalW > maxRx) {
          rx = margin + 20;
          ry += 16;
        }

        doc.fillColor(colors.darkGrayLabel).fontSize(8).font('Helvetica').text(lbl, rx, ry);
        doc.fillColor(colors.mediumGray).font('Helvetica-Bold').text(val, rx + w1 + 4, ry);
        
        rx += totalW;
      };
      
      if (plan?.productContent) {
        const rec = plan.productContent.recurrentResources;
        if (rec?.cpuPercent) drawResource('CPU', `${rec.cpuPercent}%`);
        if (rec?.memoryMb) drawResource('Memory', `${rec.memoryMb} MB`);
        if (rec?.diskMb) drawResource('Disk', `${rec.diskMb} MB`);
        if (plan.productContent.databases) drawResource('Databases', `${plan.productContent.databases}`);
        if (plan.productContent.backups) drawResource('Backups', `${plan.productContent.backups}`);
        if (plan.productContent.serverLimit) drawResource('Servers', `${plan.productContent.serverLimit}`);
      }

      let displayInterval = payment.meta?.billingCycle ? String(payment.meta.billingCycle).charAt(0).toUpperCase() + String(payment.meta.billingCycle).slice(1) : (plan?.interval || 'One-time');
      doc.fillColor(colors.textSecondary).fontSize(10).font('Helvetica').text(displayInterval, margin + 350, itemY);

      const currency = payment.currency || 'USD';
      const formatter = new Intl.NumberFormat(settings?.payments?.paypal?.currencyLocale || 'en-US', { style: 'currency', currency });
      let originalSubtotal = Number(payment.amount || 0);
      const discountAmount = Number(payment.meta?.discountAmount || 0);
      if (discountAmount > 0) {
        originalSubtotal += discountAmount;
      }

      doc.fillColor(colors.textPrimary).fontSize(13).font('Helvetica-Bold').text(formatter.format(originalSubtotal), margin + w - 100, itemY, { align: 'right', width: 80 });
      doc.fillColor(colors.mediumGray).fontSize(8).font('Helvetica').text(currency.toUpperCase(), margin + w - 100, itemY + 16, { align: 'right', width: 80 });

      const finalItemY = ry + 20;
      const tableHeight = finalItemY - tableTopY;
      
      doc.roundedRect(margin, tableTopY, w, tableHeight, 8).stroke(colors.border);

      y = finalItemY + 20;

      // TOTALS
      y += 30;
      const totalsX = margin + w - 200;
      const totalsW = 200;
      
      let subtotal = Number(payment.amount || 0);
      const taxRate = Number(settings?.payments?.paypal?.taxRatePercent || 0);
      let tax = taxRate > 0 ? subtotal * (taxRate / 100) : 0;

      const drawTotalRow = (lbl, val, isGreen, ty) => {
        doc.fillColor(colors.textMuted).fontSize(9).font('Helvetica').text(lbl, totalsX, ty);
        doc.fillColor(isGreen ? colors.emeraldText : colors.textSecondary).font('Helvetica-Bold').text(val, totalsX + 100, ty, { align: 'right', width: totalsW - 100 });
      };

      if (discountAmount > 0) {
        drawTotalRow('Original Price', formatter.format(originalSubtotal), false, y);
        drawTotalRow('Discount', `-${formatter.format(discountAmount)}`, true, y + 20);
        drawTotalRow('Subtotal', formatter.format(subtotal), false, y + 40);
        y += 66;
      } else {
        drawTotalRow('Subtotal', formatter.format(subtotal), false, y);
        y += 26;
      }

      if (taxRate > 0) {
        drawTotalRow(settings?.payments?.paypal?.taxLabel || `Tax (${taxRate}%)`, formatter.format(tax), false, y);
        y += 26;
      }

      doc.roundedRect(totalsX, y, totalsW, 44, 8).fillAndStroke(colors.orangeBoxBg, colors.orangeBoxBorder);
      doc.fillColor(colors.orangeDarkText).fontSize(11).font('Helvetica-Bold').text('Total', totalsX + 16, y + 16, { characterSpacing: 1, uppercase: true });
      doc.fillColor(colors.orangeDarkText).fontSize(18).text(formatter.format(subtotal + tax), totalsX + 100, y + 10, { align: 'right', width: totalsW - 116 });
      doc.fillColor(colors.darkGrayLabel).fontSize(7).text(currency.toUpperCase(), totalsX + 100, y + 32, { align: 'right', width: totalsW - 116 });

      y += 80;

      // PAYMENT INFORMATION
      doc.moveTo(margin, y).lineTo(margin + w, y).stroke(colors.border);
      y += 30;

      const drawPaymentInfo = (lbl, val, x) => {
        doc.fillColor(colors.darkGrayLabel).fontSize(7).font('Helvetica-Bold').text(lbl, x, y, { characterSpacing: 1 });
        doc.fillColor(colors.textSecondary).fontSize(9).font('Helvetica-Bold').text(val, x, y + 16);
      };

      drawPaymentInfo('PAYMENT METHOD', String(payment.provider || '').charAt(0).toUpperCase() + String(payment.provider || '').slice(1), margin);
      drawPaymentInfo('TRANSACTION ID', payment.providerCaptureId || payment.providerOrderId || 'N/A', margin + w / 3);
      drawPaymentInfo('PAYMENT DATE', formattedIssuedDate, margin + 2 * w / 3);

      y += 60;

      // FOOTER
      doc.moveTo(margin, y).lineTo(margin + w, y).stroke(colors.border);
      y += 20;

      doc.fillColor('#D4D4D8').fontSize(10).font('Helvetica-Bold').text('Thank you for choosing ' + brand + '.', margin, y, { lineBreak: false });
      doc.fillColor(colors.mediumGray).fontSize(8).font('Helvetica').text('This invoice was generated electronically and is\nvalid without a signature.', margin, y + 16, { lineBreak: false });

      doc.fillColor(colors.mediumGray).fontSize(8).text(siteUrl, margin + w - 150, y, { align: 'right', width: 150, lineBreak: false });
      doc.fillColor(colors.mediumGray).text(supportEmail, margin + w - 150, y + 14, { align: 'right', width: 150, lineBreak: false }); 

      y += 50;

      doc.fillColor('#27272A').fontSize(7).text(`Invoice #${invoiceId}`, margin, y, { lineBreak: false });
      doc.fillColor('#27272A').text(`${brand} Billing`, margin + w - 100, y, { align: 'right', width: 100, lineBreak: false });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateInvoicePdfBuffer };
