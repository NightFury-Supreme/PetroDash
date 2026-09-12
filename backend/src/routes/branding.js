const express = require('express');
const { getSettings } = require('../lib/settings');

const router = express.Router();

// GET /api/branding - Get dashboard branding info (name and icon)
router.get('/', async (req, res) => {
    try {
        const settings = await getSettings();
        if (!settings) {
            return res.json({ 
                siteName: 'PteroDash', 
                siteIcon: '',
                currency: 'USD',
                earnEnabled: false
            });
        }
        
        return res.json({ 
            siteName: settings.siteName || 'PteroDash', 
            siteIcon: settings.siteIcon || '',
            currency: settings.localization?.currency || 'USD',
            earnEnabled: (settings.earn?.ads?.enabled || settings.earn?.linkvertise?.enabled) || false,
            emailVerification: settings.auth?.emailVerification || false
        });
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (e) { 
                return res.json({ 
            siteName: 'PteroDash', 
            siteIcon: '',
            currency: 'USD',
            earnEnabled: false,
            emailVerification: false
        });
    }
});

module.exports = router;

