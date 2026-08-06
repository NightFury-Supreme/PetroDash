const express = require('express');
const Settings = require('../models/Settings');

const router = express.Router();

// GET /api/branding - Get dashboard branding info (name and icon)
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.findOne({}).lean();
        if (!settings) {
            return res.json({ 
                siteName: 'PteroDash', 
                siteIcon: '',
                currency: 'USD'
            });
        }
        
        return res.json({ 
            siteName: settings.siteName || 'PteroDash', 
            siteIcon: settings.siteIcon || '',
            currency: settings.localization?.currency || 'USD'
        });
    // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (e) { 
                return res.json({ 
            siteName: 'PteroDash', 
            siteIcon: '',
            currency: 'USD'
        }); 
    }
});

module.exports = router;

