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
                siteIcon: '' 
            });
        }
        
        return res.json({ 
            siteName: settings.siteName || 'PteroDash', 
            siteIcon: settings.siteIcon || '' 
        });
    } catch (e) { 
                return res.json({ 
            siteName: 'PteroDash', 
            siteIcon: '' 
        }); 
    }
});

module.exports = router;

