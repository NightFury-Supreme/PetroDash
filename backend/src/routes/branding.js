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
                siteIconUrl: '' 
            });
        }
        
        return res.json({ 
            siteName: settings.siteName || 'PteroDash', 
            siteIconUrl: settings.siteIconUrl || '' 
        });
    } catch (e) { 
        console.warn('Failed to fetch branding:', e.message);
        return res.json({ 
            siteName: 'PteroDash', 
            siteIconUrl: '' 
        }); 
    }
});

module.exports = router;
